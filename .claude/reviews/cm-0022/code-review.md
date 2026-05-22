---
id: cm-0022
title: Redesign Landing Page Hero Section
stage: review
status: approved
approver: agent
approved_at: 2026-05-21T00:00:00Z
---

# Code Review: Redesign Landing Page Hero Section

## Summary

Reviewed the cm-0022 implementation diff scoped to `client/src/features/home/` and `client/src/__tests__/features/home/`. This is a frontend-only change with no backend or API contract surface. Three source files were modified or created (`HeroSection.tsx`, `SolarSystemSvg.tsx`, `HomePage.tsx`) and two test files were updated or added (`HeroSection.test.tsx`, `SolarSystemSvg.test.tsx`). All previous blocking issues from the prior review cycle have been resolved. One low-severity advisory item was found; zero issues at medium or above.

## Scope Coverage

- **Backend files reviewed**: none (frontend-only spec)
- **Frontend files reviewed**:
  - `client/src/features/home/HeroSection.tsx`
  - `client/src/features/home/SolarSystemSvg.tsx`
  - `client/src/features/home/HomePage.tsx`
  - `client/src/__tests__/features/home/HeroSection.test.tsx`
  - `client/src/__tests__/features/home/SolarSystemSvg.test.tsx`
- **Config/other files reviewed**: none
- **Rules loaded**: `frontend.md`, `rules.md`, `review.md`

## Issues

### [LOW] Dead variable in SolarSystemSvg orbit ring test

- **Location**: `client/src/__tests__/features/home/SolarSystemSvg.test.tsx:28-30`
- **Description**: The `orbitRings` variable is computed via a `filter` call on lines 28-30 but is never referenced again. The actual assertion on line 33 correctly uses `fillNoneCircles` instead. The abandoned `orbitRings` binding is dead code left over from an intermediate draft of the test. It does not affect correctness — the test passes and asserts the right thing — but it adds noise and a misleading comment on line 27 that appears to describe the abandoned approach.
- **Suggested Fix**: Remove lines 27-30 (the comment and the `orbitRings` declaration with its filter expression). The test reads more clearly without them:

  ```tsx
  it('renders 8 orbit ring circles', () => {
    const { container } = render(<SolarSystemSvg />);
    const fillNoneCircles = Array.from(container.querySelectorAll('circle[fill="none"]'));
    expect(fillNoneCircles).toHaveLength(8);
  });
  ```

## Resolved Items (previous review)

- `prefers-reduced-motion` media query — present and correct in the `<style>` block inside `SolarSystemSvg.tsx` (lines 42-48), covering all orbit, sun, and twinkle animation classes.
- Duplicate `HeroSection.test.tsx` in `__tests__/components/` — removed; only one copy exists under `__tests__/features/home/`.
- `SolarSystemSvg.test.tsx` directory placement — moved to `__tests__/features/home/` per client CLAUDE.md convention.

## Checklist Notes

- No `dark:` prefix used anywhere in the changed files.
- No raw color values in Tailwind utility classes. `bg-hero-deep` is a properly registered design token in `client/src/index.css` (`--color-hero-deep: var(--hero-deep)` / `--hero-deep: #0a0a16`). Usage of `text-white` and `text-white/70` is explicitly justified in the approved frontend plan (section 10: Theme Independence) as intentional hard-coded values ensuring hero legibility regardless of app theme — an approved pattern deviation documented in the plan.
- CTA links rendered as `<Link>` elements producing `<a>` tags — not as `<Button>` inside `<Link>`, which would produce invalid `<button>` inside `<a>` HTML. This matches the approved plan's section 9 rationale.
- All accessibility requirements satisfied: `aria-hidden="true"` and `focusable="false"` on the decorative SVG (FR-09), `focus-visible` ring styles on both CTA links (FR-10), `prefers-reduced-motion: reduce` pauses all animations (FR-12).
- Import order follows frontend rules: React ecosystem imports first, then local feature imports. All local imports use `.js` extension.
- One component per file, `function` declaration export, props interface defined inline at top of file — all match conventions.
- No `any` types introduced.
- No new runtime dependencies.
- Commit format `cm-0022: <imperative summary>` is followed for all cm-0022 commits.
- Test files placed in `__tests__/features/home/` — matches client CLAUDE.md convention. The approved plan's test paths (`__tests__/components/`) were incorrect; the implementation's placement is correct per actual project convention.

## Verdict

**Status**: APPROVED

Zero issues at medium or above. Approved by agent.

## Next Steps

Next: `/test cm-0022`

Override: `/approve .claude/reviews/cm-0022/code-review.md` or edit frontmatter to `status: rejected`
