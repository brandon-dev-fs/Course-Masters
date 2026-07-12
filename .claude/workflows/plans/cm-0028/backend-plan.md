---
id: cm-0028
title: Lesson Activities — Activity Bookmarks, Lesson Checklist, StudentVocabFlashCard Removal
stage: design
status: approved
approver: human
approved_at: 2026-06-04T00:00:00Z
---

# Backend Plan — cm-0028

## Overview

This plan covers three backend changes for the lesson activities overhaul:

1. **Schema removal**: Delete the `StudentVocabFlashCard` model and all references.
2. **New model — `ActivityBookmark`**: Per-student, per-assignment bookmark with a free-text note.
3. **New model — `LessonChecklistItem`**: Per-student, per-lesson ordered checklist.
4. **Service integration**: Include the requesting student's bookmark in the assignment list response.

No changes to existing route paths, auth roles, or error handling conventions are required. New routes follow the established layering: `routes → controllers → services`.

---

## Migration Plan

Execute migrations in order. Never combine unrelated changes in a single migration.

### Task M-1 — Remove `StudentVocabFlashCard`

**Migration name**: `remove_student_vocab_flash_card`

Steps (Prisma handles in one migration):

1. In `schema.prisma`, remove the `StudentVocabFlashCard` model entirely.
2. Remove the `vocabFlashCards StudentVocabFlashCard[]` relation from `LessonTool`.
3. Remove the `vocabFlashCards StudentVocabFlashCard[]` relation from `User`.
4. Run `npx prisma migrate dev --name remove_student_vocab_flash_card`.
5. Prisma will emit SQL: `DELETE FROM student_vocab_flash_card; DROP TABLE student_vocab_flash_card;` — verify the generated SQL before applying.
6. Run `npx prisma generate` to update the client types.

> Note: All existing rows are deleted as part of the DROP TABLE. This is confirmed acceptable per spec FR-06. This migration is irreversible.

### Task M-2 — Add `ActivityBookmark` and `LessonChecklistItem`

**Migration name**: `add_activity_bookmark_and_lesson_checklist_item`

Steps:

1. In `schema.prisma`, add the `ActivityBookmark` model:

```prisma
model ActivityBookmark {
  id           String   @id @default(uuid())
  userId       String
  assignmentId String
  note         String   @db.VarChar(500)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  assignment Assignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)

  @@unique([userId, assignmentId])
  @@index([userId])
  @@map("activity_bookmark")
}
```

2. Add relation `activityBookmarks ActivityBookmark[]` to `User`.
3. Add relation `bookmark ActivityBookmark?` to `Assignment`.

4. In `schema.prisma`, add the `LessonChecklistItem` model:

```prisma
model LessonChecklistItem {
  id        String   @id @default(uuid())
  userId    String
  lessonId  String
  text      String   @db.VarChar(200)
  checked   Boolean  @default(false)
  order     Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  lesson Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@index([userId, lessonId])
  @@map("lesson_checklist_item")
}
```

5. Add relation `checklistItems LessonChecklistItem[]` to `User`.
6. Add relation `checklistItems LessonChecklistItem[]` to `Lesson`.
7. Run `npx prisma migrate dev --name add_activity_bookmark_and_lesson_checklist_item`.
8. Run `npx prisma generate`.

---

## Server Implementation

### Task S-1 — Delete `StudentVocabFlashCard` server references

Files to modify or delete:

- **`server/src/controllers/assignment.controller.ts`**: Remove `getSavedVocabFlashCards` handler (the old one referencing `StudentVocabFlashCard`). Do not touch `getSavedVocabEntryFlashCards` — that references `StudentVocabAssignmentFlashCard` which is kept.
- **`server/src/services/assignment.service.ts`**: No changes needed — the service already uses `studentVocabAssignmentFlashCard` (the new model). Confirm no references to `prisma.studentVocabFlashCard` remain after Prisma regeneration.
- **`server/src/routes/assignment.routes.ts`**: Confirm no routes reference the old flash card endpoints.

After M-1, TypeScript compilation will fail on any remaining `prisma.studentVocabFlashCard` references — use those errors as a checklist.

### Task S-2 — Bookmark schema (`server/src/schemas/bookmark.schema.ts`)

```ts
import { z } from 'zod';

export const createBookmarkSchema = z.object({
  note: z.string().min(1).max(500),
});

export const updateBookmarkSchema = z.object({
  note: z.string().min(1).max(500),
});

export type CreateBookmarkInput = z.infer<typeof createBookmarkSchema>;
export type UpdateBookmarkInput = z.infer<typeof updateBookmarkSchema>;
```

### Task S-3 — Bookmark service (`server/src/services/bookmark.service.ts`)

All methods scope to `userId: req.user!.id` — students only ever see their own records. No ownership walk needed (bookmarks are student-owned, not course-content).

```ts
// Pseudocode for each method:

getByAssignment(assignmentId: string, userId: string):
  record = prisma.activityBookmark.findFirst({ where: { assignmentId, userId } })
  if (!record) throw new NotFoundError('Bookmark not found')
  return record

create(assignmentId: string, userId: string, data: CreateBookmarkInput):
  // Verify assignment exists
  await assertExists(prisma.assignment, assignmentId, 'Assignment')
  // Attempt create — let Prisma P2002 bubble to ConflictError (409) via errorHandler
  return prisma.activityBookmark.create({
    data: { assignmentId, userId, note: data.note },
    select: { id, assignmentId, note, createdAt, updatedAt }
  })

upsert(assignmentId: string, userId: string, data: UpdateBookmarkInput):
  await assertExists(prisma.assignment, assignmentId, 'Assignment')
  return prisma.activityBookmark.upsert({
    where: { userId_assignmentId: { userId, assignmentId } },
    create: { userId, assignmentId, note: data.note },
    update: { note: data.note },
    select: { id, assignmentId, note, createdAt, updatedAt }
  })

remove(assignmentId: string, userId: string):
  record = prisma.activityBookmark.findFirst({ where: { assignmentId, userId } })
  if (!record) throw new NotFoundError('Bookmark not found')
  await prisma.activityBookmark.delete({ where: { id: record.id } })
  // returns void — controller sends 204
```

Use `select` on all reads/writes to exclude `userId` from response (it's internal; the client already knows who they are).

### Task S-4 — Bookmark controller (`server/src/controllers/bookmark.controller.ts`)

Thin layer. One method per endpoint, each wrapping with `asyncHandler`. Extract `assignmentId` via `req.params['assignmentId'] as string` and `userId` via `req.user!.id`.

```ts
getOne: asyncHandler(async (req, res) => {
  const result = await bookmarkService.getByAssignment(
    req.params['assignmentId'] as string,
    req.user!.id,
  );
  res.json(result);
})

create: asyncHandler(async (req, res) => {
  const result = await bookmarkService.create(
    req.params['assignmentId'] as string,
    req.user!.id,
    req.body,
  );
  res.status(201).json(result);
})

upsert: asyncHandler(async (req, res) => {
  const result = await bookmarkService.upsert(
    req.params['assignmentId'] as string,
    req.user!.id,
    req.body,
  );
  res.json(result);
})

remove: asyncHandler(async (req, res) => {
  await bookmarkService.remove(
    req.params['assignmentId'] as string,
    req.user!.id,
  );
  res.status(204).send();
})
```

### Task S-5 — Bookmark routes (`server/src/routes/bookmark.routes.ts`)

Export a single `bookmarkRouter` with `mergeParams: true` (it inherits `:assignmentId` from the parent `assignmentsRouter`).

```ts
export const bookmarkRouter = Router({ mergeParams: true });

bookmarkRouter.get('/', bookmarkController.getOne);
bookmarkRouter.post('/', validate(createBookmarkSchema), bookmarkController.create);
bookmarkRouter.put('/', validate(updateBookmarkSchema), bookmarkController.upsert);
bookmarkRouter.delete('/', bookmarkController.remove);
```

Mount in `server/src/routes/assignment.routes.ts` on `assignmentsRouter`:

```ts
// In assignmentsRouter section:
import { bookmarkRouter } from './bookmark.routes.js';
assignmentsRouter.use('/:assignmentId/bookmark', bookmarkRouter);
```

No changes to `routes/index.ts` — the bookmark routes are nested under the already-mounted `assignmentsRouter`.

### Task S-6 — Checklist schema (`server/src/schemas/checklist.schema.ts`)

```ts
import { z } from 'zod';

export const createChecklistItemSchema = z.object({
  text: z.string().min(1).max(200),
});

export const updateChecklistItemSchema = z.object({
  text: z.string().min(1).max(200).optional(),
  checked: z.boolean().optional(),
}).refine(
  (d) => d.text !== undefined || d.checked !== undefined,
  { message: 'At least one of text or checked must be provided' },
);

export const reorderChecklistSchema = z.object({
  itemIds: z.array(z.string().uuid()).min(1),
});

export type CreateChecklistItemInput = z.infer<typeof createChecklistItemSchema>;
export type UpdateChecklistItemInput = z.infer<typeof updateChecklistItemSchema>;
export type ReorderChecklistInput = z.infer<typeof reorderChecklistSchema>;
```

### Task S-7 — Checklist service (`server/src/services/checklist.service.ts`)

```ts
// Pseudocode:

findAllByLesson(lessonId: string, userId: string):
  await assertExists(prisma.lesson, lessonId, 'Lesson')
  return prisma.lessonChecklistItem.findMany({
    where: { lessonId, userId },
    orderBy: { order: 'asc' },
    select: { id, text, checked, order, createdAt, updatedAt }
  })

create(lessonId: string, userId: string, data: CreateChecklistItemInput):
  await assertExists(prisma.lesson, lessonId, 'Lesson')
  agg = await prisma.lessonChecklistItem.aggregate({
    where: { lessonId, userId },
    _max: { order: true }
  })
  nextOrder = (agg._max.order ?? 0) + 1
  return prisma.lessonChecklistItem.create({
    data: { lessonId, userId, text: data.text, order: nextOrder },
    select: { id, text, checked, order, createdAt, updatedAt }
  })

update(itemId: string, userId: string, data: UpdateChecklistItemInput):
  item = prisma.lessonChecklistItem.findUnique({ where: { id: itemId } })
  if (!item) throw new NotFoundError('Checklist item not found')
  if (item.userId !== userId) throw new AppError('FORBIDDEN', 'Not your checklist item', 403)
  return prisma.lessonChecklistItem.update({
    where: { id: itemId },
    data: { ...data },
    select: { id, text, checked, order, createdAt, updatedAt }
  })

remove(itemId: string, userId: string):
  item = prisma.lessonChecklistItem.findUnique({ where: { id: itemId } })
  if (!item) throw new NotFoundError('Checklist item not found')
  if (item.userId !== userId) throw new AppError('FORBIDDEN', 'Not your checklist item', 403)
  await prisma.lessonChecklistItem.delete({ where: { id: itemId } })
  // void — controller sends 204

reorder(lessonId: string, userId: string, itemIds: string[]):
  // Fetch all items for this student in this lesson
  existing = await prisma.lessonChecklistItem.findMany({
    where: { lessonId, userId },
    select: { id: true }
  })
  existingIds = new Set(existing.map(i => i.id))

  // Reject if any submitted ID doesn't belong to this student
  if (itemIds.some(id => !existingIds.has(id))) {
    throw new ValidationError('One or more item IDs do not belong to you', {})
  }
  if (itemIds.length !== existing.length) {
    throw new ValidationError('itemIds must include all checklist items for this lesson', {})
  }

  await prisma.$transaction(
    itemIds.map((id, index) =>
      prisma.lessonChecklistItem.update({
        where: { id },
        data: { order: index + 1 },
      })
    )
  )
  // Return updated list
  return this.findAllByLesson(lessonId, userId)
```

> Note: `reorder` uses the array form of `prisma.$transaction` (not the callback form) because the updates are independent — no cross-query dependencies. This avoids the overhead of an interactive transaction for a simple batch update.

### Task S-8 — Checklist controller (`server/src/controllers/checklist.controller.ts`)

```ts
// One asyncHandler per endpoint:

getAll: (req, res) =>
  result = await checklistService.findAllByLesson(
    req.params['lessonId'] as string,
    req.user!.id,
  )
  res.json(result)

create: (req, res) =>
  result = await checklistService.create(
    req.params['lessonId'] as string,
    req.user!.id,
    req.body,
  )
  res.status(201).json(result)

update: (req, res) =>
  result = await checklistService.update(
    req.params['itemId'] as string,
    req.user!.id,
    req.body,
  )
  res.json(result)

remove: (req, res) =>
  await checklistService.remove(
    req.params['itemId'] as string,
    req.user!.id,
  )
  res.status(204).send()

reorder: (req, res) =>
  result = await checklistService.reorder(
    req.params['lessonId'] as string,
    req.user!.id,
    req.body.itemIds,
  )
  res.json(result)
```

### Task S-9 — Checklist routes (`server/src/routes/checklist.routes.ts`)

Two routers are needed — one nested under lessons (for lesson-scoped operations), one flat (for item-level operations).

```ts
// Lesson-scoped (inherits :lessonId via mergeParams: true)
export const lessonChecklistRouter = Router({ mergeParams: true });

lessonChecklistRouter.get('/', checklistController.getAll);
lessonChecklistRouter.post('/', validate(createChecklistItemSchema), checklistController.create);
// reorder must be registered before /:itemId to avoid conflict
lessonChecklistRouter.put('/reorder', validate(reorderChecklistSchema), checklistController.reorder);

// Flat item routes
export const checklistItemsRouter = Router();

checklistItemsRouter.put('/:itemId', validate(updateChecklistItemSchema), checklistController.update);
checklistItemsRouter.delete('/:itemId', checklistController.remove);
```

### Task S-10 — Register checklist routes in `server/src/routes/index.ts`

Add two `router.use` calls in the existing root router:

```ts
import { lessonChecklistRouter, checklistItemsRouter } from './checklist.routes.js';

// In the lesson content section:
router.use('/lessons/:lessonId/checklist', lessonChecklistRouter);

// In the flat item section (alongside /resources, /tools, /student-notes):
router.use('/checklist-items', checklistItemsRouter);
```

### Task S-11 — Integration: Include bookmark in assignment list

**File**: `server/src/services/assignment.service.ts`

Modify `findAllByLesson` to accept `userId: string` (already present) and conditionally include the bookmark in the Prisma query. Change the `ASSIGNMENT_INCLUDE` constant to a function that accepts `userId`:

```ts
// Replace the const with a function:
function buildAssignmentInclude(userId: string | null) {
  return {
    noteAssignment: true,
    videoAssignment: true,
    readingAssignment: true,
    vocabAssignment: {
      include: { entries: { orderBy: { order: 'asc' as const } } },
    },
    practiceProblemAssignment: {
      include: { questions: { orderBy: { order: 'asc' as const } } },
    },
    ...(userId
      ? {
          bookmark: {
            where: { userId },
            select: { id: true, note: true, updatedAt: true },
          },
        }
      : {}),
  } as const;
}
```

In `findAllByLesson`, replace `include: ASSIGNMENT_INCLUDE` with `include: buildAssignmentInclude(userId)`.

In `findById`, also thread `userId` through so single-assignment views include the bookmark. Replace `include: ASSIGNMENT_INCLUDE` with `include: buildAssignmentInclude(userId)`.

The `completed` boolean is still appended via the `.map` call — no change to that logic.

The controller already passes `req.user!.id` as `userId` to `findAllByLesson` and `findById`. No controller changes required.

---

## Error Handling

No new error classes are required. The existing typed error hierarchy covers all cases:

| Case | Error |
|------|-------|
| Assignment or lesson not found | `NotFoundError` |
| Bookmark already exists on POST | Prisma `P2002` → `errorHandler` returns 409 `CONFLICT` |
| Checklist item not owned by student | `AppError('FORBIDDEN', msg, 403)` |
| Invalid reorder payload | `ValidationError` (Zod at boundary) or service-thrown `ValidationError` |
| Checklist item not found | `NotFoundError` |
| Bookmark not found on GET/DELETE | `NotFoundError` |

---

## Validation

All incoming bodies are validated by `validate()` middleware before the controller is called. Schemas enforce:

- `note` on bookmarks: `string`, 1–500 chars, required on POST and PUT.
- `text` on checklist items: `string`, 1–200 chars, required on POST, optional on PUT.
- `checked` on checklist items: `boolean`, optional on PUT.
- PUT checklist item requires at least one of `text` or `checked` (`.refine` check in schema).
- `itemIds` on reorder: `string[]` of UUIDs, min length 1.

---

## Schema Changes Summary

| Action | Target | Detail |
|--------|--------|--------|
| Remove | `StudentVocabFlashCard` model | Full table drop |
| Remove relation | `LessonTool.vocabFlashCards` | Drop relation field |
| Remove relation | `User.vocabFlashCards` | Drop relation field |
| Add | `ActivityBookmark` model | New table `activity_bookmark` |
| Add relation | `User.activityBookmarks` | `ActivityBookmark[]` |
| Add relation | `Assignment.bookmark` | `ActivityBookmark?` |
| Add | `LessonChecklistItem` model | New table `lesson_checklist_item` |
| Add relation | `User.checklistItems` | `LessonChecklistItem[]` |
| Add relation | `Lesson.checklistItems` | `LessonChecklistItem[]` |

---

## No New npm Dependencies

All new functionality is implementable with the existing stack (Prisma 6, Zod 3, Express 5). No new packages required.
