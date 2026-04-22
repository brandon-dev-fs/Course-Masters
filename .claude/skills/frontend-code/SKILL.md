---
name: frontend-code
description: Implement frontend code per the approved plan in an isolated worktree with passing unit tests.
---

# frontend-code

## Purpose

Implement frontend code from the approved plan in the assigned worktree. Write unit tests. Commit with `<id>: <summary>` format.

## Inputs

- Approved spec at `.claude/specs/<id>/spec.md`
- Approved frontend plan at `.claude/plans/<id>/frontend-plan.md`
- Approved api-contract at `.claude/plans/<id>/api-contract.md`
- `CLAUDE.md` for frontend stack, conventions, and tooling
- `.claude/rules/frontend.md` for project-specific rules
- Optional: rejected review doc from `.claude/reviews/<id>/`
- Worktree path and branch name (from `/implement`)

## Output

Code committed to worktree. Success only if unit tests pass (or no framework configured).

## Procedure

1. Read `CLAUDE.md` and `.claude/rules/frontend.md`.
2. Verify spec, plan, and api-contract approved.
3. If review doc provided, address each issue at `medium`+.
4. Implement per plan following the project's conventions from `CLAUDE.md`.
5. **Contract immutability**: if api-contract is missing a capability, stop and report.
6. Write unit tests (if framework exists per `CLAUDE.md`).
7. Run tests. Do not commit if tests fail.
8. Commit with `<id>: <imperative summary>`.

## Constraints

- Stay in assigned worktree. No backend code, no `.claude/` artifacts.
- Follow all conventions from `CLAUDE.md` and `.claude/rules/frontend.md`.
- Never touch protected branches.
