---
id: cm-0003
title: Add Assignment Layer to Lessons
stage: design
status: approved
approver: human
approved_at: 2026-04-28T00:00:00Z
---

# Backend Plan — cm-0003: Add Assignment Layer to Lessons

## Overview

This plan introduces a new Assignment entity that sits within a Lesson. It consists of a parent `Assignment` table (shared fields, type discriminator) and five child tables (`NoteAssignment`, `VideoAssignment`, `ReadingAssignment`, `VocabAssignment`, `PracticeProblemAssignment`). `PracticeProblemAssignment` has a one-to-many relation with `PracticeProblemQuestion`. Completion is tracked in `AssignmentCompletion` (unique per user + assignment).

All existing `LessonResource` and `LessonTool` models remain untouched during this spec.

---

## Schema Changes

### New Enums

```prisma
enum AssignmentType {
  note
  video
  reading
  vocab
  practice_problem
}

enum PracticeQuestionType {
  multiple_choice
  true_false
  matching
  fill_in_blank
}
```

### New Models

```prisma
model Assignment {
  id        String         @id @default(uuid())
  lessonId  String
  order     Int
  title     String
  objective String?
  type      AssignmentType
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt

  lesson               Lesson                @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  noteAssignment       NoteAssignment?
  videoAssignment      VideoAssignment?
  readingAssignment    ReadingAssignment?
  vocabAssignment      VocabAssignment?
  practiceProblemAssignment PracticeProblemAssignment?
  completions          AssignmentCompletion[]

  @@unique([lessonId, order])
  @@index([lessonId])
  @@map("assignment")
}

model NoteAssignment {
  id           String     @id @default(uuid())
  assignmentId String     @unique
  content      Json

  assignment Assignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)

  @@map("note_assignment")
}

model VideoAssignment {
  id           String  @id @default(uuid())
  assignmentId String  @unique
  url          String
  title        String?

  assignment Assignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)

  @@map("video_assignment")
}

model ReadingAssignment {
  id               String  @id @default(uuid())
  assignmentId     String  @unique
  url              String
  description      String?
  estimatedMinutes Int?

  assignment Assignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)

  @@map("reading_assignment")
}

model VocabAssignment {
  id           String @id @default(uuid())
  assignmentId String @unique
  entries      Json   -- ordered [{ term: string, definition: string }]

  assignment Assignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)

  @@map("vocab_assignment")
}

model PracticeProblemAssignment {
  id                String @id @default(uuid())
  assignmentId      String @unique
  passingPercentage Int?   -- 0–100; null = manual completion only

  assignment Assignment             @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  questions  PracticeProblemQuestion[]

  @@map("practice_problem_assignment")
}

model PracticeProblemQuestion {
  id                          String              @id @default(uuid())
  practiceProblemAssignmentId String
  order                       Int
  type                        PracticeQuestionType
  content                     Json

  practiceProblemAssignment PracticeProblemAssignment @relation(fields: [practiceProblemAssignmentId], references: [id], onDelete: Cascade)

  @@index([practiceProblemAssignmentId])
  @@map("practice_problem_question")
}

model AssignmentCompletion {
  id           String   @id @default(uuid())
  userId       String
  assignmentId String
  completedAt  DateTime @default(now())
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  assignment Assignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)

  @@unique([userId, assignmentId])
  @@index([userId])
  @@map("assignment_completion")
}
```

### Relation additions to existing models

Add to `Lesson` model:
```prisma
assignments Assignment[]
```

Add to `User` model:
```prisma
assignmentCompletions AssignmentCompletion[]
```

### Migration

No destructive changes to existing tables. This is a purely additive migration.

Run: `npm run db:migrate` with migration name `add_assignment_layer`

Cascade delete chain: `Lesson` delete → `Assignment` cascade → all child tables cascade (NoteAssignment, VideoAssignment, ReadingAssignment, VocabAssignment, PracticeProblemAssignment → PracticeProblemQuestion, AssignmentCompletion).

---

## Layer Structure

### File Paths

```
server/src/
  routes/
    assignment.routes.ts         -- lessonAssignmentsRouter + assignmentsRouter
  controllers/
    assignment.controller.ts
  services/
    assignment.service.ts
  schemas/
    assignment.schema.ts
```

### Route Mounting (additions to `server/src/routes/index.ts`)

```typescript
import { lessonAssignmentsRouter, assignmentsRouter } from './assignment.routes.js';

router.use('/lessons/:lessonId/assignments', lessonAssignmentsRouter);
router.use('/assignments', assignmentsRouter);
```

### Routes (`assignment.routes.ts`)

```typescript
import { Router } from 'express';
import { assignmentController } from '../controllers/assignment.controller.js';
import { validate } from '../middleware/validate.js';
import { authorize } from '../middleware/authorize.js';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  reorderAssignmentsSchema,
} from '../schemas/assignment.schema.js';

// Nested under /lessons/:lessonId/assignments
export const lessonAssignmentsRouter = Router({ mergeParams: true });
lessonAssignmentsRouter.get('/', assignmentController.getAll);
lessonAssignmentsRouter.post(
  '/',
  authorize('teacher', 'admin'),
  validate(createAssignmentSchema),
  assignmentController.create,
);
lessonAssignmentsRouter.put(
  '/reorder',
  authorize('teacher', 'admin'),
  validate(reorderAssignmentsSchema),
  assignmentController.reorder,
);

// Flat routes under /assignments
export const assignmentsRouter = Router();
assignmentsRouter.get('/:assignmentId', assignmentController.getOne);
assignmentsRouter.put(
  '/:assignmentId',
  authorize('teacher', 'admin'),
  validate(updateAssignmentSchema),
  assignmentController.update,
);
assignmentsRouter.delete(
  '/:assignmentId',
  authorize('teacher', 'admin'),
  assignmentController.remove,
);
assignmentsRouter.post('/:assignmentId/complete', assignmentController.complete);
assignmentsRouter.delete('/:assignmentId/complete', assignmentController.uncomplete);
```

Note: The `reorder` route (`PUT /lessons/:lessonId/assignments/reorder`) must be registered before the `/:assignmentId` param route to avoid Express matching `reorder` as an ID. Since it lives on `lessonAssignmentsRouter` and the flat ID routes live on `assignmentsRouter`, there is no conflict.

### Controller (`assignment.controller.ts`)

All handlers use `asyncHandler`. Params accessed with bracket notation per Express 5 convention.

```typescript
export const assignmentController = {
  getAll: asyncHandler(async (req, res) => {
    const lessonId = req.params['lessonId'] as string;
    const userId = req.user!.id;
    res.json(await assignmentService.findAllByLesson(lessonId, userId));
  }),

  getOne: asyncHandler(async (req, res) => {
    const assignmentId = req.params['assignmentId'] as string;
    const userId = req.user!.id;
    res.json(await assignmentService.findById(assignmentId, userId));
  }),

  create: asyncHandler(async (req, res) => {
    const lessonId = req.params['lessonId'] as string;
    res.status(201).json(await assignmentService.create(lessonId, req.body));
  }),

  update: asyncHandler(async (req, res) => {
    const assignmentId = req.params['assignmentId'] as string;
    res.json(await assignmentService.update(assignmentId, req.body));
  }),

  remove: asyncHandler(async (req, res) => {
    const assignmentId = req.params['assignmentId'] as string;
    await assignmentService.remove(assignmentId);
    res.status(204).send();
  }),

  reorder: asyncHandler(async (req, res) => {
    const lessonId = req.params['lessonId'] as string;
    res.json(await assignmentService.reorder(lessonId, req.body.assignmentIds));
  }),

  complete: asyncHandler(async (req, res) => {
    const assignmentId = req.params['assignmentId'] as string;
    const userId = req.user!.id;
    res.status(201).json(await assignmentService.markComplete(assignmentId, userId));
  }),

  uncomplete: asyncHandler(async (req, res) => {
    const assignmentId = req.params['assignmentId'] as string;
    const userId = req.user!.id;
    await assignmentService.markIncomplete(assignmentId, userId);
    res.status(204).send();
  }),
};
```

### Service (`assignment.service.ts`)

#### Prisma include shape (reused across queries)

```typescript
const ASSIGNMENT_INCLUDE = {
  noteAssignment: true,
  videoAssignment: true,
  readingAssignment: true,
  vocabAssignment: true,
  practiceProblemAssignment: {
    include: {
      questions: { orderBy: { order: 'asc' } },
    },
  },
} as const;
```

Completion status is resolved per-query by joining against `AssignmentCompletion` filtered to `userId`.

#### `findAllByLesson(lessonId, userId)`

```
1. Verify lesson exists — findUnique on Lesson; throw NotFoundError if missing.
2. findMany Assignment where lessonId, orderBy order asc, include ASSIGNMENT_INCLUDE.
3. findMany AssignmentCompletion where assignmentId in [result IDs] AND userId.
4. Build completedSet from step 3.
5. Return assignments mapped with: { ...assignment, completed: completedSet.has(assignment.id) }.
```

#### `findById(assignmentId, userId)`

```
1. findUnique Assignment where id = assignmentId, include ASSIGNMENT_INCLUDE.
2. Throw NotFoundError if missing.
3. findUnique AssignmentCompletion where userId + assignmentId.
4. Return { ...assignment, completed: !!completion }.
```

#### `create(lessonId, data)`

Input `data` contains: `title`, `objective?`, `type`, and type-specific fields (discriminated by `type`).

```
1. findUnique Lesson; throw NotFoundError if missing.
2. In a single Prisma transaction:
   a. Count current max order for lessonId: aggregate._max.order ?? 0.
   b. Create Assignment with order = maxOrder + 1.
   c. Create the child record for data.type:
      - note: NoteAssignment { assignmentId, content }
      - video: VideoAssignment { assignmentId, url, title? }
      - reading: ReadingAssignment { assignmentId, url, description?, estimatedMinutes? }
      - vocab: VocabAssignment { assignmentId, entries }
      - practice_problem: PracticeProblemAssignment { assignmentId, passingPercentage? }
                          then create PracticeProblemQuestion[] if questions provided
3. Return findById(newAssignment.id, null) — completed: false for new creation.
```

Using a transaction guarantees that parent + child are always written together.

#### `update(assignmentId, data)`

Input `data` contains optional shared fields (`title`, `objective`) and optional type-specific fields.

```
1. findUnique Assignment; throw NotFoundError if missing.
2. Determine child table from assignment.type.
3. In a transaction:
   a. If shared fields present: update Assignment.
   b. If type-specific fields present: update the child record (upsert pattern is not needed — child is guaranteed to exist if assignment exists).
   c. Special case for practice_problem: if questions array provided, delete all existing PracticeProblemQuestion rows for this assignment and re-insert (simplest correct approach given ordered questions).
4. Return findById(assignmentId, null).
```

Note: `type` is immutable after creation. If a client sends `type` in an update body, the schema strips it (use `.omit({ type: true })` in update schema).

#### `remove(assignmentId)`

```
1. findUnique Assignment; throw NotFoundError if missing.
2. Delete Assignment (cascade handles all children and completions).
3. Recalculate order for remaining assignments in the same lesson:
   - findMany Assignment where lessonId = assignment.lessonId, orderBy order asc.
   - In a transaction, update each with order = index + 1.
```

#### `reorder(lessonId, assignmentIds: string[])`

```
1. findMany Assignment where lessonId — collect all IDs belonging to the lesson.
2. Validate: assignmentIds.length === existing.length; every ID in assignmentIds exists in existing set. Throw ValidationError if mismatch (INVALID_REORDER).
3. In a Prisma transaction, update each assignment's order = index + 1, where index is position in assignmentIds array.
   - Use Promise.all inside the transaction with individual update calls (Prisma transactions support this pattern).
4. Return findAllByLesson(lessonId, null).
```

This is atomic per NFR-02.

#### `markComplete(assignmentId, userId)`

```
1. findUnique Assignment; throw NotFoundError if missing.
2. upsert AssignmentCompletion where { userId, assignmentId }:
   - create: { userId, assignmentId, completedAt: now() }
   - update: { completedAt: now() } (idempotent re-complete, updates timestamp)
3. Return the completion record.
```

#### `markIncomplete(assignmentId, userId)`

```
1. findUnique Assignment; throw NotFoundError if missing.
2. findUnique AssignmentCompletion where { userId_assignmentId: { userId, assignmentId } }.
3. If not found: throw NotFoundError('Completion not found').
4. Delete the record.
```

---

## Validation (`assignment.schema.ts`)

### Question content sub-schemas (mirrors AssessmentQuestion content shapes)

```typescript
const multipleChoiceContentSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).min(2),
  correctIndex: z.number().int().min(0),
});

const trueFalseContentSchema = z.object({
  question: z.string().min(1),
  correct: z.boolean(),
});

const matchingContentSchema = z.object({
  question: z.string().min(1),
  leftItems: z.array(z.string()).min(1),
  rightItems: z.array(z.string()).min(1),
  correctPairs: z.array(z.tuple([z.number().int(), z.number().int()])),
});

const fillInBlankContentSchema = z.object({
  question: z.string().min(1),
  blanks: z.array(z.object({
    answer: z.string().min(1),
    alternatives: z.array(z.string()).optional(),
  })).min(1),
});

const practiceQuestionSchema = z.object({
  type: z.enum(['multiple_choice', 'true_false', 'matching', 'fill_in_blank']),
  order: z.number().int().min(1),
  content: z.union([
    multipleChoiceContentSchema,
    trueFalseContentSchema,
    matchingContentSchema,
    fillInBlankContentSchema,
  ]),
});
```

### Discriminated union create schema

```typescript
const baseAssignmentFields = {
  title: z.string().min(1),
  objective: z.string().optional(),
};

export const createAssignmentSchema = z.discriminatedUnion('type', [
  z.object({
    ...baseAssignmentFields,
    type: z.literal('note'),
    content: z.record(z.any()),  // rich-text Json (same as LessonResource note)
  }),
  z.object({
    ...baseAssignmentFields,
    type: z.literal('video'),
    url: z.string().url(),
    title: z.string().optional(),
  }),
  z.object({
    ...baseAssignmentFields,
    type: z.literal('reading'),
    url: z.string().url(),
    description: z.string().optional(),
    estimatedMinutes: z.number().int().min(1).optional(),
  }),
  z.object({
    ...baseAssignmentFields,
    type: z.literal('vocab'),
    entries: z.array(z.object({
      term: z.string().min(1),
      definition: z.string().min(1),
    })).min(1),
  }),
  z.object({
    ...baseAssignmentFields,
    type: z.literal('practice_problem'),
    passingPercentage: z.number().int().min(0).max(100).optional(),
    questions: z.array(practiceQuestionSchema).min(1),
  }),
]);
```

### Update schema

All type-specific fields are optional. `type` is omitted (immutable).

```typescript
export const updateAssignmentSchema = z.object({
  title: z.string().min(1).optional(),
  objective: z.string().optional(),
  // note
  content: z.record(z.any()).optional(),
  // video
  url: z.string().url().optional(),
  // reading (url shared with video, description, estimatedMinutes)
  description: z.string().optional(),
  estimatedMinutes: z.number().int().min(1).optional(),
  // vocab
  entries: z.array(z.object({
    term: z.string().min(1),
    definition: z.string().min(1),
  })).optional(),
  // practice_problem
  passingPercentage: z.number().int().min(0).max(100).nullable().optional(),
  questions: z.array(practiceQuestionSchema).optional(),
});
```

### Reorder schema

```typescript
export const reorderAssignmentsSchema = z.object({
  assignmentIds: z.array(z.string().uuid()).min(1),
});
```

---

## Error Handling

All errors use the existing centralized pattern: `AppError`, `NotFoundError`, `ValidationError` from `src/errors/`. The global `errorHandler` middleware handles formatting — no error formatting in controllers or services.

| Scenario | Error class | Code |
|---|---|---|
| Lesson not found on create/list | `NotFoundError` | `NOT_FOUND` |
| Assignment not found | `NotFoundError` | `NOT_FOUND` |
| Reorder ID set mismatch | `ValidationError` | `INVALID_REORDER` |
| Completion not found on DELETE | `NotFoundError` | `NOT_FOUND` |
| Duplicate completion (race) | Prisma P2002 → `errorHandler` maps to 409 | `CONFLICT` |

`ValidationError` should be constructed as:
```typescript
new AppError('INVALID_REORDER', 'Provided assignment IDs do not match lesson assignments', 400)
```

---

## Response Shape (service return values)

### Assignment object (full)

```typescript
{
  id: string,
  lessonId: string,
  order: number,
  title: string,
  objective: string | null,
  type: AssignmentType,
  createdAt: string,
  updatedAt: string,
  completed: boolean,             // derived from AssignmentCompletion for requesting user
  // exactly one of the following child objects is non-null:
  noteAssignment: { id, content } | null,
  videoAssignment: { id, url, title } | null,
  readingAssignment: { id, url, description, estimatedMinutes } | null,
  vocabAssignment: { id, entries } | null,
  practiceProblemAssignment: {
    id,
    passingPercentage: number | null,
    questions: { id, order, type, content }[]
  } | null,
}
```

### Completion object

```typescript
{
  id: string,
  userId: string,
  assignmentId: string,
  completedAt: string,
}
```

---

## Dependencies

No new npm packages required. All needed functionality is covered by existing dependencies:
- Prisma 6 — schema models, transactions, `aggregate` for max order
- Zod 3 — discriminated union validation (`z.discriminatedUnion`)
- Express 5 — routing

---

## No Schema Changes to Existing Models (other than relation additions)

The only modifications to existing Prisma models are relation field additions (`assignments` on `Lesson`, `assignmentCompletions` on `User`). These are backward-compatible and do not require data migrations or expand-contract phases.
