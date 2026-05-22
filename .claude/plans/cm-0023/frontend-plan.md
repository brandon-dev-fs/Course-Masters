---
id: cm-0023
title: Expand Design Token System with Named Color Palette
stage: design
status: approved
approver: human
approved_at: 2026-05-21T00:00:00Z
---

# Frontend Plan — Expand Design Token System with Named Color Palette

## Overview

This is a pure styling and design system change. No new components, routes, or API calls are introduced. The work expands `client/src/index.css` with a named color palette, rewires the existing generic token aliases to point at the new named tokens, and replaces all hardcoded hex values found in non-SVG TSX files with design token references.

Acceptance criteria satisfied by this plan:

- FR-01 through FR-03: New named tokens defined in `:root` and `.dark`; `@theme inline` updated; existing token names preserved as aliases.
- FR-04 through FR-05: Brand hex values updated to rebranded values for both themes.
- FR-06: Orange family introduced with full surface system.
- FR-07: All hardcoded hex values in auditable TSX files replaced.
- FR-08: `CalendarModal.tsx` color array refactored.
- FR-09: `HeroSection.tsx` hardcoded background and ring-offset replaced.
- FR-10: `.claude/rules/design.md` updated with expanded token documentation.

The audit confirmed that hardcoded hex values exist only in `SolarSystemSvg.tsx` (excluded by spec), `HeroSection.tsx`, `CalendarModal.tsx`, `SolarSystemSvg.test.tsx` (excluded), and `MonthGrid.test.tsx` (which uses a fixture hex — `#ff0000` — that is not a brand color and is fine to leave as a test fixture).

---

## Implementation Steps

Execute in this order to avoid breakage at any intermediate state.

### Step 1 — Expand `client/src/index.css`: add named tokens to `:root`

Insert a new "Named color tokens" subsection inside `:root`, immediately after the existing "Brand" block and before the "Surfaces" block. Define named tokens first with their hex values, then rewrite the generic alias tokens to use `var()` references to the new named tokens.

The full `:root` brand block after this step:

```css
/* Brand — named tokens (new) */
--green-primary:             #047857;
--green-primary-foreground:  #FFFFFF;
--green-surface:             #ECFDF5;
--green-surface-text:        #065F46;
--green-button:              #047857;
--green-button-text:         #FFFFFF;

--blue-accent:               #2563EB;
--blue-accent-foreground:    #FFFFFF;
--blue-surface:              #EFF6FF;
--blue-surface-text:         #1E40AF;

--orange-accent:             #EA580C;
--orange-accent-foreground:  #FFFFFF;
--orange-surface:            #FFF7ED;
--orange-surface-text:       #9A3412;

/* Surface and text tokens (new) */
--border-subtle:             #F3F4F6;
--text-primary:              #111827;
--text-secondary:            #6B7280;

/* Hero section token (theme-invariant — always deep dark) */
--hero-deep:                 #0a0a16;

/* Brand — generic aliases (backward compatibility) */
--primary:                   var(--green-primary);
--primary-foreground:        var(--green-primary-foreground);
--primary-subtle:            var(--green-surface);
--accent:                    var(--blue-accent);
--accent-foreground:         var(--blue-accent-foreground);
--accent-subtle:             var(--blue-surface);
```

The following `:root` tokens are unchanged: `--charcoal`, `--charcoal-foreground`, `--background`, `--foreground`, `--surface`, `--surface-raised`, `--border`, `--muted`, `--muted-foreground`, `--destructive`, `--destructive-foreground`, `--success`, `--warning`, all `--shadow-*` values.

### Step 2 — Expand `client/src/index.css`: add named tokens to `.dark`

Inside the `.dark` block, insert the same named tokens with their dark values, then rewrite the generic aliases identically. The `--hero-deep` token is defined once in `:root` only — it is theme-invariant and must not be redefined in `.dark`.

The `.dark` brand block after this step:

```css
/* Brand — named tokens (new) */
--green-primary:             #10B981;
--green-primary-foreground:  #FFFFFF;
--green-surface:             rgba(4, 120, 87, 0.15);
--green-surface-text:        #6EE7B7;
--green-button:              #047857;  /* invariant — same as light */
--green-button-text:         #FFFFFF;

--blue-accent:               #60A5FA;
--blue-accent-foreground:    #FFFFFF;
--blue-surface:              rgba(37, 99, 235, 0.15);
--blue-surface-text:         #93C5FD;

--orange-accent:             #FB923C;
--orange-accent-foreground:  #FFFFFF;
--orange-surface:            rgba(234, 88, 12, 0.15);
--orange-surface-text:       #FDBA74;

/* Surface and text tokens (new) */
--border-subtle:             rgba(255, 255, 255, 0.06);
--text-primary:              #F9FAFB;
--text-secondary:            #A1A1AA;

/* Brand — generic aliases (backward compatibility) */
--primary:                   var(--green-primary);
--primary-foreground:        var(--green-primary-foreground);
--primary-subtle:            var(--green-surface);
--accent:                    var(--blue-accent);
--accent-foreground:         var(--blue-accent-foreground);
--accent-subtle:             var(--blue-surface);
```

The following `.dark` tokens are unchanged from their current values: `--charcoal`, `--charcoal-foreground`, `--background`, `--foreground`, `--surface`, `--surface-raised`, `--border`, `--muted`, `--muted-foreground`, `--destructive`, `--destructive-foreground`, `--success`, `--warning`, all `--shadow-*` values.

### Step 3 — Expand `client/src/index.css`: register new tokens in `@theme inline`

Append new `--color-*` entries to the `@theme inline` block so Tailwind generates utility classes for all new tokens. Add these entries after the existing `--color-warning` line:

```css
/* Named brand tokens */
--color-green-primary:            var(--green-primary);
--color-green-primary-foreground: var(--green-primary-foreground);
--color-green-surface:            var(--green-surface);
--color-green-surface-text:       var(--green-surface-text);
--color-green-button:             var(--green-button);
--color-green-button-text:        var(--green-button-text);

--color-blue-accent:              var(--blue-accent);
--color-blue-accent-foreground:   var(--blue-accent-foreground);
--color-blue-surface:             var(--blue-surface);
--color-blue-surface-text:        var(--blue-surface-text);

--color-orange-accent:            var(--orange-accent);
--color-orange-accent-foreground: var(--orange-accent-foreground);
--color-orange-surface:           var(--orange-surface);
--color-orange-surface-text:      var(--orange-surface-text);

/* Surface and text tokens */
--color-border-subtle:            var(--border-subtle);
--color-text-primary:             var(--text-primary);
--color-text-secondary:           var(--text-secondary);

/* Hero section */
--color-hero-deep:                var(--hero-deep);
```

After this step, Tailwind utilities such as `bg-green-primary`, `text-blue-surface-text`, `bg-orange-surface`, `bg-hero-deep`, `ring-offset-hero-deep`, `text-text-secondary`, `border-border-subtle`, etc., are all generated automatically. The existing utilities (`bg-primary`, `text-accent`, `bg-primary-subtle`, etc.) continue to resolve correctly because their `--color-*` entries still point to the `--primary` / `--accent` custom properties, which now alias through to the named tokens.

### Step 4 — Update `client/src/features/home/HeroSection.tsx`

Replace all four occurrences of the hardcoded `#0a0a16` value with the `hero-deep` Tailwind utility:

| Current class | Replacement class |
|---|---|
| `bg-[#0a0a16]` (line 15, the logged-in variant) | `bg-hero-deep` |
| `bg-[#0a0a16]` (line 29, the guest variant) | `bg-hero-deep` |
| `ring-offset-[#0a0a16]` (line 48, Get Started link) | `ring-offset-hero-deep` |
| `ring-offset-[#0a0a16]` (line 54, Sign In link) | `ring-offset-hero-deep` |

No logic changes. Only the four class strings change.

### Step 5 — Update `client/src/features/courses/CalendarModal.tsx`: CalendarModal decision

**Decision: Replace the two brand hex values with CSS custom property references via `var()` in inline styles; keep the five calendar-specific hex values as documented literals with a clarifying comment.**

Rationale: The calendar color array is consumed as a string value in `style={{ backgroundColor: m.color }}`. Tailwind utility classes cannot be used there — CSS variable strings via `var(--green-primary)` work correctly in inline styles. The five non-brand calendar colors (amber, violet, cyan, pink, emerald) are accent display colors for distinguishing unit markers on the calendar — they have no semantic role in the design system, are visually distinct from all existing tokens, and do not duplicate any changing brand value. Introducing `--calendar-*` CSS tokens for display-only colors with no dark-mode variants would add unnecessary complexity to `index.css` with no functional benefit. They remain as documented hex literals.

Replace the `UNIT_COLORS` constant (lines 8–16) as follows:

```ts
// Colors for unit calendar markers.
// Brand values use CSS custom properties so they track the design token system.
// Calendar-specific accent colors are intentional display colors outside the brand palette.
const UNIT_COLORS = [
  'var(--green-primary)',  // brand green (was #138808 — now tracks --green-primary)
  'var(--blue-accent)',    // brand blue  (was #085287 — now tracks --blue-accent)
  '#b45309',               // amber  — calendar accent, no token equivalent
  '#7c3aed',               // violet — calendar accent, no token equivalent
  '#0891b2',               // cyan   — calendar accent, no token equivalent
  '#be185d',               // pink   — calendar accent, no token equivalent
  '#16a34a',               // emerald — calendar accent, no token equivalent
];
```

No other changes to `CalendarModal.tsx` are needed.

### Step 6 — Update `.claude/rules/design.md`

Append a new section to `.claude/rules/design.md` with:

1. A complete token reference table covering all new named tokens (CSS property, Tailwind utility, light value, dark value, semantic role).
2. A backward-compatibility alias table mapping generic names to named token sources.
3. An orange-accent usage constraint note (large/bold text only — 3.1:1 contrast).
4. A dark-mode blue-accent constraint note (text-only, not as a button background with white label).
5. A `--hero-deep` usage note (theme-invariant, HeroSection only).
6. The WCAG contrast table from the wireframe.

---

## Files Modified

| File | Change Type | Summary |
|---|---|---|
| `client/src/index.css` | Modified | Add 17 named token properties to `:root` and `.dark`; add 21 new `--color-*` entries to `@theme inline`; rewrite `--primary`, `--accent`, and their variants as `var()` aliases |
| `client/src/features/home/HeroSection.tsx` | Modified | Replace 4 hardcoded `bg-[#0a0a16]` / `ring-offset-[#0a0a16]` classes with `bg-hero-deep` / `ring-offset-hero-deep` |
| `client/src/features/courses/CalendarModal.tsx` | Modified | Replace `UNIT_COLORS` entries `'#138808'` and `'#085287'` with `'var(--green-primary)'` and `'var(--blue-accent)'`; add explanatory comment |
| `.claude/rules/design.md` | Modified | Append token reference table, alias table, contrast table, and usage constraint notes |

No new files are created. No routes, components, hooks, or API modules are added.

---

## Backward Compatibility Strategy

The aliasing order in CSS guarantees zero visual regressions for existing code:

1. Named tokens are defined first as concrete hex values (or rgba values in dark mode).
2. Generic token names (`--primary`, `--accent`, etc.) are immediately redefined as `var(--green-primary)` and `var(--blue-accent)`.
3. The `@theme inline` block already maps `--color-primary: var(--primary)`, so `bg-primary` resolves through the chain: Tailwind utility → `var(--primary)` → `var(--green-primary)` → resolved hex.

This means every existing component using `bg-primary`, `text-accent`, `bg-primary-subtle`, `bg-accent-subtle`, `text-accent-foreground`, `text-primary-foreground`, or `border-primary` continues to render identically — except that the underlying hex values shift from the old brand colors (`#138808`, `#085287`) to the new brand colors (`#047857`, `#2563EB`). This is intentional and required by FR-04.

Tokens with no change to their resolved hex values (charcoal, warning, success, destructive, surfaces, borders, shadows) are untouched.

---

## Audit Summary

The hex audit covered all `.tsx` files under `client/src/features/` and `client/src/components/` excluding filenames containing `Svg`. Results:

| File | Hardcoded Hex Found | Action |
|---|---|---|
| `features/home/HeroSection.tsx` | `#0a0a16` × 4 | Replace with `bg-hero-deep` / `ring-offset-hero-deep` (Step 4) |
| `features/courses/CalendarModal.tsx` | `#138808`, `#085287`, `#b45309`, `#7c3aed`, `#0891b2`, `#be185d`, `#16a34a` | Replace brand colors with CSS var references; keep calendar accents as documented literals (Step 5) |
| `features/home/SolarSystemSvg.tsx` | Multiple SVG fill/stroke values | **Excluded by spec** |
| `__tests__/features/courses/MonthGrid.test.tsx` | `#ff0000` | Test fixture only — not a brand color, not subject to audit |
| All other `.tsx` files | None found | No action required |

---

## Testing Plan

This spec requires manual visual verification. There are no logic changes and no behavior changes — the test strategy is regression-focused.

### 1. Light Theme Visual Check (manual)

After implementation, run `npm run dev` and verify the following in a browser at `http://localhost:5000`:

| UI Region | What to verify |
|---|---|
| Nav bar | Brand mark and primary button still render in the expected green; no color shift beyond the intentional brand recolor |
| Course cards | `bg-primary-subtle` badge and `bg-accent-subtle` badge render in the correct light-green and light-blue washes respectively |
| Progress bars | `bg-primary` still renders the brand green |
| HeroSection (guest, unauthenticated) | Background is deep near-black; "Get Started" focus ring offset matches background; no gradient breaks |
| HeroSection (authenticated) | Compact banner renders in the same deep near-black |
| CalendarModal | Open from a course detail page; unit legend badges render with correct colors — first badge is brand green, second is brand blue, remaining five are their respective calendar accent colors |

### 2. Dark Theme Visual Check (manual)

Toggle dark mode via the theme button and verify:

| UI Region | What to verify |
|---|---|
| Nav bar | Primary button renders with the `--green-button` value (`#047857`) — theme-invariant, same as light |
| Course cards | Surface badges render in the rgba overlay style against the dark card background |
| CalendarModal | Brand color badges in the legend use the dark-theme values of `--green-primary` (`#10B981`) and `--blue-accent` (`#60A5FA`) — these values come through `var()` automatically |
| All text | Body text, muted text, and secondary text all maintain readability |

### 3. Contrast Spot-Check (manual)

Use browser DevTools color picker or a tool like the Colour Contrast Analyser to verify at least these pairings after implementation:

| Pair | Expected minimum |
|---|---|
| White on `--green-button` (`#047857`) | 5.1:1 — AA normal text |
| White on `--blue-accent` light (`#2563EB`) | 4.6:1 — AA normal text |
| `--green-surface-text` on `--green-surface` light | 7.2:1 — AA normal text |
| White on `--orange-accent` light (`#EA580C`) | ~3.1:1 — AA large text only; verify no small-text usage |

### 4. Existing Unit Tests

Run `npm test -w client` to verify that no existing component tests break. The only test touching a hex value in non-SVG territory is `MonthGrid.test.tsx`, which uses a fixture red (`#ff0000`) that is not touched by this spec.

---

## Open Questions

None. All design decisions have been resolved by the approved spec and wireframe:

- Orange semantic role: confirmed as in-progress, pending, and caution states.
- CalendarModal non-brand colors: confirmed to remain as documented hex literals with a comment.
- `--hero-deep` token: confirmed as theme-invariant (defined in `:root` only).
- `--blue-accent` dark value: confirmed as text-only; not to be used as a button background with white label in dark mode.
