---
id: cm-0025
title: Landing Page Card & How It Works Updates
stage: spec
status: approved
approver: human
approved_at: 2026-05-26T00:00:00Z
---

# Landing Page Card & How It Works Updates

## Problem Statement

The landing page has two areas that need visual and functional improvement. For signed-in users, the course card grid uses a basic layout without search, filtering, or rich metadata -- making it harder to scan and manage courses as the list grows. For signed-out users, the page jumps straight from the hero section to the footer with no supporting content that explains the platform's value proposition. Both gaps reduce the page's effectiveness as an entry point for new and returning users.

## Scope

### In Scope

- Redesigned course card component with subject-colored icon, three-dot action menu, two-line clamped description, category tag pill, and unit/lesson count footer
- Three-column responsive grid layout for course cards (single column on mobile, two on tablet, three on desktop)
- Search input and category filter pills above the course grid for client-side filtering
- Relocation of the "New Course" button into the section header area
- Mobile-specific horizontal card layout (icon left, content right)
- "How it works" section for signed-out users with three color-coded steps, connecting line, and CTA button
- Responsive behavior for the "How it works" section (horizontal row on desktop, vertical stack on mobile)
- All styling uses the existing design token system (no raw colors, no `dark:` prefix)

### Out of Scope

- Adding a `category` field to the Course data model or API -- category pills will use placeholder/hardcoded values derived client-side (e.g., based on course title keywords or a static mapping) until a formal category system is built
- Server-side search or filtering -- all filtering is client-side against the already-fetched course list
- Changes to the hero section (already completed in prior work)
- Changes to backend API endpoints -- no new routes or response shape changes
- Dark mode visual differences beyond what the design tokens already handle
- Pagination of the course list
- Course card click-through behavior changes (existing link to course detail page remains unchanged)

## Requirements

### Functional Requirements

- FR-01: The course grid must render in a responsive layout: one column below 768px, two columns at 768px--1023px, three columns at 1024px and above.
- FR-02: Each course card must display a subject-colored icon in the top-left area using one of the three accent color families (green-primary, blue-accent, orange-accent), assigned deterministically per course (e.g., based on a hash of the course ID or index position).
- FR-03: Each course card must display the course title, a two-line clamped description (truncated with ellipsis), a category tag pill, and a footer showing unit count and lesson count.
- FR-04: For teachers and admins, each course card must display a three-dot menu icon that reveals edit and delete actions (replacing the current inline icon buttons that appear on hover).
- FR-05: For students, the three-dot menu must not render on course cards.
- FR-06: A search input must appear above the course grid. Typing in the search input must filter the displayed courses by title (case-insensitive substring match), with results updating as the user types.
- FR-07: Category filter pills must appear above the course grid, including an "All" pill that is selected by default. Selecting a category pill filters the displayed courses to that category. The available categories are a static list defined in the frontend.
- FR-08: The search input and category filter pills must work together -- both filters apply simultaneously (intersection).
- FR-09: The "New Course" button (for teachers/admins) must appear in the section header row alongside the "My Courses" heading, not below the grid or in a separate area.
- FR-10: On viewports below 768px, each course card must switch to a horizontal row layout with the subject icon on the left side and the text content arranged beside it.
- FR-11: When the user is signed out, a "How it works" section must appear below the hero section.
- FR-12: The "How it works" section must display exactly three steps: "Build your course" (green accent), "Add learning tools" (blue accent), and "Track your progress" (orange accent).
- FR-13: Each step must display a large icon inside a color-coded container, a step number badge, a title, and a short description.
- FR-14: A subtle connecting line must visually link the three steps. On desktop (horizontal layout), the line runs horizontally between steps. On mobile (vertical layout), the line runs vertically along the left side.
- FR-15: A "Get started" CTA button must appear centered below the three steps, linking to the registration page.
- FR-16: The "How it works" section must not render when the user is signed in.
- FR-17: When search and category filters result in zero matching courses, an appropriate empty state message must be displayed (distinct from the "no courses yet" empty state).

### Non-Functional Requirements

- NFR-01: All colors in the new components must use design tokens from `index.css` (e.g., `bg-green-primary`, `text-blue-accent`, `bg-orange-surface`). No raw hex or Tailwind palette colors.
- NFR-02: The course card and "How it works" components must meet WCAG 2.1 AA contrast requirements. The orange accent color must only be used for large text or surface/surface-text pairings per the project's WCAG contrast notes.
- NFR-03: All interactive elements (three-dot menu, filter pills, search input, CTA button) must be keyboard accessible and have appropriate ARIA labels.
- NFR-04: The search filter must feel instantaneous -- no debounce delay is needed since filtering runs against an in-memory array.
- NFR-05: The three-dot menu must be dismissible by clicking outside or pressing Escape.
- NFR-06: Course card transitions and hover effects must use the project's existing transition patterns (e.g., `transition-all`, `shadow-warm-sm` to `shadow-warm-md`).

## Systems-Level Architecture

### Components Involved

**Existing components to modify:**

- `HomePage` (`client/src/features/home/HomePage.tsx`) -- add search/filter state, pass filtered courses to the grid, render the "How it works" section for signed-out users
- `CourseCard` (`client/src/features/courses/CourseCard.tsx`) -- redesign with subject icon, three-dot menu, category pill, unit/lesson counts, and responsive horizontal layout

**New components to create:**

- `HowItWorksSection` -- the three-step explanation section for signed-out users, rendered inside `HomePage`
- `CourseFilters` -- the search input and category filter pill bar, rendered above the course grid in `HomePage`
- `CourseCardMenu` -- the three-dot dropdown menu for course card actions (edit/delete)

**Existing shared components to use:**

- `Button` -- for the "Get started" CTA and "New Course" button
- `EmptyState` -- for the filtered-no-results state
- `LoadingSpinner` -- existing loading state
- `ErrorMessage` -- existing error state

### Data Model Changes

None. This is a purely frontend change. The Course model already includes `title`, `description`, and `_count.units`. Lesson counts are not currently returned by `GET /courses` but can be derived from the unit count or will use the unit count alone if lesson counts are unavailable. Category assignment is handled client-side with a static mapping.

### API Changes

None. All data needed is already provided by the existing `GET /courses` endpoint.

### Data Flow

1. `HomePage` fetches courses via `coursesApi.getAll()` on mount (existing behavior, unchanged).
2. User types in the search input or selects a category pill -- `HomePage` stores search text and selected category in local state.
3. `HomePage` derives a filtered course list by applying both the search substring match and category filter to the full course array.
4. The filtered list is rendered through the course card grid. If the filtered list is empty but the full list is not, a "no matches" empty state is shown.
5. For signed-out users, `HomePage` renders `HowItWorksSection` below the hero. The "Get started" button links to `/register`.

### Integration Points

- `useAuth()` from `AuthContext` -- determines signed-in/signed-out state for conditional rendering of the course grid vs. "How it works" section (existing pattern, unchanged).
- `useCanEdit()` hook -- determines whether the three-dot menu and "New Course" button render (existing pattern, unchanged).
- `coursesApi.getAll()` -- the sole data source for the course list (existing, unchanged).
- React Router `Link` -- used by the "Get started" CTA to navigate to `/register` (existing pattern).
- Design tokens from `client/src/index.css` -- `green-primary`, `blue-accent`, `orange-accent` and their surface/surface-text variants for the three-step color coding and course card icons.

## Required Design Artifacts

- [ ] Backend plan (`backend-plan.md`)
- [ ] API contract (`api-contract.md`)
- [x] Frontend plan (`frontend-plan.md`)
- [x] UI wireframe (`wireframe.md`)
