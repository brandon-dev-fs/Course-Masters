---
id: cm-0029
title: 'Backend Plan: Consolidate LessonResource and LessonTool into Assignment'
stage: design
status: approved
---

# Backend Plan: Consolidate LessonResource and LessonTool into Assignment

## Overview

This plan eliminates the `LessonResource`, `LessonTool`, `LessonResourceCompletion`, `LessonToolCompletion`, and `StudentLessonToolFlashCard` models by migrating all data into the existing `Assignment` model hierarchy and `AssignmentCompletion`. It removes 8 API endpoints, rewrites the resource completion service, and adds one new import endpoint.

---

## 1. Schema Changes

### 1.1 Models to Drop (5)

| Model                        | Table                            | Migration Action                  |
| ---------------------------- | -------------------------------- | --------------------------------- |
| `LessonResource`             | `lesson_resource`                | Data migrated, then table dropped |
| `LessonTool`                 | `lesson_tool`                    | Data migrated, then table dropped |
| `LessonResourceCompletion`   | `lesson_resource_completion`     | Data migrated, then table dropped |
| `LessonToolCompletion`       | `lesson_tool_completion`         | Data migrated, then table dropped |
| `StudentLessonToolFlashCard` | `student_lesson_tool_flash_card` | Dropped with no data migration    |

### 1.2 Enums to Drop (2)

| Enum           | Values                      | Migration Action             |
| -------------- | --------------------------- | ---------------------------- |
| `ResourceType` | `note`, `video`, `lecture`  | Dropped after data migration |
| `ToolType`     | `practice_problem`, `vocab` | Dropped after data migration |

### 1.3 Relation Changes on Surviving Models

**`Lesson` model** -- remove these relation fields from `schema.prisma`:

- `resources LessonResource[]`
- `tools LessonTool[]`

**`User` model** -- remove these relation fields from `schema.prisma`:

- `resourceCompletions LessonResourceCompletion[]`
- `toolCompletions LessonToolCompletion[]`
- `lessonToolFlashCards StudentLessonToolFlashCard[]`

### 1.4 No New Models or Columns

All target models already exist: `Assignment`, `NoteAssignment`, `VideoAssignment`, `VocabAssignment`, `VocabAssignmentEntry`, `PracticeProblemAssignment`, `PracticeProblemQuestion`, `AssignmentCompletion`.

---

## 2. Data Migration

The migration is a single Prisma migration containing a SQL data migration script. The SQL runs inside the implicit transaction that `prisma migrate dev` wraps around each migration file. The migration must be idempotent -- re-running on an already-migrated database must not produce duplicates.

### 2.1 Migration File Generation

```bash
npx prisma migrate dev --name consolidate_resources_tools_into_assignments --create-only
```

This generates the migration file without applying it. The coder must then edit the generated SQL to insert the data migration steps **before** the DDL that drops tables.

### 2.2 Data Migration SQL (pseudocode, executed before DROP)

The migration SQL must be written in the generated migration file. The following is the logical sequence. All UUIDs are generated via `gen_random_uuid()`.

#### Step 1: Migrate Note and Lecture Resources to Note Assignments

```sql
-- For each LessonResource with type = 'note' or type = 'lecture':
-- 1. Determine next order value = MAX(assignment.order) for that lesson + 1
-- 2. INSERT INTO assignment (id, lessonId, order, title, objective, type, ...)
-- 3. INSERT INTO note_assignment (id, assignmentId, content) using resource.content

-- Use a CTE to compute per-lesson order offsets:
WITH resource_ordered AS (
  SELECT
    lr.id AS resource_id,
    lr.lesson_id,
    lr.title,
    lr.content,
    lr.created_at,
    lr.updated_at,
    ROW_NUMBER() OVER (PARTITION BY lr.lesson_id ORDER BY lr."order") AS rn
  FROM lesson_resource lr
  WHERE lr.type IN ('note', 'lecture')
    -- Idempotency: skip resources already migrated
    AND NOT EXISTS (
      SELECT 1 FROM assignment a
      WHERE a.lesson_id = lr.lesson_id AND a.title = lr.title
        AND a.type = 'note' AND a.id = lr.id
    )
),
lesson_max_order AS (
  SELECT lesson_id, COALESCE(MAX("order"), 0) AS max_order
  FROM assignment
  GROUP BY lesson_id
),
new_assignments AS (
  INSERT INTO assignment (id, lesson_id, "order", title, objective, type, created_at, updated_at)
  SELECT
    ro.resource_id,  -- reuse resource UUID as assignment UUID for completion mapping
    ro.lesson_id,
    COALESCE(lmo.max_order, 0) + ro.rn,
    ro.title,
    NULL,
    'note',
    ro.created_at,
    ro.updated_at
  FROM resource_ordered ro
  LEFT JOIN lesson_max_order lmo ON lmo.lesson_id = ro.lesson_id
  ON CONFLICT (id) DO NOTHING  -- idempotency
  RETURNING id, lesson_id
)
INSERT INTO note_assignment (id, assignment_id, content)
SELECT gen_random_uuid(), ro.resource_id, ro.content::jsonb
FROM resource_ordered ro
WHERE NOT EXISTS (
  SELECT 1 FROM note_assignment na WHERE na.assignment_id = ro.resource_id
)
ON CONFLICT DO NOTHING;
```

**Key design decision**: Reuse the original `LessonResource.id` as the new `Assignment.id`. This makes completion migration trivial -- the `resourceId` in `LessonResourceCompletion` maps directly to `assignmentId` without a lookup table.

#### Step 2: Migrate Video Resources to Video Assignments

```sql
WITH video_ordered AS (
  SELECT
    lr.id AS resource_id,
    lr.lesson_id,
    lr.title,
    lr.content,
    lr.created_at,
    lr.updated_at,
    -- Order after note/lecture resources that were already migrated
    ROW_NUMBER() OVER (PARTITION BY lr.lesson_id ORDER BY lr."order") AS rn
  FROM lesson_resource lr
  WHERE lr.type = 'video'
),
lesson_max_order_v AS (
  SELECT lesson_id, COALESCE(MAX("order"), 0) AS max_order
  FROM assignment
  GROUP BY lesson_id
)
-- Insert assignments (reuse resource UUID)
INSERT INTO assignment (id, lesson_id, "order", title, objective, type, created_at, updated_at)
SELECT
  vo.resource_id,
  vo.lesson_id,
  COALESCE(lmo.max_order, 0) + vo.rn,
  vo.title,
  NULL,
  'video',
  vo.created_at,
  vo.updated_at
FROM video_ordered vo
LEFT JOIN lesson_max_order_v lmo ON lmo.lesson_id = vo.lesson_id
ON CONFLICT (id) DO NOTHING;

-- Insert video_assignment child records
INSERT INTO video_assignment (id, assignment_id, url, title)
SELECT
  gen_random_uuid(),
  lr.id,
  lr.content::jsonb ->> 'url',
  lr.title
FROM lesson_resource lr
WHERE lr.type = 'video'
  AND NOT EXISTS (
    SELECT 1 FROM video_assignment va WHERE va.assignment_id = lr.id
  )
ON CONFLICT DO NOTHING;
```

#### Step 3: Migrate Vocab Tools (grouped per lesson)

```sql
-- Group all vocab tools per lesson into a single VocabAssignment.
-- Cannot reuse tool IDs since multiple tools collapse into one assignment.
WITH lessons_with_vocab AS (
  SELECT DISTINCT lesson_id
  FROM lesson_tool
  WHERE type = 'vocab'
    -- Idempotency: skip lessons that already have a vocab assignment
    AND lesson_id NOT IN (
      SELECT a.lesson_id FROM assignment a WHERE a.type = 'vocab'
    )
),
lesson_max_order_vocab AS (
  SELECT lesson_id, COALESCE(MAX("order"), 0) AS max_order
  FROM assignment
  GROUP BY lesson_id
),
new_vocab_assignments AS (
  INSERT INTO assignment (id, lesson_id, "order", title, objective, type, created_at, updated_at)
  SELECT
    gen_random_uuid(),
    lv.lesson_id,
    COALESCE(lmo.max_order, 0) + 1,
    'Vocabulary',
    NULL,
    'vocab',
    NOW(),
    NOW()
  FROM lessons_with_vocab lv
  LEFT JOIN lesson_max_order_vocab lmo ON lmo.lesson_id = lv.lesson_id
  RETURNING id, lesson_id
),
new_vocab_child AS (
  INSERT INTO vocab_assignment (id, assignment_id)
  SELECT gen_random_uuid(), nva.id
  FROM new_vocab_assignments nva
  RETURNING id, assignment_id
)
INSERT INTO vocab_assignment_entry (id, vocab_assignment_id, term, definition, example, "order", created_at, updated_at)
SELECT
  gen_random_uuid(),
  nvc.id,
  lt.content::jsonb ->> 'term',
  lt.content::jsonb ->> 'definition',
  lt.content::jsonb ->> 'example',
  lt."order",
  lt.created_at,
  lt.updated_at
FROM lesson_tool lt
JOIN new_vocab_assignments nva ON nva.lesson_id = lt.lesson_id
JOIN new_vocab_child nvc ON nvc.assignment_id = nva.id
WHERE lt.type = 'vocab';
```

#### Step 4: Migrate Practice Problem Tools (grouped per lesson)

```sql
-- Group all practice_problem tools per lesson into a single PracticeProblemAssignment.
WITH lessons_with_pp AS (
  SELECT DISTINCT lesson_id
  FROM lesson_tool
  WHERE type = 'practice_problem'
    AND lesson_id NOT IN (
      SELECT a.lesson_id FROM assignment a WHERE a.type = 'practice_problem'
    )
),
lesson_max_order_pp AS (
  SELECT lesson_id, COALESCE(MAX("order"), 0) AS max_order
  FROM assignment
  GROUP BY lesson_id
),
new_pp_assignments AS (
  INSERT INTO assignment (id, lesson_id, "order", title, objective, type, created_at, updated_at)
  SELECT
    gen_random_uuid(),
    lp.lesson_id,
    COALESCE(lmo.max_order, 0) + 1,
    'Practice Problems',
    NULL,
    'practice_problem',
    NOW(),
    NOW()
  FROM lessons_with_pp lp
  LEFT JOIN lesson_max_order_pp lmo ON lmo.lesson_id = lp.lesson_id
  RETURNING id, lesson_id
),
new_pp_child AS (
  INSERT INTO practice_problem_assignment (id, assignment_id, passing_percentage)
  SELECT gen_random_uuid(), npa.id, NULL
  FROM new_pp_assignments npa
  RETURNING id, assignment_id
)
INSERT INTO practice_problem_question (id, practice_problem_assignment_id, "order", type, content)
SELECT
  gen_random_uuid(),
  npc.id,
  lt."order",
  'multiple_choice',
  lt.content::jsonb
FROM lesson_tool lt
JOIN new_pp_assignments npa ON npa.lesson_id = lt.lesson_id
JOIN new_pp_child npc ON npc.assignment_id = npa.id
WHERE lt.type = 'practice_problem';
```

#### Step 5: Migrate LessonResourceCompletion to AssignmentCompletion

```sql
-- Resource IDs were reused as assignment IDs, so direct mapping:
INSERT INTO assignment_completion (id, user_id, assignment_id, completed_at, created_at, updated_at)
SELECT
  gen_random_uuid(),
  lrc.user_id,
  lrc.resource_id,  -- same as new assignment ID
  lrc.completed_at,
  lrc.completed_at,
  lrc.completed_at
FROM lesson_resource_completion lrc
WHERE EXISTS (SELECT 1 FROM assignment a WHERE a.id = lrc.resource_id)
ON CONFLICT (user_id, assignment_id) DO NOTHING;
```

#### Step 6: Migrate LessonToolCompletion to AssignmentCompletion

```sql
-- Tool completions map to the grouped assignment for that lesson + type.
-- For vocab tools: find the vocab assignment for the tool's lesson.
-- For practice_problem tools: find the practice_problem assignment for the tool's lesson.
INSERT INTO assignment_completion (id, user_id, assignment_id, completed_at, created_at, updated_at)
SELECT DISTINCT ON (ltc.user_id, a.id)
  gen_random_uuid(),
  ltc.user_id,
  a.id,
  ltc.completed_at,
  ltc.completed_at,
  ltc.completed_at
FROM lesson_tool_completion ltc
JOIN lesson_tool lt ON lt.id = ltc.tool_id
JOIN assignment a ON a.lesson_id = lt.lesson_id
  AND a.type = CASE lt.type
    WHEN 'practice_problem' THEN 'practice_problem'
    WHEN 'vocab' THEN 'vocab'
  END::assignment_type
ON CONFLICT (user_id, assignment_id) DO NOTHING;
```

#### Step 7: Drop Source Tables and Enums (DDL)

This is generated by Prisma when the models and enums are removed from `schema.prisma`. The generated migration SQL will contain:

```sql
DROP TABLE IF EXISTS "student_lesson_tool_flash_card";
DROP TABLE IF EXISTS "lesson_tool_completion";
DROP TABLE IF EXISTS "lesson_resource_completion";
DROP TABLE IF EXISTS "lesson_tool";
DROP TABLE IF EXISTS "lesson_resource";
DROP TYPE IF EXISTS "ResourceType";
DROP TYPE IF EXISTS "ToolType";
```

### 2.3 Migration Ordering Guarantee

The `Assignment` table has a `@@unique([lessonId, order])` constraint. The migration must ensure no order collisions within a lesson. The strategy:

1. Existing assignments keep their current `order` values.
2. Note/lecture resources are appended next (ordered by original `LessonResource.order`).
3. Video resources are appended next (ordered by original `LessonResource.order`).
4. Grouped vocab assignment appended next.
5. Grouped practice problem assignment appended last.

Each step queries `MAX(assignment.order)` for the lesson at execution time, so subsequent steps see the values inserted by prior steps.

### 2.4 Idempotency

Every `INSERT` uses either `ON CONFLICT (id) DO NOTHING` or `ON CONFLICT (user_id, assignment_id) DO NOTHING`. The vocab/PP grouping CTEs filter out lessons that already have an assignment of the target type. Re-running the migration on a partially or fully migrated database produces no duplicates.

---

## 3. Prisma Schema Changes

After generating the migration with `--create-only`, update `schema.prisma`:

1. **Remove** the `ResourceType` enum block.
2. **Remove** the `ToolType` enum block.
3. **Remove** the `LessonResource` model block.
4. **Remove** the `LessonTool` model block.
5. **Remove** the `LessonResourceCompletion` model block.
6. **Remove** the `LessonToolCompletion` model block.
7. **Remove** the `StudentLessonToolFlashCard` model block.
8. **In `Lesson` model**: remove `resources LessonResource[]` and `tools LessonTool[]` relation fields.
9. **In `User` model**: remove `resourceCompletions LessonResourceCompletion[]`, `toolCompletions LessonToolCompletion[]`, and `lessonToolFlashCards StudentLessonToolFlashCard[]` relation fields.

Then run `npx prisma generate` to update the Prisma client types.

---

## 4. Files to Delete

### 4.1 Server Source Files (8 files)

| File                                            | Layer      |
| ----------------------------------------------- | ---------- |
| `src/routes/lesson-resource.routes.ts`          | Routes     |
| `src/controllers/lesson-resource.controller.ts` | Controller |
| `src/services/lesson-resource.service.ts`       | Service    |
| `src/schemas/lesson-resource.schema.ts`         | Schema     |
| `src/routes/lesson-tool.routes.ts`              | Routes     |
| `src/controllers/lesson-tool.controller.ts`     | Controller |
| `src/services/lesson-tool.service.ts`           | Service    |
| `src/schemas/lesson-tool.schema.ts`             | Schema     |

### 4.2 Server Test Files (6 files)

| File                                                           | Layer           |
| -------------------------------------------------------------- | --------------- |
| `src/__tests__/controllers/lesson-resource.controller.test.ts` | Controller test |
| `src/__tests__/services/lesson-resource.service.test.ts`       | Service test    |
| `src/__tests__/schemas/lesson-resource.schema.test.ts`         | Schema test     |
| `src/__tests__/controllers/lesson-tool.controller.test.ts`     | Controller test |
| `src/__tests__/services/lesson-tool.service.test.ts`           | Service test    |
| `src/__tests__/schemas/lesson-tool.schema.test.ts`             | Schema test     |

---

## 5. Files to Modify

### 5.1 `src/routes/index.ts`

**Remove** these imports and mount lines:

```ts
// Remove import
import {
	lessonResourcesRouter,
	resourcesRouter,
} from './lesson-resource.routes.js';
import { lessonToolsRouter, toolsRouter } from './lesson-tool.routes.js';

// Remove mount lines
router.use('/lessons/:lessonId/resources', lessonResourcesRouter);
router.use('/lessons/:lessonId/tools', lessonToolsRouter);
router.use('/resources', resourcesRouter);
router.use('/tools', toolsRouter);
```

No replacement routes needed -- assignments already handle all content types.

### 5.2 `src/middleware/authorize-resource.ts`

**Remove** the `'resource'` and `'tool'` cases from the `ResourceOwnershipType` union and the `resolveCourseOwner` switch statement.

Updated type:

```ts
export type ResourceOwnershipType =
	| 'course'
	| 'unit'
	| 'lesson'
	| 'assessment'
	| 'lesson_assessment'
	| 'unit_assessment'
	| 'course_assessment';
```

Remove the `case 'resource':` block (lines 69-85) and the `case 'tool':` block (lines 87-103).

### 5.3 `src/schemas/resource-completion.schema.ts`

**Rewrite** to use `assignmentId` instead of `type` + `targetId`:

```ts
import { z } from 'zod';

export const toggleCompletionSchema = z.object({
	assignmentId: z.string().uuid(),
});

export type ToggleCompletionInput = z.infer<typeof toggleCompletionSchema>;
```

### 5.4 `src/services/resource-completion.service.ts`

**Rewrite** to use `AssignmentCompletion` only. Remove all `LessonResourceCompletion` and `LessonToolCompletion` references.

```ts
import prisma from '../lib/prisma.js';
import { NotFoundError } from '../errors/index.js';

interface CompletionItem {
	assignmentId: string;
	completedAt: Date;
}

interface CompletionResult {
	completions: CompletionItem[];
}

export const resourceCompletionService = {
	async getByLesson(
		lessonId: string,
		userId: string,
	): Promise<CompletionResult> {
		const completions = await prisma.assignmentCompletion.findMany({
			where: {
				assignment: { lessonId },
				userId,
			},
			select: { assignmentId: true, completedAt: true },
		});

		return {
			completions: completions.map((c) => ({
				assignmentId: c.assignmentId,
				completedAt: c.completedAt,
			})),
		};
	},

	async toggle(
		lessonId: string,
		userId: string,
		assignmentId: string,
	): Promise<CompletionResult> {
		// Verify the assignment belongs to this lesson
		const assignment = await prisma.assignment.findUnique({
			where: { id: assignmentId },
		});
		if (!assignment || assignment.lessonId !== lessonId) {
			throw new NotFoundError('Assignment not found in this lesson');
		}

		const existing = await prisma.assignmentCompletion.findUnique({
			where: { userId_assignmentId: { userId, assignmentId } },
		});

		if (existing) {
			await prisma.assignmentCompletion.delete({
				where: { id: existing.id },
			});
		} else {
			await prisma.assignmentCompletion.create({
				data: { userId, assignmentId },
			});
		}

		return this.getByLesson(lessonId, userId);
	},
};
```

### 5.5 `src/controllers/resource-completion.controller.ts`

**Update** the `toggleCompletion` method to use the new schema shape:

```ts
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { resourceCompletionService } from '../services/resource-completion.service.js';
import { type ToggleCompletionInput } from '../schemas/resource-completion.schema.js';

export const resourceCompletionController = {
	getCompletions: asyncHandler(async (req: Request, res: Response) => {
		const lessonId = req.params['lessonId'] as string;
		const userId = req.user!.id;
		const data = await resourceCompletionService.getByLesson(
			lessonId,
			userId,
		);
		res.json(data);
	}),

	toggleCompletion: asyncHandler(async (req: Request, res: Response) => {
		const lessonId = req.params['lessonId'] as string;
		const userId = req.user!.id;
		const { assignmentId } = req.body as ToggleCompletionInput;
		const data = await resourceCompletionService.toggle(
			lessonId,
			userId,
			assignmentId,
		);
		res.json(data);
	}),
};
```

### 5.6 `src/utils/softDelete.ts`

**No changes required.** The current `softDeleteLesson` function only cascades to `Assessment` (soft delete). `LessonResource` and `LessonTool` were never handled in `softDelete.ts` -- they relied on database-level `onDelete: Cascade` from the `Lesson` relation. After migration, `Assignment` also uses `onDelete: Cascade` from `Lesson`, so no soft delete cascade changes are needed.

After verifying the file (already read above), this is confirmed: `softDeleteLesson` only sets `deletedAt` on assessments and the lesson itself. No resource or tool references exist in this file.

### 5.7 `src/swagger.ts`

**Remove** all OpenAPI documentation for:

- `GET /lessons/{lessonId}/resources`
- `POST /lessons/{lessonId}/resources`
- `PUT /resources/{resourceId}`
- `DELETE /resources/{resourceId}`
- `GET /lessons/{lessonId}/tools`
- `POST /lessons/{lessonId}/tools`
- `PUT /tools/{toolId}`
- `DELETE /tools/{toolId}`

**Add** OpenAPI documentation for:

- `POST /assessments/{assessmentId}/import-questions`

**Update** documentation for:

- `GET /lessons/{lessonId}/completions` -- new response shape
- `POST /lessons/{lessonId}/completions` -- new request body

### 5.8 `src/routes/assessment.routes.ts`

**Add** the import-questions route to `assessmentsRouter`:

```ts
import { importQuestionsSchema } from '../schemas/assessment.schema.js';

assessmentsRouter.post(
	'/:assessmentId/import-questions',
	authorize('teacher', 'admin'),
	requireCourseOwnership(
		'assessment',
		(req) => req.params['assessmentId'] as string,
	),
	validate(importQuestionsSchema),
	assessmentController.importQuestions,
);
```

### 5.9 `src/schemas/assessment.schema.ts`

**Add** the import questions schema:

```ts
export const importQuestionsSchema = z.object({
	practiceProblemAssignmentId: z.string().uuid(),
});

export type ImportQuestionsInput = z.infer<typeof importQuestionsSchema>;
```

### 5.10 `src/controllers/assessment.controller.ts`

**Add** the `importQuestions` method to `assessmentController`:

```ts
importQuestions: asyncHandler(async (req: Request, res: Response) => {
  const assessmentId = req.params['assessmentId'] as string;
  const { practiceProblemAssignmentId } = req.body;
  const questions = await assessmentService.importQuestions(
    assessmentId,
    practiceProblemAssignmentId,
    req.user!.id,
  );
  res.status(201).json(questions);
}),
```

### 5.11 `src/services/assessment.service.ts`

**Add** the `importQuestions` method:

```ts
async importQuestions(
  assessmentId: string,
  practiceProblemAssignmentId: string,
  userId: string,
) {
  // 1. Verify assessment exists and is not soft-deleted
  const assessment = await prisma.assessment.findFirst({
    where: { id: assessmentId, deletedAt: null },
    include: { questions: { select: { id: true } } },
  });
  if (!assessment) throw new NotFoundError('Assessment not found');

  // 2. Verify practice problem assignment exists and belongs to same course
  const ppAssignment = await prisma.practiceProblemAssignment.findUnique({
    where: { id: practiceProblemAssignmentId },
    include: {
      assignment: {
        include: {
          lesson: {
            include: {
              unit: { select: { courseId: true } },
            },
          },
        },
      },
      questions: { orderBy: { order: 'asc' } },
    },
  });
  if (!ppAssignment) {
    throw new NotFoundError('Practice problem assignment not found');
  }

  // 3. Resolve the course ID of the assessment
  const assessmentCourseId = await resolveAssessmentCourseId(assessment);

  // 4. Verify same course
  const ppCourseId = ppAssignment.assignment.lesson.unit.courseId;
  if (assessmentCourseId !== ppCourseId) {
    throw new AppError(
      'FORBIDDEN',
      'Practice problem assignment must belong to the same course',
      403,
    );
  }

  // 5. Determine next order value
  const maxOrder = await prisma.assessmentQuestion.aggregate({
    where: { assessmentId },
    _max: { order: true },
  });
  let nextOrder = (maxOrder._max.order ?? -1) + 1;

  // 6. Create new AssessmentQuestion records from PracticeProblemQuestion data
  const newQuestions = await prisma.$transaction(
    ppAssignment.questions.map(ppq =>
      prisma.assessmentQuestion.create({
        data: {
          assessmentId,
          type: ppq.type,
          question: (ppq.content as any).question ?? '',
          content: ppq.content,
          order: nextOrder++,
          calculatorEnabled: (ppq.content as any).calculatorEnabled ?? false,
        },
      }),
    ),
  );

  return newQuestions;
},
```

**Add** a helper function (private to the service module):

```ts
async function resolveAssessmentCourseId(assessment: {
	lessonId: string | null;
	unitId: string | null;
	courseId: string | null;
}): Promise<string> {
	if (assessment.courseId) return assessment.courseId;
	if (assessment.unitId) {
		const unit = await prisma.unit.findUnique({
			where: { id: assessment.unitId },
			select: { courseId: true },
		});
		if (!unit) throw new NotFoundError('Unit not found');
		return unit.courseId;
	}
	if (assessment.lessonId) {
		const lesson = await prisma.lesson.findUnique({
			where: { id: assessment.lessonId },
			select: { unit: { select: { courseId: true } } },
		});
		if (!lesson) throw new NotFoundError('Lesson not found');
		return lesson.unit.courseId;
	}
	throw new NotFoundError('Assessment has no parent');
}
```

---

## 6. New Endpoint: Import Questions

### Layer Structure

| Layer      | File                                       | Function                               |
| ---------- | ------------------------------------------ | -------------------------------------- |
| Route      | `src/routes/assessment.routes.ts`          | `POST /:assessmentId/import-questions` |
| Controller | `src/controllers/assessment.controller.ts` | `assessmentController.importQuestions` |
| Service    | `src/services/assessment.service.ts`       | `assessmentService.importQuestions()`  |
| Schema     | `src/schemas/assessment.schema.ts`         | `importQuestionsSchema`                |

### Middleware Chain

```
authorize('teacher', 'admin')
  -> requireCourseOwnership('assessment', req => req.params['assessmentId'])
  -> validate(importQuestionsSchema)
  -> assessmentController.importQuestions
```

### Service Logic (pseudocode)

```
function importQuestions(assessmentId, practiceProblemAssignmentId, userId):
  assessment = findAssessment(assessmentId, deletedAt: null)
  if not assessment -> throw NotFoundError

  ppAssignment = findPracticeProblemAssignment(practiceProblemAssignmentId)
    include: assignment -> lesson -> unit (select courseId)
    include: questions (orderBy: order asc)
  if not ppAssignment -> throw NotFoundError

  assessmentCourseId = resolveAssessmentCourseId(assessment)
  ppCourseId = ppAssignment.assignment.lesson.unit.courseId

  if assessmentCourseId != ppCourseId -> throw 403 FORBIDDEN

  maxOrder = MAX(assessmentQuestion.order WHERE assessmentId) ?? -1
  nextOrder = maxOrder + 1

  for each ppQuestion in ppAssignment.questions:
    create AssessmentQuestion:
      assessmentId: assessmentId
      type: ppQuestion.type
      question: ppQuestion.content.question ?? ''
      content: ppQuestion.content
      order: nextOrder++
      calculatorEnabled: ppQuestion.content.calculatorEnabled ?? false

  return created questions
```

---

## 7. Error Handling

All error cases use existing typed error classes:

| Scenario                                           | Error Class                          | HTTP Status | Code               |
| -------------------------------------------------- | ------------------------------------ | ----------- | ------------------ |
| Assessment not found                               | `NotFoundError`                      | 404         | `NOT_FOUND`        |
| Practice problem assignment not found              | `NotFoundError`                      | 404         | `NOT_FOUND`        |
| PP assignment in different course                  | `AppError`                           | 403         | `FORBIDDEN`        |
| Invalid request body                               | `ValidationError` (via `validate()`) | 400         | `VALIDATION_ERROR` |
| Assignment not found in lesson (completion toggle) | `NotFoundError`                      | 404         | `NOT_FOUND`        |

No new error classes needed.

---

## 8. Validation

### Modified Schemas

| Schema                   | Change                                                                   |
| ------------------------ | ------------------------------------------------------------------------ |
| `toggleCompletionSchema` | `{ type, targetId }` replaced with `{ assignmentId: z.string().uuid() }` |

### New Schemas

| Schema                  | Shape                                                |
| ----------------------- | ---------------------------------------------------- |
| `importQuestionsSchema` | `{ practiceProblemAssignmentId: z.string().uuid() }` |

---

## 9. Dependencies

No new npm packages required. All functionality is implemented with existing dependencies (Prisma, Zod, Express).

---

## 10. Test Strategy

### Tests to Delete (6 files)

All test files listed in section 4.2.

### Tests to Update (3 files)

| File                                                               | Changes                                                                                                                                                                  |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/__tests__/services/resource-completion.service.test.ts`       | Rewrite to test `AssignmentCompletion`-based service. Mock `prisma.assignmentCompletion` instead of `prisma.lessonResourceCompletion` and `prisma.lessonToolCompletion`. |
| `src/__tests__/controllers/resource-completion.controller.test.ts` | Update to pass `{ assignmentId }` instead of `{ type, targetId }`.                                                                                                       |
| `src/__tests__/schemas/resource-completion.schema.test.ts`         | Update to validate `{ assignmentId }` schema shape.                                                                                                                      |
| `src/__tests__/middleware/authorize-resource.test.ts`              | Remove test cases for `'resource'` and `'tool'` resource types.                                                                                                          |

### New Tests (2 files or additions)

| File                                                                  | Coverage                                                                                                 |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `src/__tests__/services/assessment.service.test.ts` (add cases)       | Test `importQuestions`: success, PP not found, different course (403), empty questions, order appending. |
| `src/__tests__/controllers/assessment.controller.test.ts` (add cases) | Test `importQuestions` controller: 201 on success, param extraction.                                     |

---

## 11. Implementation Order

Execute in this exact sequence:

1. **Schema + Migration**: Update `schema.prisma` (remove models/enums/relations), generate migration with `--create-only`, insert data migration SQL before DDL drops, apply migration.
2. **Delete files**: Remove all 14 server source and test files listed in sections 4.1 and 4.2.
3. **Update routes/index.ts**: Remove resource and tool route imports and mounts.
4. **Update authorize-resource.ts**: Remove `'resource'` and `'tool'` cases.
5. **Update resource completion layer**: Rewrite schema, service, and controller.
6. **Add import-questions endpoint**: Add schema, service method, controller method, route.
7. **Update swagger.ts**: Remove old docs, add new endpoint docs.
8. **Update tests**: Delete old tests, update completion tests, add import tests.
9. **Run `npx prisma generate`** to ensure client types are current.
10. **Run `npm test -w server`** to verify all tests pass.
