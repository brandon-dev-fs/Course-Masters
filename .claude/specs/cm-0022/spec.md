---
id: cm-0022
title: Redesign Landing Page Hero Section
stage: spec
status: approved
approver: human
approved_at: 2026-05-20T12:00:00Z
---

# Redesign Landing Page Hero Section

## Problem Statement

The current HeroSection is a plain text-and-button banner with a generic surface background. It does not visually communicate what Course Masters is about or create a memorable first impression for unauthenticated visitors. A redesigned hero with a space-themed solar system illustration, a dark background, and refined typography will establish stronger visual identity and better communicate the platform's purpose at first glance.

## Scope

### In Scope

- Redesigning the HeroSection component for unauthenticated visitors with a dark background (#0a0a16), updated layout, and a decorative solar system SVG illustration
- Implementing a two-column layout on desktop: headline, subtitle, and CTA buttons on the left; solar system SVG on the right
- Responsive behavior: stacking the text and CTA above the SVG on mobile and tablet viewports
- Collapsing the hero to a compact greeting banner when the user is authenticated
- CSS keyframe animations on the solar system SVG: orbiting planets (8 orbit classes with proportional speeds, Mercury 3s base), sun pulse animation, and star twinkle animations (3 variants). All CSS-only, no JavaScript
- Marking the solar system SVG as decorative (aria-hidden) and meeting WCAG 2.1 AA accessibility standards
- Respecting `prefers-reduced-motion` by pausing all animations when the user has reduced motion enabled
- Ensuring the hero section renders correctly in both light and dark themes

### Out of Scope

- Changing the page-level background color outside the hero section
- Changing the headline or subtitle copy (locked to current text for now)
- "Pick up where you left off" functionality for authenticated users (future enhancement)
- Backend or API changes (this is entirely frontend)
- Any changes to the course list section below the hero

## Requirements

### Functional Requirements

- FR-01: The hero section for unauthenticated visitors must display a dark background (#0a0a16) that is visually distinct from the rest of the page
- FR-02: The hero section must display the existing headline text ("Master anything, one lesson at a time.") and existing subtitle text in a left-aligned text column
- FR-03: The hero section must display "Get Started" (primary) and "Sign In" (secondary) CTA buttons below the subtitle text, linking to /register and /login respectively
- FR-04: The hero section must display a decorative solar system SVG illustration positioned to the right of the text column on desktop viewports
- FR-05: On viewports narrower than the desktop breakpoint, the layout must stack vertically with the text content and CTA buttons above the solar system SVG
- FR-06: When a user is authenticated, the hero section must collapse to a compact greeting banner instead of the full hero layout
- FR-07: The greeting banner for authenticated users must not display the solar system SVG, the CTA buttons, or the subtitle text
- FR-08: Text within the dark hero section must have sufficient contrast against the #0a0a16 background to meet WCAG 2.1 AA standards (minimum 4.5:1 for normal text, 3:1 for large text)
- FR-09: The solar system SVG must be marked as decorative with aria-hidden="true" and must not receive keyboard focus
- FR-10: CTA buttons within the hero must be fully keyboard-accessible and visually distinguishable against the dark background
- FR-11: The solar system SVG must include CSS keyframe animations for orbiting planets (8 orbits with proportional speeds, Mercury at 3s base), a sun pulse animation, and star twinkle animations (3 variants). Orbital tracks must be color-matched to each planet
- FR-12: All animations must pause when the user has `prefers-reduced-motion: reduce` enabled

### Non-Functional Requirements

- NFR-01: The solar system SVG must be implemented as an inline SVG component (not an external image file) with CSS keyframe animations defined in a scoped style block — no JavaScript animation libraries or runtime dependencies
- NFR-02: The hero section must render correctly in both light and dark application themes without using Tailwind's dark: prefix
- NFR-03: The hero section must be responsive across the three target breakpoints: desktop (1280px+), tablet (768px-1024px), and mobile (< 640px)
- NFR-04: The redesigned hero must not introduce any new runtime dependencies

## Systems-Level Architecture

### Components Involved

- **HeroSection** (existing, `client/src/features/home/HeroSection.tsx`) -- the primary component being redesigned. Currently accepts a `loggedIn` prop and conditionally renders CTA buttons.
- **HomePage** (existing, `client/src/features/home/HomePage.tsx`) -- parent component that renders HeroSection and passes the `loggedIn` prop. No changes expected to HomePage itself beyond what HeroSection already handles.
- **SolarSystemSvg** (new, `client/src/features/home/SolarSystemSvg.tsx`) -- a new component encapsulating the decorative solar system illustration as an inline SVG with CSS keyframe animations for orbiting planets, sun pulse, and star twinkle effects. Kept separate from HeroSection for readability.
- **Button** (existing, `client/src/components/Button.tsx`) -- shared button component used for CTA buttons. May need variant adjustments or additional styling props to render correctly against the dark hero background.

### Data Model Changes

None. This is a purely frontend visual change.

### API Changes

None. No new or modified endpoints.

### Data Flow

1. HomePage determines whether the user is authenticated via the useAuth hook and passes the `loggedIn` boolean to HeroSection.
2. HeroSection checks the `loggedIn` prop. If false, it renders the full hero layout: dark background container, headline, subtitle, CTA buttons, and the SolarSystemSvg component.
3. If `loggedIn` is true, HeroSection renders a compact greeting banner without the SVG, subtitle, or CTA buttons.
4. The SolarSystemSvg component renders a self-contained inline SVG with no external data dependencies.

### Integration Points

- **AuthContext**: HeroSection indirectly depends on authentication state via the `loggedIn` prop passed from HomePage, which reads from useAuth().
- **React Router**: CTA buttons link to /register and /login using the existing Link component from react-router-dom.
- **Design tokens**: The dark hero background (#0a0a16) is a one-off value specific to this section. Text colors within the hero will need to use light values that contrast against this background, potentially requiring local style overrides rather than the standard design tokens which assume a light or standard dark background.
- **Tailwind CSS**: All styling via Tailwind utility classes and CSS custom properties, consistent with the project's styling approach.

## Required Design Artifacts

- [ ] Backend plan (`backend-plan.md`)
- [ ] API contract (`api-contract.md`)
- [x] Frontend plan (`frontend-plan.md`)
- [x] UI wireframe (`wireframe.md`)
