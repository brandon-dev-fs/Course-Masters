---
id: cm-0018
title: Add Soft Delete to Core Models
stage: design
status: approved
approver: human
approved_at: 2026-05-13T00:00:00Z
---

# Backend Plan — cm-0018: Add Soft Delete to Core Models

## 1. Overview

This plan replaces hard deletes with soft deletes on five models: User, Course, Unit, Lesson, and Assessment. No new endpoints are created. Existing DELETE endpoints change behavior. All read paths gain `deletedAt: null` filters. Cascade soft deletes flow down the ownership hierarchy in a single transaction per request.

---

## 2. Schema Changes

### 2a. New Fields

Add `deletedAt DateTime?` to five models. The field is nullable with no default, meaning Prisma omits it from the generated default (null at the database level — no explicit `@default(null)` needed in Prisma schema since nullable fields default to null).

Models and their additions:

| Model | Field to add |
|---|---|
| `User` | `deletedAt DateTime?` |
| `Course` | `deletedAt DateTime?` |
| `Unit` | `deletedAt DateTime?` |
| `Lesson` | `deletedAt DateTime?` |
| `Assessment` | `deletedAt DateTime?` |

Note on `User`: better-auth owns the `user` table via the Prisma adapter. Adding `deletedAt` to the Prisma `User` model is safe — better-auth will not interfere with an extra nullable field it does not know about. Migration must not alter any existing better-auth columns.

### 2b. Indexes

Add one index per model on `deletedAt` using a **partial index** (only indexes rows where `deletedAt IS NOT NULL`). This is the preferred strategy because:
- The overwhelming majority of rows will have `deletedAt = null` (undeleted)
- A standard index on `deletedAt` would include all null values, adding write overhead for no read benefit on the hot `WHERE deletedAt IS NULL` list queries
- A partial index covers only the rare soft-deleted rows, which is primarily useful for administrative inspection queries, not the `IS NULL` path

Prisma does not natively support partial indexes via `@@index`. Use a raw SQL migration block to create them:

```sql
CREATE INDEX IF NOT EXISTS "user_deleted_at_idx" ON "user"("deletedAt") WHERE "deletedAt" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Course_deleted_at_idx" ON "Course"("deletedAt") WHERE "deletedAt" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Unit_deleted_at_idx" ON "Unit"("deletedAt") WHERE "deletedAt" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Lesson_deleted_at_idx" ON "Lesson"("deletedAt") WHERE "deletedAt" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "assessment_deleted_at_idx" ON "assessment"("deletedAt") WHERE "deletedAt" IS NOT NULL;
```

These raw index statements must be added to the migration SQL file produced by `npm run db:migrate`. The coder must ensure the migration file is not re-generated after manual edit (use `prisma migrate dev --create-only` then edit the SQL before applying).

### 2c. Migration Strategy

This migration is non-destructive:
- All existing rows retain `deletedAt = null` (not deleted) automatically — no data backfill required
- No existing columns are altered or removed
- Foreign key cascade-delete constraints remain in place (they serve as a hard-delete safety net if a row is ever truly removed outside normal application flow)
- Apply with `npm run db:migrate`

---

## 3. Layer Structure

### 3a. New Utility: `softDelete` helper (`src/utils/softDelete.ts`)

A shared transaction-aware cascade utility. This function accepts a Prisma transaction client, a model name, and a record ID, then soft-deletes the target record and all descendants in the correct order within the caller's transaction.

The utility encapsulates the cascade logic so that no service function re-implements it. It must accept both the regular `prisma` client and a `tx` (transaction) client — the caller always passes `tx` when inside a `prisma.$transaction` block.

Cascade order for each entry point:

**Course cascade:**
1. Set `deletedAt` on Assessments where `courseId = X` and `deletedAt IS NULL`
2. For all Units of the Course (where `deletedAt IS NULL`):
   a. Set `deletedAt` on Assessments where `unitId = unitId` and `deletedAt IS NULL`
   b. For all Lessons of each Unit (where `deletedAt IS NULL`):
      - Set `deletedAt` on Assessments where `lessonId = lessonId` and `deletedAt IS NULL`
      - Set `deletedAt` on Lessons (batch `updateMany`)
   c. Set `deletedAt` on Units (batch `updateMany`)
3. Set `deletedAt` on Course

**Unit cascade:**
1. Set `deletedAt` on Assessment where `unitId = X` and `deletedAt IS NULL`
2. For all Lessons of the Unit (where `deletedAt IS NULL`):
   a. Set `deletedAt` on Assessments where `lessonId = lessonId` and `deletedAt IS NULL`
   b. Set `deletedAt` on Lessons (batch `updateMany`)
3. Set `deletedAt` on Unit

**Lesson cascade:**
1. Set `deletedAt` on Assessment where `lessonId = X` and `deletedAt IS NULL`
2. Set `deletedAt` on Lesson

**User cascade:**
1. Find all Courses for the User where `deletedAt IS NULL`
2. For each Course: execute Course cascade (as above) within the same transaction
3. Set `deletedAt` on User

All operations use `updateMany` with batched IDs wherever possible to minimize round trips. The transaction ensures atomicity.

**Pseudocode for `softDeleteCourse(tx, courseId)`:**
```
now = new Date()

// 1. Soft-delete the course-level assessment
tx.assessment.updateMany({ where: { courseId, deletedAt: null }, data: { deletedAt: now } })

// 2. Collect non-deleted unit IDs for this course
units = tx.unit.findMany({ where: { courseId, deletedAt: null }, select: { id: true } })
unitIds = units.map(u => u.id)

// 3. For each unit, collect non-deleted lesson IDs
lessons = tx.lesson.findMany({ where: { unitId: { in: unitIds }, deletedAt: null }, select: { id: true } })
lessonIds = lessons.map(l => l.id)

// 4. Soft-delete unit-level and lesson-level assessments
tx.assessment.updateMany({ where: { unitId: { in: unitIds }, deletedAt: null }, data: { deletedAt: now } })
tx.assessment.updateMany({ where: { lessonId: { in: lessonIds }, deletedAt: null }, data: { deletedAt: now } })

// 5. Soft-delete lessons and units
tx.lesson.updateMany({ where: { id: { in: lessonIds } }, data: { deletedAt: now } })
tx.unit.updateMany({ where: { id: { in: unitIds } }, data: { deletedAt: now } })

// 6. Soft-delete the course
tx.course.update({ where: { id: courseId }, data: { deletedAt: now } })
```

This avoids N+1 queries by collecting all IDs first, then issuing batched `updateMany` calls.

### 3b. Modified Service Functions

#### `courseService`

- `findAll()`: Add `where: { deletedAt: null }` to `findMany`. Also add `deletedAt: null` filter to the `units` and `lessons` relationship includes.
- `findById(id)`: Change `where: { id }` to `where: { id, deletedAt: null }`. Keep throwing `NotFoundError` for null result (covers both "not found" and "soft-deleted" cases — no distinction exposed to the client).
- `update(...)`: `findById` already throws if soft-deleted; no additional change needed to update logic.
- `remove(id, userId, userRole)`:
  1. Call `findById(id)` (handles not-found and soft-deleted as 404)
  2. Check ownership/admin — unchanged
  3. Wrap in `prisma.$transaction`
  4. Call `softDeleteCourse(tx, id)`
  5. Return void (204 response — unchanged)

#### `unitService`

- `findAllByCourse(courseId)`: Add `deletedAt: null` to the `findMany` `where`. The parent Course check via `assertExists` must also be updated to use the `deletedAt`-aware lookup (see Section 3c on `assertExists`).
- `findById(id)`: Add `deletedAt: null` to `findUnique` `where`.
- `remove(id)`:
  1. Call `findById(id)` — handles soft-deleted as 404
  2. Wrap in `prisma.$transaction`
  3. Call `softDeleteUnit(tx, id)`
  4. Return void

#### `lessonService`

- `findAllByUnit(unitId)`: Add `deletedAt: null` to `findMany` `where`.
- `findById(id)`: The current implementation delegates to `assertExists`. `assertExists` must be updated or a new variant provided (see 3c).
- `remove(id)`:
  1. Call `findById(id)` — handles soft-deleted as 404
  2. Wrap in `prisma.$transaction`
  3. Call `softDeleteLesson(tx, id)`
  4. Return void

#### `assessmentService`

- `findByParent(type, parentId)`: The query uses `findUnique` via `parentWhere`. Add `deletedAt: null` to the `where` clause. Since the `Assessment` model uses unique single-field foreign keys (`lessonId`, `unitId`, `courseId`), and Prisma's `findUnique` requires the unique constraint field(s) only, the `deletedAt` filter must be added to a `findFirst` instead (because `findUnique` does not accept additional `where` filters beyond the unique constraint). **Change `findUnique` to `findFirst` with `{ where: { ...parentWhere(type, parentId), deletedAt: null } }`.**
- `create(type, parentId)`: The `assertParentExists` helper calls `assertExists` on the parent — must use the soft-delete-aware lookup (Section 3c).
- `update(assessmentId)`: Add `deletedAt: null` to the `assertExists` / lookup. If the Assessment is soft-deleted, throw `NotFoundError`.
- `submitAttempt(assessmentId)`: Add `deletedAt: null` to the `findUnique` `where`. If the Assessment is soft-deleted, throw `NotFoundError('Assessment not found')` — which maps to 404.
- `bulkUpdateCalculator(assessmentId)`: Add `deletedAt: null` to the `assertExists` lookup.

#### `progressService` (`fetchCourseProgressData`, `fetchUnitProgressData`)

- `fetchCourseProgressData`: Add `deletedAt: null` to the top-level Course lookup, the `units` include filter, the `units.lessons` include filter. Assessment includes do not need a `deletedAt` filter since assessments are 1:1 with their parent (not a list).
- `fetchUnitProgressData`: Add `deletedAt: null` to the top-level Unit lookup and the `lessons` include filter.
- `computeCourseProgress` and `computeUnitProgress`: These are pure computation functions; they consume what the fetchers provide. Since the fetchers now exclude soft-deleted entities, the computation functions automatically produce correct totals. No changes needed to the computation logic.

### 3c. `assertExists` Utility

The current `assertExists` calls `findUnique({ where: { id } })` without a `deletedAt` filter. For soft-deletable models, this would return a soft-deleted record as "found", causing incorrect behavior.

Two options were considered:
1. Modify `assertExists` to accept an optional extra `where` clause
2. Replace `assertExists` calls in soft-deletable model services with inline `findFirst({ where: { id, deletedAt: null } })` + `NotFoundError` throw

**Decision: option 2.** Modifying `assertExists` to carry a generic extra-where clause adds complexity for a small win. Services for soft-deletable models (Course, Unit, Lesson, Assessment) should use inline `findFirst({ where: { id, deletedAt: null } })` lookups and throw `NotFoundError` explicitly. Services for non-soft-deletable models (LessonResource, LessonTool, StudentNote, etc.) continue using `assertExists` unchanged.

Parent existence checks in nested routes (e.g., `unitService.findAllByCourse` calling `assertExists(prisma.course, ...)`) must be updated to inline lookups for the Course, Unit, and Lesson delegates.

### 3d. User Deletion and better-auth Admin Plugin

The better-auth admin plugin handles user deletion via `DELETE /api/auth/admin/delete-user`. This route is internal to better-auth and cannot be intercepted by Express middleware. Two approaches were considered:

1. **Override via Prisma middleware**: Add a Prisma `$use` / query event hook that intercepts `delete` operations on the `user` table and converts them to `update` with `deletedAt`. **Rejected** — Prisma interactive transactions interact poorly with middleware-intercepted deletes; this is fragile and opaque.
2. **Block better-auth's delete and provide a custom endpoint**: Add a custom `DELETE /api/users/:userId` Express route (admin-only) that performs the cascade soft delete. Configure the better-auth admin plugin to disable its delete capability, or document that the custom route must be used instead. **Selected.**

**Design decision:** Add a new route `DELETE /api/users/:userId` protected by `authorize('admin')`. This route:
1. Looks up the User by ID with `findFirst({ where: { id, deletedAt: null } })`; throws 404 if not found or already soft-deleted
2. Wraps the User cascade soft delete in a `prisma.$transaction`
3. Returns 204

The better-auth admin plugin's built-in delete endpoint (`DELETE /api/auth/admin/delete-user`) performs a hard delete. It must be disabled or left in place with a clear documentation note that it bypasses soft delete. The spec says "no restore/undelete" and this is admin-only infrastructure — the safest approach is to leave the better-auth endpoint in place but document that operators should use the new custom endpoint. If the better-auth endpoint must be removed, that requires a better-auth config change (outside scope; flag to implementer).

A new route file `src/routes/user.routes.ts` and controller `src/controllers/user.controller.ts` will be introduced. The service logic lives in a new `src/services/user.service.ts` (or the soft-delete cascade utility is called directly from the controller — prefer service layer for consistency).

---

## 4. Error Handling

No new error types are required. All soft-deleted-record-as-404 cases use the existing `NotFoundError`:

| Scenario | Error | HTTP |
|---|---|---|
| Record not found by ID | `NotFoundError` | 404 |
| Record found but `deletedAt` is non-null | `NotFoundError` (same message — no distinction) | 404 |
| Attempt to create assessment attempt against soft-deleted assessment | `NotFoundError` | 404 |

The error handler (`errorHandler.ts`) already maps `NotFoundError` to 404. No changes to the error handler.

---

## 5. Validation

No new Zod schemas are required. The `deletedAt` field is never accepted as input from clients — it is always set server-side. Route schemas remain unchanged.

---

## 6. Affected Files Summary

| File | Change type |
|---|---|
| `prisma/schema.prisma` | Add `deletedAt DateTime?` to User, Course, Unit, Lesson, Assessment |
| `prisma/migrations/<timestamp>_soft_delete/migration.sql` | Generated + manually edited to add partial indexes |
| `src/utils/softDelete.ts` | New — cascade soft-delete utility |
| `src/services/course.service.ts` | Add `deletedAt: null` filters; replace `delete` with `softDeleteCourse` in transaction |
| `src/services/unit.service.ts` | Add `deletedAt: null` filters; replace `delete` with `softDeleteUnit` in transaction |
| `src/services/lesson.service.ts` | Add `deletedAt: null` filters; replace `delete` with `softDeleteLesson` in transaction |
| `src/services/assessment.service.ts` | Add `deletedAt: null` filters; `findUnique` → `findFirst` in `findByParent`; gate `submitAttempt` |
| `src/services/progress.service.ts` | Add `deletedAt: null` to all `where` and include filters |
| `src/services/user.service.ts` | New — `softDeleteUser(id)` service function |
| `src/controllers/user.controller.ts` | New — `remove` handler |
| `src/routes/user.routes.ts` | New — `DELETE /users/:userId` route |
| `src/routes/index.ts` | Mount new user router |

No changes to route files for Course, Unit, Lesson, or Assessment — their DELETE endpoints already exist; only the service layer changes.

---

## 7. No New npm Dependencies

All required capabilities (Prisma transactions, `updateMany`, `findFirst`) are available in the existing Prisma 6 client. No new packages are needed.
