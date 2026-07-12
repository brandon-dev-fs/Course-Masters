---
id: cm-0016
title: Database Schema Data Integrity Fixes
stage: spec
status: approved
approver: human
approved_at: 2026-05-13T00:00:00Z
---

## Problem Statement

Four data integrity gaps in the current Prisma schema allow invalid database states that cannot be caught at the DB level:

1. **Polymorphic LessonResourceCompletion**: `LessonResourceCompletion` uses untyped `resourceType: String` and `resourceId: String` fields with no foreign key enforcement. A completion row can reference a non-existent resource or tool, and the database has no way to verify the reference is valid.

2. **Assessment ownership ambiguity**: `Assessment` has three nullable FK columns (`lessonId`, `unitId`, `courseId`) with no constraint requiring exactly one to be populated. A row can legally have zero or multiple owners, making the `AssessmentType` enum value unenforceable by the schema alone.

3. **Assignment sub-table consistency**: `Assignment.type` declares which sub-table holds the content (e.g. `type = note` implies a `NoteAssignment` row exists), but there is no database-level enforcement. An assignment row can exist with a declared type and no corresponding sub-table record, or with multiple sub-table records.

4. **Duplicate question type enums**: `QuestionType` (used on `AssessmentQuestion`) and `PracticeQuestionType` (used on `PracticeProblemQuestion`) are structurally identical enums with the same four values. Maintaining two enums creates risk of future divergence and unnecessary cognitive overhead.

## Scope

### In Scope

- Replace `LessonResourceCompletion` (polymorphic) with two typed tables: `LessonResourceCompletion` (FK to `LessonResource`) and `LessonToolCompletion` (FK to `LessonTool`). The existing table has no production data and will be dropped and recreated.
- Update the `resource-completions` API endpoint to align with the new split-table model.
- Add a PostgreSQL `CHECK` constraint on `Assessment` enforcing exactly one of `lessonId`, `unitId`, `courseId` is non-null.
- Add a PostgreSQL `BEFORE INSERT/UPDATE` trigger on `assignment` enforcing that the sub-table row for the declared `type` exists at write time.
- Merge `QuestionType` and `PracticeQuestionType` into a single shared enum (`QuestionType`). Update `PracticeProblemQuestion.type` to use the retained enum. Drop `PracticeQuestionType`.
- Update all server-side code (services, schemas, types) affected by the schema changes.

### Out of Scope

- Changes to lesson resource or tool content structure.
- New API endpoints beyond what is required to support the split-table completion model.
- UI changes (all fixes are schema/backend-only).
- Performance optimization of completion queries.
- Adding completion tracking for any resource or tool types not already tracked.

## Requirements

### Functional

1. **LessonResourceCompletion split**: After migration, `LessonResourceCompletion` must have a non-nullable FK to `LessonResource` and `LessonToolCompletion` must have a non-nullable FK to `LessonTool`. Both tables must enforce `@@unique([userId, resourceId])` / `@@unique([userId, toolId])`. The existing polymorphic table is dropped; no data migration is required.

2. **Resource-completions API update**: The `GET /lessons/:lessonId/resource-completions` and `POST /lessons/:lessonId/resource-completions` endpoints must be updated to handle both resource and tool completions via the split tables. The request body must distinguish completion type (resource vs. tool).

3. **Assessment CHECK constraint**: A `CHECK` constraint must be added to the `assessment` table enforcing `(lessonId IS NOT NULL)::int + (unitId IS NOT NULL)::int + (courseId IS NOT NULL)::int = 1`. Existing rows that violate this constraint must be cleaned up before the constraint is applied (if any exist).

4. **Assignment type trigger**: A `BEFORE INSERT OR UPDATE` trigger on the `assignment` table must verify that a row in the appropriate sub-table exists for the row's `type` value. The trigger must raise an exception for any violation. The trigger must cover all five assignment types: `note`, `video`, `reading`, `vocab`, `practice_problem`.

5. **Enum merge**: `PracticeQuestionType` is dropped. `PracticeProblemQuestion.type` is changed to use `QuestionType`. The values (`multiple_choice`, `true_false`, `matching`, `fill_in_blank`) are identical, so no data migration is needed.

### Non-Functional

- All schema changes must be applied via a single Prisma migration (or `prisma db push` per the project's dev workflow).
- Raw SQL for the `CHECK` constraint and trigger must be included in a migration file or applied via `prisma.$executeRaw` in the seed/migration process.
- No existing passing tests may be broken by these changes.
- Server TypeScript must compile without errors after the changes.

## Systems Architecture

### Components

- **`server/prisma/schema.prisma`**: Primary change surface — model definitions, enum definitions, and FK declarations.
- **PostgreSQL migration / raw SQL**: CHECK constraint on `assessment`, trigger function and trigger on `assignment`. These cannot be expressed in the Prisma schema and require raw SQL.
- **`server/src/services/`**: Completion service(s) must be updated to write to/read from the two new completion tables instead of the polymorphic one.
- **`server/src/schemas/`**: Zod validation schemas for the resource-completions endpoint must be updated to reflect the new request body shape.
- **`server/src/routes/` and `server/src/controllers/`**: The `resource-completions` route/controller must handle both `LessonResourceCompletion` and `LessonToolCompletion`.

### Data Flow

Completion write path (after change):
1. Client `POST /lessons/:lessonId/resource-completions` with `{ type: 'resource' | 'tool', targetId }`.
2. Controller validates body via updated Zod schema.
3. Service routes write to `LessonResourceCompletion` (if `type = resource`) or `LessonToolCompletion` (if `type = tool`).
4. Prisma enforces the FK against `lesson_resource` or `lesson_tool` respectively.

### Integration Points

- **Frontend resource-completion tracking**: Any client code calling `POST /lessons/:lessonId/resource-completions` must send the updated request body shape. This is an API surface change.
- **Progress service**: `src/services/progress.service.ts` may query completion counts — must be verified against the new table names.

## Required Design Artifacts

- [ ] ui-design
- [ ] frontend-plan
- [x] backend-plan
- [x] api-contract
