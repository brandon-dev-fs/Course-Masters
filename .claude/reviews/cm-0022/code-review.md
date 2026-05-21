---
id: cm-0022
title: Redesign Landing Page Hero Section
stage: review
status: approved
---

# Code Review: Redesign Landing Page Hero Section

## Summary

Reviewed the cm-0022 frontend changes across 3 source files and 3 test files. The implementation correctly delivers the two-column hero layout, authenticated greeting banner, inline SVG solar system, accessibility attributes (`aria-hidden`, `focusable="false"`), semantic `<section>` landmark, and keyboard-accessible CTA links. However, two blocking issues were found: the `prefers-reduced-motion` requirement (FR-12) is not implemented anywhere in the animation CSS, and a duplicate test module was added for the same source component in the wrong location.

## Scope Coverage

- **Frontend files reviewed**: `client/src/features/home/HeroSection.tsx`, `client/src/features/home/SolarSystemSvg.tsx`, `client/src/features/home/HomePage.tsx`
- **Test files reviewed**: `client/src/__tests__/components/HeroSection.test.tsx`, `client/src/__tests__/components/SolarSystemSvg.test.tsx`, `client/src/__tests__/features/home/HeroSection.test.tsx`
- **Config/other files reviewed**: none
- **Rules loaded**: `.claude/rules/frontend.md`, `CLAUDE.md` (client section), `client/CLAUDE.md`

## Issues

### [HIGH] `prefers-reduced-motion` not implemented — FR-12 unmet

- **Location**: `client/src/features/home/SolarSystemSvg.tsx:11-41` (the `<style>` block)
- **Description**: The spec requires all CSS animations to pause when the user has `prefers-reduced-motion: reduce` enabled (FR-12, NFR-01). The `<style>` block defines `orbit1`–`orbit8`, `sun`, `twinkle-a`, `twinkle-b`, and `twinkle-c` animation rules with no `@media (prefers-reduced-motion: reduce)` override. Users who opt into reduced motion will receive all animations at full speed. This is both an accessibility failure (WCAG 2.3.3 Animation from Interactions) and a direct spec violation.
- **Suggested Fix**: Add the following block at the end of the `<style>` content, after all animation class definitions:
  ```css
  @media (prefers-reduced-motion: reduce) {
    .orbit1, .orbit2, .orbit3, .orbit4,
    .orbit5, .orbit6, .orbit7, .orbit8,
    .sun, .twinkle-a, .twinkle-b, .twinkle-c {
      animation: none;
    }
  }
  ```

---

### [MEDIUM] Duplicate test file for `HeroSection` violates one-test-file-per-module convention

- **Location**: `client/src/__tests__/components/HeroSection.test.tsx` (new file)
- **Description**: `client/CLAUDE.md` states "One test file per source module; names mirror the source file." A test file for `HeroSection` already exists at `client/src/__tests__/features/home/HeroSection.test.tsx`, which is the canonical location matching the source module at `client/src/features/home/HeroSection.tsx`. The new file at `__tests__/components/HeroSection.test.tsx` duplicates coverage for the same component in the wrong directory (`components/` is for tests of shared components in `src/components/`, not feature components). This will create confusing double-runs and makes it unclear which file is authoritative.
- **Suggested Fix**: Remove `client/src/__tests__/components/HeroSection.test.tsx`. Merge any additional test cases it contains (e.g., the SVG presence assertion and authenticated-state cases) into the existing `client/src/__tests__/features/home/HeroSection.test.tsx`.

---

### [LOW] Dead variable in `SolarSystemSvg.test.tsx`

- **Location**: `client/src/__tests__/components/SolarSystemSvg.test.tsx:28-30`
- **Description**: The variable `orbitRings` is assigned on line 28 but is never read — the assertion on line 32 uses the separate `fillNoneCircles` variable. TypeScript will flag this with `noUnusedLocals` if enabled; it also adds noise to the test without contributing coverage.
- **Suggested Fix**: Remove lines 28-30 (the `orbitRings` assignment and filter) entirely, as they are dead code.

---

### [LOW] Import grouping — missing blank line separator in `HeroSection.tsx`

- **Location**: `client/src/features/home/HeroSection.tsx:1-3`
- **Description**: The frontend import convention requires each import group to be separated by a blank line. Group 1 is React/ecosystem (`react-router-dom`); group 5 is feature-local components (`./SolarSystemSvg.js`). The file places both imports back-to-back with no blank line between them.
- **Suggested Fix**:
  ```ts
  import { Link } from 'react-router-dom';

  import SolarSystemSvg from './SolarSystemSvg.js';
  ```

---

### [INFO] Neptune planet starts outside the SVG viewBox at initial position

- **Location**: `client/src/features/home/SolarSystemSvg.tsx:137`
- **Description**: Neptune's planet circle is initialized at `cx="498"`, which is 18px beyond the 480px viewBox width. The SVG uses `overflow="visible"` to intentionally allow bleed, and the parent container has `overflow-visible`. This is a deliberate design choice noted in the comments. However, on browsers with aggressive compositing or inside a CSS `overflow: hidden` ancestor, the planet will be invisible at its starting position until the orbit animation rotates it into view. No action required unless visual QA reveals clipping.
- **Suggested Fix**: If clipping is observed in QA, initialize Neptune at `cx="240" cy="498"` (bottom of viewBox, fully inside the `overflow:visible` bleed zone) so it is always visible at start. Otherwise no change needed.

---

### [INFO] CTA links styled inline rather than using `<Button>` — semantic improvement acknowledged

- **Location**: `client/src/features/home/HeroSection.tsx:46-57`
- **Description**: The previous implementation wrapped `<Button>` inside `<Link>`, producing invalid HTML (`<a><button>`). The new implementation uses `<Link>` elements styled as buttons directly, which is semantically correct. The frontend rules say to always use shared `<Button>`, but that component renders a `<button>` element and cannot serve as an anchor. The new approach is the right call. Flagged here for visibility so reviewers can confirm the focus-visible ring color (`focus-visible:ring-white`) has been verified against the dark background in manual QA.
- **Suggested Fix**: No code change needed. Confirm visually in QA that the white focus ring is visible at 4.5:1 contrast against `#0a0a16`.

## Verdict

**Status**: REJECTED

Blocking issues found at HIGH and MEDIUM severity. Resolve all medium and high issues before re-running `/review cm-0022`.

1. **[HIGH]** Add the `@media (prefers-reduced-motion: reduce)` block to `SolarSystemSvg.tsx` to pause all animations — this is an explicit spec requirement (FR-12) and an accessibility compliance gap.
2. **[MEDIUM]** Remove the duplicate `client/src/__tests__/components/HeroSection.test.tsx` and consolidate its test cases into the canonical `client/src/__tests__/features/home/HeroSection.test.tsx`.

## Next Steps

Fix the blocking issues listed above, then re-run: `/review cm-0022`

Override: `/approve .claude/reviews/cm-0022/code-review.md` or edit frontmatter to `status: rejected`
