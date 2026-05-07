---
id: cm-0005
title: Refactor Backend Service Layer for Clean Separation and Centralized Error Handling
stage: design
status: approved
approver: human
approved_at: 2026-05-06T00:00:00Z
---

# Backend Plan — cm-0005

## Overview

Pure code refactoring across three concerns. No schema changes, no new routes, no contract changes. Every observable API behavior is preserved exactly. The three concerns are independent and can be implemented in any order, though the migration sequence in Section 6 minimizes risk.

---

## Schema Changes

None. This is a pure code refactoring with no Prisma schema or migration changes.

---

## Layer Structure

### New file: `server/src/utils/assertExists.ts`

This utility consolidates the find-then-throw-if-null pattern that currently appears ~90 times across 11 service files.

**TypeScript signature:**

```typescript
import { NotFoundError } from '../errors/index.js';

/**
 * Queries `delegate.findUnique({ where: { id } })` and returns the record.
 * Throws NotFoundError with `<entityName> not found` if the result is null.
 *
 * T is inferred from the delegate's return type so the caller receives
 * a fully-typed, non-null record without any `any`.
 */
export async function assertExists<T>(
  delegate: { findUnique: (args: { where: { id: string } }) => Promise<T | null> },
  id: string,
  entityName: string,
): Promise<T> {
  const record = await delegate.findUnique({ where: { id } });
  if (record === null) throw new NotFoundError(`${entityName} not found`);
  return record;
}
```

**Design rationale:**

- The delegate type is structural (duck-typed), not imported from Prisma internals. This keeps the utility decoupled from any specific Prisma model and avoids the `any` escape hatch.
- `entityName` is a caller-supplied string (e.g. `'Course'`, `'Unit'`, `'Lesson'`), not derived from Prisma model metadata, so no Prisma internals are exposed in error messages.
- One `findUnique` call per invocation — identical to the current inline pattern (NFR-01).
- Return type `T` is fully inferred from the delegate, so callers see the concrete Prisma model type without casting (NFR-02).

**Placement rationale:** `server/src/utils/` already contains `asyncHandler.ts`, establishing it as the home for shared service-layer helpers. Placing `assertExists` here keeps it discoverable alongside the existing utility pattern.

---

### Modified: `server/src/services/*.ts` (all 11 files)

Replace every inline `findUnique` + null check + `throw new NotFoundError(...)` with a call to `assertExists`.

**Replacement pattern (before):**

```typescript
const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
if (!lesson) throw new NotFoundError('Lesson not found');
```

**Replacement pattern (after):**

```typescript
await assertExists(prisma.lesson, lessonId, 'Lesson');
```

When the record is also used after the check (e.g. `course.authorId`), capture the return value:

```typescript
const course = await assertExists(prisma.course, id, 'Course');
```

**Per-file call sites (exhaustive):**

| File | Entity type(s) validated | Approx. occurrences |
|---|---|---|
| `course.service.ts` | Course | 2 (`findById`, inline in `update`/`remove` via `findById`) |
| `unit.service.ts` | Course, Unit | 4 |
| `lesson.service.ts` | Unit, Lesson | 4 |
| `lesson-resource.service.ts` | Lesson, LessonResource | 4 |
| `lesson-tool.service.ts` | Lesson, LessonTool | 4 |
| `student-note.service.ts` | Lesson | 2 |
| `completion.service.ts` | Lesson, Unit | 4 |
| `assessment.service.ts` | Lesson, Unit, Course, Assessment | ~8 (including `assertParentExists` helper) |
| `assignment.service.ts` | Lesson, Assignment | ~8 |
| `resource-completion.service.ts` | (no parent assertions currently) | 0 |
| `progress.service.ts` | Course, Unit | 2 (post-refactor, see below) |

Note: `assessment.service.ts` already has a local `assertParentExists` helper. That helper is replaced by `assertExists` calls to each delegate directly.

---

### Modified: `server/src/services/progress.service.ts`

Split the two monolithic methods into data-fetching functions and pure computation functions. The public service methods remain unchanged in signature and return type.

**New file structure (single file, logically sectioned):**

```
progress.service.ts
  ├── [Data fetching]  fetchCourseProgressData(courseId, userId)
  ├── [Data fetching]  fetchUnitProgressData(unitId, userId)
  ├── [Computation]    computeCourseProgress(data: CourseProgressData)
  ├── [Computation]    computeUnitProgress(data: UnitProgressData)
  └── [Public service] progressService.getCourseProgress / getUnitProgress
```

All four helper functions are exported so they can be unit-tested independently. The public `progressService` object calls them in sequence.

**Type definitions (co-located at top of file):**

```typescript
// Shape returned by prisma query in fetchCourseProgressData
type CourseProgressData = Prisma.CourseGetPayload<{
  include: {
    units: {
      include: {
        lessons: {
          include: {
            assessment: { where: { type: 'lesson_quiz' }; include: { attempts: true } }
          }
        };
        assessment: { where: { type: 'unit_quiz' }; include: { attempts: true } }
      }
    };
    assessment: { where: { type: 'course_exam' }; include: { attempts: true } }
  }
}>;

// Shape returned by prisma query in fetchUnitProgressData
type UnitProgressData = Prisma.UnitGetPayload<{
  include: {
    lessons: {
      include: {
        assessment: { where: { type: 'lesson_quiz' }; include: { attempts: true } }
      }
    };
    assessment: { where: { type: 'unit_quiz' }; include: { attempts: true } }
  }
}>;
```

These `Prisma.XGetPayload` types derive directly from the Prisma schema so they stay in sync automatically with any future schema change.

**Data fetching functions (pseudocode):**

```typescript
export async function fetchCourseProgressData(
  courseId: string,
  userId: string,
): Promise<CourseProgressData> {
  const course = await assertExists(prisma.course, courseId, 'Course');
  // Re-fetch with full include shape (assertExists uses bare findUnique;
  // we need the nested include, so a second query is acceptable here —
  // the include shape is too deep to express through the assertExists delegate type)
  return prisma.course.findUniqueOrThrow({
    where: { id: courseId },
    include: { /* same include as current getCourseProgress */ },
  });
}
```

**Alternative (preferred — single query, no extra round-trip):**

```typescript
export async function fetchCourseProgressData(
  courseId: string,
  userId: string,
): Promise<CourseProgressData> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { /* same deep include as current getCourseProgress */ },
  });
  if (!course) throw new NotFoundError('Course not found');
  return course;
}
```

The preferred form keeps the single query from the current implementation. `assertExists` is not used here because the delegate would need to carry the full `include` shape, which cannot be expressed through the generic delegate type without losing the typed return. Using `assertExists` only for the shallow existence checks in other services is the correct scope.

**Pure computation functions (pseudocode):**

```typescript
export function computeCourseProgress(data: CourseProgressData): CourseProgressResult {
  // All logic from the current getCourseProgress method after the Prisma query,
  // exactly as written today. No side effects. No Prisma access.
  // Returns the same shape currently returned by getCourseProgress.
  const allLessons = data.units.flatMap(u => u.lessons);
  // ... (verbatim extraction of current computation block)
  return { totalUnits, completedUnits, totalLessons, completedLessons, examPassed, examScore, percentComplete, units };
}

export function computeUnitProgress(data: UnitProgressData): UnitProgressResult {
  // All logic from the current getUnitProgress method after the Prisma query.
  // Returns the same shape currently returned by getUnitProgress.
}
```

**Public service methods (after refactoring):**

```typescript
export const progressService = {
  async getCourseProgress(courseId: string, userId: string) {
    const data = await fetchCourseProgressData(courseId, userId);
    return computeCourseProgress(data);
  },

  async getUnitProgress(unitId: string, userId: string) {
    const data = await fetchUnitProgressData(unitId, userId);
    return computeUnitProgress(data);
  },
};
```

Return shapes are identical to current output (FR-05 preserved).

---

### Modified: `server/src/middleware/errorHandler.ts`

**New error class: `server/src/errors/ConflictError.ts`**

```typescript
import { AppError } from './AppError.js';

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super('CONFLICT', message, 409);
  }
}
```

Export from `server/src/errors/index.ts`:

```typescript
export { ConflictError } from './ConflictError.js';
```

**Expanded error handler — new Prisma mappings:**

```typescript
if (err instanceof Prisma.PrismaClientKnownRequestError) {
  if (err.code === 'P2025') {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Resource not found' } });
    return;
  }
  if (err.code === 'P2002') {
    res.status(409).json({ error: { code: 'CONFLICT', message: 'Resource already exists' } });
    return;
  }
  // NEW: P2003 — foreign key constraint violation
  if (err.code === 'P2003') {
    res.status(409).json({ error: { code: 'CONFLICT', message: 'Operation conflicts with an existing relation' } });
    return;
  }
  // NEW: P2014 — required relation violation
  if (err.code === 'P2014') {
    res.status(409).json({ error: { code: 'CONFLICT', message: 'Operation would violate a required relation' } });
    return;
  }
}

// NEW: PrismaClientValidationError — invalid enum values, type mismatches
if (err instanceof Prisma.PrismaClientValidationError) {
  res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request data' } });
  return;
}
```

**Design decisions:**
- P2003 and P2014 map to 409 (conflict), not 400, because they arise from referential integrity violations, not malformed input.
- `PrismaClientValidationError` maps to 400 with code `VALIDATION_ERROR`, matching the existing `ValidationError` error code — consistent with the established error vocabulary.
- No Prisma `err.meta` fields are included in any response message. The messages are static strings (FR-10).
- P2003 and P2014 reuse `CONFLICT` code. A `ConflictError` class is added for use in service-layer business logic (e.g., duplicate detection), but the handler maps Prisma errors directly without instantiating error classes, keeping the handler flat and readable.

---

## Error Handling

### Existing pattern (unchanged)
- `AppError` subclasses (`NotFoundError`, `ValidationError`) are thrown from service layer and caught by `errorHandler.ts`.
- Shape: `{ error: { code: string, message: string, details?: object } }`.

### New `ConflictError` class
- Subclass of `AppError` with `statusCode: 409` and `code: 'CONFLICT'`.
- Used for service-layer business logic conflicts (e.g., detecting a duplicate before Prisma throws P2002).
- Not used for the new Prisma error mappings — those are handled inline in `errorHandler.ts`.

### Prisma error mapping table (final state)

| Prisma error | HTTP status | Response code | Message |
|---|---|---|---|
| `P2025` | 404 | `NOT_FOUND` | `Resource not found` |
| `P2002` | 409 | `CONFLICT` | `Resource already exists` |
| `P2003` (new) | 409 | `CONFLICT` | `Operation conflicts with an existing relation` |
| `P2014` (new) | 409 | `CONFLICT` | `Operation would violate a required relation` |
| `PrismaClientValidationError` (new) | 400 | `VALIDATION_ERROR` | `Invalid request data` |
| All others | 500 | `INTERNAL_ERROR` | `An unexpected error occurred` |

---

## Validation

No changes to Zod schemas or `validate.ts` middleware. This refactoring operates entirely within the service and error-handling layers.

---

## Test Considerations

### `assertExists` utility (`server/src/utils/assertExists.ts`)
- Unit test: mock delegate returns `null` → assert `NotFoundError` is thrown with correct message.
- Unit test: mock delegate returns a record → assert the record is returned with full type.
- No database required for either test.

### Progress computation functions
- The pure `computeCourseProgress` and `computeUnitProgress` functions accept a plain data object and return a plain result object. No mocking required.
- Test cases to cover: zero lessons, zero units, all lessons passed but no unit quiz, exam passed, exam not attempted, partial completion, `lessonPercent` boundary at zero total lessons.
- These tests cover the same logic as before but without spinning up a database or Prisma client.

### Error handler Prisma mapping
- Integration test via `supertest` or unit test with a mock `err` object.
- For each new mapping: construct a `Prisma.PrismaClientKnownRequestError` with the target `code`, pass to `errorHandler`, assert response status and body.
- For `PrismaClientValidationError`: construct instance, assert 400 + `VALIDATION_ERROR`.

### Service files (`assertExists` migration)
- No new test surface is introduced; existing service tests exercise the same paths.
- If any service file had inline tests verifying the exact error thrown, verify they still pass (message format `'<Entity> not found'` is preserved).

---

## Migration Order (minimize risk)

Implement in this sequence:

**Step 1 — Add `ConflictError` class**
New file, no other changes. Zero risk. Allows error handler and services to reference it immediately.

**Step 2 — Add `assertExists` utility**
New file, no other changes. Zero risk.

**Step 3 — Expand `errorHandler.ts`**
Add P2003, P2014, and `PrismaClientValidationError` mappings. Only changes behavior for currently-unhandled errors (previously 500 → now 4xx). No regressions possible on existing handled paths.

**Step 4 — Migrate service files to `assertExists`**
File by file. Each file is independently releasable. Suggested order (simplest first):
1. `completion.service.ts` (small, no business logic beyond the checks)
2. `lesson-resource.service.ts`
3. `lesson-tool.service.ts`
4. `student-note.service.ts`
5. `lesson.service.ts`
6. `unit.service.ts`
7. `course.service.ts`
8. `assignment.service.ts`
9. `assessment.service.ts` (replace local `assertParentExists` helper)
10. `progress.service.ts` (see Step 5)

**Step 5 — Refactor `progress.service.ts`**
Last because it is the most structurally complex change. At this point `assertExists` is available for the shallow existence checks, but the deep-include fetching functions use inline `findUnique` + null check (by design — see data-fetching section above).

---

## Dependencies

No new npm packages required. All changes use:
- TypeScript 5 (generics, `Prisma.XGetPayload` utility types)
- `@prisma/client` (already a dependency — `Prisma.PrismaClientKnownRequestError`, `Prisma.PrismaClientValidationError`, `Prisma.XGetPayload`)
- `NotFoundError`, `AppError` from `server/src/errors/` (existing)
