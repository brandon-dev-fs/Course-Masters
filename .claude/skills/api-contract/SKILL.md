---
name: api-contract
description: Generate the API contract document — the immutable interface between backend and frontend. Use when /design runs and the spec's Required Design Artifacts includes api-contract. Produces .claude/plans/<id>-api-contract.md detailing every endpoint with method, path, request/response schemas, and error codes.
---

# api-contract

## Purpose

Produce the API contract: every endpoint with method, path (with `/v1/` prefix), auth requirement, request schema, success response shape and status code, and full error code list. Once approved, this contract is **immutable** to coder agents.

## Inputs

- The approved spec at `.claude/specs/<id>-spec.md`
- The backend plan at `.claude/plans/<id>-backend-plan.md` (or in-progress backend planning context)

## Output

A single file at `.claude/plans/<id>-api-contract.md` matching `template.md` in this skill's directory.

## Procedure

1. **Read** `template.md` in this skill directory.

2. **Verify** the spec is `status: approved`.

3. **For each endpoint**, fill the endpoint block in the template:
   - HTTP method and path with `/v1/` prefix.
   - Auth requirement (required or none).
   - Path params and query params (with types, defaults, descriptions).
   - Request body as a Zod schema sketch (`.strict()` on object schemas — reject unknown fields).
   - Success response: raw resource (no envelope) for single items; `{ items: [...], nextCursor: ... }` for paginated collections.
   - Error responses: status, error code from `ERROR_CODES`, when triggered.
   - Concrete request/response examples.

4. **Pagination**: cursor-based, not offset. Default `limit` 20, max 100. `cursor` is opaque string.

5. **Status codes**: follow the conventions in `api.md` — 200/201/204 for success, 400 for validation, 401 for unauth, 403 for forbidden, 404 for not found, 409 for conflict, 500 only for unhandled errors (never expose stack traces).

6. **Error code reference**: list any new codes introduced by this contract. These must be added to `server/src/errors/codes.ts` during implementation; coordinate with the backend plan.

7. **Write** to `.claude/plans/<id>-api-contract.md` with `status: pending`.

8. **Report** the file path. Note that frontend-plan depends on this contract — the frontend-architect should not finalize until this exists.

## Constraints

- All paths prefixed with `/v1/`. Breaking changes require a new version.
- Within a version, only backward-compatible changes (additive).
- Success: raw resource. Error: standard envelope `{ error: { code, message, details } }`. No exceptions.
- All error codes come from `ERROR_CODES` enum. Never free-form strings.
- This contract becomes immutable after approval. Coder agents cannot modify it; required changes escalate back to `/design`.
- Do not write outside `.claude/plans/`.
