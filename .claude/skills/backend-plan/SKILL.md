---
name: backend-plan
description: Generate a backend implementation plan with per-section task lists. Produces .claude/plans/<id>/backend-plan.md.
---

# backend-plan

## Purpose

Produce a technical plan with per-section task lists that the backend coder agent will execute one at a time. Each section describes the design, and its `### Tasks` subsection breaks it into discrete, ordered, implementable units of work.

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
5. Fill each section with the design details.
6. **For each section**, generate a `### Tasks` subsection containing an ordered checklist of discrete tasks. Each task must be:
   - **Small**: one logical unit of work (one file, one function, one migration — not "implement the whole service layer")
   - **Specific**: names the exact file, function, class, or migration to create/modify
   - **Ordered**: dependencies respected — earlier tasks don't depend on later ones
   - **Verifiable**: the lead-dev can check the diff and confirm the task is done correctly
   - **Self-contained**: includes enough context that the coder doesn't need to read the entire plan — just the section and task
7. Tasks that have no work (e.g., Pseudocode section is explanatory only) do not get a `### Tasks` subsection.
8. Write with `status: pending`.
9. Verify mechanically.

## Task examples

Good tasks:
- `Create UserAvatar model in schema with cuid id, userId, url, createdAt, updatedAt`
- `Add migration add_user_avatar_table`
- `Create AvatarService.upload() accepting file buffer and userId, returning avatar URL`
- `Add AVATAR_TOO_LARGE error code to codes file`

Bad tasks (too vague):
- `Set up the data layer`
- `Implement error handling`
- `Add endpoints`

## Constraints

- Follow the project's conventions from `CLAUDE.md`.
- Destructive schema changes follow expand-contract.
- Every section with implementation work must have a `### Tasks` subsection.
- Write only to `.claude/plans/<id>/`.