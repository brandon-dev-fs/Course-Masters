---
id: cm-0021
title: Expand Unit Test Coverage — Backend Plan
stage: design
status: approved
approver: human
approved_at: 2026-05-15T00:00:00Z
---

# Backend Plan — cm-0021: Expand Unit Test Coverage

## Overview

This plan expands the server-side unit test suite from 1 test file (assessment.service.test.ts) to comprehensive coverage across all testable layers: services, middleware, and utilities. The existing testing infrastructure (Vitest, node environment, shared Prisma mock) established in cm-0020 requires no changes. All new tests follow the conventions already documented in `server/CLAUDE.md`.

---

## Coverage Target and Justification

**Target: 85%**

Justification: The server layer is composed primarily of pure business logic (services) and Express middleware functions — both of which are highly testable in isolation with the existing Prisma mock and a lightweight req/res/next mock factory. The 85% target is achievable because:

- All 12 service files contain testable functions with clearly defined inputs, outputs, and error paths
- All middleware files have distinct branches (authenticated/not, authorized/not, valid/invalid) that are fully exercisable without a running Express server
- All utility functions and error classes are pure or near-pure
- Excluded files (enumerated below) are genuinely untestable at the unit level and together represent a small fraction of total line count

A 70% target would be too conservative given how much of the codebase is already structured for testability. 85% is the realistic ceiling given the exclusions.

---

## File Exclusion Decisions

| File | Decision | Rationale |
|---|---|---|
| `server/src/index.ts` | EXCLUDED | Entry point — starts the HTTP server, validates env. No exercisable logic; side effects only. |
| `server/src/app.ts` | EXCLUDED | Wires Express middleware stack in a specific order. Integration concern; no business logic to unit test. |
| `server/src/config.ts` | EXCLUDED | Zod validation of `process.env`. Testing would require controlling `process.env` globals — fragile and low value. The schema itself is declarative Zod. |
| `server/src/swagger.ts` | EXCLUDED | Static OpenAPI document definition. No logic. |
| `server/src/lib/prisma.ts` | EXCLUDED | `new PrismaClient()` singleton. No logic to test. |
| `server/src/lib/auth.ts` | EXCLUDED | better-auth initialization with access control setup. Third-party library configuration, not application logic. |
| `server/src/lib/logger.ts` | EXCLUDED | pino instance with redaction config. Third-party library initialization. |
| `server/src/routes/*.ts` | EXCLUDED | Express router wiring (middleware chain + controller reference). All behavior exercised through middleware and service tests. No logic lives in route files. |
| `server/src/schemas/*.ts` | EXCLUDED | Declarative Zod schemas. Logic lives inside Zod itself — we are not testing Zod. |
| `server/src/errors/index.ts` | EXCLUDED | Re-export barrel only. Zero logic. |
| `server/src/middleware/rateLimiter.ts` | EXCLUDED | Thin `express-rate-limit` configuration wrapper. Third-party library behavior. |
| `server/src/middleware/requestId.ts` | EXCLUDED | Simple UUID attachment middleware. Trivially correct, no branches. |
| `server/src/middleware/httpLogger.ts` | EXCLUDED | pino-http configuration wrapper. Third-party library behavior. |
| `server/src/types/express.d.ts` | EXCLUDED | TypeScript declaration file only. Not compiled to runtime code. |
| `server/src/controllers/*.ts` | EXCLUDED | Controllers are deliberately thin HTTP adapters: extract params → call one service method → send response. All business logic lives in services. Testing controllers would mock the service (making the test a mock of a mock) while providing no signal about correctness. Behavior is fully exercised through service tests plus middleware tests. |

---

## File Audit Table

| File | Status | Notes |
|---|---|---|
| `services/assessment.service.ts` | COVERED | 26 tests in cm-0020 |
| `services/assignment.service.ts` | WILL TEST | CRUD operations on LessonTool/LessonResource |
| `services/completion.service.ts` | WILL TEST | Complex quiz-gate logic + cascade completions |
| `services/course.service.ts` | WILL TEST | CRUD with soft delete, ownership |
| `services/lesson.service.ts` | WILL TEST | CRUD with soft delete |
| `services/lesson-resource.service.ts` | WILL TEST | CRUD + order management |
| `services/lesson-tool.service.ts` | WILL TEST | CRUD + order management |
| `services/progress.service.ts` | WILL TEST | Complex progress calculation logic |
| `services/resource-completion.service.ts` | WILL TEST | Completion tracking per resource |
| `services/student-note.service.ts` | WILL TEST | CRUD with unique constraint handling |
| `services/unit.service.ts` | WILL TEST | CRUD with soft delete |
| `services/user.service.ts` | WILL TEST | CRUD + role management |
| `middleware/authenticate.ts` | WILL TEST | Session valid / missing / expired branches |
| `middleware/authorize.ts` | WILL TEST | Role match / mismatch branches |
| `middleware/authorize-resource.ts` | WILL TEST | Ownership check, admin bypass, student bypass |
| `middleware/envelope.ts` | WILL TEST | Wraps res.json payload |
| `middleware/errorHandler.ts` | WILL TEST | All error type branches (AppError, Prisma codes, unhandled) |
| `middleware/validate.ts` | WILL TEST | Valid body passes through, invalid throws ValidationError |
| `utils/asyncHandler.ts` | WILL TEST | Forwards thrown errors to next() |
| `utils/assertExists.ts` | WILL TEST | Returns record when found, throws NotFoundError when null |
| `utils/softDelete.ts` | WILL TEST | Cascade soft-delete operations via transaction mock |
| `errors/AppError.ts` | WILL TEST | Constructor, properties, statusCode |
| `errors/NotFoundError.ts` | WILL TEST | Extends AppError, correct code/statusCode |
| `errors/ValidationError.ts` | WILL TEST | Extends AppError, details field |
| `errors/ConflictError.ts` | WILL TEST | Extends AppError, correct code/statusCode |
| `index.ts` | EXCLUDED | Entry point |
| `app.ts` | EXCLUDED | Middleware wiring |
| `config.ts` | EXCLUDED | Zod env validation |
| `swagger.ts` | EXCLUDED | Static OpenAPI definition |
| `lib/prisma.ts` | EXCLUDED | Singleton instantiation |
| `lib/auth.ts` | EXCLUDED | Third-party initialization |
| `lib/logger.ts` | EXCLUDED | Third-party initialization |
| `routes/*.ts` (all) | EXCLUDED | Express router wiring |
| `schemas/*.ts` (all) | EXCLUDED | Declarative Zod schemas |
| `errors/index.ts` | EXCLUDED | Re-export barrel |
| `middleware/rateLimiter.ts` | EXCLUDED | Third-party wrapper |
| `middleware/requestId.ts` | EXCLUDED | Trivial UUID attachment |
| `middleware/httpLogger.ts` | EXCLUDED | Third-party wrapper |
| `controllers/*.ts` (all) | EXCLUDED | Thin HTTP adapters |
| `types/express.d.ts` | EXCLUDED | TypeScript declarations only |

---

## Shared Test Utilities

### Express Middleware Mock Factory

Middleware tests need lightweight `req`, `res`, and `next` mocks. Add a shared factory:

**File**: `server/src/__tests__/mocks/express.ts`

```ts
import { vi } from 'vitest';

export function makeReq(overrides: Record<string, unknown> = {}) {
  return {
    user: null,
    session: null,
    params: {},
    body: {},
    headers: {},
    requestId: 'req-test-id',
    ...overrides,
  };
}

export function makeRes() {
  const res: Record<string, ReturnType<typeof vi.fn>> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res;
}

export function makeNext() {
  return vi.fn();
}
```

---

## Implementation Steps (Priority Order)

### 1. Error Classes — `server/src/__tests__/errors/errors.test.ts`
**Priority: LOW** (pure constructors, but establishes pattern for error assertions in other tests)

Tests:
- `AppError` sets `code`, `message`, `statusCode`, optional `details`
- `NotFoundError` has code `NOT_FOUND`, statusCode `404`
- `ValidationError` has code `VALIDATION_ERROR`, statusCode `400`, carries `details`
- `ConflictError` has code `CONFLICT`, statusCode `409`
- All extend `AppError` (`instanceof` checks)

---

### 2. Utilities — `server/src/__tests__/utils/asyncHandler.test.ts`
**Priority: LOW**

Tests:
- Resolved async handler calls `next()` with no argument
- Rejected async handler forwards the error to `next(err)`
- Return value of handler is not passed to next

---

### 3. Utilities — `server/src/__tests__/utils/assertExists.test.ts`
**Priority: LOW**

Tests:
- Returns record when `findUnique` resolves a value
- Throws `NotFoundError` with appropriate message when `findUnique` returns null
- Error message includes the resource name passed as third argument

Mock: pass a mock `{ findUnique: vi.fn() }` object directly — no Prisma mock needed.

---

### 4. Utilities — `server/src/__tests__/utils/softDelete.test.ts`
**Priority: MEDIUM** (cascade correctness is critical)

Tests:
- `softDeleteLesson`: sets `deletedAt` on lesson, calls updateMany for resources and tools
- `softDeleteUnit`: sets `deletedAt` on unit, cascades to lessons
- `softDeleteCourse`: sets `deletedAt` on course, cascades to units and assessments
- `softDeleteUser`: sets `deletedAt` on user
- All operations run inside a single `$transaction` call
- Transaction is called exactly once per helper

Mock setup: `prismaMock.$transaction` is handled by the existing Prisma mock — it executes the callback with a fresh proxy.

---

### 5. Middleware — `server/src/__tests__/middleware/envelope.test.ts`
**Priority: LOW**

Tests:
- `res.json(payload)` is wrapped to call original json with `{ data: payload }`
- Responses with status >= 400 bypass the envelope (errorHandler handles those)
- 204 responses (`res.status(204).send()`) do not trigger envelope

---

### 6. Middleware — `server/src/__tests__/middleware/validate.test.ts`
**Priority: MEDIUM**

Tests:
- Valid body passes through unchanged, `next()` called without error
- Invalid body throws `ValidationError` with flattened field errors
- Query validation: valid query is attached to `res.locals.validatedQuery`
- Query validation: invalid query throws `ValidationError`

---

### 7. Middleware — `server/src/__tests__/middleware/errorHandler.test.ts`
**Priority: HIGH** (central error contract)

Tests:
- `AppError` subclass → correct statusCode + code in response body
- Prisma `P2025` → 404 `NOT_FOUND`
- Prisma `P2002` → 409 `CONFLICT`
- Prisma `P2003` → 409 `CONFLICT`
- `PrismaClientValidationError` → 400 `VALIDATION_ERROR`
- Unknown error → 500 `INTERNAL_ERROR`
- Response body always matches `{ error: { code, message, details? } }` shape
- Stack traces never appear in response body

---

### 8. Middleware — `server/src/__tests__/middleware/authorize.test.ts`
**Priority: MEDIUM**

Tests:
- User with matching role: `next()` called without error
- User with non-matching role: `next(AppError)` called with 403 FORBIDDEN
- Multiple allowed roles: any match passes
- `req.user` is null (unauthenticated): 403 returned (authenticate should prevent this, but defensive)

---

### 9. Middleware — `server/src/__tests__/middleware/authenticate.test.ts`
**Priority: HIGH**

Tests:
- Valid session cookie: `req.user` and `req.session` set, `next()` called
- Missing session: 401 UNAUTHENTICATED returned
- Expired/invalid session: 401 UNAUTHENTICATED returned

Mock: `vi.mock('../../lib/auth.js', ...)` to control `auth.api.getSession` return value.

---

### 10. Middleware — `server/src/__tests__/middleware/authorize-resource.test.ts`
**Priority: HIGH** (ownership enforcement)

Tests:
- `requireCourseOwnership`: teacher owns resource → `next()` called
- `requireCourseOwnership`: teacher does not own → `NotFoundError` thrown (not 403)
- `requireCourseOwnership`: admin bypasses ownership check entirely
- `requireCourseOwnership`: resource not found → `NotFoundError` thrown
- `requireSelf`: user matches target → `next()` called
- `requireSelf`: user does not match → 403 thrown
- `requireSelf`: admin bypasses
- `requireStudentRole`: student → passes
- `requireStudentRole`: teacher → 403
- `requireStudentRole`: admin → 403

---

### 11. Service — `server/src/__tests__/services/student-note.service.test.ts`
**Priority: MEDIUM**

Tests:
- `getOrCreate`: returns existing note when found
- `getOrCreate`: creates new note when none exists
- `delete`: calls `delete` on prismaMock, throws `NotFoundError` if not found
- Unique constraint violation (P2002) propagates as `ConflictError`

---

### 12. Service — `server/src/__tests__/services/resource-completion.service.test.ts`
**Priority: MEDIUM**

Tests:
- `markComplete`: creates completion record
- `markComplete`: idempotent on re-completion (P2002 → no error or handled gracefully)
- `getCompletions`: returns list of completed resource IDs for a lesson+user

---

### 13. Service — `server/src/__tests__/services/lesson-resource.service.test.ts`
**Priority: MEDIUM**

Tests:
- `create`: sets correct `order` (max existing order + 1)
- `update`: updates fields, returns updated record
- `delete`: hard deletes
- `reorder`: swaps `order` values between two resources

---

### 14. Service — `server/src/__tests__/services/lesson-tool.service.test.ts`
**Priority: MEDIUM**

Tests:
- `create`: sets correct `order`
- `update`: updates fields
- `delete`: hard deletes
- `reorder`: swaps `order` values

---

### 15. Service — `server/src/__tests__/services/assignment.service.test.ts`
**Priority: MEDIUM**

Tests:
- `getAll`: returns sorted list by `order`
- `create`: inserts with correct order
- `update`: updates content
- `delete`: hard deletes
- `reorder`: swaps `order` values

---

### 16. Service — `server/src/__tests__/services/unit.service.test.ts`
**Priority: MEDIUM**

Tests:
- `getAll`: filters `deletedAt: null`
- `getById`: returns unit, throws `NotFoundError` when not found or soft-deleted
- `create`: creates with provided fields
- `update`: partial update
- `delete`: calls `softDeleteUnit`

---

### 17. Service — `server/src/__tests__/services/lesson.service.test.ts`
**Priority: MEDIUM**

Tests:
- `getAll`: filters `deletedAt: null`
- `getById`: returns lesson, throws `NotFoundError` when not found or soft-deleted
- `create`: creates with provided fields
- `update`: partial update
- `delete`: calls `softDeleteLesson`

---

### 18. Service — `server/src/__tests__/services/course.service.test.ts`
**Priority: HIGH**

Tests:
- `getAll`: returns all non-soft-deleted courses
- `getById`: returns course, throws `NotFoundError` when not found
- `create`: creates with `authorId`
- `update`: partial update, verifies `updatedAt` touched
- `delete`: calls `softDeleteCourse`

---

### 19. Service — `server/src/__tests__/services/user.service.test.ts`
**Priority: MEDIUM**

Tests:
- `getById`: returns user, throws `NotFoundError` when not found
- `updateRole`: updates user role
- `delete`: calls `softDeleteUser`

---

### 20. Service — `server/src/__tests__/services/completion.service.test.ts`
**Priority: HIGH** (complex quiz-gate logic)

Tests:
- `completeLesson`: passes when no quiz exists
- `completeLesson`: passes when quiz exists and latest attempt `passed === true`
- `completeLesson`: throws when quiz exists and latest attempt `passed === false`
- `completeLesson`: throws when quiz exists and no attempts
- `uncompleteLesson`: deletes completion record
- `completeUnit`: creates unit completion record
- `uncompleteUnit`: deletes unit completion record

---

### 21. Service — `server/src/__tests__/services/progress.service.test.ts`
**Priority: HIGH** (progress formula)

Tests:
- `getCourseProgress`: 0% when no lessons completed, no exam
- `getCourseProgress`: calculates `Math.round((completed / total) * 90)` correctly at various values
- `getCourseProgress`: caps at 100% when course exam passed
- `getCourseProgress`: max 90% when exam not passed even if all lessons complete
- `getUnitProgress`: correct counts for completed vs. total lessons

---

## Implementation Notes

### Middleware Testing Pattern
```ts
import { makeReq, makeRes, makeNext } from '../mocks/express.js';

const req = makeReq({ user: { id: 'u-1', role: 'student' } });
const res = makeRes();
const next = makeNext();

await middlewareFn(req, res, next);

expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: 'FORBIDDEN' }));
```

### Mocking better-auth in authenticate tests
```ts
vi.mock('../../lib/auth.js', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));
import { auth } from '../../lib/auth.js';
(auth.api.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({ user: mockUser, session: mockSession });
```

### Soft delete transaction testing
The existing `prismaMock.$transaction` mock executes the callback synchronously with a fresh proxy. No special setup needed beyond the standard `vi.mock('../../lib/prisma.js', () => ({ default: prismaMock }))`.

### Error class testing does not need Prisma mock
Import error classes directly — they have no external dependencies.
