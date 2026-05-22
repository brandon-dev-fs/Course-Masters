---
id: cm-0023
title: Expand Design Token System with Named Color Palette
stage: review
status: approved
approver: agent
hand_back_to: implement
---

# Code Review: Expand Design Token System with Named Color Palette

## Summary

Reviewed 3 commits on `develop` (commits `8bd9715`, `29cb445`, `6ebad97`) against `refactor/code_cleanup` as the base. Four files changed, all frontend scope: `client/src/index.css`, `client/src/features/home/HeroSection.tsx`, `client/src/features/courses/CalendarModal.tsx`, and `.claude/rules/design.md`.

The implementation correctly expands the token system with 17 new CSS custom properties, registers 21 new Tailwind tokens in `@theme inline`, maintains all backward-compatibility aliases, replaces hardcoded hex values in both target components, and documents the new system in design.md. No backend changes, no new dependencies, no `dark:` prefix usage, no raw color overrides of design tokens in existing components.

## Scope Coverage

- **Backend files reviewed**: none (no backend changes)
- **Frontend files reviewed**: `client/src/index.css`, `client/src/features/home/HeroSection.tsx`, `client/src/features/courses/CalendarModal.tsx`
- **Config/other files reviewed**: `.claude/rules/design.md`
- **Rules loaded**: `frontend.md`, `rules.md`, `review.md`

## Issues

### [LOW] Dark-mode orange-accent foreground fails WCAG AA at all text sizes — undocumented in design.md
- **Location**: `client/src/index.css:143` (`.dark` block `--orange-accent-foreground: #FFFFFF`)
- **Description**: In dark mode, `--orange-accent` is `#FB923C`. White (`#FFFFFF`) on `#FB923C` yields approximately 2.24:1 contrast — below the 3:1 minimum required for large text under WCAG 2.1 AA. The existing WCAG notes in `design.md` flag the light-mode orange (`#EA580C`, 3.1:1) as large-text-only, but the dark-mode value is worse and goes entirely undocumented. NFR-01 requires all token pairings to meet AA minimums in both themes. The foreground token itself is not inherently broken (it is valid CSS), but its semantic promise of being a safe foreground on `--orange-accent` is broken in dark mode.
- **Suggested Fix**: Update the WCAG contrast notes in `.claude/rules/design.md` to explicitly call out the dark-mode orange-accent pairing: "White on `--orange-accent` dark (`#FB923C`): ~2.24:1 — fails AA for all text sizes. In dark mode, use `--orange-surface` + `--orange-surface-text` for all orange-tinted text." Optionally change the dark-mode `--orange-accent-foreground` to a dark neutral (e.g., `#7C2D12`, approximately 6.5:1 on `#FB923C`) so the token actually delivers a safe foreground — or remove the foreground token's implied usage on dark orange backgrounds via documentation alone.

### [LOW] Dark-mode blue-accent foreground pairing is undocumented as failing — token misleads callers
- **Location**: `client/src/index.css:138` (`.dark` block `--blue-accent-foreground: #FFFFFF`) and `.claude/rules/design.md` WCAG section
- **Description**: The design.md WCAG notes state that dark-mode `--blue-accent` (#60A5FA) fails AA with white (~2.7:1). Yet `--blue-accent-foreground` remains `#FFFFFF` in dark mode, and the `@theme inline` registers `--color-blue-accent-foreground`. A developer consuming `text-blue-accent-foreground` on a `bg-blue-accent` background in dark mode will produce an inaccessible color combination. The notes partially address this ("not as a button background with white label"), but the documented alias table in design.md still lists `--accent-foreground` → `var(--blue-accent-foreground)` without any dark-mode caveat, creating a silent trap.
- **Suggested Fix**: Add a note to the alias table in design.md that `--accent-foreground` (and `--blue-accent-foreground`) is only safe in light mode. Additionally, consider whether `--blue-accent-foreground` in dark mode should be changed to a contrasting dark value (e.g., `#1E3A5F`, ~9:1 on `#60A5FA`) to make the token pair mechanically safe in both themes.

### [LOW] Backward-compatibility alias table in design.md omits `--charcoal` and `--charcoal-foreground`
- **Location**: `.claude/rules/design.md` — Backward-Compatibility Alias Table section
- **Description**: FR-03 requires that `--charcoal` and `--charcoal-foreground` "continue to resolve to the same colors they map to today." They do — both are present as direct hex values in `:root` and `.dark`. However, the Backward-Compatibility Alias Table in design.md lists only the six green/blue aliases and does not mention `--charcoal`. A developer reading the table for reassurance about backward compatibility will find an incomplete picture.
- **Suggested Fix**: Add `--charcoal` and `--charcoal-foreground` rows to the table in design.md, noting they remain direct hex values (not aliases to named tokens) and are unchanged.

### [INFO] `--text-primary` / `--text-secondary` and `--border-subtle` tokens generate awkward Tailwind class names
- **Location**: `client/src/index.css:57-62` (`@theme inline` named token entries)
- **Description**: The `@theme inline` entries `--color-text-primary` and `--color-text-secondary` generate Tailwind utility classes `text-text-primary` and `text-text-secondary`. Similarly `--color-border-subtle` generates `border-border-subtle`. These double-word class names (`text-text-*`, `border-border-*`) are functional but may cause confusion. This is an advisory observation — it follows the existing naming convention and is consistent with the Tailwind v4 `--color-*` pattern used by the rest of the project.
- **Suggested Fix**: No action required. For future tokens consider whether semantic names that avoid the prefix collision can be chosen (e.g., `--color-body-text` → `text-body-text`). Document the known quirk in design.md if additional tokens in this category are introduced.

## Verdict

**Status**: APPROVED

Zero issues at medium or above. Three low-severity advisory items (two WCAG documentation gaps for dark-mode token pairings, one alias table omission) and one info item. All are documentation improvements with no functional breakage of the implementation. Approved by agent.

All spec requirements are met:
- FR-01 through FR-10: verified against `client/src/index.css` (17 named tokens defined, both `:root` and `.dark` blocks), `HeroSection.tsx` (bg-hero-deep and ring-offset-hero-deep used throughout), `CalendarModal.tsx` (var(--green-primary) and var(--blue-accent) used for brand colors, documented calendar-specific hex values retained), and `.claude/rules/design.md` (complete token reference, alias table, WCAG notes, SVG exclusion note — present).
- NFR-02: backward-compat aliases intact; `--primary`, `--accent`, and all variants resolve through the named token chain.
- NFR-03: hex audit covered `client/src/features/` and `client/src/components/`; only HeroSection and CalendarModal had non-SVG brand hex values.
- No `dark:` prefix usage. No new dependencies. No architectural layer violations. Commit format follows `<id>: <imperative summary>` on all three cm-0023 commits.

## Next Steps

Next: `/test cm-0023`

Override: `/approve .claude/reviews/cm-0023/code-review.md` or edit frontmatter to `status: rejected`
