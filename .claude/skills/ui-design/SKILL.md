---
name: ui-design
description: Generate a wireframe document for a feature's UI. Use when /design command runs and the spec's Required Design Artifacts checklist includes ui-design. Produces .claude/designs/<id>-wireframe.md covering desktop and mobile layouts and all interactive states.
---

# ui-design

## Purpose

Produce a wireframe document describing the UI layout, component composition, and interactive states for a feature. Wireframes are structural — ASCII, mermaid, or markdown layouts annotated with Tailwind tokens — not high-fidelity mockups.

## Inputs

- The approved spec at `.claude/specs/<id>-spec.md`

## Output

A single file at `.claude/designs/<id>-wireframe.md` matching `template.md` in this skill's directory.

## Procedure

1. **Read** `template.md` in this skill directory.

2. **Verify** the spec at `.claude/specs/<id>-spec.md` has `status: approved` in its frontmatter. Fail if not.

3. **Verify** the spec's `## Required Design Artifacts` includes `ui-design`. Fail if not.

4. **Fill the template**:
   - Desktop layout (≥1280px) and mobile layout (≤480px) are both required.
   - Cover every interactive element with all applicable states: default, hover, focus, active, disabled, loading, error, empty.
   - Annotate layouts with Tailwind token references (`bg-surface`, `text-primary`, `p-6`, etc.) — not hex colors or pixel values.
   - If the design needs a token that doesn't exist in `tailwind.config.js`, add it to the `## Required Token Additions` section. Do not use arbitrary values like `text-[13px]` or `bg-[#ff5500]`.

5. **Write** to `.claude/designs/<id>-wireframe.md` with `status: pending`.

6. **Report** the file path and note that the wireframe requires human approval.

## Constraints

- Wireframes are structural, not pixel-perfect. ASCII or mermaid is fine.
- Target WCAG 2.1 Level AA. Focus states must be visible. Color contrast ≥ 4.5:1 for normal text.
- Desktop-first; design for desktop and adapt down.
- Never use arbitrary Tailwind values. Reference tokens or add them to the required-additions list.
- Do not write outside `.claude/designs/`.
