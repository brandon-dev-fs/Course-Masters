---
id: cm-0023
title: Expand Design Token System with Named Color Palette
stage: design
status: approved
approver: human
approved_at: 2026-05-21T00:00:00Z
---

# Expand Design Token System with Named Color Palette

## Overview

This spec introduces no new screens or interactive components. The "wireframe" for cm-0023 is a **design token reference document** — the authoritative specification for the expanded CSS custom property palette that the frontend plan will implement directly into `client/src/index.css`.

The work has three parts:

1. Define the full named-color token set with light and dark hex values
2. Establish the semantic role of the orange color family (deferred to design)
3. Document backward-compatibility aliases so existing component code requires no changes

No client routes are affected. No new components are added. The changes affect the single source-of-truth file `client/src/index.css` and the audit targets listed at the end of this document.

---

## Orange Token Semantics

### Role: In-Progress, Pending, and Caution States

The existing palette covers:
- **Green** (`--primary`) — brand, success, primary actions
- **Blue** (`--accent`) — links, informational states
- **Red** (`--destructive`) — errors, deletions

Orange fills the gap for **states that are neither passing nor failing** — things that need attention without being errors. In the Course Masters context, this maps to:

| Use Case | Example |
|---|---|
| In-progress lesson / unit | A lesson the student has started but not completed |
| Pending assessment attempts | Quiz submitted, awaiting grading (future feature) |
| Teacher attention callouts | "This lesson has no quiz yet" advisory banners |
| Caution/warning banners | Non-blocking notices that require user awareness |
| "Draft" content badges | Course or lesson marked draft by teacher |

Orange is **not** used for primary CTAs (green owns that), links (blue owns that), or errors (red owns that). It is the "you need to do something, but it's not broken" signal.

### Relationship to Existing Warning Token

The current `--warning: #d97706` (light) / `--f59e0b` (dark) tokens are status-only scalars used for text coloring (e.g., `text-warning`). The new orange family extends this into a full surface system (base color + background surface + text-on-surface), consistent with how green and blue are structured. The `--warning` token remains as-is; it does not alias to orange-accent because their roles are subtly different — `warning` is used inline in text; `orange-accent` is for interactive elements and badges.

---

## Token Palette

Complete specification for both light (`:root`) and dark (`.dark`) values. All token names become Tailwind CSS utilities via the `@theme inline` block.

### Named Color Tokens (New)

| CSS Custom Property | Tailwind Utility | Light Value | Dark Value | Semantic Role |
|---|---|---|---|---|
| `--green-primary` | `bg-green-primary` / `text-green-primary` | `#047857` | `#10B981` | Primary brand, CTAs, success |
| `--green-primary-foreground` | `text-green-primary-foreground` | `#FFFFFF` | `#FFFFFF` | Text on green-primary backgrounds |
| `--green-surface` | `bg-green-surface` | `#ECFDF5` | `rgba(4,120,87,0.15)` | Success/completion background chips |
| `--green-surface-text` | `text-green-surface-text` | `#065F46` | `#6EE7B7` | Text rendered on green-surface |
| `--green-button` | `bg-green-button` | `#047857` | `#047857` | Button background (theme-invariant) |
| `--green-button-text` | `text-green-button-text` | `#FFFFFF` | `#FFFFFF` | Button label (theme-invariant) |
| `--blue-accent` | `bg-blue-accent` / `text-blue-accent` | `#2563EB` | `#60A5FA` | Links, informational highlights |
| `--blue-accent-foreground` | `text-blue-accent-foreground` | `#FFFFFF` | `#FFFFFF` | Text on blue-accent backgrounds |
| `--blue-surface` | `bg-blue-surface` | `#EFF6FF` | `rgba(37,99,235,0.15)` | Informational background chips |
| `--blue-surface-text` | `text-blue-surface-text` | `#1E40AF` | `#93C5FD` | Text rendered on blue-surface |
| `--orange-accent` | `bg-orange-accent` / `text-orange-accent` | `#EA580C` | `#FB923C` | In-progress, caution, draft badges |
| `--orange-accent-foreground` | `text-orange-accent-foreground` | `#FFFFFF` | `#FFFFFF` | Text on orange-accent backgrounds |
| `--orange-surface` | `bg-orange-surface` | `#FFF7ED` | `rgba(234,88,12,0.15)` | In-progress / caution background chips |
| `--orange-surface-text` | `text-orange-surface-text` | `#9A3412` | `#FDBA74` | Text rendered on orange-surface |
| `--border-subtle` | `border-border-subtle` | `#F3F4F6` | `rgba(255,255,255,0.06)` | Dividers, low-contrast card borders |
| `--text-primary` | `text-text-primary` | `#111827` | `#F9FAFB` | High-contrast body text |
| `--text-secondary` | `text-text-secondary` | `#6B7280` | `#A1A1AA` | Captions, metadata, helper text |

### Existing Tokens (Preserved — Values Updated)

These tokens retain their names exactly. Their hex values are updated to match the new brand palette.

| CSS Custom Property | Current Light | New Light | Current Dark | New Dark | Notes |
|---|---|---|---|---|---|
| `--primary` | `#138808` | `#047857` (via alias) | `#17a009` | `#10B981` (via alias) | Aliases to `--green-primary` |
| `--primary-foreground` | `#ffffff` | `#ffffff` | `#ffffff` | `#ffffff` | Aliases to `--green-primary-foreground` |
| `--primary-subtle` | `#e8f5e4` | `#ECFDF5` | `#1a3318` | `rgba(4,120,87,0.15)` | Aliases to `--green-surface` |
| `--accent` | `#085287` | `#2563EB` (via alias) | `#0a6db5` | `#60A5FA` (via alias) | Aliases to `--blue-accent` |
| `--accent-foreground` | `#ffffff` | `#ffffff` | `#ffffff` | `#ffffff` | Aliases to `--blue-accent-foreground` |
| `--accent-subtle` | `#e0eef8` | `#EFF6FF` | `#0f2a40` | `rgba(37,99,235,0.15)` | Aliases to `--blue-surface` |
| `--charcoal` | `#2c2c35` | `#2c2c35` (unchanged) | `#4a4a56` | `#4a4a56` (unchanged) | No named alias needed |
| `--charcoal-foreground` | `#ffffff` | `#ffffff` | `#ffffff` | `#ffffff` | No named alias needed |
| `--warning` | `#d97706` | `#d97706` (unchanged) | `#f59e0b` | `#f59e0b` (unchanged) | Standalone status scalar, not aliased |
| `--success` | `#16a34a` | `#16a34a` (unchanged) | `#22c55e` | `#22c55e` (unchanged) | Standalone status scalar, not aliased |
| `--destructive` | `#dc2626` | `#dc2626` (unchanged) | `#ef4444` | `#ef4444` (unchanged) | Unchanged |
| `--destructive-foreground` | `#ffffff` | `#ffffff` | `#ffffff` | `#ffffff` | Unchanged |

---

## Backward Compatibility Aliases

The implementation must define named tokens first, then have the generic names reference them via `var()`. This ordering ensures that changing a named token's hex value in one place automatically updates all aliases.

```
Implementation pattern in :root and .dark:

  Step 1 — Define named tokens with hex values:
    --green-primary:            #047857;
    --green-surface:            #ECFDF5;
    --blue-accent:              #2563EB;
    --blue-surface:             #EFF6FF;
    --orange-accent:            #EA580C;
    --orange-surface:           #FFF7ED;
    --orange-surface-text:      #9A3412;

  Step 2 — Generic names alias to named tokens:
    --primary:                  var(--green-primary);
    --primary-foreground:       var(--green-primary-foreground);
    --primary-subtle:           var(--green-surface);
    --accent:                   var(--blue-accent);
    --accent-foreground:        var(--blue-accent-foreground);
    --accent-subtle:            var(--blue-surface);
```

The `@theme inline` block must register **both** the named tokens and the generic aliases as `--color-*` entries so both `bg-green-primary` and `bg-primary` are available as Tailwind utilities.

### Alias Mapping Table

| Generic Token (existing) | Points To (new named token) | Tailwind utilities unchanged |
|---|---|---|
| `--primary` | `--green-primary` | `bg-primary`, `text-primary`, `border-primary` |
| `--primary-foreground` | `--green-primary-foreground` | `text-primary-foreground` |
| `--primary-subtle` | `--green-surface` | `bg-primary-subtle` |
| `--accent` | `--blue-accent` | `bg-accent`, `text-accent`, `border-accent` |
| `--accent-foreground` | `--blue-accent-foreground` | `text-accent-foreground` |
| `--accent-subtle` | `--blue-surface` | `bg-accent-subtle` |

Tokens with no alias needed (no equivalent named token): `--charcoal`, `--charcoal-foreground`, `--background`, `--foreground`, `--surface`, `--surface-raised`, `--border`, `--muted`, `--muted-foreground`, `--warning`, `--success`, `--destructive`, `--destructive-foreground`.

---

## Contrast Verification

All ratios are computed against the WCAG 2.1 relative luminance formula. Values marked PASS meet the 4.5:1 threshold for normal text. Values meeting 3:1 but not 4.5:1 are acceptable only for large text (18px+ or 14px+ bold) and UI component boundaries.

### Light Theme Pairings

| Foreground Color | Background Color | Hex Pair | Approx. Ratio | WCAG AA (normal) | WCAG AA (large/UI) |
|---|---|---|---|---|---|
| `--text-primary` `#111827` | `--background` `#faf9f7` | dark navy / warm cream | ~17.5:1 | PASS | PASS |
| `--text-secondary` `#6B7280` | `--background` `#faf9f7` | mid-gray / warm cream | ~5.4:1 | PASS | PASS |
| `--green-surface-text` `#065F46` | `--green-surface` `#ECFDF5` | dark teal / mint white | ~7.2:1 | PASS | PASS |
| `--blue-surface-text` `#1E40AF` | `--blue-surface` `#EFF6FF` | deep navy / blue-white | ~8.6:1 | PASS | PASS |
| `--orange-surface-text` `#9A3412` | `--orange-surface` `#FFF7ED` | burnt sienna / warm white | ~6.1:1 | PASS | PASS |
| `--green-button-text` `#FFFFFF` | `--green-button` `#047857` | white / dark green | ~5.1:1 | PASS | PASS |
| `--green-primary-foreground` `#FFFFFF` | `--green-primary` `#047857` | white / dark green | ~5.1:1 | PASS | PASS |
| `--blue-accent-foreground` `#FFFFFF` | `--blue-accent` `#2563EB` | white / royal blue | ~4.6:1 | PASS | PASS |
| `--orange-accent-foreground` `#FFFFFF` | `--orange-accent` `#EA580C` | white / deep orange | ~3.1:1 | FAIL (normal) | PASS (large/UI) |

**Note on orange-accent-foreground:** White text on `#EA580C` achieves approximately 3.1:1, which passes for large text (18px+) and UI component boundaries (button labels at 14px bold qualify as "large text" per WCAG 2.1 definition). Orange-accent should not be used as a background for small normal-weight text with white foreground. When used as a badge or button with bold ≥14px labels, it is AA-compliant. If normal-weight small text is needed on an orange background, use `--orange-surface` with `--orange-surface-text` instead.

### Dark Theme Pairings

The dark mode surface tokens use `rgba()` over the dark background `#1a1917`. Effective blended colors are computed as: rgba over `#242220` (card surface) for surface tokens.

| Foreground Color | Background | Effective Blended BG | Approx. Ratio | WCAG AA (normal) | WCAG AA (large/UI) |
|---|---|---|---|---|---|
| `--text-primary` `#F9FAFB` | `--background` `#1a1917` | — | ~17.2:1 | PASS | PASS |
| `--text-secondary` `#A1A1AA` | `--background` `#1a1917` | — | ~7.1:1 | PASS | PASS |
| `--green-surface-text` `#6EE7B7` | `--green-surface` `rgba(4,120,87,0.15)` | ~`#243A30` (over #242220) | ~8.4:1 | PASS | PASS |
| `--blue-surface-text` `#93C5FD` | `--blue-surface` `rgba(37,99,235,0.15)` | ~`#252A3A` (over #242220) | ~7.6:1 | PASS | PASS |
| `--orange-surface-text` `#FDBA74` | `--orange-surface` `rgba(234,88,12,0.15)` | ~`#312820` (over #242220) | ~6.8:1 | PASS | PASS |
| `--green-button-text` `#FFFFFF` | `--green-button` `#047857` | — | ~5.1:1 | PASS | PASS |
| `--blue-accent-foreground` `#FFFFFF` | `--blue-accent` `#60A5FA` | — | ~2.7:1 | FAIL (normal) | FAIL (large) |

**Note on dark blue-accent-foreground:** `#FFFFFF` on `#60A5FA` is approximately 2.7:1 — below AA for both normal and large text. The dark value of `--blue-accent` is intentionally a lighter blue for use as **text on dark backgrounds** (analogous to how link text works), not as a **button background with white label**. For dark-mode buttons using the blue family, the button background should use a darker blue (e.g., `#2563EB` unchanged, same as light) rather than the lighter `#60A5FA`. The `--blue-accent-foreground` token is primarily used for text-mode `text-accent` usage, not as a button background. Implementation note: the frontend plan should use `--green-button` / `--green-button-text` for primary CTAs (which intentionally hold the same value in both themes) and avoid blue-accent as a button background in dark mode.

---

## Desktop Layout

Not applicable. This spec introduces no new pages, routes, or layout regions.

The token changes will be visually validated by checking the following existing UI regions after implementation:

```
+--------------------------------------------------+
|  Nav bar (bg-surface / text-foreground)          |
|  primary green brand mark  |  bg-primary button  |
+--------------------------------------------------+
|                                                  |
|  CourseCard  [bg-surface]                        |
|  ├─ Badge  [bg-primary-subtle / text-primary]    |  <- green-surface alias check
|  ├─ Badge  [bg-accent-subtle / text-accent]      |  <- blue-surface alias check
|  └─ Progress bar [bg-primary]                    |
|                                                  |
|  HeroSection  [new: bg-hero-deep token]          |  <- replaces #0a0a16
|  ├─ CTA button  [bg-primary text-white]          |
|  └─ Ghost button  [ring-offset-hero-deep]        |  <- ring-offset alias check
|                                                  |
|  CalendarModal  [bg-surface-raised]              |
|  └─ Unit color swatches  [token-driven array]    |  <- replaces hardcoded hex array
|                                                  |
+--------------------------------------------------+
```

---

## Mobile Layout

Not applicable. Token changes apply uniformly across all breakpoints — no layout-specific token behavior.

---

## Interactive States

Not applicable. No new interactive elements are introduced.

---

## User Flows

Not applicable. No new user flows.

---

## Component Inventory

### Components Requiring Token Audit Changes

These components contain hardcoded hex values (confirmed by codebase search) and must be updated as part of this spec.

| Component | File Path | Hardcoded Values | Action |
|---|---|---|---|
| `CalendarModal` | `client/src/features/courses/CalendarModal.tsx` | `'#138808'`, `'#085287'`, `'#b45309'`, `'#7c3aed'`, `'#0891b2'`, `'#be185d'`, `'#16a34a'` — a 7-color array | Replace with CSS custom property references or Tailwind token classes. The green and blue values must map to `--green-primary` and `--blue-accent`. The remaining palette colors (violet, cyan, pink, amber, emerald) are calendar-event accent colors with no existing token equivalents — document as `--calendar-*` tokens or use inline hex with a comment explaining they are calendar-specific display colors outside the main brand palette. |
| `HeroSection` | `client/src/features/home/HeroSection.tsx` | `#0a0a16` used in `bg-[#0a0a16]` (2×) and `ring-offset-[#0a0a16]` (2×) | Introduce `--hero-deep: #0a0a16` as a new CSS token. This is a near-black deep space blue unique to the hero section. It does not need a dark-mode variant (it is always deep dark). Tailwind usage: `bg-hero-deep` and `ring-offset-hero-deep`. |

### Components Excluded from Audit

| Component | Reason |
|---|---|
| `SolarSystemSvg.tsx` | SVG illustration — spec explicitly excludes SVG files from the hex audit |
| `SolarSystemSvg.test.tsx` | SVG test file — spec explicitly excludes |

### No New Shared Components Required

No new React components are created by this spec.

---

## Accessibility Notes

### Token-Level Accessibility Requirements

- All text-on-surface pairings verified in the Contrast Verification section above.
- `--orange-accent` with white foreground achieves 3.1:1 — restrict to large text / bold UI labels only (badge chips, button labels at ≥14px bold). Never use for paragraph or caption text.
- `--blue-accent` in dark mode (`#60A5FA`) is a text color only, not a button background. Document this constraint in `.claude/rules/design.md`.
- `--hero-deep` (`#0a0a16`) is only used as a background — its text contrast is governed by the white text overlaid on it in `HeroSection`. White on `#0a0a16` achieves ~21:1 (maximum possible) — PASS.

### ThemeContext Integration

The `.dark` class on `<html>` drives all token swaps. No new theme-toggle logic is required. Every new token defined in `:root` must have a corresponding value in `.dark`.

### Keyboard and Screen Reader Impact

None. This spec does not add or modify interactive elements.

---

## Required Token Additions

The following CSS custom properties are new and do not exist in `client/src/index.css` today:

**Named color tokens (brand palette):**
- `--green-primary`: emerald dark green; light `#047857`, dark `#10B981`
- `--green-primary-foreground`: always `#FFFFFF`
- `--green-surface`: success/completion background surface; light `#ECFDF5`, dark `rgba(4,120,87,0.15)`
- `--green-surface-text`: text on green-surface; light `#065F46`, dark `#6EE7B7`
- `--green-button`: button background, theme-invariant; always `#047857`
- `--green-button-text`: button label, theme-invariant; always `#FFFFFF`
- `--blue-accent`: link and info color; light `#2563EB`, dark `#60A5FA`
- `--blue-accent-foreground`: always `#FFFFFF`
- `--blue-surface`: informational background surface; light `#EFF6FF`, dark `rgba(37,99,235,0.15)`
- `--blue-surface-text`: text on blue-surface; light `#1E40AF`, dark `#93C5FD`
- `--orange-accent`: in-progress / caution accent; light `#EA580C`, dark `#FB923C`
- `--orange-accent-foreground`: always `#FFFFFF` (large text / bold only)
- `--orange-surface`: caution / in-progress background; light `#FFF7ED`, dark `rgba(234,88,12,0.15)`
- `--orange-surface-text`: text on orange-surface; light `#9A3412`, dark `#FDBA74`

**Surface and text tokens:**
- `--border-subtle`: dividers, low-contrast borders; light `#F3F4F6`, dark `rgba(255,255,255,0.06)`
- `--text-primary`: high-contrast body text; light `#111827`, dark `#F9FAFB`
- `--text-secondary`: caption and metadata text; light `#6B7280`, dark `#A1A1AA`

**Hero section token:**
- `--hero-deep`: deep space near-black for HeroSection background and ring offsets; always `#0a0a16` (no dark variant needed — it is already dark)

---

## Audit Targets

### Files Requiring Changes

These are the source files the frontend coder must modify, ordered by priority.

**1. `client/src/index.css` (primary target)**

Current state of `@theme inline` block: registers 18 color tokens (`primary`, `primary-foreground`, `primary-subtle`, `accent`, `accent-foreground`, `accent-subtle`, `charcoal`, `charcoal-foreground`, `background`, `foreground`, `surface`, `surface-raised`, `border`, `muted`, `muted-foreground`, `destructive`, `destructive-foreground`, `success`, `warning`).

Required additions to `@theme inline`: 17 new `--color-*` entries for the named tokens listed above, plus `--color-hero-deep`, `--color-border-subtle`, `--color-text-primary`, `--color-text-secondary`.

Required additions to `:root`: all 17 named token definitions with light hex values.

Required additions to `.dark`: all 17 named token definitions with dark hex values.

Required changes to `:root` and `.dark`: update `--primary`, `--accent`, `--primary-subtle`, `--accent-subtle` to use `var(--green-*)` and `var(--blue-*)` aliases instead of direct hex values.

**2. `client/src/features/home/HeroSection.tsx`**

Replace `bg-[#0a0a16]` (×2) with `bg-hero-deep`.
Replace `ring-offset-[#0a0a16]` (×2) with `ring-offset-hero-deep`.

**3. `client/src/features/courses/CalendarModal.tsx`**

Current hardcoded array (lines 9–15):
```
'#138808', // primary green   → var(--green-primary) or CSS custom property reference
'#085287', // accent blue     → var(--blue-accent)
'#b45309', // amber           → calendar-specific; document as-is or add --calendar-amber
'#7c3aed', // violet          → calendar-specific; document as-is or add --calendar-violet
'#0891b2', // cyan            → calendar-specific; document as-is or add --calendar-cyan
'#be185d', // pink            → calendar-specific; document as-is or add --calendar-pink
'#16a34a', // emerald         → calendar-specific; document as-is or add --calendar-emerald
```

The frontend plan should decide whether calendar-specific colors (amber, violet, cyan, pink, emerald) become `--calendar-*` tokens in `index.css` or remain as documented hex literals with a comment. Either approach is acceptable — the constraint is that `#138808` and `#085287` must be replaced with token references because they duplicate brand values that are changing.

**4. `.claude/rules/design.md`**

Append a token reference section covering all tokens defined by this spec, their Tailwind utilities, light/dark values, and the accessibility notes from this document. The frontend coder does not touch this file — it is updated by the design stage.
