---
id: cm-0024
title: Home page UI polish — color migration, mobile nav, hero transition, card definition
stage: review
status: approved
approver: agent
approved_at: 2026-05-22T00:00:00Z
---

# Code Review: Home Page UI Polish (Second Pass)

## Summary

Second-pass review of cm-0024 against the `develop` branch. Five commits reviewed covering 11 changed files — all frontend. This pass verifies that the four low-severity findings from the first review were correctly resolved, and performs a fresh full-scope review of the entire diff.

All four prior fixes are confirmed correct. No new issues at medium or above were found.

## Scope Coverage

- **Frontend files reviewed**: `client/src/components/Layout.tsx`, `client/src/components/MobileDrawer.tsx`, `client/src/components/LessonStatusIcon.tsx`, `client/src/components/ResourceCompletionCheckbox.tsx`, `client/src/features/exams/ExamCard.tsx`, `client/src/features/home/HeroSection.tsx`, `client/src/features/lessons/LearningResourceNav.tsx`, `client/src/features/tests/UnitTestCard.tsx`, `client/src/features/units/UnitCard.tsx`, `client/src/index.css`, `client/src/__tests__/components/MobileDrawer.test.tsx`
- **Backend files reviewed**: none
- **Config/other files reviewed**: none
- **Rules loaded**: `.claude/rules/rules.md`, `.claude/rules/frontend.md`, `.claude/rules/design.md`

---

## Verification of Prior Fixes

### Fix 1 — ResourceCompletionCheckbox hover regression
**Status: CONFIRMED FIXED.**
`ResourceCompletionCheckbox.tsx` line 15 now uses `hover:brightness-95` on the completed state. The raw `hover:bg-green-500/20` is gone.

### Fix 2 — Layout scroll threshold
**Status: CONFIRMED FIXED.**
`Layout.tsx` lines 46–49: `handleScroll` now computes `heroEl.offsetHeight + heroEl.offsetTop` when the element is found in the DOM, falling back to `HERO_HEIGHT_ESTIMATE` only when the element is absent. Both measurements are static document-relative values — the mixing of viewport-relative and document-relative measurements is gone.

### Fix 3 — MobileDrawer `wasOpenRef` guard
**Status: CONFIRMED FIXED.**
`MobileDrawer.tsx` lines 27 and 36–43: `wasOpenRef` is initialized to `false` and set to `true` only on the first open. The `focusReturnRef.current?.focus()` call in the else branch is guarded against the initial mount render where `isOpen` begins as `false`.

### Fix 4 — MobileDrawer close button touch target
**Status: CONFIRMED FIXED.**
`MobileDrawer.tsx` line 121: close button is now `w-11 h-11` (44px), meeting the WCAG 2.1 AA 44x44px touch target requirement (NFR-04).

---

## Full Diff Review

### FR and NFR compliance

- **FR-01 (token migration)**: All reviewed files have replaced `bg-green-500`, `text-green-500`, `text-green-600`, `bg-green-500/10`, and `bg-green-500/20` with corresponding design tokens. Grep confirms no remaining occurrences in any diff-scope file. The one hit in `CalendarModal.tsx` (`#16a34a` with a justifying comment) is outside this spec's scope and predates this branch.
- **FR-02 (`--success` dark token)**: `index.css` line 176 in `.dark` now reads `--success: #16a34a`, matching the light theme value. Confirmed.
- **FR-03/FR-04 (mobile nav and hamburger)**: `Layout.tsx` hides inline nav at `md:hidden` and shows hamburger below `md`. `MobileDrawer.tsx` contains all required nav items: Sign In/Sign Up (unauthenticated), dark mode toggle, Profile (authenticated), Admin (admin role only), and Sign Out.
- **FR-05 (drawer dismissal)**: Backdrop `onClick`, close button `onClick`, and Escape key listener all confirmed in `MobileDrawer.tsx` lines 98–102, 117–124, and 46–53 respectively.
- **FR-06 (focus trap and return)**: Focus trap via `handleKeyDownOnDrawer` cycles Tab/Shift+Tab over all focusable elements. Initial focus moves to close button via `requestAnimationFrame`. Focus returns to `focusReturnRef` on close, guarded by `wasOpenRef`. All confirmed.
- **FR-07/FR-08 (hero overlay and scroll transition)**: `isHeroOverlay` is `true` only when `isHeroPage && !hasScrolled && theme !== 'dark'`. Scrolling past the hero triggers `setHasScrolled(true)`, which transitions to the opaque header class. Confirmed.
- **FR-09 (smooth transition, no layout shift)**: Both `headerClass` variants include `transition-colors duration-300`. The header remains `sticky` in both states — no height or position change, so no layout shift. Confirmed.
- **FR-10/FR-11 (card definition, signed-in hero separation)**: `HeroSection.tsx` logged-in variant now has `border-b border-border`. `UnitCard.tsx` already carries `bg-surface border border-border`. Confirmed.
- **FR-12 (dark mode correctness)**: All replaced tokens resolve to dark-mode values via CSS custom properties in `.dark`. No `dark:` Tailwind prefix is used anywhere in the diff. Confirmed.
- **NFR-01 (no FOUC)**: `hasScrolled` is initialized synchronously with `useState(() => window.scrollY > HERO_HEIGHT_ESTIMATE)`. On the guest landing page at the top of the page this evaluates to `false` and `isHeroOverlay` evaluates to `true` (light mode) before any paint. Confirmed.
- **NFR-02 (animation 300ms)**: `animate-slide-in-right` in `index.css` is `300ms ease-in-out forwards`. Confirmed.
- **NFR-03 (WCAG contrast)**: All introduced pairings use verified design tokens: `bg-green-surface` / `text-green-surface-text` (7.2:1 AAA), `bg-green-button` / `text-green-button-text` (5.1:1 AA), `bg-green-primary` with white icon fills (5.1:1 AA). `text-destructive` on the Sign Out button resolves to `#dc2626` on a surface background — sufficient contrast. Confirmed.
- **NFR-04 (44px touch targets)**: Hamburger `w-11 h-11`, close button `w-11 h-11`, all drawer nav links `min-h-[44px]`, theme toggle `min-h-[44px]`. Confirmed.
- **NFR-05 (no new dependencies)**: No new dependencies added. Drawer, scroll detection, animation, and focus management all use React state, DOM APIs, and CSS. Confirmed.

### Design token rules

- No `dark:` Tailwind prefix used anywhere in the diff. All theming via CSS variables. Confirmed.
- No raw color values introduced in any `.tsx` file in the diff scope. Confirmed.
- `animate-slide-in-right` defined as a CSS class in `index.css` rather than an inline `style={}`. Correct pattern for Tailwind v4.

### Accessibility

- `role="dialog"`, `aria-modal="true"`, `aria-label="Navigation"` present on drawer panel. Confirmed.
- `aria-expanded` and `aria-controls="mobile-nav-drawer"` present on hamburger button; drawer carries matching `id="mobile-nav-drawer"`. Confirmed.
- `aria-current="page"` applied conditionally to active links in the drawer. Confirmed.
- Backdrop carries `aria-hidden="true"` — correct, it is decorative. Confirmed.
- `prefers-reduced-motion` media query in `index.css` reduces all animation durations to `0.01ms`, covering the slide-in animation. Confirmed.

### Component and structural conventions

- `MobileDrawer` is correctly placed in `src/components/` (shared component used by `Layout`). Single component per file, PascalCase filename, default export. Confirmed.
- `MobileDrawer` is rendered outside `<header>` but inside the Layout `div` — correct placement for a fixed overlay. Confirmed.
- No prop drilling beyond 2 levels. `focusReturnRef` is passed from `Layout` to `MobileDrawer` (one level). Confirmed.
- The "Sign Up" drawer item renders as a styled `<Link>` rather than `<Button>`. This is appropriate: `Button` wraps `<button>`, not `<a>`, and the item must navigate. The pattern of using `<Link>` with button-like styling is established in `HeroSection.tsx`. Confirmed acceptable.

### Import conventions

- All local imports use `.js` extension. Confirmed.
- Import group ordering in `MobileDrawer.tsx` and `Layout.tsx` matches the project convention (React, router, third-party, local in that order with blank-line separators). Confirmed.

### TypeScript

- No `any` usage in changed files. Confirmed.
- `focusReturnRef: React.RefObject<HTMLButtonElement | null>` — `| null` inner type is the React 19 ref convention. Correct.
- `drawerLinkClass` returns `string` explicitly. Clean.

### Test coverage

- `MobileDrawer.test.tsx` covers: visibility (open/closed), all three dismissal paths (Escape, backdrop click, close button), unauthenticated nav items, authenticated nav items, admin-only Admin link, and theme toggle presence. All key behaviors are tested.
- `vi.hoisted()` pattern used correctly — mock is hoisted before `vi.mock` call. Confirmed.
- Test file location `client/src/__tests__/components/MobileDrawer.test.tsx` matches the `<layer>/<name>.test.tsx` convention. Confirmed.

### Commit format

All five commits follow the `cm-0024: <imperative summary>` format required by project rules. Confirmed.

---

## Issues

No issues found.

---

## Verdict

**Status: APPROVED**

Zero issues at medium or above. Approved by agent.

All four prior low-severity findings are correctly resolved. The full diff is clean: design tokens applied consistently across all six token-migration targets, the mobile drawer is accessible and correctly structured, hero-overlay logic is sound with FOUC prevention and a corrected scroll threshold, and test coverage addresses all key drawer behaviors.

## Next Steps

Next: `/test cm-0024`

Override: `/approve .claude/reviews/cm-0024/code-review.md` or edit frontmatter to `status: rejected`
