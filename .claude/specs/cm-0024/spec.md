---
id: cm-0024
title: Home page UI polish — color migration, mobile nav, hero transition, card definition
stage: spec
status: approved
approver: human
approved_at: 2026-05-22T00:00:00Z
---

# Home Page UI Polish

## Problem Statement

The home/landing page has several visual inconsistencies and missing responsive behaviors. Hardcoded old green values (`#22c55e`, `green-500`, `green-600`) bypass the design token system, the navbar lacks a mobile-friendly layout, the light-mode navbar clashes visually when overlaying the dark hero section, and signed-in course cards blend into the white page background in light mode due to insufficient contrast. These issues degrade the visual polish and usability of the most prominent page in the application.

## Scope

### In Scope

- Replacing all remaining hardcoded green color values (`bg-green-500`, `text-green-500`, `text-green-600`, `bg-green-500/10`, `bg-green-500/20`) with the appropriate design system tokens across the entire client codebase
- Updating the `--success` token in the dark theme from `#22c55e` to a value consistent with the design system (likely `#16a34a` to match light, or the named `--green-primary` token)
- Adding a mobile hamburger menu to the `Layout` navbar that collapses all nav items (Sign In, Sign Up, dark mode toggle, user links, logout) into a slide-out drawer at mobile breakpoints
- Making the navbar background transparent or dark-tinted when overlaying the dark hero section on the guest landing page in light mode, with a transition back to the standard opaque background on scroll or on non-hero pages
- Increasing card definition on the signed-in `HomePage` course list by applying the `#F9FAFB` surface background with a visible `#E5E7EB` border so cards do not blend into the white page background in light mode

### Out of Scope

- Backend changes of any kind
- Changes to pages other than the home/landing page layout (though token replacements apply globally wherever hardcoded greens exist)
- Adding new design tokens to `index.css` (the existing token set already covers all needed values)
- Changes to the `SolarSystemSvg` illustration (excluded from token requirements per project rules)
- Redesigning the hero section layout or content
- Adding new navigation destinations or restructuring the route hierarchy

## Requirements

### Functional Requirements

- FR-01: All instances of `bg-green-500`, `text-green-500`, `text-green-600`, `bg-green-500/10`, and `bg-green-500/20` in client source files must be replaced with the corresponding design system token utilities (`bg-green-primary`, `text-green-primary`, `bg-green-surface`, `text-green-surface-text`, or `text-success` as semantically appropriate for each usage)
- FR-02: The dark theme `--success` CSS custom property in `index.css` must be updated from `#22c55e` to `#16a34a` to match the light theme value, ensuring the success semantic token no longer uses the old green
- FR-03: At the mobile breakpoint (below `md` / 768px), the Layout navbar must hide the inline nav items and display a hamburger menu button instead
- FR-04: Activating the hamburger menu must open a slide-out drawer containing all nav items: Sign In and Sign Up (for unauthenticated users), dark mode toggle, Admin link (for admin users), Profile link (for authenticated users), and Sign Out button (for authenticated users)
- FR-05: The mobile drawer must be dismissible by tapping the close button, pressing Escape, or tapping the backdrop overlay
- FR-06: The mobile drawer must trap keyboard focus while open and return focus to the hamburger button on close
- FR-07: On the guest landing page in light mode, the navbar must render with a transparent or dark-tinted background when the hero section is visible behind it, avoiding the white-on-dark contrast clash
- FR-08: As the user scrolls past the hero section (or on any non-hero page), the navbar must transition to its standard opaque background with border
- FR-09: The navbar background transition between transparent/dark and opaque must be smooth (CSS transition) and not cause layout shift
- FR-10: On the signed-in home page in light mode, course cards must have sufficient visual definition against the white page background, using the surface background token (`--surface`, currently `#F9FAFB`) and a visible border (the `--border` token, currently `#E4E4E7`)
- FR-11: The signed-in hero section ("Welcome back") must also have clear visual separation from the card area below it
- FR-12: All color replacements must produce identical visual results in dark mode (the design tokens already swap values via the `.dark` class, so using tokens instead of hardcoded values should maintain dark mode appearance)

### Non-Functional Requirements

- NFR-01: The navbar hero-overlay behavior must not cause a visible flash of white background on initial page load in light mode
- NFR-02: The mobile drawer animation must complete within 300ms to feel responsive
- NFR-03: All text-on-background pairings introduced or modified must meet WCAG 2.1 AA contrast minimums (4.5:1 for normal text, 3:1 for large text)
- NFR-04: The hamburger menu touch target must be at least 44x44px per WCAG 2.1 AA requirements
- NFR-05: No new third-party dependencies may be added for these changes (drawer, scroll detection, and transitions must use native React state, DOM APIs, and CSS)

## Systems-Level Architecture

### Components Involved

**Existing components (modified):**

- `client/src/components/Layout.tsx` — The primary component affected. Needs mobile hamburger menu, drawer, and hero-overlay navbar logic. Currently renders the sticky header with inline nav items for all screen sizes.
- `client/src/features/home/HeroSection.tsx` — May need to expose information about whether it is the active hero (guest vs. signed-in variant) so Layout can determine navbar styling. The signed-in variant needs card-definition improvements.
- `client/src/features/home/HomePage.tsx` — May need minor adjustments to the course list container to support card definition improvements.
- `client/src/features/courses/CourseCard.tsx` — Already uses `bg-surface` and `border-border`; may need border visibility adjustments for light mode.
- `client/src/index.css` — Dark theme `--success` token value update.

**Existing components (token migration only):**

- `client/src/components/ResourceCompletionCheckbox.tsx` — Uses `bg-green-500/10`, `text-green-600`, `bg-green-500/20`, `bg-green-500`, `border-green-500`
- `client/src/components/LessonStatusIcon.tsx` — Uses `bg-green-500`, `border-green-500`
- `client/src/features/tests/UnitTestCard.tsx` — Uses `bg-green-500`, `border-green-500`
- `client/src/features/units/UnitCard.tsx` — Uses `bg-green-500`, `text-green-500`, `text-green-600`
- `client/src/features/lessons/LearningResourceNav.tsx` — Uses `text-green-500`
- `client/src/features/exams/ExamCard.tsx` — Uses `bg-green-500`, `text-green-600`

**New components (potential):**

- A `MobileDrawer` component (or inline within Layout) for the slide-out mobile navigation. Whether this is extracted as a shared component or kept inline in Layout is a design-stage decision.

### Data Model Changes

None. This is a purely frontend visual change.

### API Changes

None. No new or modified endpoints.

### Data Flow

**Mobile nav drawer:**
1. User taps the hamburger button in the navbar (visible only below `md` breakpoint).
2. React state in Layout toggles the drawer open.
3. The drawer renders as an overlay with all nav items.
4. User interacts with a nav item (e.g., taps Sign In) or dismisses the drawer.
5. On navigation or dismissal, the drawer closes and focus returns to the hamburger button.

**Navbar hero overlay (light mode):**
1. On the guest landing page, the Layout component detects that the hero section is at the top of the viewport.
2. The navbar renders with a transparent/dark background instead of the standard opaque white.
3. As the user scrolls and the hero section moves out of view, a scroll listener triggers a state change.
4. The navbar transitions to its standard opaque background with border.
5. On non-hero pages (or the signed-in home page), the navbar always uses the standard opaque background.

### Integration Points

- **ThemeContext** — The mobile drawer must include the dark mode toggle, reading from `useTheme()`.
- **AuthContext** — The mobile drawer must conditionally render Sign In/Sign Up (unauthenticated) vs. Profile/Admin/Logout (authenticated), reading from `useAuth()`.
- **React Router** — The mobile drawer must close on navigation. The hero-overlay logic may need to know the current route to determine if the guest hero is active.
- **Layout component** — Central integration point. The hero-overlay behavior and mobile drawer both live here. The Layout must communicate with or detect the hero section to know when to apply transparent navbar styling.

## Required Design Artifacts

- [ ] Backend plan (`backend-plan.md`)
- [ ] API contract (`api-contract.md`)
- [x] Frontend plan (`frontend-plan.md`)
- [x] UI wireframe (`wireframe.md`)
