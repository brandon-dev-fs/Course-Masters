---
id: cm-0033
title: Course Builder — Single-Page Outline Editor
stage: spec
status: approved
---

# Course Builder — Single-Page Outline Editor

## Problem Statement

Teachers currently share the same `CourseDetailPage` view with students and must navigate between multiple pages to build out a course's hierarchy (units, lessons, activities). This creates a fragmented authoring experience where teachers constantly route back and forth between the course page, individual lesson pages, and various activity forms. A dedicated single-page builder that displays the entire course structure as a collapsible outline tree would let teachers see and manage the full hierarchy without leaving the page.

## Proposed Solution

Introduce a new `/courses/:courseId/builder` route that renders a single-page outline editor exclusively for teachers (and admins). The builder displays the full course hierarchy as a collapsible tree: units at the top level, lessons nested within units, and activities nested within lessons. Each level supports inline rename, delete, drag-and-drop reordering, and creation of new items. A right sidebar shows course metadata and teacher quick actions on desktop, while mobile collapses to a single-column view with overflow menus. When a teacher clicks a course from the home page, they navigate to the builder; students continue to navigate to the existing `CourseDetailPage` at `/courses/:courseId`.

## Scope

### In Scope

- New client route `/courses/:courseId/builder` rendering a `CourseBuilderPage` component
- Role-based routing: teachers and admins navigate to the builder from the home page; students navigate to the existing course detail page
- Collapsible outline tree with three levels: units, lessons, and activities (resources, tools, assignments)
- Drag-and-drop reordering of units, lessons, and activities with order persistence
- Inline rename for units and lessons via the three-dot menu
- Delete actions for units, lessons, and activities via the three-dot menu with confirmation dialogs
- Creation of new units, lessons, and activities via inline add buttons
- Activity type pills (colored badges indicating Note, Video, Vocab, Practice Problem, External Link)
- Auto-created assessment rows: lesson quiz at the bottom of each lesson, unit test at the bottom of each unit, course exam at the bottom of the course outline — all visually dimmed and non-deletable, with question count badges and edit buttons
- Right sidebar on desktop showing course metadata (category, unit/lesson/activity counts, student enrollment count) and teacher quick actions (placeholders for calendar, syllabus, manage students, course settings)
- Top bar with breadcrumb navigation, course title, and a "Preview as student" button that navigates to `/courses/:courseId`
- Mobile-responsive layout: sidebar content moves to a top-bar overflow menu, drag handles are removed and reordering moves into item context menus
- New backend endpoint for batch reordering of units within a course
- New backend endpoint for batch reordering of lessons within a unit
- New backend endpoint for batch reordering of resources within a lesson
- New backend endpoint for batch reordering of tools within a lesson
- New backend endpoint to fetch the full course outline tree (units with lessons with activity counts and assessment metadata) in a single request

### Out of Scope

- Activity content editors (slide-out panels for editing note content, video URLs, vocab terms, practice problem questions) — these are the next layer to design in a follow-up spec
- Assessment question editor integration within the builder — the existing assessment editor flow is reused via navigation or modal, but no new assessment editing UI is designed here
- Duplicate action in the three-dot menu — deferred to a future spec due to the complexity of deep-cloning hierarchical content
- Course publishing or draft/published status workflow
- Student enrollment management UI (the sidebar shows a placeholder for "Manage Students")
- Calendar, syllabus generation, and course settings features (sidebar shows placeholders only)
- Bulk import/export of course content
- Undo/redo for outline operations
- Real-time collaboration (multiple teachers editing simultaneously)

## User Stories

- US-01: As a teacher, I want to see the entire structure of my course on a single page so that I can understand and manage the content hierarchy without navigating between pages.
- US-02: As a teacher, I want to expand and collapse units and lessons so that I can focus on the section I am currently editing.
- US-03: As a teacher, I want to drag and drop units, lessons, and activities to reorder them so that I can organize my course content intuitively.
- US-04: As a teacher, I want to add a new unit, lesson, or activity from inline buttons so that I can build out the course without opening separate forms or pages.
- US-05: As a teacher, I want to rename a unit or lesson from a context menu so that I can quickly fix titles without opening a full edit form.
- US-06: As a teacher, I want to delete a unit, lesson, or activity from a context menu with a confirmation step so that I can remove content safely.
- US-07: As a teacher, I want to see which activities are auto-created (lesson quiz, unit test, course exam) and visually distinguish them from teacher-created activities so that I know which items I cannot remove.
- US-08: As a teacher, I want to see activity counts on each unit and lesson so that I can gauge the size and completeness of each section at a glance.
- US-09: As a teacher, I want to preview my course as a student so that I can verify how the content looks from the learner's perspective.
- US-10: As a teacher on a mobile device, I want to use the builder without drag handles, with reordering available through context menus, so that the interface remains usable on touch screens.
- US-11: As a student, I want to continue navigating to the existing course detail page when I click a course so that my experience is unaffected by the new builder.

## Requirements

### Functional Requirements

- FR-01: The system must register a new client route at `/courses/:courseId/builder` that renders the `CourseBuilderPage` component, wrapped in `RequireAuth` and restricted to users with the `teacher` or `admin` role.
- FR-02: When a teacher or admin clicks a course from the home page course list, the application must navigate to `/courses/:courseId/builder` instead of `/courses/:courseId`.
- FR-03: When a student clicks a course from the home page course list, the application must navigate to `/courses/:courseId` (the existing `CourseDetailPage`).
- FR-04: The builder page must fetch the complete course outline (all units, their lessons, and per-lesson activity summaries) in a single API request on mount.
- FR-05: Units must be displayed as collapsible top-level rows in the outline tree, sorted by their `order` field. Each unit row must show a drag handle (desktop only), an expand/collapse chevron, the unit name, a lesson count badge, and a three-dot context menu.
- FR-06: Lessons must be displayed as collapsible rows nested under their parent unit when the unit is expanded, sorted by their `order` field. Each lesson row must show a drag handle (desktop only), an expand/collapse chevron, the lesson name, an activity count badge, and a three-dot context menu.
- FR-07: Activities (resources, tools, and assignments) must be displayed as compact rows nested under their parent lesson when the lesson is expanded, sorted by their `order` field within each category. Each activity row must show a drag handle (desktop only), a colored type pill, the activity title, and an edit button.
- FR-08: The activity type pill must use the following color mapping: Note = blue (`blue-surface` / `blue-surface-text`), Video = orange (`orange-surface` / `orange-surface-text`), Vocab = green (`green-surface` / `green-surface-text`), Practice Problem = purple (a new surface token or an appropriate existing token), External Link = default neutral styling.
- FR-09: The lesson plan (first resource of type `lecture` if it exists) must appear as the first item when a lesson is expanded, visually dimmed with an "auto" label. It must not be deletable or reorderable, but must have an edit button.
- FR-10: The lesson quiz assessment must appear as the last item when a lesson is expanded, visually dimmed with an "auto" label and a question count badge. It must not be deletable or reorderable, but must have an edit button.
- FR-11: The unit test assessment must appear as the last item when a unit is expanded (below all lessons), visually dimmed with an "auto" label and a question count badge. It must not be deletable or reorderable, but must have an edit button.
- FR-12: The course exam assessment must appear as the last item in the entire outline tree, visually dimmed with an "auto" label and a question count badge. It must not be deletable or reorderable, but must have an edit button.
- FR-13: An "Add activity" button with a dashed border must appear within each expanded lesson, positioned between the last teacher-created activity and the lesson quiz. Clicking it must open a dropdown or popover listing the available activity types (Note, Video, Vocab, Practice Problem).
- FR-14: An "Add lesson" button must appear at the bottom of each expanded unit's lesson list (before the unit test row). Clicking it must create a new lesson with a default name and the next available order value.
- FR-15: An "Add unit" button must appear at the bottom of the unit list (before the course exam row). Clicking it must create a new unit with a default name and the next available order value.
- FR-16: Drag-and-drop reordering of units must update the `order` field of all affected units within the course via a batch reorder API call. Reordering must be optimistic with rollback on failure.
- FR-17: Drag-and-drop reordering of lessons must update the `order` field of all affected lessons within the same unit via a batch reorder API call. Lessons must not be draggable between units.
- FR-18: Drag-and-drop reordering of activities must update the `order` field of all affected items within the same lesson via the appropriate batch reorder API call. Activities must not be draggable between lessons. Auto-created items (lesson plan, lesson quiz) must not be draggable.
- FR-19: The three-dot context menu on units must offer: Rename, Delete. The Rename action must allow inline editing of the unit title. The Delete action must show a `ConfirmDialog` warning that all child lessons and activities will be deleted.
- FR-20: The three-dot context menu on lessons must offer: Rename, Delete. The Rename action must allow inline editing of the lesson title. The Delete action must show a `ConfirmDialog` warning that all child activities will be deleted.
- FR-21: The three-dot context menu on activities must offer: Delete. The Delete action must show a `ConfirmDialog`.
- FR-22: On viewports below the `md` breakpoint (768px), drag handles must be hidden and the three-dot context menu must include "Move up" and "Move down" options for reordering.
- FR-23: The right sidebar must display on desktop (above `lg` breakpoint) and show: course title, category (if set), unit count, lesson count, total activity count, and enrolled student count. Below these, a "Quick Actions" section must show placeholder buttons for Calendar, Syllabus, Manage Students, and Course Settings.
- FR-24: On viewports below the `lg` breakpoint, the sidebar content must be accessible from a three-dot overflow menu in the top bar.
- FR-25: The top bar must display a breadcrumb (Home > Course Name), the course title, and a "Preview as student" button. Clicking "Preview as student" must navigate to `/courses/:courseId`.
- FR-26: The server must expose a new endpoint to fetch the full course outline tree optimized for the builder, returning units with their lessons and per-lesson activity summaries (counts by type, assessment question counts) in a single response.
- FR-27: The server must expose batch reorder endpoints for units (`PUT /courses/:courseId/units/reorder`), lessons (`PUT /units/:unitId/lessons/reorder`), resources (`PUT /lessons/:lessonId/resources/reorder`), and tools (`PUT /lessons/:lessonId/tools/reorder`). Each endpoint must accept an array of `{ id, order }` pairs and update all specified records in a single transaction.
- FR-28: Clicking the edit button on an auto-created assessment (lesson quiz, unit test, course exam) must navigate to the assessment's existing edit flow or open the existing `AssessmentForm` in a modal. The specific interaction pattern is determined during design.
- FR-29: Clicking the edit button on a teacher-created activity must be a no-op placeholder in this spec (activity editors are out of scope). The button must be present but may show a "Coming soon" tooltip or be visually indicated as not yet functional.
- FR-30: All outline tree state (which units and lessons are expanded/collapsed) must be maintained in component state and preserved during reordering, adding, and deleting operations within the same page session.

### Non-Functional Requirements

- NFR-01: The full course outline tree endpoint must return the complete hierarchy in a single database query (or a bounded number of queries using `include`) to avoid N+1 performance issues for courses with many units and lessons.
- NFR-02: Drag-and-drop interactions must feel responsive with optimistic UI updates. The reorder API call must complete within 500ms for typical course sizes (up to 20 units, 10 lessons per unit).
- NFR-03: The builder page must be keyboard-accessible: all interactive elements (chevrons, context menus, add buttons, edit buttons) must be focusable and operable via keyboard. Drag-and-drop is not required to work via keyboard in this iteration.
- NFR-04: The outline tree must handle courses with up to 20 units, each containing up to 15 lessons, each containing up to 20 activities, without noticeable rendering lag.
- NFR-05: All new UI must use design tokens from `index.css` and follow the project's Tailwind CSS conventions (no raw colors, no `dark:` prefix).
- NFR-06: The builder must be usable on mobile viewports (down to 320px width) with the adapted layout described in the functional requirements.

## Systems-Level Architecture

### Components Involved

**New components (client):**
- `CourseBuilderPage` — top-level page component at `/courses/:courseId/builder`. Fetches the outline tree, manages expand/collapse state, renders the top bar, outline tree, and sidebar.
- `BuilderTopBar` — breadcrumb, course title, "Preview as student" button, mobile overflow menu.
- `OutlineTree` — renders the collapsible tree of units, lessons, and activities.
- `UnitRow` — a single unit row with drag handle, chevron, name, badge, context menu.
- `LessonRow` — a single lesson row with drag handle, chevron, name, badge, context menu.
- `ActivityRow` — a single activity row with drag handle, type pill, name, edit button.
- `AssessmentRow` — a dimmed row for auto-created assessments with question count and edit button.
- `ActivityTypePill` — colored badge component for activity type labels.
- `BuilderSidebar` — course metadata and quick action placeholders.
- `InlineRenameInput` — inline text input that replaces a name on rename action.
- `AddItemButton` — dashed-border button for adding units, lessons, or activities.
- `ActivityTypeMenu` — dropdown/popover listing available activity types when adding an activity.

**Existing components that will be modified:**
- `CourseCard` (in `features/courses/`) — navigation target must change based on user role (builder for teachers, detail page for students).
- `App.tsx` — new route registration for `/courses/:courseId/builder`.

**New API module (client):**
- Functions in `src/api/courses.ts` or a new `src/api/builder.ts` for the outline tree fetch and batch reorder calls.

**New routes/services (server):**
- Outline tree endpoint in the course router or a dedicated builder router.
- Batch reorder endpoints for units, lessons, resources, and tools.

### Data Model Changes

No new models, fields, or relationships are needed. The builder uses existing models: `Course`, `Unit`, `Lesson`, `LessonResource`, `LessonTool`, `Assignment`, and `Assessment`. All have existing `order` fields. The only backend additions are new API endpoints for batch reordering and the outline tree query.

### API Changes

- `GET /courses/:courseId/builder` — new endpoint returning the full course outline tree with units, lessons, and per-lesson activity summaries (type, title, order, id) plus assessment metadata (question count). This is a read-only endpoint for the builder's initial data load.
- `PUT /courses/:courseId/units/reorder` — new endpoint accepting `{ items: [{ id, order }] }` to batch-update unit order within a course.
- `PUT /units/:unitId/lessons/reorder` — new endpoint accepting `{ items: [{ id, order }] }` to batch-update lesson order within a unit.
- `PUT /lessons/:lessonId/resources/reorder` — new endpoint accepting `{ items: [{ id, order }] }` to batch-update resource order within a lesson.
- `PUT /lessons/:lessonId/tools/reorder` — new endpoint accepting `{ items: [{ id, order }] }` to batch-update tool order within a lesson.

The existing assignment reorder endpoint (`PUT /lessons/:lessonId/assignments/reorder`) already exists and will be reused.

### Data Flow

1. Teacher navigates to a course from the home page. The `CourseCard` component checks `user.role` and navigates to `/courses/:courseId/builder` for teachers/admins.
2. `CourseBuilderPage` mounts and calls `GET /api/courses/:courseId/builder` to fetch the full outline tree.
3. The server queries the course with nested includes: units (with lessons, and per-lesson resources, tools, assignments, and assessments) filtered by `deletedAt: null` and ordered by `order`.
4. The response is stored in page-level state. The outline tree renders with all units collapsed by default.
5. The teacher expands a unit by clicking its chevron. The lessons within that unit are revealed from the already-fetched data (no additional API call).
6. The teacher expands a lesson. Activities within that lesson are revealed from the already-fetched data.
7. For reordering: the teacher drags a unit to a new position. The UI optimistically updates the order. A `PUT /api/courses/:courseId/units/reorder` call sends the new order mapping. On failure, the UI rolls back to the previous order.
8. For adding: the teacher clicks "Add unit." A `POST /api/courses/:courseId/units` call creates the unit. On success, the new unit is appended to the tree and the tree state is updated.
9. For renaming: the teacher selects "Rename" from the context menu. An `InlineRenameInput` replaces the name text. On blur or Enter, a `PUT /api/courses/:courseId/units/:unitId` call updates the name.
10. For deleting: the teacher selects "Delete" from the context menu. A `ConfirmDialog` appears. On confirmation, the appropriate `DELETE` endpoint is called and the item is removed from the tree.

### Integration Points

- **Authentication**: the builder route requires `authenticate()` middleware (already applied to all `/api` routes). The client route is wrapped in `RequireAuth`.
- **Authorization**: the builder endpoint and reorder endpoints require `authorize('teacher', 'admin')` and `requireCourseOwnership()` middleware, following the same pattern as existing unit/lesson write routes.
- **Existing CRUD endpoints**: the builder reuses existing `POST`, `PUT`, and `DELETE` endpoints for units, lessons, resources, tools, and assignments. No changes to those endpoints are needed.
- **Existing assessment endpoints**: the builder displays assessment metadata (question count) from the outline tree query. Edit buttons use the existing assessment flow.
- **`useCanEdit` hook**: used to determine role-based navigation from `CourseCard`.
- **`useAuth` context**: used to check `user.role` for routing decisions.
- **`ConfirmDialog` component**: reused for all delete confirmations.
- **Design tokens**: all new components use tokens from `index.css`. A purple surface token may need to be added for Practice Problem pills if no suitable token exists.

## Required Design Artifacts

- [x] Frontend plan (`frontend-plan.md`)
- [x] Backend plan (`backend-plan.md`)
- [x] API contract (`api-contract.md`)
- [x] UI wireframe (`wireframe.md`)

## Open Questions

- OQ-01: Should the purple color for Practice Problem type pills use an existing token or require a new design token pair (purple-surface / purple-surface-text)? The current design token set does not include a purple semantic color.
- OQ-02: Should the "Add activity" flow create the activity immediately with default content (like "Add unit" and "Add lesson"), or should it open a minimal creation form inline? This affects whether activity editors are partially in scope.
- OQ-03: When adding a lesson, should a lesson quiz assessment be auto-created along with the lesson, or should it only be created when the teacher explicitly adds quiz questions? The current system creates assessments on demand via `POST /lessons/:lessonId/assessment`.
