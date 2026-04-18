---
name: ui-design
description: Generate a wireframe document. Produces .claude/designs/<id>/wireframe.md.
---

# ui-design

## Purpose

Produce a wireframe covering desktop and mobile layouts and all interactive states, annotated with the project's design tokens.

## Inputs

- Approved spec at `.claude/specs/<id>/spec.md`
- `CLAUDE.md` for design system, styling approach, and accessibility standard
- `.claude/rules/design.md` for project-specific design conventions

## Output

`.claude/designs/<id>/wireframe.md` matching `template.md`.

## Procedure

1. Read `template.md`.
2. Read `CLAUDE.md` and `.claude/rules/design.md` for design system, styling framework, and accessibility standard.
3. Verify spec is `status: approved` and lists `ui-design`.
4. **Ask design questions in the terminal** — layout preferences, interactions, branding. Wait for answers.
5. Create `.claude/designs/<id>/` if missing.
6. Fill template: desktop and mobile layouts, all component states, token annotations. Missing tokens go in Required Token Additions.
7. Write with `status: pending`.
8. Verify mechanically.

## Constraints

- Structural wireframes, not high-fidelity. ASCII/mermaid/markdown fine.
- Follow the accessibility standard defined in the project's design rules.
- Reference design tokens, never hardcode values.
- Write only to `.claude/designs/<id>/`.
