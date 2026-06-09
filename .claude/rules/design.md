---
description: Run the design stage. Produces wireframe, plans, and api-contract based on the spec's Required Design Artifacts checklist.
argument-hint: <spec id> [review.md]
---

# /design

You are running the **Design stage**. Read the approved spec, determine which design artifacts are needed, orchestrate the relevant agents and skills.

## Arguments

- Spec ID: $ARGUMENTS (first argument, required)
- Review doc path: (optional second argument) — rejected review for revision

If spec ID is empty, ask and stop.

## Procedure

### 1. Verify environment

- `CLAUDE.md` exists. If missing: `Run /init to generate CLAUDE.md first.`
- `.claude/config.yaml` and `.claude/rules.md` exist.
- Create `.claude/designs/<id>/` and `.claude/plans/<id>/` if missing.

### 2. Read and verify spec

- Load `.claude/specs/<id>/spec.md`. If not found, stop.
- If not `approved`, stop with approval instructions.

### 3. Parse Required Design Artifacts

Determine which skills to run from the checklist.

### 4. Check review feedback

If review doc provided: verify `status: rejected` and `hand_back_to: design`. Extract issues for agents.

### 5. Orchestrate skills (order matters)

**Step A: Backend plan + API contract** (if required)
- `backend-architect` agent. Reads `CLAUDE.md` and scoped rules lazily.
- Outputs: `.claude/plans/<id>/backend-plan.md`, `.claude/plans/<id>/api-contract.md`

**Step B: UI design** (if required, parallel with Step A)
- `designer` agent. Reads `CLAUDE.md` and design rules.
- Output: `.claude/designs/<id>/wireframe.md`

**Step C: Frontend plan** (if required, after Step A)
- `frontend-architect` agent. Reads api-contract from Step A.
- Output: `.claude/plans/<id>/frontend-plan.md`

### 6. Verify mechanically

Check each artifact has `status: pending` in frontmatter.

### 7. Report

List all produced artifacts awaiting approval with next steps.

## Constraints

- Write only to `.claude/designs/<id>/` and `.claude/plans/<id>/`.
- Never set `status: approved` on design artifacts.
- Overwrite existing artifacts on re-run.

---

## Design Tokens

All tokens are defined in `client/src/index.css` in the `:root` (light) and `.dark` blocks. The `@theme inline` block maps each CSS custom property to a Tailwind utility class.

### Named Color Token Reference

| CSS Property | Tailwind Utility | Light Value | Dark Value | Semantic Role |
|---|---|---|---|---|
| `--green-primary` | `bg-green-primary` / `text-green-primary` | `#047857` | `#10B981` | Brand primary green — buttons, progress, active states |
| `--green-primary-foreground` | `text-green-primary-foreground` | `#FFFFFF` | `#FFFFFF` | Text on `--green-primary` backgrounds |
| `--green-surface` | `bg-green-surface` | `#ECFDF5` | `rgba(4,120,87,0.15)` | Light green wash — badges, active tab bg |
| `--green-surface-text` | `text-green-surface-text` | `#065F46` | `#6EE7B7` | Text on `--green-surface` backgrounds |
| `--green-button` | `bg-green-button` | `#047857` | `#047857` | CTA button background — theme-invariant |
| `--green-button-text` | `text-green-button-text` | `#FFFFFF` | `#FFFFFF` | Text on CTA buttons — theme-invariant |
| `--blue-accent` | `bg-blue-accent` / `text-blue-accent` | `#2563EB` | `#60A5FA` | Brand secondary blue — links, info states |
| `--blue-accent-foreground` | `text-blue-accent-foreground` | `#FFFFFF` | `#FFFFFF` | Text on `--blue-accent` backgrounds (light only) |
| `--blue-surface` | `bg-blue-surface` | `#EFF6FF` | `rgba(37,99,235,0.15)` | Light blue wash — info badges, accent tab bg |
| `--blue-surface-text` | `text-blue-surface-text` | `#1E40AF` | `#93C5FD` | Text on `--blue-surface` backgrounds |
| `--orange-accent` | `bg-orange-accent` / `text-orange-accent` | `#EA580C` | `#FB923C` | In-progress, pending, caution states |
| `--orange-accent-foreground` | `text-orange-accent-foreground` | `#FFFFFF` | `#FFFFFF` | Text on `--orange-accent` (large/bold text only) |
| `--orange-surface` | `bg-orange-surface` | `#FFF7ED` | `rgba(234,88,12,0.15)` | Caution/pending wash — badges, alert bg |
| `--orange-surface-text` | `text-orange-surface-text` | `#9A3412` | `#FDBA74` | Text on `--orange-surface` backgrounds |
| `--border-subtle` | `border-border-subtle` | `#F3F4F6` | `rgba(255,255,255,0.06)` | Hairline dividers, subtle separators |
| `--text-primary` | `text-text-primary` | `#111827` | `#F9FAFB` | High-emphasis body text |
| `--text-secondary` | `text-text-secondary` | `#6B7280` | `#A1A1AA` | Secondary/helper text, captions |
| `--hero-deep` | `bg-hero-deep` / `ring-offset-hero-deep` | `#0a0a16` | `#0a0a16` | HeroSection background — theme-invariant, `:root` only |

### Backward-Compatibility Alias Table

The generic token names are aliased to the new named tokens. All existing Tailwind utility classes continue to work unchanged.

| Generic Token | Resolves To | Tailwind Utility |
|---|---|---|
| `--primary` | `var(--green-primary)` | `bg-primary`, `text-primary` |
| `--primary-foreground` | `var(--green-primary-foreground)` | `text-primary-foreground` |
| `--primary-subtle` | `var(--green-surface)` | `bg-primary-subtle` |
| `--accent` | `var(--blue-accent)` | `bg-accent`, `text-accent` |
| `--accent-foreground` | `var(--blue-accent-foreground)` | `text-accent-foreground` |
| `--accent-subtle` | `var(--blue-surface)` | `bg-accent-subtle` |

### WCAG Contrast Notes

**Orange accent (`--orange-accent`) — use with caution:**
- White foreground on `--orange-accent` light (`#EA580C`): ~3.1:1 — passes AA for large text (18pt+) and bold large text (14pt bold+) only.
- Do NOT use `text-white` on an `--orange-accent` background for normal body text.
- For small text, use `--orange-surface` + `--orange-surface-text` instead (7.0:1 contrast, AA normal text).

**Blue accent (`--blue-accent`) in dark mode — text only:**
- Dark mode `--blue-accent` is `#60A5FA`. White on `#60A5FA`: ~2.7:1 — fails AA for all text sizes.
- In dark mode, `--blue-accent` is suitable for text on dark surfaces, not as a button background with white label.
- Use `--green-button` / `--green-button-text` for CTA buttons in both themes (theme-invariant, passes 5.1:1).

**Verified passing pairings:**
| Pair | Contrast | WCAG Level |
|---|---|---|
| White on `--green-button` (`#047857`) | 5.1:1 | AA normal text |
| White on `--blue-accent` light (`#2563EB`) | 4.6:1 | AA normal text |
| `--green-surface-text` on `--green-surface` light | 7.2:1 | AAA normal text |
| White on `--orange-accent` light (`#EA580C`) | 3.1:1 | AA large text only |

### SVG Illustration Exclusion

SVG illustration files (e.g., `SolarSystemSvg.tsx`) are excluded from the design token requirement. Hardcoded fill and stroke values in SVG elements are acceptable and not subject to audit.
