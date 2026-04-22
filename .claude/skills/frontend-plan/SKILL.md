---
name: frontend-plan
description: Generate a frontend implementation plan. Produces .claude/plans/<id>/frontend-plan.md. Requires api-contract to exist first.
---

# frontend-plan

## Purpose

Produce a technical plan: folder structure, component tree, data fetching, state management, and pseudocode, following the project's frontend conventions.

## Inputs

- Approved spec at `.claude/specs/<id>/spec.md`
- `CLAUDE.md` for frontend stack and conventions
- `.claude/rules/frontend.md` for project-specific frontend rules
- Wireframe at `.claude/designs/<id>/wireframe.md` (if required)
- API contract at `.claude/plans/<id>/api-contract.md` (must exist)

## Output

`.claude/plans/<id>/frontend-plan.md` matching `template.md`.

## Procedure

1. Read `template.md`.
2. Read `CLAUDE.md` and `.claude/rules/frontend.md` for frontend conventions.
3. Verify spec approved and api-contract exists.
4. **Ask clarifying questions in the terminal.** Wait for answers.
5. Fill template. API calls must match the api-contract exactly. If a needed capability is missing, **ask the user**.
6. Write with `status: pending`.
7. Verify mechanically.

## Constraints

- Follow the project's folder structure and component patterns from `CLAUDE.md`.
- All API calls through the project's API client. Never raw fetch/HTTP.
- Write only to `.claude/plans/<id>/`.
