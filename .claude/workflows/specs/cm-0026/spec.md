---
id: cm-0026
title: Redesign Course Detail Page with Vertical Roadmap Layout
stage: spec
status: approved
approver: human
approved_at: 2026-05-27T00:00:00Z
---

# Redesign Course Detail Page with Vertical Roadmap Layout

## Problem Statement

The current Course Detail page uses a horizontal scrolling card strip to display units, which becomes unwieldy as course size grows and does not communicate progression or student status effectively. The layout lacks a dedicated progress summary and quick actions sidebar, forcing students to navigate away from the page to access common workflows like reviewing flash cards or checking their completion status. A vertical roadmap layout with clear visual states (completed, in-progress, locked) and an always-visible progress sidebar will improve wayfinding, motivation, and task resumption.

## Scope

### In Scope

- Replacing the CourseHero header with a compact course header showing icon, title, description, teacher name, and metadata (unit count, lesson count, estimated time) in a single row
- Removing the standalone "Start Learning" / "Continue Learning" CTA button from the header (the CTA moves to the active unit card)
- Replacing the horizontal UnitCardStrip with a vertical roadmap timeline layout
- Implementing three visual states for unit cards on the roadmap: completed (green), in-progress (blue), and locked (dimmed)
- Displaying lesson names with completion checkmarks inside each unit card
- Showing flash card and practice problem counts on each unit card
- Adding an "Up next" badge and "Continue lesson" button on the active (in-progress) unit card
- Adding a right sidebar with a Course Progress card (percentage, progress bar, breakdown stats) and a Quick Actions card (review flash cards, view syllabus, calendar)
- Displaying the Final Exam as a locked item at the bottom of the roadmap with a trophy indicator and "Complete all units to unlock" messaging
- Showing "Complete all lessons to unlock the unit test" text on unit test rows within each unit card
- Mobile responsive layout: sidebar content collapses above the roadmap as a compact progress bar with inline quick action buttons
- Preserving all existing teacher/admin edit functionality (course settings, unit settings, syllabus modals)

### Out of Scope

- Backend API changes (all required data is already available from existing endpoints)
- Changes to the LessonDetailPage or any other page
- New API endpoints or modifications to existing response shapes
- Changes to the data model or Prisma schema
- Flash card review flow (the quick action link navigates to the first unit's first lesson for now)
- Calendar functionality changes (the existing CalendarModal is reused)
- Course enrollment or access control changes
- Progress calculation logic changes (the existing server-side progress calculation is unchanged)

## Requirements

### Functional Requirements

- FR-01: The course header displays the course title, description, teacher name (from `course.author.name`), unit count (from `course.units.length`), lesson count (sum of lessons across units), and an estimated time value in a single compact row, replacing the current CourseHero component.
- FR-02: The course header displays a course icon to the left of the title. The icon is consistent with the category-matched icon used on course cards on the home page.
- FR-03: The course header no longer renders a "Start Learning" or "Continue Learning" CTA button. The primary CTA is relocated to the in-progress unit card.
- FR-04: The course header retains the course settings gear icon (visible to teachers/admins only) and the calendar button.
- FR-05: Units are rendered as a vertical timeline on the left side of the page. Each unit is a card connected to the next by a vertical line segment. Units are sorted by their `order` field in ascending order.
- FR-06: Each unit card on the timeline has a circular indicator dot on the vertical line. The dot's visual treatment varies by unit state: green with a check icon for completed, blue filled for in-progress, and a lock icon with dimmed appearance for locked.
- FR-07: A unit is considered "completed" when `unitProgress.isComplete === true`. A unit is considered "in-progress" when it is the first unit in order that is not complete. All units after the in-progress unit are considered "locked."
- FR-08: Locked unit cards are rendered at 60% opacity to visually communicate inaccessibility.
- FR-09: Each unit card displays its lesson names as a list. Completed lessons show a green checkmark icon. Incomplete lessons show an empty circle or no icon.
- FR-10: Each unit card displays counts for flash cards and practice problems available within that unit's lessons. These counts are derived from the existing data fetched for the unit's lessons and tools.
- FR-11: The in-progress unit card highlights the next incomplete lesson with an "Up next" badge and renders a prominent "Continue lesson" button that links to that lesson's detail page.
- FR-12: The in-progress unit card has a visually distinct border or highlight (blue accent) to differentiate it from completed and locked cards.
- FR-13: Clicking a lesson name within a completed or in-progress unit card navigates to that lesson's detail page (`/courses/:courseId/units/:unitId/lessons/:lessonId`).
- FR-14: Lesson names within locked unit cards are not clickable.
- FR-15: The Final Exam is displayed as the last item on the vertical roadmap, below all unit cards, with a trophy indicator icon.
- FR-16: When not all units are complete, the Final Exam item shows a lock icon and the text "Complete all units to unlock." It is rendered at 60% opacity.
- FR-17: When all units are complete, the Final Exam item becomes active (full opacity) and links to the course exam.
- FR-18: Each unit card's unit test row displays "Complete all lessons to unlock the unit test" when not all lessons in that unit are complete, replacing the current generic "Unit test locked" text.
- FR-19: A right sidebar (~260px wide) is displayed on desktop viewports. It contains two cards stacked vertically: a Course Progress card and a Quick Actions card.
- FR-20: The Course Progress card displays the overall course completion percentage as a large number, a visual progress bar, and breakdown stats: lessons completed (e.g., "3/4 lessons"), flash cards reviewed count, and unit tests completed count. All data comes from the existing `CourseProgress` response.
- FR-21: The Quick Actions card displays three action links: "Review flash cards" (navigates to the first available lesson with flash cards), "View syllabus" (opens the existing SyllabusViewModal), and "Calendar" (opens the existing CalendarModal).
- FR-22: On viewports narrower than the `md` breakpoint (768px), the sidebar content renders above the roadmap as a compact horizontal bar showing the progress percentage, a slim progress bar, and inline quick action buttons (flash cards, syllabus).
- FR-23: The page continues to fetch data from the same three endpoints: `GET /courses/:courseId`, `GET /courses/:courseId/progress`, and `coursesApi.getAll()` for the course dropdown.
- FR-24: All existing modal functionality is preserved: CourseSettingsModal, SyllabusViewModal, SyllabusEditModal, UnitSettingsModal, and CalendarModal.
- FR-25: Teachers and admins continue to see the "+ Add Unit" button and course settings controls. These controls integrate into the new layout without disrupting the student view.
- FR-26: The empty state (no units) continues to display the existing EmptyState component with appropriate messaging.
- FR-27: Loading and error states continue to use LoadingSpinner and ErrorMessage components respectively.

### Non-Functional Requirements

- NFR-01: The page must render the roadmap and sidebar within 200ms of data availability (no additional API calls beyond the existing three parallel fetches).
- NFR-02: All text meets WCAG 2.1 AA contrast requirements using the project's design tokens. No raw color values are used.
- NFR-03: The vertical timeline and all interactive elements are keyboard-accessible. Unit cards and lesson links are reachable via Tab and activatable via Enter.
- NFR-04: The roadmap layout is responsive across three breakpoints: desktop (1280px+), tablet (768px-1024px), and mobile (<640px). The sidebar collapses to an inline bar below 768px.
- NFR-05: All theming uses CSS custom properties from the design token system. No `dark:` Tailwind prefix is used.
- NFR-06: Screen readers can navigate the unit progression via semantic landmarks. The timeline uses an ordered list (`<ol>`) for the unit sequence. Progress values use `aria-valuenow`, `aria-valuemin`, and `aria-valuemax` on the progress bar.

## Systems-Level Architecture

### Components Involved

**Existing components to modify:**

- `CourseDetailPage.tsx` (`client/src/features/courses/`) — Page orchestrator. Will be restructured to use a two-column layout (roadmap + sidebar) instead of the current single-column with CourseHero + UnitCardStrip.

**Existing components to replace or retire:**

- `CourseHero.tsx` (`client/src/features/courses/`) — Replaced by a new compact CourseHeader component.
- `UnitCardStrip.tsx` (`client/src/features/units/`) — Replaced by a new vertical UnitRoadmap component.
- `UnitCard.tsx` (`client/src/features/units/`) — Replaced by a new RoadmapUnitCard component with timeline integration and three visual states.

**New components to create:**

- `CourseHeader` (`client/src/features/courses/`) — Compact header with icon, title, description, teacher name, metadata row.
- `UnitRoadmap` (`client/src/features/courses/`) — Vertical timeline container that renders unit cards connected by vertical line segments, plus the Final Exam item at the bottom.
- `RoadmapUnitCard` (`client/src/features/courses/`) — Individual unit card for the roadmap, displaying lessons, tool counts, unit test status, and the "Continue lesson" CTA for the active unit.
- `CourseProgressSidebar` (`client/src/features/courses/`) — Right sidebar containing the progress card and quick actions card.
- `MobileProgressBar` (`client/src/features/courses/`) — Compact progress bar with inline quick actions for mobile viewports.

**Existing components reused without modification:**

- `CourseSettingsModal`, `SyllabusViewModal`, `SyllabusEditModal`, `CalendarModal` (all in `client/src/features/courses/`)
- `UnitSettingsModal` (`client/src/features/units/`)
- `CourseDropdown` (`client/src/features/courses/`) — May be integrated into the new header
- `LessonStatusIcon` (`client/src/components/`)
- `LoadingSpinner`, `ErrorMessage`, `EmptyState`, `Button` (`client/src/components/`)
- `ExamCard` (`client/src/features/exams/`) — May be replaced by inline Final Exam rendering within UnitRoadmap, or adapted

**Existing shared components referenced:**

- `ProgressBar` (`client/src/features/progress/`) — Reused in the sidebar progress card and mobile progress bar

### Data Model Changes

None. This is a frontend-only change. All required data is available from existing API responses.

### API Changes

None. The page continues to use the same three existing API calls:

1. `GET /courses/:courseId` — course details with units and lessons included
2. `GET /courses/:courseId/progress` — progress data with per-unit and per-lesson breakdowns
3. `coursesApi.getAll()` — for the course dropdown

Flash card and practice problem counts per unit will be derived from the existing data. If the current `GET /courses/:courseId` response does not include tool counts at the unit level, these counts may need to be fetched separately or computed from available lesson-level data. This is a data derivation concern handled in the frontend, not an API change.

### Data Flow

1. The page loads and fires three parallel API calls (same as current behavior): course details, course progress, and all courses for the dropdown.
2. The CourseHeader receives the course object and renders the compact header with metadata computed from the course's units and lessons arrays.
3. The UnitRoadmap receives the sorted units array and the progress data. It determines each unit's state (completed, in-progress, locked) by iterating units in order: all units before the first incomplete one are "completed" (if their `unitProgress.isComplete` is true), the first incomplete unit is "in-progress," and all subsequent units are "locked."
4. Each RoadmapUnitCard receives its unit data, progress entry, and state designation. The in-progress card identifies the next incomplete lesson by finding the first lesson whose `quizPassed` is false (or not attempted) in the unit's lesson progress array.
5. The CourseProgressSidebar receives the CourseProgress object and renders the percentage, progress bar, and breakdown stats directly from its fields.
6. Quick action handlers reuse existing disclosure hooks for the syllabus and calendar modals. The "Review flash cards" action computes a navigation target from the course and progress data.
7. On mobile, the MobileProgressBar renders the same progress data in a compact horizontal format, and quick action buttons trigger the same modal/navigation handlers.

### Integration Points

- **Authentication**: The page is wrapped in `RequireAuth` via the route definition in `App.tsx`. No changes needed.
- **Authorization**: `useCanEdit()` hook continues to gate teacher/admin UI (settings, add unit). No changes needed.
- **Data fetching**: `useFetch` hook with the existing three-call pattern. No changes to the fetch layer.
- **Navigation**: `react-router-dom` `Link` components for lesson navigation, `useNavigate` for programmatic navigation. Same patterns as current implementation.
- **Modals**: All five existing modals (CourseSettings, SyllabusView, SyllabusEdit, UnitSettings, Calendar) are retained with their current `useDisclosure` hook pattern.
- **Icons**: `lucide-react` icons for check, lock, trophy, and other visual indicators. Consistent with the rest of the application.
- **Design tokens**: All colors reference CSS custom properties via Tailwind utilities (`bg-primary`, `text-accent`, `border-border`, `bg-green-primary`, `text-green-primary`, `bg-blue-accent`, etc.).
- **Existing progress components**: `ProgressBar` from `client/src/features/progress/` is reused in the sidebar.

## Required Design Artifacts

- [x] Frontend plan (`frontend-plan.md`)
- [x] UI wireframe (`wireframe.md`)
- [ ] Backend plan (`backend-plan.md`)
- [ ] API contract (`api-contract.md`)
