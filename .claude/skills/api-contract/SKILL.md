---
name: api-contract
description: Generate the API contract — the immutable interface between backend and frontend. Produces .claude/plans/<id>/api-contract.md.
---

# api-contract

## Purpose

Document every endpoint with method, path, auth, request/response schemas, status codes, and error codes. Immutable to coder agents once approved.

## Inputs

- Approved spec at `.claude/specs/<id>/spec.md`
- `CLAUDE.md` for API conventions (style, versioning, auth, response shapes)
- `.claude/rules/api.md` for project-specific API rules
- Backend plan at `.claude/plans/<id>/backend-plan.md` (or in-progress context)

## Output

`.claude/plans/<id>/api-contract.md` matching `template.md`.

## Procedure

1. Read `template.md`.
2. Read `CLAUDE.md` and `.claude/rules/api.md` for API conventions.
3. Verify spec approved.
4. **Ask clarifying questions in the terminal.** Wait for answers.
5. For each endpoint: method, path (with version prefix if project uses versioning), auth, request schema, success response, error responses with codes, examples.
6. Follow the project's pagination, response shape, and status code conventions.
7. List new error codes in the reference section.
8. Write with `status: pending`.
9. Verify mechanically.

## Constraints

- Follow the project's API style and conventions from `CLAUDE.md`.
- Immutable after approval. Changes escalate to `/design`.
- Write only to `.claude/plans/<id>/`.
