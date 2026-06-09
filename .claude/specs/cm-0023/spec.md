---
id: cm-0023
title: Expand Design Token System with Named Color Palette
stage: spec
status: approved
approver: human
approved_at: 2026-05-21T00:00:00Z
---

# Expand Design Token System with Named Color Palette

## Problem Statement

The current design token system uses generic semantic names (`primary`, `accent`, `charcoal`) that do not communicate the actual color identity. As the brand evolves, the token naming convention needs to explicitly encode the color family (e.g., `green-primary`, `blue-accent`) so that developers can reason about the palette without inspecting hex values. Additionally, the brand color values themselves are being updated as part of a deliberate rebranding, and several component files contain hardcoded hex values that bypass the token system entirely, undermining theme consistency and dark mode support.

## Scope

### In Scope

- Define new CSS custom properties in `client/src/index.css` using the named color convention (`green-primary`, `blue-accent`, etc.) for both light and dark themes
- Register the new tokens in the Tailwind `@theme inline` block so they are available as utility classes
- Introduce an orange color family with tokens whose semantic purpose is determined during design
- Update brand color hex values in both light and dark themes to the new rebranded values
- Preserve all existing token names (`primary`, `accent`, `charcoal`, etc.) as aliases pointing to the new named tokens, ensuring zero breakage of current component usage
- Audit all component TSX files for hardcoded hex color values and replace them with the appropriate design tokens
- Update `.claude/rules/design.md` with the full token definitions, Tailwind utility mappings, and accessibility contrast notes
- Ensure all new and updated tokens meet WCAG 2.1 AA contrast requirements (4.5:1 for normal text, 3:1 for large text) against their intended background surfaces

### Out of Scope

- SVG illustration files (e.g., `SolarSystemSvg.tsx`) — hardcoded colors in SVG elements are not subject to the token audit
- SVG test files (e.g., `SolarSystemSvg.test.tsx`) — assertions on SVG fill values are excluded
- Changes to the `rich-text` CSS class styles in `index.css` (these already reference tokens correctly)
- Shadow token changes (the warm shadow system is unaffected)
- Typography or font changes
- Creating a new standalone design system documentation file — token documentation goes into the existing `.claude/rules/design.md`
- Any backend or API changes

## Requirements

### Functional Requirements

- FR-01: New CSS custom properties are defined in `:root` (light) and `.dark` blocks using the naming convention `--<color>-<role>` (e.g., `--green-primary`, `--green-primary-foreground`, `--blue-accent`, `--blue-accent-foreground`, `--orange-<role>`)
- FR-02: Each new named token is registered in the `@theme inline` block so that Tailwind utility classes like `bg-green-primary`, `text-blue-accent`, etc. are generated
- FR-03: Existing generic token names (`--primary`, `--accent`, `--charcoal`, and all their variants like `--primary-foreground`, `--primary-subtle`, `--accent-foreground`, `--accent-subtle`, `--charcoal-foreground`) continue to resolve to the same colors they map to today, preserving backward compatibility
- FR-04: The light theme brand color hex values are updated to the new rebranded values as specified during design
- FR-05: The dark theme brand color hex values are updated to maintain appropriate brightness adjustments relative to the new light theme values
- FR-06: An orange color family is introduced with at minimum: base, foreground, and subtle variants for both light and dark themes — the semantic purpose of the orange tokens is determined during the design stage
- FR-07: All hardcoded hex color values in component TSX files (excluding SVG illustrations) are replaced with references to design tokens, either via Tailwind utility classes or CSS custom properties
- FR-08: The `CalendarModal.tsx` unit color palette (currently hardcoded hex array) is refactored to use design tokens
- FR-09: The `HeroSection.tsx` hardcoded background color (`#0a0a16`) and ring offset colors are refactored to use a design token
- FR-10: `.claude/rules/design.md` is updated with a complete token reference table, Tailwind class mappings, and accessibility contrast notes for the expanded palette

### Non-Functional Requirements

- NFR-01: All color token pairings (background + foreground) meet WCAG 2.1 AA contrast minimums — 4.5:1 for normal text, 3:1 for large text and UI components — in both light and dark themes
- NFR-02: Zero visual regressions in components that currently use the generic token names (`bg-primary`, `text-accent`, etc.) — the aliasing strategy must produce identical rendered colors for existing code
- NFR-03: The token audit must cover every `.tsx` file under `client/src/features/` and `client/src/components/`, excluding files whose name contains `Svg`

## Systems-Level Architecture

### Components Involved

**Modified files:**

- `client/src/index.css` — new CSS custom properties in `:root` and `.dark`, new entries in `@theme inline`
- `client/src/features/courses/CalendarModal.tsx` — replace hardcoded hex color array with token references
- `client/src/features/home/HeroSection.tsx` — replace hardcoded `#0a0a16` background and ring offset colors with tokens
- `.claude/rules/design.md` — add token reference documentation

**Potentially modified files (pending audit):**

- Any additional `.tsx` file under `client/src/features/` or `client/src/components/` found to contain hardcoded hex color values outside of SVG elements

### Data Model Changes

None. This is a purely frontend styling change.

### API Changes

None.

### Data Flow

1. New named CSS custom properties are defined in `client/src/index.css` within the `:root` and `.dark` blocks
2. The `@theme inline` block maps each new property to a Tailwind color token, making utility classes available project-wide
3. Existing generic token variables (`--primary`, `--accent`, etc.) are updated to reference the new brand hex values, or alternatively the new named tokens alias to the same underlying values — either approach preserves backward compatibility
4. Component files with hardcoded colors are updated to use the appropriate Tailwind utility classes or CSS variable references
5. The design rules file is updated so future development references the expanded token system

### Integration Points

- **Tailwind CSS v4 theming** — the `@theme inline` block in `index.css` is the single source of truth for all Tailwind color utilities; new tokens must follow the existing pattern of referencing CSS custom properties
- **ThemeContext** — toggles the `.dark` class on `<html>`; new tokens must define both light and dark variants to work with the existing theme toggle
- **Existing component usage** — all current references to `bg-primary`, `text-accent`, `border-border`, etc. must continue to work unchanged

## Required Design Artifacts

- [ ] Backend plan (`backend-plan.md`)
- [ ] API contract (`api-contract.md`)
- [x] Frontend plan (`frontend-plan.md`)
- [x] UI wireframe (`wireframe.md`)
