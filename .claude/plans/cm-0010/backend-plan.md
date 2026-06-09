---
id: cm-0010
title: Fix Assignment Reorder Race Condition and Add Pagination
stage: design
status: approved
approver: human
approved_at: 2026-05-07T00:00:00Z
---

# Backend Implementation Plan — cm-0010

## Summary

Three targeted changes with no schema migrations required:

1. **Reorder race condition fix** — convert `assignmentService.reorder` from a split read-then-batched-transaction pattern to a single Prisma interactive transaction with `SELECT ... FOR UPDATE` row-level locking.
2. **Assessment attempts pagination** — extend `getAttempts` in `assessmentService` to accept `page`/`pageSize`, run a `COUNT` and `findMany` in parallel, and return a paginated envelope. Wire up a new Zod query schema, update the controller, and add `authenticate` middleware to the route.
3. **Admin user list pagination** — client-only change. The better-auth admin plugin already supports `limit`/`offset`; update `AdminUsersPage.tsx` to pass `offset` and handle the paginated response.

---

## Current Implementation Analysis

### Reorder Race Condition (`server/src/services/assignment.service.ts`, lines 244–273)

The bug is a classic TOCTOU split:

```
// OUTSIDE transaction — reads snapshot of current assignments
const existing = await prisma.assignment.findMany({ where: { lessonId }, select: { id: true } });
const existingIds = new Set(existing.map((a) => a.id));

// Validation uses the snapshot — stale under concurrency
if (assignmentIds.length !== existing.length || assignmentIds.some((id) => !existingIds.has(id))) {
  throw new AppError(...);
}

// INSIDE batched transaction — writes use a different DB connection snapshot
await prisma.$transaction(
  assignmentIds.map((id, index) => prisma.assignment.update({ where: { id }, data: { order: index + 1 } }))
);
```

A concurrent request that deletes or adds an assignment between the read and the `$transaction` call will cause the reorder to silently succeed with stale validation results. The batched `$transaction([...])` form does not allow injecting a read inside it, so the fix requires converting to an interactive transaction.

**Entity scope**: The `reorder` method covers `Assignment` records belonging to a `Lesson`. Resources and tools have no `reorder` method and are out of scope per spec.

### Assessment Attempts (`server/src/services/assessment.service.ts`, lines 131–137)

```typescript
async getAttempts(assessmentId: string, userId: string) {
  return prisma.assessmentAttempt.findMany({
    where: { assessmentId, userId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, score: true, passed: true, createdAt: true },
  });
}
```

- Returns a **raw array** (not a count). Current response shape is an array of `{ id, score, passed, createdAt }` objects.
- No `LIMIT`/`OFFSET` — unbounded. A heavy user who has retaken an assessment many times will receive the full history.
- `userId` is already passed from `req.user!.id` in the controller — FR-05 is already architecturally satisfied; pagination does not break user scoping.
- The route at `GET /:assessmentId/attempts` (line 51 of assessment.routes.ts) has **no authentication middleware** applied. This is a latent security issue uncovered during analysis; the fix must add `authenticate` middleware.

### Admin User List (`client/src/features/auth/AdminUsersPage.tsx`, line 25)

```typescript
authClient.admin.listUsers({ query: { limit: 100 } })
```

- Hardcoded `limit: 100`, no `offset`.
- The better-auth admin plugin natively supports `limit` and `offset` query parameters and returns `{ users: [...], total: number }`. No backend changes needed.
- This is a **client-only change**.

---

## Pagination Design Decisions

| Concern | Decision | Rationale |
|---|---|---|
| Default page size | `20` | Reasonable for both admin user list and attempt history; keeps response payloads small |
| Max page size | `100` | Prevents unbounded requests while matching the current admin page's hardcoded limit |
| Pagination style | Offset-based (`page` + `pageSize`) | Matches spec requirement; cursor-based is explicitly out of scope |
| Response envelope | `{ data: T[], total: number, page: number, pageSize: number }` | Gives the client everything needed to render pagination controls |
| Attempt return shape | Array of summaries `{ id, score, passed, createdAt }` | Preserves the existing select shape per FR-06 |

---

## Changes Required

### No Schema Changes

No new models, fields, enums, or relations. All changes are service-layer, controller, route, and schema (Zod) changes.

### 1. `server/src/services/assignment.service.ts` — `reorder` method

**Replace** the split read + batched transaction with a single interactive transaction using `SELECT ... FOR UPDATE` via Prisma's raw locking.

Prisma 6 does not expose `SELECT ... FOR UPDATE` natively in `findMany`. The correct approach is to use `prisma.$queryRaw` inside the interactive transaction to lock the rows, then validate, then write.

**Pseudocode:**

```
async reorder(lessonId: string, assignmentIds: string[]) {
  await assertExists(prisma.lesson, lessonId, 'Lesson');

  await prisma.$transaction(async (tx) => {
    // Lock all Assignment rows for this lesson against concurrent writes.
    // prisma.$queryRaw is valid inside an interactive transaction on the tx client.
    const locked = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Assignment"
      WHERE "lessonId" = ${lessonId}
      FOR UPDATE
    `;

    // Validate inside the transaction against locked data
    const lockedIds = new Set(locked.map((r) => r.id));
    if (
      assignmentIds.length !== locked.length ||
      assignmentIds.some((id) => !lockedIds.has(id))
    ) {
      throw new AppError(
        'INVALID_REORDER',
        'Provided assignment IDs do not match lesson assignments',
        400,
      );
    }

    // Apply order updates inside the same transaction
    await Promise.all(
      assignmentIds.map((id, index) =>
        tx.assignment.update({
          where: { id },
          data: { order: index + 1 },
        }),
      ),
    );
  }, { isolationLevel: 'Serializable' });

  return this.findAllByLesson(lessonId, null);
}
```

**Notes on isolation level:**

`{ isolationLevel: 'Serializable' }` is passed as the second argument to `prisma.$transaction`. This is the Prisma 6 API. `FOR UPDATE` within a Serializable transaction on PostgreSQL provides the strongest guarantee: concurrent transactions attempting to reorder the same lesson will serialize, and the second will either wait or fail with a serialization error (which Prisma surfaces as a Prisma error that the global error handler should translate to a 409). If a serialization failure reaches the error handler, the existing unhandled-error path will return a 500; the error handler should be extended to catch Prisma error code `P2034` (transaction conflict) and return 409.

**Alternative without raw SQL:**

If `$queryRaw` inside a transaction is considered undesirable, use `Serializable` isolation alone without an explicit `FOR UPDATE`. PostgreSQL Serializable isolation detects conflicting concurrent reads and writes and aborts the losing transaction. This avoids raw SQL but requires callers to handle 409 retries. The `$queryRaw` approach is preferred because it avoids silent retry complexity at the client.

### 2. `server/src/middleware/errorHandler.ts`

Extend the Prisma error handler block to catch **P2034** (transaction conflict / serialization failure):

```
if (err.code === 'P2034') {
  res.status(409).json({ error: { code: 'TRANSACTION_CONFLICT', message: 'Concurrent modification detected; please retry.' } });
  return;
}
```

### 3. `server/src/schemas/assessment.schema.ts`

Add a pagination query schema:

```typescript
export const attemptsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type AttemptsQuery = z.infer<typeof attemptsQuerySchema>;
```

Note: `z.coerce.number()` is required because query parameters arrive as strings. The `validate` middleware applies to `req.body`; for query params, use a separate validate-query middleware or validate in the controller. See Implementation Steps for the recommended approach.

### 4. `server/src/services/assessment.service.ts` — `getAttempts` method

Replace the single `findMany` with a parallel count + paginated `findMany`:

```typescript
async getAttempts(
  assessmentId: string,
  userId: string,
  page: number,
  pageSize: number,
) {
  const skip = (page - 1) * pageSize;

  const [total, data] = await Promise.all([
    prisma.assessmentAttempt.count({
      where: { assessmentId, userId },
    }),
    prisma.assessmentAttempt.findMany({
      where: { assessmentId, userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, score: true, passed: true, createdAt: true },
      skip,
      take: pageSize,
    }),
  ]);

  return { data, total, page, pageSize };
}
```

### 5. `server/src/controllers/assessment.controller.ts` — `getAttempts` handler

Parse and validate query parameters, then pass them to the service:

```typescript
getAttempts: asyncHandler(async (req: Request, res: Response) => {
  const parsed = attemptsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ValidationError('Invalid pagination parameters', parsed.error.flatten().fieldErrors);
  }
  const { page, pageSize } = parsed.data;
  res.json(
    await assessmentService.getAttempts(
      req.params['assessmentId'] as string,
      req.user!.id,
      page,
      pageSize,
    ),
  );
}),
```

The controller validates the query directly (not via `validate` middleware, which targets `req.body`) using `safeParse`. Import `attemptsQuerySchema` from the schema file.

### 6. `server/src/routes/assessment.routes.ts` — GET `/:assessmentId/attempts`

Add `authenticate` middleware. Current line 51:

```typescript
assessmentsRouter.get('/:assessmentId/attempts', assessmentController.getAttempts);
```

Updated:

```typescript
import { authenticate } from '../middleware/authenticate.js';

assessmentsRouter.get('/:assessmentId/attempts', authenticate, assessmentController.getAttempts);
```

Note: `authenticate` is not currently imported in this file. Verify by checking existing imports; add it. No `authorize` is needed — any authenticated user may retrieve their own attempts (user scoping is enforced by `req.user!.id` in the controller).

### 7. `client/src/features/auth/AdminUsersPage.tsx`

Add pagination state and controls. The better-auth admin client returns `{ users: User[], total: number }`.

**State additions:**

```typescript
const [page, setPage] = useState(1);
const [total, setTotal] = useState(0);
const PAGE_SIZE = 20;
```

**Updated fetch call:**

```typescript
authClient.admin
  .listUsers({ query: { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE } })
  .then(({ data, error: err }) => {
    if (err) throw new Error(err.message);
    setUsers((data?.users ?? []) as AuthUser[]);
    setTotal(data?.total ?? 0);
  })
```

**Trigger refetch on page change:**

Move the fetch logic into a function called on `useEffect([page])` or use a `useCallback`. Re-run on `page` dependency.

**Pagination controls** (below the table):

```tsx
<div className="flex items-center justify-between px-4 py-3 border-t border-border">
  <span className="text-sm text-muted-foreground">
    {total} user{total !== 1 ? 's' : ''} total
  </span>
  <div className="flex gap-2">
    <Button variant="secondary" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
      Previous
    </Button>
    <span className="text-sm text-muted-foreground self-center">Page {page}</span>
    <Button variant="secondary" onClick={() => setPage((p) => p + 1)} disabled={page * PAGE_SIZE >= total}>
      Next
    </Button>
  </div>
</div>
```

Use the existing `Button` shared component (`src/components/Button.tsx`).

---

## Implementation Steps

Execute in this order to avoid breaking the running server:

**Step 1 — Schema (Zod), no runtime risk**
- Add `attemptsQuerySchema` and `AttemptsQuery` type to `server/src/schemas/assessment.schema.ts`.

**Step 2 — Service layer**
- Update `assessmentService.getAttempts` signature and body in `server/src/services/assessment.service.ts`.
- Update `assignmentService.reorder` in `server/src/services/assignment.service.ts`.

**Step 3 — Error handler**
- Extend `server/src/middleware/errorHandler.ts` to handle P2034.

**Step 4 — Controller**
- Update `assessmentController.getAttempts` in `server/src/controllers/assessment.controller.ts` to validate query and pass pagination params.

**Step 5 — Route**
- Add `authenticate` middleware to `GET /:assessmentId/attempts` in `server/src/routes/assessment.routes.ts`.

**Step 6 — Client**
- Update `client/src/features/auth/AdminUsersPage.tsx` with pagination state, updated fetch, and pagination controls.

**Step 7 — Smoke test**
- Verify existing assessment attempts endpoint returns the new envelope shape.
- Verify reorder with concurrent requests does not produce invalid ordering.
- Verify admin user list loads page 1 and page 2 correctly.

---

## Error Handling

| Scenario | Error Code | HTTP Status | Handler |
|---|---|---|---|
| Reorder IDs do not match lesson assignments | `INVALID_REORDER` | 400 | `assignmentService.reorder` throws `AppError` |
| Prisma serialization failure (P2034) | `TRANSACTION_CONFLICT` | 409 | `errorHandler.ts` catches Prisma error code |
| Attempts pagination query params invalid | `VALIDATION_ERROR` | 400 | Controller `safeParse` throws `ValidationError` |
| Assessment not found (P2025) | `NOT_FOUND` | 404 | Existing `errorHandler.ts` P2025 handler |
| Unauthenticated access to attempts | — | 401 | `authenticate` middleware |

---

## Validation

| Input | Schema | Location |
|---|---|---|
| Reorder body (`assignmentIds: string[]`) | Existing assignment schema | Route middleware (unchanged) |
| Attempts query (`page`, `pageSize`) | `attemptsQuerySchema` (new) | Controller `safeParse` on `req.query` |
| Admin list query | better-auth admin plugin handles internally | Client passes typed params |

---

## Testing Considerations

- **Reorder race condition**: Write a test that fires two concurrent reorder requests for the same lesson with different orderings and asserts the final state matches exactly one of the two requests (not an interleaved state). Use a test database with serializable isolation enabled.
- **Reorder invalid IDs**: Provide an ID list that omits one assignment or includes a foreign ID; assert 400 `INVALID_REORDER`.
- **Attempts pagination**: Create more than 20 attempts for a user, then assert `page=1` returns 20, `page=2` returns the remainder, and `total` is correct. Assert that attempts for a different user are not included.
- **Attempts unauthenticated**: Assert that `GET /api/assessments/:id/attempts` without a session returns 401 (currently missing).
- **Admin user list**: Mock `authClient.admin.listUsers` to return `{ users: [...20], total: 35 }` and assert the Previous/Next buttons render and the page increments correctly.

---

## Dependencies

No new npm packages required. All changes use:
- Prisma 6 interactive transactions and `$queryRaw` (already in use)
- Zod 3 `z.coerce.number()` (available in Zod 3)
- Existing `AppError`, `ValidationError`, `NotFoundError` from `server/src/errors/`
- Existing `Button` component in client
- better-auth admin plugin `offset` parameter (already supported by the plugin per spec)
