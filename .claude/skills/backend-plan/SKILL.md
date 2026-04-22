---
name: backend-plan
description: Generate a backend implementation plan. Produces .claude/plans/<id>/backend-plan.md.
---

# backend-plan

## Purpose

Produce a technical plan: folder layout, handlers/controllers, services, data access, error handling, and schema changes, following the project's backend conventions.

## Inputs

- Approved spec at `.claude/specs/<id>/spec.md`
- `CLAUDE.md` for backend stack and conventions
- `.claude/rules/backend.md` and `.claude/rules/data.md` for project-specific rules
- Wireframe at `.claude/designs/<id>/wireframe.md` (if exists)

## Output

`.claude/plans/<id>/backend-plan.md` matching `template.md`.

## Procedure

1. Read `template.md`.
2. Read `CLAUDE.md`, `.claude/rules/backend.md`, `.claude/rules/data.md` for conventions.
3. Verify spec approved.
4. **Ask clarifying questions in the terminal.** Wait for answers.
5. Fill template. List new error codes explicitly. Schema changes follow the project's migration conventions and the expand-contract pattern.
6. Write with `status: pending`.
7. Verify mechanically.

## Constraints

- Follow the project's error handling pattern, layer separation, and folder structure from `CLAUDE.md`.
- Destructive schema changes follow expand-contract.
- Write only to `.claude/plans/<id>/`.
