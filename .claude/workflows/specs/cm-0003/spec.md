---
id: cm-0003
title: Add Assignment Layer to Lessons
stage: spec
status: approved
approver: human
approved_at: 2026-04-28T00:00:00Z
---

# Add Assignment Layer to Lessons

## Problem Statement

Lesson content is currently modeled as two flat collections — `LessonResource` (notes, videos, lectures) and `LessonTool` (flashcards, practice problems, vocab) — with no concept of ordered, objective-driven work. Teachers cannot sequence content into a structured learning path, and students have no clear progression through a lesson's material. An **assignment** layer is needed: an ordered sequence of tasks within a lesson, each with a defined type, objective, and completion state, that sits above the existing resource and tool models.

## Scope

### In Scope

- New `Assignment` parent model with shared fields (lesson foreign key, display order, title, objective text, type discriminator) and child tables for type-specific data
- Assignment types shipped in this spec: **note**, **video**, **reading assignment**, **vocab**, **practice problem**
- Reading assignment type fields: external URL/link, optional description/summary, estimated reading time
- Teacher experience: an "add assignment" menu that replaces the current individual "add resource" buttons, with per-type creation/edit/delete forms
- Student experience: ordered assignment list within a lesson, per-assignment completion tracking, and type-specific views (including the reading assignment view showing link, description, and estimated reading time)
- Reordering assignments within a lesson (drag-and-drop or move up/down controls)
- Clean-slate approach to data: no migration of existing `LessonResource` or `LessonTool` rows required (all current data is seed data)

### Out of Scope

- **Deferred assignment types (file infrastructure dependency):** image gallery and file download — these require file upload infrastructure that is a separate pending project (see Memory: Docker Setup Priority, File Upload Feature)
- **Deferred assignment types (future specs):** discussion prompt, code exercise, worksheet, checklist, embedded content, audio
- Migration of existing `LessonResource` or `LessonTool` data into the new assignment model
- Changes to the existing `LessonTool` model or student tools UX (flashcards, personal notes) — these remain as-is as tertiary/discretionary tools
- Removal of the existing `LessonResource` model — coexistence during transition is acceptable; cleanup is a future task
- Assessment integration (quizzes/exams remain unchanged)
- Bulk operations (bulk reorder, bulk delete)

## Requirements

### Functional Requirements

- FR-01: The system shall provide a new `Assignment` data model with a parent table containing shared fields (lesson foreign key, sequential order integer, title, objective text, type discriminator) and separate child tables for type-specific data joined by foreign key.
- FR-02: The system shall support five assignment types at launch: `note`, `video`, `reading`, `vocab`, and `practice_problem`.
- FR-03: The `note` assignment type shall store rich-text content (same content model as the current `LessonResource` note type).
- FR-04: The `video` assignment type shall store a video URL and optional title (same content model as the current `LessonResource` video type).
- FR-05: The `reading` assignment type shall store a required external URL, an optional description/summary (plain text), and an optional estimated reading time in minutes.
- FR-05a: The `vocab` assignment type shall store an ordered list of term/definition pairs (each pair: required term string, required definition string).
- FR-05b: The `practice_problem` assignment type shall contain an ordered set of questions, each with a type (`multiple_choice`, `true_false`, `matching`, `fill_in_blank`) and typed JSON content mirroring the existing `AssessmentQuestion` content shapes.
- FR-05c: The `practice_problem` assignment type shall include an optional `passingPercentage` (0–100) set by the teacher. If set, the assignment auto-completes when the student's score meets or exceeds the threshold. If not set, the student manually marks it complete.
- FR-05d: Students may retry a practice problem assignment unlimited times regardless of their score.
- FR-06: Teachers shall be able to create assignments of any supported type within a lesson through a single "add assignment" menu that presents available types.
- FR-07: Teachers shall be able to edit assignment shared fields (title, objective) and type-specific fields for any existing assignment.
- FR-08: Teachers shall be able to delete an assignment; deletion shall remove both the parent record and the associated child record.
- FR-09: Teachers shall be able to reorder assignments within a lesson; the system shall maintain a consistent sequential order with no gaps after reordering.
- FR-10: The "add assignment" menu shall replace the current individual add-resource buttons in the teacher's lesson editing view.
- FR-11: Students shall see assignments listed in their defined order within a lesson.
- FR-12: Students shall be able to mark individual assignments as complete; completion status shall be tracked per student per assignment.
- FR-13: For the `reading` assignment type, the student view shall display the external link (opening in a new tab), the description/summary if present, and the estimated reading time if present.
- FR-14: For the `note` assignment type, the student view shall render the rich-text content inline (consistent with current note resource rendering).
- FR-15: For the `video` assignment type, the student view shall embed or link the video (consistent with current video resource rendering).
- FR-15a: For the `vocab` assignment type, the student view shall display each term/definition pair; terms and definitions should be clearly distinguished.
- FR-15b: For the `practice_problem` assignment type, the student view shall present questions in sequence with immediate per-question feedback after each answer is submitted.
- FR-15c: After the final question in a practice problem, the client shall calculate the score (correct / total × 100). If `passingPercentage` is set and the score meets or exceeds it, the client shall automatically call `POST /assignments/:id/complete`. Otherwise the student may retry from the beginning.
- FR-15d: Students may retry a practice problem assignment unlimited times regardless of score or prior completion state.
- FR-16: Assignment order values shall be automatically assigned on creation (appended to the end of the current list) and recalculated on reorder or deletion to remain sequential starting from 1.
- FR-17: Only teachers (and admins) shall be able to create, edit, delete, or reorder assignments. Students shall have read-only access plus completion toggling.
- FR-18: Deleting a lesson shall cascade-delete all its assignments and their child records (consistent with existing cascade-delete behavior throughout the hierarchy).

### Non-Functional Requirements

- NFR-01: Assignment list retrieval for a lesson shall complete in under 200ms for lessons with up to 50 assignments.
- NFR-02: Reorder operations shall be atomic — no intermediate states where two assignments share the same order value.
- NFR-03: All assignment API inputs shall be validated with Zod schemas at the API boundary.
- NFR-04: Assignment endpoints shall enforce authentication and role-based authorization consistent with existing middleware patterns.

## Systems-Level Architecture

### Components Involved

**Existing components (modified):**
- Lesson detail page (client) — will integrate the ordered assignment list and the "add assignment" menu in place of current resource-add buttons
- Lesson routes or a new assignment router (server) — new endpoints for assignment CRUD and reorder
- Authentication and authorization middleware (server) — applied to new routes, no changes to middleware itself

**New components:**
- `Assignment` parent model and type-specific child models (Prisma schema)
- `AssignmentCompletion` model for per-student per-assignment completion tracking
- Assignment API router (server) — CRUD, reorder, and completion endpoints
- Assignment list component (client) — ordered display of assignments within a lesson
- "Add assignment" menu component (client) — replaces current add-resource buttons
- Per-type assignment form components (client) — note form, video form, reading form, vocab form, practice problem builder (add/reorder questions, set passing percentage)
- Per-type student view components (client) — note viewer, video viewer, reading viewer, vocab viewer, practice problem runner (sequential questions, per-question feedback, score summary)
- Assignment completion toggle component (client)

### Data Model Changes

**New model: `Assignment` (parent table)**
- UUID primary key
- Foreign key to `Lesson` (required, cascade delete)
- `order` integer field — sequential position within the lesson
- `title` string field (required)
- `objective` string field (optional) — describes what the student should achieve
- `type` enum discriminator field with values: `note`, `video`, `reading` (new enum: `AssignmentType`)
- Timestamps (createdAt, updatedAt)
- Unique constraint on (lessonId, order) to prevent duplicate ordering

**New model: `NoteAssignment` (child table)**
- UUID primary key
- Foreign key to `Assignment` (required, unique, cascade delete)
- `content` Json field — rich-text content (same structure as current LessonResource note content)

**New model: `VideoAssignment` (child table)**
- UUID primary key
- Foreign key to `Assignment` (required, unique, cascade delete)
- `url` string field (required) — video URL
- `title` string field (optional) — display title for the video

**New model: `ReadingAssignment` (child table)**
- UUID primary key
- Foreign key to `Assignment` (required, unique, cascade delete)
- `url` string field (required) — external link to the reading material
- `description` string field (optional) — summary or context for the reading
- `estimatedMinutes` integer field (optional) — estimated reading time in minutes

**New model: `VocabAssignment` (child table)**
- UUID primary key
- Foreign key to `Assignment` (required, unique, cascade delete)
- `entries` Json field — ordered array of `{ term: string, definition: string }` objects

**New model: `PracticeProblemAssignment` (child table)**
- UUID primary key
- Foreign key to `Assignment` (required, unique, cascade delete)
- `passingPercentage` integer field (optional, 0–100) — auto-completion threshold; if null, student marks complete manually

**New model: `PracticeProblemQuestion`**
- UUID primary key
- Foreign key to `PracticeProblemAssignment` (required, cascade delete)
- `order` integer field — sequential position within the practice set
- `type` enum field: `multiple_choice | true_false | matching | fill_in_blank` (new enum: `PracticeQuestionType`)
- `content` Json field — typed content per question type, mirroring `AssessmentQuestion` content shapes:
  - `multiple_choice`: `{ question, options: string[], correctIndex: number }`
  - `true_false`: `{ question, correct: boolean }`
  - `matching`: `{ question, leftItems: string[], rightItems: string[], correctPairs: [number, number][] }`
  - `fill_in_blank`: `{ question, blanks: [{ answer: string, alternatives?: string[] }] }`

**New model: `AssignmentCompletion`**
- UUID primary key
- Foreign key to `User` (required, cascade delete)
- Foreign key to `Assignment` (required, cascade delete)
- Unique constraint on (userId, assignmentId) — one completion record per student per assignment
- `completedAt` datetime field
- Timestamps

**New enum: `AssignmentType`**
- Values: `note`, `video`, `reading`, `vocab`, `practice_problem`
- Additional values (e.g., `image_gallery`, `file_download`) will be added in future specs when file infrastructure is available

**New enum: `PracticeQuestionType`**
- Values: `multiple_choice`, `true_false`, `matching`, `fill_in_blank`

### API Changes

New endpoints under `/api`:

- `GET /lessons/:lessonId/assignments` — list all assignments for a lesson in order, including type-specific child data and (for authenticated students) completion status
- `POST /lessons/:lessonId/assignments` — create a new assignment (teacher/admin only); accepts type discriminator and type-specific fields
- `GET /assignments/:assignmentId` — get a single assignment with child data and completion status
- `PUT /assignments/:assignmentId` — update an assignment's shared and/or type-specific fields (teacher/admin only)
- `DELETE /assignments/:assignmentId` — delete an assignment and recalculate order (teacher/admin only)
- `PUT /lessons/:lessonId/assignments/reorder` — accept an ordered list of assignment IDs and update order values atomically (teacher/admin only)
- `POST /assignments/:assignmentId/complete` — mark an assignment as complete for the authenticated student
- `DELETE /assignments/:assignmentId/complete` — unmark an assignment completion for the authenticated student

### Data Flow

**Teacher creates an assignment:**
1. Teacher opens the lesson edit view and clicks the "add assignment" menu.
2. Teacher selects an assignment type (e.g., "Reading").
3. Client renders the type-specific form (URL, description, estimated reading time for reading type).
4. Teacher fills in shared fields (title, objective) and type-specific fields, then submits.
5. Client sends a POST request to `/lessons/:lessonId/assignments` with the type discriminator and all fields.
6. Server validates input with Zod, verifies teacher/admin role, creates the `Assignment` parent record with order set to (max current order + 1), creates the type-specific child record in a transaction, and returns the full assignment.
7. Client updates the assignment list to include the new assignment at the end.

**Student views and completes assignments:**
1. Student navigates to a lesson detail page.
2. Client fetches `GET /lessons/:lessonId/assignments`, which returns assignments in order with completion status for the authenticated user.
3. Client renders the assignment list; each assignment shows its type-specific content (inline note, embedded video, or reading link with description and estimated time).
4. Student interacts with the assignment content (reads the note, watches the video, follows the reading link).
5. Student clicks a completion toggle on the assignment.
6. Client sends `POST /assignments/:assignmentId/complete`.
7. Server creates an `AssignmentCompletion` record and returns success.
8. Client updates the UI to show the assignment as completed.

**Teacher reorders assignments:**
1. Teacher drags an assignment to a new position (or uses move up/down controls).
2. Client sends `PUT /lessons/:lessonId/assignments/reorder` with the full ordered list of assignment IDs.
3. Server validates that all IDs belong to the lesson, updates order values atomically in a transaction, and returns the updated list.
4. Client reflects the new order.

### Integration Points

- **Authentication/authorization middleware:** New assignment routes use the existing `authenticate` and `authorize` middleware (roles: teacher, admin for mutations; authenticated for reads and completions).
- **Cascade deletes:** Assignment and child records cascade-delete when a lesson is deleted, consistent with the existing `User -> Course -> Unit -> Lesson` cascade chain.
- **Existing lesson detail page:** The assignment list integrates into the existing `LessonDetailPage` component, replacing or augmenting the current resource display area.
- **Existing resource/tool models:** `LessonResource` and `LessonTool` remain unchanged. The assignment layer coexists alongside them during transition. Future cleanup is out of scope.
- **Completion tracking:** `AssignmentCompletion` follows the same pattern as existing `LessonCompletion` and `UnitCompletion` models. Integration with the existing progress endpoints (course progress, unit progress) is out of scope for this spec but should be considered in a follow-up.

## Future Assignment Types (Deferred)

The following types are planned but deferred because they depend on file upload infrastructure, which is a separate pending project (Docker setup is a prerequisite):

- **Image gallery:** A set of images displayed in a gallery or carousel format within a lesson assignment. Requires server-side file storage and upload endpoints.
- **File download:** A downloadable file (PDF, document, etc.) attached to an assignment. Requires the same file storage infrastructure.

These types will be added as new child tables and new `AssignmentType` enum values in future specs once the file infrastructure is available.

## Required Design Artifacts

- [x] Backend plan (`backend-plan.md`)
- [x] API contract (`api-contract.md`)
- [x] Frontend plan (`frontend-plan.md`)
- [x] UI wireframe (`wireframe.md`)
