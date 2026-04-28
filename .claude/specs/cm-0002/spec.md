---
id: cm-0002
title: Redesign Lesson Detail Page Layout
stage: spec
status: approved
approver: human
approved_at: 2026-04-24T00:00:00Z
---

# Redesign Lesson Detail Page Layout

## Problem Statement

The current Lesson Detail Page uses a horizontal tab bar (`LearningResourceNav`) to switch between lesson content (lesson plan, notes, videos, vocab) and a separate right sidebar (`PracticeResourceSidebar`) for flashcards and practice problems. The student notes panel (`StudentNotePanel`) floats as an overlay. This layout separates related content into disconnected areas, making the learning workflow feel fragmented rather than structured. Students cannot easily see their full set of assignments in a single ordered list, and the floating notes panel competes with the main content area instead of living in a predictable location.

## Scope

### In Scope

- Replacing the horizontal tab-based resource navigation with a vertical assignment list in the left sidebar
- Adding a unit dropdown to the left sidebar that navigates to the first lesson of the selected unit
- Relocating the `StudentNotePanel` from a floating overlay into a persistent right aside panel titled "Student Materials"
- Merging practice resources (flashcards, practice problems) into the assignment list alongside other resources
- Supporting teachers marking individual assignments (resources and tools) as optional or required
- Updating lesson completion logic so completion is based on finishing all required assignments plus the lesson quiz
- Improving responsive behavior where there are clear wins for the new layout

### Out of Scope

- A dedicated "Student Materials" standalone page (deferred to a future spec)
- Changes to the CourseDetailPage or course-level navigation
- Changes to assessment content, question types, or grading logic
- New data models beyond the fields needed for optional/required assignment marking
- Mobile-first redesign (improvements are incremental, not a full mobile overhaul)
- Changes to the unit test (unit quiz) flow or course exam flow

## Requirements

### Functional Requirements

- FR-01: The left sidebar shall display a unit dropdown at the top that lists all units in the current course. Selecting a unit navigates the user to the first lesson of that unit.
- FR-02: The left sidebar shall display the list of lessons in the current unit below the unit dropdown, preserving the current lesson highlighting and navigation behavior from `UnitLessonSidebar`.
- FR-03: Below the lesson list, the left sidebar shall display an ordered assignment list for the currently selected lesson. This list replaces the current `LearningResourceNav` tab bar and `PracticeResourceSidebar`.
- FR-04: The assignment list shall include all lesson content in a single ordered sequence: lesson plan, notes, videos, vocabulary, flashcards, and practice problems. The quiz shall appear as the final item in the list.
- FR-05: Each assignment in the list shall display a completion indicator (checkbox or equivalent) for students, reflecting whether that assignment has been marked complete.
- FR-06: The quiz item in the assignment list shall be visually locked until all required assignments are completed. Clicking a locked quiz shows a message indicating what remains.
- FR-07: Teachers and admins shall be able to mark individual assignments (resources and tools, excluding lesson plan and quiz) as optional or required.
- FR-08: Lesson completion shall be determined by the student completing all assignments marked as required plus the lesson quiz.
- FR-09: The right aside shall be a persistent panel titled "Student Materials" that contains the student's personal notes for the current lesson (currently in `StudentNotePanel`).
- FR-10: The right aside shall hide when the student is taking a quiz, consistent with the current `StudentNotePanel` disabled behavior.
- FR-11: Selecting an assignment from the left sidebar list shall display its content in the main center area, replacing the current tab-switching behavior.
- FR-12: The main content area shall retain the current rendering logic for each content type (lesson plan, note editor, video card, vocab list, flashcard list, practice problem list, quiz section).
- FR-13: Teachers shall retain the ability to add, delete, and reorder assignments from the left sidebar, replacing the current `LearningResourceNav` add/delete/move controls.
- FR-14: On smaller screens, the left sidebar and right aside shall collapse or become accessible via toggle, following the existing responsive patterns used by `UnitLessonSidebar` and `PracticeResourceSidebar`.

### Non-Functional Requirements

- NFR-01: The layout transition shall not introduce additional API calls beyond what the page currently makes, except for fetching units for the dropdown and the new optional/required field on resources and tools.
- NFR-02: The right aside (Student Materials) shall auto-save student notes with the same debounce behavior currently used by `StudentNotePanel`.
- NFR-03: The assignment list shall render without layout shift when switching between lessons within the same unit.

## Systems-Level Architecture

### Components Involved

**Existing components to modify:**
- `LessonDetailPage` — restructure from three-column (sidebar + tabs/content + practice sidebar) to three-column (enhanced sidebar + content + student materials aside)
- `UnitLessonSidebar` — extend with unit dropdown and assignment list, or split into sub-components
- `StudentNotePanel` — refactor from floating overlay to inline panel within the right aside
- `LearningResourceNav` — remove or repurpose; its responsibilities move into the sidebar assignment list
- `PracticeResourceSidebar` and `PracticeResourceMobileBar` — remove; flashcards and practice problems join the unified assignment list

**Existing components unchanged (rendered in main content area):**
- `LessonPlanView`, `NoteEditor`, `VideoCard`, `VideoForm`, `VocabList`, `FlashCardList`, `PracticeProblemList`, `QuizSection`, `TestSection`

**New components (likely needed):**
- An assignment list component within the sidebar that renders the ordered list of all lesson content items with completion state, optional/required badges, and locked quiz indicator
- A unit dropdown/selector component
- A right aside wrapper component titled "Student Materials"

### Data Model Changes

- `LessonResource` needs a new boolean field to indicate whether the resource is required or optional. Default value: required (true).
- `LessonTool` needs the same boolean field to indicate required or optional. Default value: required (true).
- The lesson completion evaluation logic on the server must be updated to consider only required resources and tools (plus the quiz) when determining whether a lesson is complete.

### API Changes

- A new endpoint or modification to existing resource/tool endpoints to allow teachers to update the required/optional status of a resource or tool.
- The existing units list endpoint (GET `/api/courses/:courseId/units`) is already available and will be used by the unit dropdown; no new endpoint needed for that.
- The existing resource completions endpoint may need adjustment to return which resources are required vs. optional, so the client can determine quiz unlock state.
- The lesson completion endpoint (POST `/api/lessons/:lessonId/complete`) logic must be updated to check only required assignments.

### Data Flow

1. When the Lesson Detail Page loads, it fetches the current lesson, all units in the course, all lessons in the current unit, all resources, all tools, resource completions, and unit progress (the units list is a new addition to the existing data fetch).
2. The left sidebar renders the unit dropdown (populated from the units list), the lesson list for the selected unit, and the assignment list for the active lesson. The assignment list merges resources and tools into a single ordered sequence, each annotated with its completion state and required/optional status.
3. When a student clicks an assignment, the main content area renders the corresponding content component. The selected assignment is highlighted in the sidebar list.
4. When a student completes an assignment, the completion indicator updates in the sidebar. Once all required assignments are complete, the quiz item unlocks.
5. The right aside loads the student's personal note for the current lesson (or an empty editor) and auto-saves on changes with debounce. It hides during quiz-taking.
6. When a teacher toggles an assignment between required and optional, the change is persisted via an API call, and the sidebar updates to reflect the new status. The quiz lock state recalculates based on the updated required set.

### Integration Points

- **Authentication/Authorization**: The existing `authenticate` and `authorize` middleware protect resource and tool endpoints. The new required/optional toggle must be restricted to teacher and admin roles.
- **Resource completions**: The existing `resourceCompletionsApi` is used to track per-assignment completion. The quiz unlock logic currently checks `allResourcesComplete`; this must change to check only required resources and tools.
- **Lesson completion**: The existing `LessonCompletion` model and completion endpoints must incorporate the new required-only logic.
- **Progress**: The existing progress endpoints (`progressApi.getUnit`, `progressApi.getCourse`) derive from lesson completions, so they will automatically reflect the updated completion logic without changes.
- **Units API**: The existing `unitsApi.getAll(courseId)` call provides unit data for the dropdown. The lessons API (`lessonsApi.getAll(unitId)`) provides the first lesson ID for navigation on unit selection.

## Required Design Artifacts

- [x] Backend plan (`backend-plan.md`)
- [x] API contract (`api-contract.md`)
- [x] Frontend plan (`frontend-plan.md`)
- [x] UI wireframe (`wireframe.md`)
