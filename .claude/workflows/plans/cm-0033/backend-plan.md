---
id: cm-0033
title: Course Builder — Backend Plan
stage: design
status: approved
---

# Course Builder — Backend Plan

## Overview

Three new backend endpoints support the course builder:

1. **GET /api/courses/:courseId/builder/outline** — fetch the full course hierarchy in one query
2. **PUT /api/courses/:courseId/units/reorder** — batch reorder units within a course
3. **PUT /api/units/:unitId/lessons/reorder** — batch reorder lessons within a unit

The existing `PUT /api/lessons/:lessonId/assignments/reorder` endpoint already handles assignment reordering and is reused as-is.

> **Data model note**: The spec references "resources" and "tools" as separate entities, but the current schema has consolidated all lesson activities into the `Assignment` model with `AssignmentType` enum values (`note`, `video`, `reading`, `vocab`, `practice_problem`, `file`). The `LessonResource` and `LessonTool` models no longer exist. Therefore, separate resource/tool reorder endpoints are unnecessary — the existing assignment reorder endpoint covers all activity types.

## Schema Changes

No schema changes required. All existing models and fields are sufficient:

- `Course` — `id`, `title`, `description`, `authorId`
- `Unit` — `id`, `title`, `order`, `courseId`, `deletedAt`
- `Lesson` — `id`, `title`, `order`, `unitId`, `deletedAt`
- `Assignment` — `id`, `title`, `order`, `type`, `lessonId` (types: `note`, `video`, `reading`, `vocab`, `practice_problem`, `file`)
- `Assessment` — `id`, `type`, `lessonId?`, `unitId?`, `courseId?`, `deletedAt`
- `AssessmentQuestion` — `id`, `assessmentId` (used for `_count` only)

## New Files to Create

### 1. Route file: `server/src/routes/builder.routes.ts`

```
Router({ mergeParams: true })

GET  /                → builderController.getOutline
PUT  /units/reorder   → builderController.reorderUnits
```

Middleware chain for GET:
- `authorize('teacher', 'admin')`
- `requireCourseOwnership('course', req => req.params['courseId'])`
- `builderController.getOutline`

Middleware chain for PUT /units/reorder:
- `authorize('teacher', 'admin')`
- `requireCourseOwnership('course', req => req.params['courseId'])`
- `validate(reorderItemsSchema)`
- `builderController.reorderUnits`

### 2. Route file: `server/src/routes/builder-lesson.routes.ts`

```
Router({ mergeParams: true })

PUT  /reorder   → builderController.reorderLessons
```

Middleware chain for PUT /reorder:
- `authorize('teacher', 'admin')`
- `requireCourseOwnership('unit', req => req.params['unitId'])`
- `validate(reorderItemsSchema)`
- `builderController.reorderLessons`

### 3. Controller: `server/src/controllers/builder.controller.ts`

Three methods, all wrapped in `asyncHandler`:

```typescript
getOutline: asyncHandler(async (req, res) => {
  const courseId = req.params['courseId'] as string;
  const outline = await builderService.getOutline(courseId);
  res.json(outline);
})

reorderUnits: asyncHandler(async (req, res) => {
  const courseId = req.params['courseId'] as string;
  await builderService.reorderUnits(courseId, req.body.items);
  res.status(204).send();
})

reorderLessons: asyncHandler(async (req, res) => {
  const unitId = req.params['unitId'] as string;
  await builderService.reorderLessons(unitId, req.body.items);
  res.status(204).send();
})
```

### 4. Service: `server/src/services/builder.service.ts`

#### `getOutline(courseId: string)`

Single Prisma query with nested includes. Returns the full course hierarchy.

**Pseudocode:**

```
1. findFirst on Course where { id: courseId, deletedAt: null }
   include:
     - units (where: deletedAt null, orderBy: order asc)
       include:
         - lessons (where: deletedAt null, orderBy: order asc)
           include:
             - assignments (orderBy: order asc)
               select: id, title, type, order
             - assessment (where: deletedAt null)
               include: _count: { select: { questions: true } }
               select: id, type, _count
         - assessment (where: deletedAt null)
           include: _count: { select: { questions: true } }
           select: id, type, _count
     - assessment (where: deletedAt null, type: course_exam)
       include: _count: { select: { questions: true } }
       select: id, type, _count

2. If course is null, throw NotFoundError('Course not found')

3. Transform the Prisma result to the response shape:
   - Strip deletedAt from all levels
   - For each assignment: return { id, title, type, order }
   - For each assessment: return { id, type, questionCount: _count.questions }
   - Compute summary counts: totalUnits, totalLessons, totalAssignments
```

**Performance note:** This is a single Prisma query compiled to JOINs. No N+1 queries. For a course with 20 units x 15 lessons x 20 assignments, this returns ~6000 assignment rows at most, which is well within acceptable query performance. The `select` clauses limit the data transferred.

#### `reorderUnits(courseId: string, items: ReorderItem[])`

**Pseudocode:**

```
1. Verify course exists: findFirst where { id: courseId, deletedAt: null }
   If null, throw NotFoundError('Course not found')

2. Run $transaction with Serializable isolation:
   a. Lock rows: SELECT id FROM "unit" WHERE "courseId" = courseId AND "deletedAt" IS NULL FOR UPDATE
   b. Validate: every id in items must exist in locked rows, and every locked row must appear in items
      If mismatch, throw ValidationError('INVALID_REORDER', 'Provided unit IDs do not match course units')
   c. Promise.all: update each unit's order field
      tx.unit.update({ where: { id }, data: { order } }) for each item
```

This follows the exact same pattern as the existing `assignmentService.reorder()`.

#### `reorderLessons(unitId: string, items: ReorderItem[])`

**Pseudocode:**

```
1. Verify unit exists: findFirst where { id: unitId, deletedAt: null }
   If null, throw NotFoundError('Unit not found')

2. Run $transaction with Serializable isolation:
   a. Lock rows: SELECT id FROM "lesson" WHERE "unitId" = unitId AND "deletedAt" IS NULL FOR UPDATE
   b. Validate: every id in items must exist in locked rows, and every locked row must appear in items
      If mismatch, throw ValidationError('INVALID_REORDER', 'Provided lesson IDs do not match unit lessons')
   c. Promise.all: update each lesson's order field
      tx.lesson.update({ where: { id }, data: { order } }) for each item
```

### 5. Schema: `server/src/schemas/builder.schema.ts`

```typescript
import { z } from 'zod';

const reorderItemSchema = z.object({
  id: z.string().uuid(),
  order: z.number().int().min(1),
});

export const reorderItemsSchema = z.object({
  items: z.array(reorderItemSchema).min(1),
});

export type ReorderItem = z.infer<typeof reorderItemSchema>;
export type ReorderItemsInput = z.infer<typeof reorderItemsSchema>;
```

## Existing Files to Modify

### `server/src/routes/index.ts`

Add two new route mounts:

```typescript
import builderRouter from './builder.routes.js';
import { builderLessonReorderRouter } from './builder-lesson.routes.js';

// Builder
router.use('/courses/:courseId/builder', builderRouter);
router.use('/units/:unitId/lessons/reorder', builderLessonReorderRouter);
```

**Placement note:** The lesson reorder route must be mounted at the root router level (like progress routes) because it uses `:unitId` as a path param. Mount it before the existing `/units/:unitId/lessons` route to avoid the `/reorder` segment being captured as a `:lessonId` param.

Alternatively, mount the reorder endpoint inside the existing `lesson.routes.ts` file, before the `/:lessonId` route, using the same pattern as the assignment reorder in `assignment.routes.ts`. This is the preferred approach since it keeps related routes together.

**Preferred approach — modify `server/src/routes/lesson.routes.ts`:**

Add the reorder route before the `/:lessonId` route:

```typescript
import { builderController } from '../controllers/builder.controller.js';
import { reorderItemsSchema } from '../schemas/builder.schema.js';

router.put(
  '/reorder',
  authorize('teacher', 'admin'),
  requireCourseOwnership('unit', (req) => req.params['unitId'] as string),
  validate(reorderItemsSchema),
  builderController.reorderLessons,
);
```

This follows the same pattern used in `assignment.routes.ts` where `/reorder` is registered before `/:assignmentId`.

Similarly, add the unit reorder to `server/src/routes/unit.routes.ts` before `/:unitId`:

```typescript
import { builderController } from '../controllers/builder.controller.js';
import { reorderItemsSchema } from '../schemas/builder.schema.js';

router.put(
  '/reorder',
  authorize('teacher', 'admin'),
  requireCourseOwnership('course', (req) => req.params['courseId'] as string),
  validate(reorderItemsSchema),
  builderController.reorderUnits,
);
```

**Revised file plan:**

| Action | File | Change |
|--------|------|--------|
| Create | `server/src/routes/builder.routes.ts` | Outline tree GET only |
| Create | `server/src/controllers/builder.controller.ts` | All three controller methods |
| Create | `server/src/services/builder.service.ts` | All three service methods |
| Create | `server/src/schemas/builder.schema.ts` | `reorderItemsSchema` |
| Modify | `server/src/routes/index.ts` | Mount builder router at `/courses/:courseId/builder` |
| Modify | `server/src/routes/unit.routes.ts` | Add `PUT /reorder` before `/:unitId` |
| Modify | `server/src/routes/lesson.routes.ts` | Add `PUT /reorder` before `/:lessonId` |

## Error Handling

| Scenario | Error Class | Code | Status |
|----------|-------------|------|--------|
| Course not found (or soft-deleted) | `NotFoundError` | `NOT_FOUND` | 404 |
| Unit not found (or soft-deleted) | `NotFoundError` | `NOT_FOUND` | 404 |
| Reorder item IDs don't match existing records | `ValidationError` | `VALIDATION_ERROR` | 400 |
| Reorder body fails Zod validation | `ValidationError` | `VALIDATION_ERROR` | 400 |
| Not authenticated | (authenticate middleware) | `UNAUTHENTICATED` | 401 |
| Not teacher/admin | (authorize middleware) | `FORBIDDEN` | 403 |
| Not course owner | `NotFoundError` / `AppError` | `NOT_FOUND` / `FORBIDDEN` | 404 / 403 |
| Transaction conflict (concurrent reorder) | (Prisma P2034) | `TRANSACTION_CONFLICT` | 409 |

## Validation

- `reorderItemsSchema`: validates `{ items: [{ id: uuid, order: int >= 1 }] }` with `min(1)` on the array
- The outline tree endpoint has no request body or query params to validate
- All path params (`:courseId`, `:unitId`) are validated implicitly by `requireCourseOwnership` which does a DB lookup

## Transaction Requirements

Both reorder endpoints use `prisma.$transaction()` with `Serializable` isolation level and `SELECT ... FOR UPDATE` row locking, matching the existing assignment reorder pattern. This prevents:
- Race conditions from concurrent reorder requests
- Partial updates if one row update fails

## Dependencies

No new npm packages required. All functionality is implemented with existing dependencies:
- Express 5, Prisma 6, Zod 3 (existing)

## Implementation Order

1. Create `server/src/schemas/builder.schema.ts` (no dependencies)
2. Create `server/src/services/builder.service.ts` (depends on Prisma, errors)
3. Create `server/src/controllers/builder.controller.ts` (depends on service)
4. Create `server/src/routes/builder.routes.ts` (depends on controller, schema)
5. Modify `server/src/routes/unit.routes.ts` — add reorder route
6. Modify `server/src/routes/lesson.routes.ts` — add reorder route
7. Modify `server/src/routes/index.ts` — mount builder router
