---
name: backend-code
description: Implement backend code per the approved plan in an isolated worktree with passing unit tests.
---

# backend-code

## Purpose

Implement backend code from the approved plan in the assigned worktree. Write unit tests. Commit with `<id>: <summary>` format.

## Inputs

- Approved spec at `.claude/specs/<id>/spec.md`
- Approved backend plan at `.claude/plans/<id>/backend-plan.md`
- Approved api-contract at `.claude/plans/<id>/api-contract.md`
- `CLAUDE.md` for backend stack, conventions, and tooling
- `.claude/rules/backend.md` and `.claude/rules/data.md` for project-specific rules
- Optional: rejected review doc from `.claude/reviews/<id>/`
- Worktree path and branch name (from `/implement`)

## Output

Code committed to worktree. Success only if unit tests pass (or no framework configured).

## Procedure

1. Read `CLAUDE.md`, `.claude/rules/backend.md`, `.claude/rules/data.md`.
2. Verify spec, plan, and api-contract approved.
3. If review doc provided, address each issue at `medium`+.
4. Implement per plan following the project's conventions from `CLAUDE.md`.
5. Schema changes follow the project's migration tooling and expand-contract pattern.
6. **Contract immutability**: if api-contract needs changes, stop and report.
7. Write unit tests (if framework exists per `CLAUDE.md`).
8. Run tests. Do not commit if tests fail.
9. Commit with `<id>: <imperative summary>`.

## Constraints

- Stay in assigned worktree. No frontend code, no `.claude/` artifacts.
- Follow all conventions from `CLAUDE.md` and scoped rules.
- Never touch protected branches. Never edit applied migrations.
