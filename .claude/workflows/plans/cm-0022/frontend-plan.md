---
id: cm-0022
title: Redesign Landing Page Hero Section
stage: design
status: approved
approver: human
approved_at: 2026-05-20T12:02:00Z
---

# Frontend Implementation Plan: Redesign Landing Page Hero Section

## 1. Overview

This plan covers the visual redesign of `HeroSection` at `/` (HomePage). The change affects unauthenticated visitors and authenticated users differently, and introduces a new `SolarSystemSvg` component. No API calls, no new routes, and no new runtime dependencies are required.

Acceptance criteria addressed:

- FR-01–FR-05: Full-bleed dark hero (#0a0a16), two-column desktop grid, headline, subtitle, CTA links, and decorative SVG illustration for guests.
- FR-06–FR-07: Authenticated state collapses to a compact greeting banner — no SVG, no subtitle, no CTAs.
- FR-08–FR-10: WCAG 2.1 AA contrast, decorative SVG hidden from assistive technology, keyboard-accessible CTA links.
- FR-11–FR-12: Eight-orbit CSS keyframe animation system with sun pulse and star twinkle; all animations pause under `prefers-reduced-motion`.
- NFR-01–NFR-04: Inline SVG with scoped `<style>` block, no JS animation, correct rendering in both themes, no new dependencies.

---

## 2. Folder Structure

Files to create:

```
client/src/features/home/SolarSystemSvg.tsx     (new)
```

Files to modify:

```
client/src/features/home/HeroSection.tsx        (rewrite)
client/src/features/home/HomePage.tsx           (minimal prop addition)
```

No new directories are required. Test files:

```
client/src/__tests__/components/HeroSection.test.tsx   (new)
client/src/__tests__/components/SolarSystemSvg.test.tsx (new)
```

---

## 3. Component Tree

### HeroSection

**File:** `client/src/features/home/HeroSection.tsx`
**Type:** Feature UI component

**Props interface:**

```ts
interface HeroSectionProps {
  loggedIn: boolean;
  userName?: string;
}
```

**Responsibilities:**

- Renders the outer `<section>` with dark background (`bg-[#0a0a16]`) and the `aria-label="Hero"` landmark.
- Branches on `loggedIn`:
  - Guest path: two-column grid containing the text column and `<SolarSystemSvg />`.
  - Authenticated path: compact single-column greeting banner with `<h1>`.
- Owns no state. Receives all data via props from `HomePage`.

**Note on CTA rendering:** CTA links must be rendered as `<a>` elements — not as `<button>` nested inside `<a>`. The "Get Started" and "Sign In" links use `<Link>` from `react-router-dom` with Tailwind classes matching the visual spec. The shared `Button` component is NOT used for CTAs because it renders a `<button>` element, which would produce invalid HTML when nested inside a `<Link>`-rendered `<a>`. The styling classes for each CTA are applied directly to the `<Link>` component.

---

### SolarSystemSvg

**File:** `client/src/features/home/SolarSystemSvg.tsx`
**Type:** Feature UI component (decorative)

**Props interface:**

```ts
// No props. Component is fully self-contained.
```

**Responsibilities:**

- Renders a single `<svg>` element with `viewBox="0 0 480 480"`, `aria-hidden="true"`, and `focusable="false"`.
- Contains a scoped `<style>` block with all CSS keyframe definitions and animation assignments.
- Renders three layers in SVG document order: star field (background), orbit rings (mid), planets + sun (foreground).
- Owns no state. Accepts no props. Has no side effects.

---

### HomePage (modified)

**File:** `client/src/features/home/HomePage.tsx`
**Type:** Page component

**Change:** Pass `userName={user?.name ?? ''}` as an additional prop to `<HeroSection>`. The existing `loggedIn={loggedIn}` prop is unchanged. No other modifications are needed.

---

## 4. Client Routes

No new or modified routes. The feature renders entirely within the existing `/` route handled by `HomePage`.

---

## 5. Hooks and Data Fetching

No new hooks. No API calls. The component reads auth state via the existing `useAuth()` hook already called in `HomePage`.

`HeroSection` receives `loggedIn` and `userName` as props — it does not call `useAuth()` directly, consistent with the existing pattern.

---

## 6. API Integration

No API integration. This feature is entirely presentational with no server communication.

---

## 7. State Management

All state relevant to `HeroSection` originates in `HomePage` and is passed down as props:

| Data | Source | How it reaches HeroSection |
|---|---|---|
| `loggedIn` | `useAuth()` → `user !== null` | Existing prop, no change |
| `userName` | `useAuth()` → `user?.name` | New optional prop, passed as `user?.name ?? ''` |

`SolarSystemSvg` has no state. All animation is declarative CSS.

`HeroSection` itself has no local state. The component is a pure render function of its props.

---

## 8. Authentication and Authorization

`HeroSection` is rendered on the public `/` route — it renders in both guest and authenticated states. The `loggedIn` boolean gates which layout branch is shown.

`HomePage` already guards the `isLoading` case:

```tsx
// Already present in HomePage — no change required:
if (loading) return <LoadingSpinner fullPage />;
```

`HeroSection` always receives a settled `loggedIn` value; it does not need to handle the loading state itself.

No route-level auth guard is needed. The hero is intentionally visible to all users.

---

## 9. Pseudocode for Complex Logic

### CTA Link Styling (avoiding nested interactive elements)

The existing implementation wraps `<Button>` inside `<Link>`, producing a `<button>` inside `<a>` — invalid HTML. The correct approach applies button-like styles directly to `<Link>`:

```
// Get Started — styled to match Button primary lg
<Link
  to="/register"
  className="inline-flex items-center justify-center gap-2 font-semibold
             transition-all px-6 py-3 text-base rounded-2xl
             bg-primary text-primary-foreground shadow-warm-sm
             hover:brightness-110
             focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
>
  Get Started
</Link>

// Sign In — outlined style, visible on dark background
<Link
  to="/login"
  className="inline-flex items-center justify-center gap-2 font-semibold
             transition-all px-6 py-3 text-base rounded-2xl
             border border-white/60 bg-transparent text-white
             hover:bg-white/10
             focus-visible:ring-2 focus-visible:ring-white
             focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a16]"
>
  Sign In
</Link>
```

This produces valid `<a>` elements with accessible focus rings appropriate to the dark background.

### SolarSystemSvg Layer Construction

The SVG is built in three explicit layers rendered in document order (back to front):

```
Layer 1 — Star field
  ~40 <circle> elements scattered across viewBox (0,0,480,480)
  Grouped into three sets: fast-twinkle, mid-twinkle, slow-twinkle
  Each set references one of three keyframe animations

Layer 2 — Orbit rings
  Eight <circle> elements, fill="none", center cx=240 cy=240
  Radii: 52, 76, 100, 128, 164, 196, 230, 262
  Each stroke uses planet color at 30% opacity: stroke="#4fa3e0" stroke-opacity="0.3"
  stroke-width="1"

Layer 3 — Sun + Planets
  Sun: <circle cx=240 cy=240 r=28 fill=#FDB813>
       animation: sunPulse 3s ease-in-out infinite

  Each planet: <g class="orbitN" style="transform-origin: 240px 240px">
                 <circle cx={240 + orbitRadius} cy=240 r={planetRadius} fill={planetColor} />
               </g>
  The <g> rotates; the planet <circle> is offset from center by orbitRadius along the x-axis.
```

### Animation Keyframe Spec

All keyframes are defined inside a `<style>` block within the SVG component. The `prefers-reduced-motion` global rule in `index.css` handles freezing without any per-component media query.

**Orbit animations** (one per planet, rotate 360deg around SVG center):

| Class | Duration | Easing |
|---|---|---|
| `orbit1` (Mercury) | 3s | linear |
| `orbit2` (Venus) | 7.5s | linear |
| `orbit3` (Earth) | 12s | linear |
| `orbit4` (Mars) | 22.5s | linear |
| `orbit5` (Jupiter) | 142s | linear |
| `orbit6` (Saturn) | 353s | linear |
| `orbit7` (Uranus) | 1008s | linear |
| `orbit8` (Neptune) | 1978s | linear |

Keyframe: `@keyframes orbitN { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`

Since all orbit animations share the same keyframe shape, a single `@keyframes orbit` definition can be reused. Each planet's `<g>` uses `animation: orbit <duration>s linear infinite`.

**Sun pulse:**

```
@keyframes sunPulse {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.08); }
}
```

Applied to the sun `<circle>` with `animation: sunPulse 3s ease-in-out infinite`. The `transform-origin` must be set to `240px 240px` (SVG coordinates).

**Star twinkle (3 variants):**

```
@keyframes twinkle {
  0%, 100% { opacity: 0.2; }
  50%       { opacity: 1.0; }
}
```

Three CSS classes each reference the same `twinkle` keyframe with different durations: `twinkle-a` (2s), `twinkle-b` (3s), `twinkle-c` (4s). Stars are distributed across the three classes to stagger their visible peaks.

### Planet Specification

| Planet | Orbit r | Fill | Planet r |
|---|---|---|---|
| Mercury | 52 | #b5b5b5 | 4 |
| Venus | 76 | #e8cda0 | 5 |
| Earth | 100 | #4fa3e0 | 6 |
| Mars | 128 | #c1440e | 5 |
| Jupiter | 164 | #c88b3a | 10 |
| Saturn | 196 | #e8d5a3 | 8 |
| Uranus | 230 | #7de8e8 | 7 |
| Neptune | 262 | #5b7fdb | 7 |

Saturn also receives a tilted ellipse decoration for the ring: `<ellipse cx={240+196} cy=240 rx=14 ry=5 fill="none" stroke="#e8d5a3" stroke-opacity="0.6" stroke-width="2" transform="rotate(-20, {240+196}, 240)" />` rendered as a sibling inside Saturn's `<g>`.

---

## 10. Styling Notes

### Dark Background

The `#0a0a16` value is used directly as a Tailwind arbitrary value: `bg-[#0a0a16]`. This is a single-use value specific to this section and does not belong in the global design token system. The wireframe recommends optionally adding `--hero-bg: #0a0a16` to `:root` in `index.css` and referencing it as `bg-[--hero-bg]` — this is acceptable but optional; the direct arbitrary value is simpler and equally maintainable for a single-use color.

### Guest Hero Layout Classes

```
<section>:        w-full py-20 px-6 bg-[#0a0a16]
  aria-label:     "Hero"

<div> (container): max-w-7xl mx-auto
                   grid grid-cols-1 gap-12 items-center
                   md:grid-cols-2

Left column:      flex flex-col justify-center
                  text-center md:text-left

<h1>:             text-4xl md:text-5xl font-bold text-white
                  tracking-tight leading-tight mb-4 md:mb-5

<p> (subtitle):   text-base md:text-lg text-white/70
                  mb-7 md:mb-8 leading-relaxed max-w-lg

CTA wrapper:      flex flex-col gap-3 w-full
                  sm:flex-row sm:w-auto

Right column:     flex items-center justify-center
                  mt-8 md:mt-0

SVG wrapper:      w-full max-w-[320px] md:w-[480px] md:max-w-none
```

### Greeting Banner Layout Classes

```
<section>:        w-full py-6 px-5 bg-[#0a0a16]
                  md:py-8 md:px-6

<div> (container): max-w-7xl mx-auto

<h1>:             text-2xl md:text-3xl font-bold text-white tracking-tight
```

### Sign In Button Contrast Fix

The existing `secondary` Button variant uses `bg-surface` (warm off-white), which is invisible against `#0a0a16`. The fix is to not use `<Button>` at all for the CTA links — render `<Link>` elements directly with the outlined style specified in Section 9. No new Button variant is needed, and `Button.tsx` is not modified.

### Focus Ring Offset on Dark Background

The `focus-visible:ring-offset-[#0a0a16]` class on the "Sign In" link ensures the ring offset gap matches the hero background rather than defaulting to the page background, keeping the white ring visually distinct.

### Theme Independence

Both guest and authenticated hero states use `text-white` and `text-white/70` for text — values that are explicitly `#ffffff` and not design tokens. This ensures the hero remains legible against `#0a0a16` regardless of whether the app is in light or dark theme. The `dark:` Tailwind prefix is never used (per project convention).

---

## 11. Edge Cases and Error Handling

### Loading State

`HomePage` already returns `<LoadingSpinner fullPage />` while `isLoading` from `useAuth()` is true. `HeroSection` never renders during a pending session check. No loading handling is required inside `HeroSection` itself.

### Empty or Missing userName

`user?.name` may be an empty string or undefined for edge-case accounts. `HomePage` passes `user?.name ?? ''` to `HeroSection`. The greeting banner renders `Welcome back, .` in this case — acceptable for the initial implementation. If needed, a fallback like `user?.email?.split('@')[0]` can be applied in `HomePage` before passing the prop, but this is outside the current spec scope.

### Guest Sees Greeting Flash (auth race)

Because `HomePage` renders `<LoadingSpinner fullPage />` during `isLoading`, there is no flash of the guest hero for authenticated users. The hero always receives a settled `loggedIn` state.

### SVG in Forced Colors Mode (Windows High Contrast)

The planet and orbit ring fills use hardcoded hex colors that may be overridden by forced colors mode. Since the SVG is `aria-hidden="true"` (purely decorative), accessibility is not impacted by color overrides. No special handling is needed.

### SVG on Very Small Viewports (< 320px)

The SVG wrapper uses `w-full max-w-[320px]` on mobile. On viewports narrower than 320px, the SVG will scale down via `width: 100%` on the `<svg>` element (no `height` attribute, `viewBox` preserves aspect ratio). This is acceptable for the rare sub-320px case.

### Animation Performance

CSS `transform: rotate()` on `<g>` elements inside SVG uses the GPU compositor path on modern browsers. With 8 orbit groups + sun pulse + ~40 star twinkles, the total animation count is manageable without `will-change`. If profiling reveals jank (unlikely), `will-change: transform` can be added to the orbit `<g>` elements. This is not needed proactively.

### Both Themes Render Correctly

The hero section background is hardcoded (`#0a0a16`) and all text is explicitly `text-white` — neither references a CSS custom property that changes between light and dark themes. The section will look identical in both themes, which is the intended behavior per NFR-02 and the spec's note that the dark band should contrast against the page background regardless of theme.

---

## 12. Test Plan

### HeroSection tests (`client/src/__tests__/components/HeroSection.test.tsx`)

| Test | Assertion |
|---|---|
| Guest state renders hero section | `<section aria-label="Hero">` is in the document |
| Guest state renders headline | Text "Master anything, one lesson at a time." is visible |
| Guest state renders subtitle | Subtitle paragraph is visible |
| Guest state renders Get Started link | `<a href="/register">` with text "Get Started" is in the document |
| Guest state renders Sign In link | `<a href="/login">` with text "Sign In" is in the document |
| Guest state renders SolarSystemSvg | The decorative SVG is present (can check for `aria-hidden="true"` on the SVG) |
| Authenticated state renders greeting | Text "Welcome back, Test User." is visible when `loggedIn=true` and `userName="Test User"` |
| Authenticated state hides subtitle | Subtitle paragraph is not in the document when `loggedIn=true` |
| Authenticated state hides CTAs | "Get Started" and "Sign In" links are not in the document when `loggedIn=true` |
| Authenticated state hides SVG | SVG is not in the document when `loggedIn=true` |
| Get Started link has correct href | `<a>` element navigates to `/register` |
| Sign In link has correct href | `<a>` element navigates to `/login` |

Render helper: use `renderWithProviders` from `client/src/__tests__/setup/renderWithProviders.tsx` with `MemoryRouter` for link resolution. Auth state is not consumed by `HeroSection` directly (props-driven), so `AuthContext.Provider` is not required for these tests.

### SolarSystemSvg tests (`client/src/__tests__/components/SolarSystemSvg.test.tsx`)

| Test | Assertion |
|---|---|
| SVG is aria-hidden | `aria-hidden="true"` on the root `<svg>` element |
| SVG is not focusable | `focusable="false"` on the root `<svg>` element |
| SVG renders with correct viewBox | `viewBox="0 0 480 480"` |
| SVG renders 8 orbit rings | 8 orbit ring `<circle>` elements with `fill="none"` |
| SVG contains the sun | One `<circle>` with `fill="#FDB813"` |

Note: Animation behavior (timing, motion) is not testable in jsdom. Tests focus on structural correctness and accessibility attributes.

### HomePage integration (existing test or new if missing)

Verify `HeroSection` receives `userName` prop when `user.name` is populated. This is a minimal check that `HomePage` passes the correct prop shape.
