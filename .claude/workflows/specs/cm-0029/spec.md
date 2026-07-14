---
id: cm-0029
title: Consolidate LessonResource and LessonTool into Assignment Model
stage: spec
status: approved
approver: human
approved_at: 2026-06-11T00:00:00Z
---

# Consolidate LessonResource and LessonTool into Assignment Model

## Problem Statement

The lesson content system currently uses three parallel models to represent teacher-authored content within a lesson: `LessonResource` (notes, videos, lectures), `LessonTool` (practice problems, vocab), and `Assignment` (notes, videos, external links, vocab, practice problems). The `LessonResource` and `LessonTool` models predate the `Assignment` model and overlap significantly in purpose. This creates duplicated CRUD endpoints, duplicated completion tracking, a fragmented teacher editing experience, and a confusing student-facing stepper that interleaves items from two unrelated models. Consolidating all lesson content into the `Assignment` model eliminates this duplication, simplifies the data model, and creates a single coherent content pipeline for both teachers and students.

## Scope

### In Scope

- Migrating all existing `LessonResource` records (types: `note`, `video`, `lecture`) into corresponding `Assignment` records, with `lecture` resources mapped to `note` assignments
- Migrating all existing `LessonTool` records (types: `practice_problem`, `vocab`) into corresponding `Assignment` records (these assignment types already exist)
- Migrating all `LessonResourceCompletion` and `LessonToolCompletion` records into `AssignmentCompletion` records
- Removing the `LessonResource`, `LessonTool`, `LessonResourceCompletion`, `LessonToolCompletion`, and `StudentLessonToolFlashCard` models from the Prisma schema
- Removing the `ResourceType` and `ToolType` enums from the Prisma schema
- Removing all server-side routes, controllers, services, schemas, and middleware references for lesson resources and lesson tools
- Removing all client-side API modules, components, hooks, and type definitions for lesson resources and lesson tools
- Updating the resource completion system to track assignment completions only
- Updating the lesson detail page stepper to render exclusively from the assignment list
- Adding a `lecture` value to the `AssignmentType` enum to preserve the `lecture` content type identity during migration, then removing it post-migration (see FR-10)
- Enabling practice problem question import from assignments into assessments via a copy operation

### Out of Scope

- Changes to the `Assessment`, `AssessmentQuestion`, or `AssessmentAttempt` models (quiz/exam flow unchanged)
- Changes to the lesson completion or unit completion logic (the pass/fail gating via quiz attempts remains unchanged)
- Changes to the `StudentNote` model (student-authored notes are separate from teacher-authored note assignments)
- Changes to `ActivityBookmark`, `LessonChecklistItem`, or any models added in cm-0028
- File upload or document embedding (deferred pending Docker)
- Pagination of the assignment list (bounded per lesson)
- Changes to course progress calculation formulas

## Requirements

### Functional Requirements

#### FR-01 -- Migrate Note Resources to Note Assignments

All existing `LessonResource` records with `type = 'note'` must be migrated to `Assignment` records with `type = 'note'`. Each migrated assignment must have a corresponding `NoteAssignment` child record. The `LessonResource.content` JSON (containing `{ body: TiptapJSON }`) must be stored as the `NoteAssignment.content` field. The `LessonResource.title` becomes `Assignment.title`. The `LessonResource.order` value must be preserved relative to other resources and existing assignments within the same lesson (see FR-07 for ordering strategy).

#### FR-02 -- Migrate Video Resources to Video Assignments

All existing `LessonResource` records with `type = 'video'` must be migrated to `Assignment` records with `type = 'video'`. Each migrated assignment must have a corresponding `VideoAssignment` child record. The `LessonResource.content` JSON (containing `{ url: string }`) must be mapped: `content.url` becomes `VideoAssignment.url`, `LessonResource.title` becomes both `Assignment.title` and `VideoAssignment.title`.

#### FR-03 -- Migrate Lecture Resources to Note Assignments

All existing `LessonResource` records with `type = 'lecture'` must be migrated to `Assignment` records with `type = 'note'`. The `lecture` ResourceType is collapsed into the `note` AssignmentType. Each migrated assignment must have a corresponding `NoteAssignment` child record. The `LessonResource.content` JSON (containing `{ body: TiptapJSON }`) is stored as `NoteAssignment.content`. The original title is preserved. No new `lecture` AssignmentType is created.

#### FR-04 -- Migrate Practice Problem Tools to Practice Problem Assignments

All existing `LessonTool` records with `type = 'practice_problem'` must be migrated to `Assignment` records with `type = 'practice_problem'`. Each migrated assignment must have a corresponding `PracticeProblemAssignment` child record. The `LessonTool.content` JSON for practice problem tools contains question data in the old format (single question per tool record with fields `question`, `options`, `correctIndex`, `calculatorEnabled`). Each tool record must produce one `PracticeProblemQuestion` child record under the new `PracticeProblemAssignment`, with the content mapped to the `PracticeProblemQuestion.content` JSON column and `type` set to `multiple_choice`. If multiple `LessonTool` records of type `practice_problem` exist for a lesson, they should be grouped into a single `PracticeProblemAssignment` per lesson with one question per original tool record, ordered by the original `LessonTool.order`.

#### FR-05 -- Migrate Vocab Tools to Vocab Assignments

All existing `LessonTool` records with `type = 'vocab'` must be migrated to `Assignment` records with `type = 'vocab'`. Each migrated assignment must have a corresponding `VocabAssignment` child record. The `LessonTool.content` JSON for vocab tools contains `{ term, definition, example? }`. Each tool record must produce one `VocabAssignmentEntry` child record under the new `VocabAssignment`, ordered by the original `LessonTool.order`. If multiple `LessonTool` records of type `vocab` exist for a lesson, they should be grouped into a single `VocabAssignment` per lesson with one entry per original tool record.

#### FR-06 -- Migrate Completion Records

All existing `LessonResourceCompletion` records must be migrated to `AssignmentCompletion` records, with the `resourceId` mapped to the `assignmentId` of the corresponding migrated assignment. All existing `LessonToolCompletion` records must be similarly migrated. For grouped tools (FR-04, FR-05), where multiple tool records become a single assignment, any completion on any of the grouped tools should result in a single completion on the resulting assignment.

#### FR-07 -- Assignment Ordering After Migration

After migration, each lesson must have a contiguous, 1-based `order` sequence across all assignments (both pre-existing and newly migrated). The ordering strategy must place migrated resources before migrated tools, preserving their original relative order within each group, and appending them after any existing assignments. Specifically: existing assignments retain their current order values, migrated resources are appended next (sorted by their original `LessonResource.order`), and migrated grouped tools (practice problems, vocab) are appended last.

#### FR-08 -- Remove LessonResource Model and All Dependencies

After migration, the `LessonResource` model must be dropped from the Prisma schema. This includes removing the `ResourceType` enum, the `resources` relation on `Lesson`, the `LessonResourceCompletion` model, the `resourceCompletions` relation on `User`, and all server-side files: `lesson-resource.routes.ts`, `lesson-resource.controller.ts`, `lesson-resource.service.ts`, `lesson-resource.schema.ts`. All client-side files must also be removed: `api/lesson-resources.ts`, `features/lessons/LessonResourceContent.tsx`, `features/lessons/hooks/useResources.ts`, `features/notes/NoteEditor.tsx` (if exclusively used for LessonResource), `features/videos/VideoCard.tsx`, `features/videos/VideoForm.tsx`, `features/videos/VideoList.tsx`. All test files for removed modules must be deleted.

#### FR-09 -- Remove LessonTool Model and All Dependencies

After migration, the `LessonTool` model must be dropped from the Prisma schema. This includes removing the `ToolType` enum, the `tools` relation on `Lesson`, the `LessonToolCompletion` model, the `toolCompletions` relation on `User`, the `StudentLessonToolFlashCard` model, the `lessonToolFlashCards` relation on `User`, and all server-side files: `lesson-tool.routes.ts`, `lesson-tool.controller.ts`, `lesson-tool.service.ts`, `lesson-tool.schema.ts`. All client-side files must also be removed: `api/lesson-tools.ts`, `features/lessons/LessonToolContent.tsx`, `features/lessons/LessonToolModals.tsx`, `features/lessons/hooks/useTools.ts`. All test files for removed modules must be deleted.

#### FR-10 -- Remove lecture from ResourceType During Migration

The `lecture` value is not added to `AssignmentType`. Lecture resources are migrated as `note` assignments (FR-03). After migration, the `ResourceType` enum is dropped entirely (FR-08). No `lecture` assignment type exists post-migration.

#### FR-11 -- Update Resource Completion Endpoints

The existing `GET /lessons/:lessonId/completions` and `POST /lessons/:lessonId/completions` endpoints must be updated to track completions against `Assignment` records only (via `AssignmentCompletion`), replacing the current dual `LessonResourceCompletion` + `LessonToolCompletion` system. The response shape must change: the `type` discriminator currently returns `'resource'` or `'tool'` and must be replaced with `'assignment'` (or the type field removed entirely since all items are assignments). The `targetId` field maps to `assignmentId`.

#### FR-12 -- Update Lesson Detail Page to Use Assignments Only

The `LessonDetailPage` stepper and content area must render exclusively from the assignment list. The current system interleaves `LessonResource` items (via `useResources`) and `Assignment` items in a combined sidebar. Post-migration, `useResources` and `useTools` hooks are removed. The stepper reads only from the assignment list returned by `GET /lessons/:lessonId/assignments`. The `ActiveItemContent` component must be updated to handle all assignment types (note, video, external link, vocab, practice problem) without delegating to `LessonResourceContent` or `LessonToolContent`.

#### FR-13 -- Update Ownership Middleware

The `requireCourseOwnership` middleware in `authorize-resource.ts` currently handles `'resource'` and `'tool'` resource types for ownership validation. These cases must be removed. All ownership checks for lesson content now go through the existing `'assignment'` resource type.

#### FR-14 -- Remove Resource and Tool API Routes

The following route groups must be removed from the server route index:

- `GET /lessons/:lessonId/resources`, `POST /lessons/:lessonId/resources`, `PUT /resources/:resourceId`, `DELETE /resources/:resourceId`
- `GET /lessons/:lessonId/tools`, `POST /lessons/:lessonId/tools`, `PUT /tools/:toolId`, `DELETE /tools/:toolId`

#### FR-15 -- Practice Problem Question Import to Assessment

Teachers must be able to import questions from a practice problem assignment into a lesson quiz (or unit/course assessment). The import is a copy operation: new `AssessmentQuestion` records are created with content duplicated from the source `PracticeProblemQuestion` records. The source practice problem questions remain unchanged. Questions are exclusive to one parent -- a question record belongs to either an `Assessment` (via `assessmentId`) or a `PracticeProblemAssignment` (via `practiceProblemAssignmentId`), never both simultaneously. This exclusivity is enforced via service-layer validation only, not a database constraint.

#### FR-16 -- Practice Problem Passing Percentage in Content JSON

The `passingPercentage` for practice problems is stored in the `PracticeProblemAssignment` model's existing `passingPercentage` column (already present). No new column is added to the `Assignment` model. This requirement confirms the existing design; no migration or schema change is needed for this field.

#### FR-17 -- Update Swagger/OpenAPI Documentation

The OpenAPI specification in `swagger.ts` must be updated to remove all `LessonResource` and `LessonTool` endpoint documentation and add documentation for the question import endpoint.

#### FR-18 -- Soft Delete Cascade Updates

The `softDeleteLesson` helper in `utils/softDelete.ts` currently cascades to `LessonResource` and `LessonTool` records. These references must be removed. Hard deletes on lessons already cascade to assignments via the `onDelete: Cascade` relation, so no new cascade logic is needed for the migrated data.

### Non-Functional Requirements

- NFR-01: The data migration must be implemented as a Prisma migration containing a SQL data migration script. It must be idempotent -- running the migration on a database where some or all records have already been migrated must not produce duplicates or errors.
- NFR-02: The migration must preserve all existing `AssignmentCompletion` records. No student progress data may be lost.
- NFR-03: The migration must run within a single database transaction to ensure atomicity. If any step fails, the entire migration rolls back.
- NFR-04: All removed API endpoints must return 404 (via the absence of route registration), not 500.
- NFR-05: The question import endpoint must follow existing REST conventions (envelope response, Zod validation, asyncHandler, proper status codes).
- NFR-06: Client-side type definitions must be updated to remove `LessonResource`, `LessonTool`, `ResourceType`, `ToolType`, and all associated interfaces from `api/types.ts`.
- NFR-07: The post-migration assignment list for any lesson must maintain a valid contiguous order sequence with no gaps.

## Systems-Level Architecture

### Components Involved

**Existing models being removed:**
- `LessonResource` (and its `ResourceType` enum)
- `LessonTool` (and its `ToolType` enum)
- `LessonResourceCompletion`
- `LessonToolCompletion`
- `StudentLessonToolFlashCard`

**Existing models being modified:**
- `Lesson` -- remove `resources` and `tools` relations
- `User` -- remove `resourceCompletions`, `toolCompletions`, `lessonToolFlashCards` relations
- `Assignment` -- no schema change; gains migrated data

**Existing models unchanged but referenced:**
- `NoteAssignment`, `VideoAssignment`, `VocabAssignment`, `VocabAssignmentEntry`, `PracticeProblemAssignment`, `PracticeProblemQuestion`, `AssignmentCompletion`

**Server files to remove (16 files):**
- `routes/lesson-resource.routes.ts`
- `controllers/lesson-resource.controller.ts`
- `services/lesson-resource.service.ts`
- `schemas/lesson-resource.schema.ts`
- `routes/lesson-tool.routes.ts`
- `controllers/lesson-tool.controller.ts`
- `services/lesson-tool.service.ts`
- `schemas/lesson-tool.schema.ts`
- All corresponding test files (8 files across `__tests__/services/`, `__tests__/controllers/`, `__tests__/schemas/`)

**Server files to modify:**
- `routes/index.ts` -- remove resource and tool route mounts
- `middleware/authorize-resource.ts` -- remove `'resource'` and `'tool'` cases
- `services/resource-completion.service.ts` -- rewrite to use `AssignmentCompletion` only
- `controllers/resource-completion.controller.ts` -- update to new service interface
- `utils/softDelete.ts` -- remove `LessonResource` and `LessonTool` cascade references
- `swagger.ts` -- remove resource/tool docs, add import endpoint docs

**Client files to remove:**
- `api/lesson-resources.ts`
- `api/lesson-tools.ts`
- `features/lessons/LessonResourceContent.tsx`
- `features/lessons/LessonToolContent.tsx`
- `features/lessons/LessonToolModals.tsx`
- `features/lessons/hooks/useResources.ts`
- `features/lessons/hooks/useTools.ts`
- `features/videos/VideoCard.tsx`, `VideoForm.tsx`, `VideoList.tsx` (if exclusively used for LessonResource videos)
- All corresponding test files

**Client files to modify:**
- `api/types.ts` -- remove `ResourceType`, `ToolType`, `LessonResource`, `LessonTool` types and all sub-interfaces
- `features/lessons/LessonDetailPage.tsx` -- remove `useResources`, `useTools`; render stepper from assignments only
- `features/lessons/ActiveItemContent.tsx` -- remove resource/tool content delegation; handle all types via assignment
- `features/lessons/hooks/useAssignments.ts` -- remove resource/tool interleaving logic
- `features/flashcards/FlashCardList.tsx` -- remove LessonTool flash card references
- `features/vocab/VocabCard.tsx` -- remove LessonTool vocab references
- `features/student-notes/StudentMaterialsModal.tsx` -- remove tool-based panels

### Data Model Changes

**Models to drop (5):**
1. `LessonResource` -- all records migrated to `Assignment` + type-specific child tables
2. `LessonTool` -- all records migrated to `Assignment` + type-specific child tables
3. `LessonResourceCompletion` -- all records migrated to `AssignmentCompletion`
4. `LessonToolCompletion` -- all records migrated to `AssignmentCompletion`
5. `StudentLessonToolFlashCard` -- dropped with no migration (superseded by `StudentVocabAssignmentFlashCard` for vocab; practice problem tools have no saved-card equivalent)

**Enums to drop (2):**
1. `ResourceType` (values: `note`, `video`, `lecture`)
2. `ToolType` (values: `practice_problem`, `vocab`)

**Relation changes on surviving models:**
- `Lesson`: remove `resources LessonResource[]` and `tools LessonTool[]` relations
- `User`: remove `resourceCompletions LessonResourceCompletion[]`, `toolCompletions LessonToolCompletion[]`, and `lessonToolFlashCards StudentLessonToolFlashCard[]` relations

**No new models or columns are added.** All target models (`Assignment`, `NoteAssignment`, `VideoAssignment`, `VocabAssignment`, `VocabAssignmentEntry`, `PracticeProblemAssignment`, `PracticeProblemQuestion`, `AssignmentCompletion`) already exist.

### API Changes

**Endpoints to remove (8):**
- `GET /lessons/:lessonId/resources`
- `POST /lessons/:lessonId/resources`
- `PUT /resources/:resourceId`
- `DELETE /resources/:resourceId`
- `GET /lessons/:lessonId/tools`
- `POST /lessons/:lessonId/tools`
- `PUT /tools/:toolId`
- `DELETE /tools/:toolId`

**Endpoints to modify (2):**
- `GET /lessons/:lessonId/completions` -- returns assignment completions only; removes `type: 'resource' | 'tool'` discriminator
- `POST /lessons/:lessonId/completions` -- toggles `AssignmentCompletion` records only; request body changes from `{ type, targetId }` to `{ assignmentId }`

**Endpoints to add (1):**
- `POST /assessments/:assessmentId/import-questions` -- copies questions from a practice problem assignment into the target assessment. Request includes the source `practiceProblemAssignmentId`. Returns the newly created `AssessmentQuestion` records. Restricted to teachers who own the course containing the assessment.

### Data Flow

**Migration flow (one-time, during deploy):**

1. For each lesson, query all `LessonResource` records ordered by `order`.
2. Determine the next available `order` value by finding the max existing `Assignment.order` for that lesson.
3. For each `note` or `lecture` resource: create an `Assignment` (type `note`) and a `NoteAssignment` with the content JSON. Increment order.
4. For each `video` resource: create an `Assignment` (type `video`) and a `VideoAssignment` with URL and title extracted from content JSON. Increment order.
5. For each lesson, query all `LessonTool` records of type `vocab`, ordered by `order`. If any exist, create a single `Assignment` (type `vocab`), a `VocabAssignment`, and one `VocabAssignmentEntry` per tool record. Increment order.
6. For each lesson, query all `LessonTool` records of type `practice_problem`, ordered by `order`. If any exist, create a single `Assignment` (type `practice_problem`), a `PracticeProblemAssignment`, and one `PracticeProblemQuestion` per tool record. Increment order.
7. For each `LessonResourceCompletion`, look up the newly created assignment ID via a mapping table (old resource ID to new assignment ID) and create an `AssignmentCompletion`.
8. For each `LessonToolCompletion`, look up the newly created assignment ID (for grouped tools, map to the single assignment for that lesson + type combination) and create an `AssignmentCompletion` if one does not already exist for that user + assignment pair.
9. Drop all migrated source tables and enums.

**Question import flow (runtime):**

1. Teacher navigates to the lesson quiz editor and selects "Import from Practice Problems."
2. Client calls `POST /assessments/:assessmentId/import-questions` with `{ practiceProblemAssignmentId }`.
3. Server validates that the teacher owns the course containing both the assessment and the practice problem assignment.
4. Server reads all `PracticeProblemQuestion` records from the source assignment.
5. Server creates new `AssessmentQuestion` records with content copied from each source question. The `order` values are appended after the assessment's existing questions.
6. Server returns the newly created questions.

### Integration Points

- **Authentication/authorization**: The question import endpoint requires `authenticate()`, `authorize('teacher', 'admin')`, and `requireCourseOwnership` for the target assessment. The service layer additionally verifies the source practice problem assignment belongs to the same course.
- **Resource completion routes**: `resource-completion.routes.ts` and `resource-completion.controller.ts` remain but are rewritten to work with `AssignmentCompletion` only. The route paths (`/lessons/:lessonId/completions`) do not change.
- **Lesson detail page hooks**: `useAssignments` becomes the sole data source for the lesson stepper. The `buildAssignmentItems` function (or equivalent) that currently merges resources, tools, and assignments into a single list is simplified to return assignments directly.
- **Flash card feature**: `FlashCardList` currently supports both `LessonTool`-based and `VocabAssignment`-based flash cards. Post-migration, only the `VocabAssignment` path remains. The `StudentLessonToolFlashCard` model is removed.
- **Soft delete helpers**: The `softDeleteLesson` function in `utils/softDelete.ts` no longer needs to cascade to `LessonResource` or `LessonTool` -- the `onDelete: Cascade` on `Assignment` handles all child cleanup.

## Required Design Artifacts

- [x] Backend plan (`backend-plan.md`)
- [x] API contract (`api-contract.md`)
- [x] Frontend plan (`frontend-plan.md`)
- [ ] UI wireframe (`wireframe.md`)
