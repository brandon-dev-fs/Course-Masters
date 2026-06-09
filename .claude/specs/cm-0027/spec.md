---
id: cm-0027
title: Refactor Lesson Detail Page Layout and Navigation
stage: spec
status: approved
approver: human
approved_at: 2026-05-29T00:00:00Z
---

# Refactor Lesson Detail Page Layout and Navigation

## Problem Statement

The current LessonDetailPage layout has several UX issues that reduce usability as lessons grow in content. The horizontal assignment stepper becomes unwieldy with many items, the step labels are static and verbose, the left sidebar lacks a collapse mechanism, and the mobile experience uses a bottom tab bar with a "Saved" feature that does not exist. This refactor restructures the lesson page layout to improve navigation clarity, content density, and responsive behavior across desktop and mobile breakpoints.

## Scope

### In Scope

- Replacing the horizontal `AssignmentStepper` with a vertical step sidebar on desktop and a compact horizontal scroller on mobile
- Making step labels dynamic (single-word, derived from the activity types actually present in the lesson)
- Adding a collapse/expand toggle to the `UnitLessonSidebar` with state persisted in localStorage
- Removing the "Saved" tab from the mobile bottom tab bar
- Updating the mobile bottom tab bar to show only Notes, Cards, and Vocab (matching existing `StudentToolType` values: `notes`, `flashcards`, `vocab`)
- Preserving all existing teacher editing controls (settings gear, add assignment, reorder, edit, delete) within the new layout
- Maintaining all existing student interactions (completion toggling, quiz taking, tool access, navigation)
- Responsive behavior across desktop (1280px+), tablet (768px-1024px), and mobile (<640px) breakpoints

### Out of Scope

- "Review" step or any new step types not currently in the data model
- Bookmarks or "Saved" feature (removed entirely, not deferred)
- New API endpoints or data model changes (this is purely a frontend layout refactor)
- Changes to the `CourseDetailPage` or any other page
- Changes to the assessment flow (AssessmentSection, AssessmentTaker, etc.)
- Changes to the content rendering components (ActiveItemContent, LessonResourceContent, LessonToolContent, etc.)

## Requirements

### Functional Requirements

- FR-01: The horizontal `AssignmentStepper` on desktop must be replaced with a vertical step list rendered as a sidebar panel adjacent to the main content area.
- FR-02: On mobile (below the `lg` breakpoint), the step navigation must render as a compact horizontal scrollable row of icons, preserving the current mobile stepper behavior for step selection.
- FR-03: Step labels must be dynamic single-word labels derived from the activity type of each step (e.g., "Plan" for lessonPlan, "Notes" for note resources, "Video" for video resources, "Cards" for flash_card tools, "Quiz" for quiz, etc.). Labels must only appear for activity types that exist in the current lesson.
- FR-04: The `UnitLessonSidebar` must include a collapse/expand toggle button visible on desktop. When collapsed, the sidebar must hide its content and show only the toggle control (or a narrow icon strip). When expanded, it must display the full lesson list as it does today.
- FR-05: The collapsed/expanded state of the `UnitLessonSidebar` must persist across page navigations and browser sessions using localStorage.
- FR-06: The mobile bottom tab bar (StudentToolsBar in mobile mode) must not include a "Saved" tab. The available tabs must be limited to Notes, Cards (flash cards), and Vocab, matching the tool types that have existing content implementations.
- FR-07: All teacher editing controls must remain accessible in the new layout: the lesson settings gear button, the "Add assignment" action, reorder (move up/down) controls, edit and delete actions on assignments, and the lesson plan edit button.
- FR-08: Clicking a step in the vertical step sidebar (desktop) or horizontal step scroller (mobile) must set the active step and display the corresponding content in the main content area, exactly as the current stepper does.
- FR-09: Completion state indicators (completed checkmark, active highlight, locked icon for quiz) must be preserved on all step items in both desktop and mobile step navigation views.
- FR-10: The vertical step sidebar on desktop must show both an icon and the dynamic single-word label for each step. The mobile horizontal scroller must show only icons (with labels accessible via title/aria-label attributes).
- FR-11: When the UnitLessonSidebar is collapsed on desktop, the vertical step sidebar and main content area must expand to fill the reclaimed horizontal space.
- FR-12: The "Add assignment" button for teachers must be accessible from within the vertical step sidebar (desktop) or the horizontal step scroller area (mobile), consistent with its current placement in the AssignmentStepper.
- FR-13: The unit test navigation item currently in the UnitLessonSidebar must continue to function, switching the main content area to the unit test AssessmentSection view.
- FR-14: The practice problems tool type must be excluded from the mobile bottom tab bar. Only notes, flashcards, and vocab are shown.

### Non-Functional Requirements

- NFR-01: The sidebar collapse/expand transition must use CSS transitions for a smooth animation (no layout jumps or content flicker).
- NFR-02: All interactive elements in the new layout must meet WCAG 2.1 AA keyboard accessibility requirements (focusable, operable with Enter/Space, visible focus indicators).
- NFR-03: The vertical step sidebar must handle lessons with up to 20+ steps without layout overflow, using vertical scrolling within the sidebar when content exceeds the viewport height.
- NFR-04: The localStorage key for sidebar collapse state must be namespaced to avoid conflicts (e.g., `cm-sidebar-collapsed`).
- NFR-05: All new and modified components must use existing design tokens from `src/index.css` and follow the project's Tailwind CSS conventions (no raw color values, no `dark:` prefix).

## Systems-Level Architecture

### Components Involved

**Existing components to modify:**

- `LessonDetailPage` (`client/src/features/lessons/LessonDetailPage.tsx`) -- the page-level orchestrator. Layout structure changes to accommodate the new sidebar arrangement. The three-column layout (UnitLessonSidebar | content | StudentToolsBar) becomes a flexible multi-panel layout with the vertical step sidebar inserted between the UnitLessonSidebar and the main content area.
- `AssignmentStepper` (`client/src/features/lessons/AssignmentStepper.tsx`) -- currently a horizontal stepper bar. Must be refactored into a vertical sidebar layout on desktop and a compact horizontal icon row on mobile. The `StepperItem` interface and step icon logic will be preserved; the rendering template changes significantly.
- `UnitLessonSidebar` (`client/src/features/lessons/UnitLessonSidebar.tsx`) -- gains a collapse/expand toggle on desktop. Needs to accept and manage collapsed state, reading initial state from localStorage and writing changes back.
- `StudentToolsBar` (`client/src/features/student-notes/StudentToolsBar.tsx`) -- the mobile rendering mode must exclude the "practice" tool type from the bottom tab bar. The desktop vertical strip remains unchanged.

**Existing components unchanged (content renderers):**

- `ActiveItemContent`, `LessonResourceContent`, `LessonToolContent`, `LessonAssignmentContent`, `AssignmentSection`, `AssessmentSection` -- these render inside the main content area and are not affected by the layout refactor.

**Potential new components:**

- A step label utility or mapping constant that produces dynamic single-word labels from `StepperItem` kind/type fields. This could live within the refactored `AssignmentStepper` or be extracted as a utility if needed by multiple components.

### Data Model Changes

None. This is a frontend-only layout refactor. No new models, fields, or relationships are needed.

### API Changes

None. No new or modified endpoints. All data fetching remains unchanged.

### Data Flow

The data flow for the lesson page is unchanged. The refactor affects only how the already-fetched data is visually arranged:

1. `LessonDetailPage` mounts and fetches lesson data, resources, tools, and assignments via the existing hooks (`useLesson`, `useResources`, `useTools`, `useAssignments`).
2. The `assignmentItems` and `stepperItems` arrays are computed from the fetched data, exactly as they are today.
3. Instead of passing `stepperItems` to a horizontal `AssignmentStepper`, the page passes them to the refactored component which renders them vertically on desktop.
4. Step selection (`setActiveStepKey`) and content rendering (`ActiveItemContent`) continue to work through the same state and callback mechanism.
5. The UnitLessonSidebar reads its initial collapsed state from localStorage on mount and writes changes on toggle. The collapsed state is local to this component (or lifted to the page if needed for layout calculations).

### Integration Points

- **localStorage**: New integration for persisting sidebar collapse state. Read on component mount, write on toggle.
- **Existing hooks**: `useLesson`, `useResources`, `useTools`, `useAssignments` -- all continue to work unchanged. The refactored components consume the same data shapes.
- **StudentToolsBar**: The mobile mode filters `availableTools` to exclude `practice`. The `TOOL_META` constant and `StudentToolType` type remain unchanged; filtering happens at the render site or via a prop.
- **Design tokens**: All styling uses existing Tailwind utility classes derived from CSS custom properties in `src/index.css`.
- **React Router**: Navigation links within the UnitLessonSidebar continue to use `<Link>` components to navigate between lessons.

## Required Design Artifacts

Check all that apply for this feature:

- [ ] Backend plan (`backend-plan.md`)
- [ ] API contract (`api-contract.md`)
- [x] Frontend plan (`frontend-plan.md`)
- [x] UI wireframe (`wireframe.md`)
