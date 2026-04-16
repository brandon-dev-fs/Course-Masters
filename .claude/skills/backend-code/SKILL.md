---
name: backend-code
description: Implement backend code per the approved backend plan, in an isolated worktree, with passing unit tests. Use when /implement runs in the backend worktree. Reads spec, backend plan, and api-contract; writes Express+TypeScript code, error classes, and Prisma migrations.
---

# backend-code

## Purpose

Implement the backend code described in the approved backend plan. Code lives in the assigned worktree on branch `feature/<id>-backend`. Includes new error codes, `AppError` subclasses, Prisma schema changes and migrations (following expand-contract for destructive changes), and unit tests for new code.

## Inputs

- The approved spec at `.claude/specs/<id>-spec.md`
- The approved backend plan at `.claude/plans/<id>-backend-plan.md`
- The approved api-contract at `.claude/plans/<id>-api-contract.md`
- Optionally a rejected review doc when re-running
- The worktree path and branch name (passed by `/implement`)

## Output

- Source files committed to the worktree under `server/src/`
- Updates to `server/src/errors/codes.ts` for new error codes
- New `AppError` subclass files in `server/src/errors/` if specified
- Prisma schema and migration files in `server/prisma/`
- Unit test files (when test framework exists)
- Git commits in format `<id>: <imperative summary>`

## Procedure

1. **Verify prerequisites**: spec, backend plan, and api-contract all `status: approved`.

2. **Check for review feedback**: if a review doc was passed, address each issue at severity `medium` or above.

3. **Add error codes first**: before throwing any new error, add the code to `server/src/errors/codes.ts` (append to the `ERROR_CODES` const). Then create the `AppError` subclass in `server/src/errors/<n>.ts` if the plan specifies a new one.

4. **Schema changes**: if the plan modifies the Prisma schema, edit `server/prisma/schema.prisma`. Run `prisma migrate dev --name <descriptive_snake_case_name>`. Review the generated SQL.

   - For destructive changes (drop, rename, type change): split across migrations per the plan's expand-contract phases. Never combine destruction with the code change that depends on it in a single migration.
   - Never edit a migration after it has been applied to a shared environment.

5. **Implement** code following the plan:
   - Folder structure: `routes/`, `controllers/`, `services/`, repositories or direct Prisma in services per plan.
   - Controllers: thin. Validate input with Zod (`.strict()`), call services, return response. No business logic.
   - Services: business logic. Throw `AppError` subclasses for failures. No Express types.
   - Routes: every async handler wrapped in `asyncHandler`.
   - Errors: throw, never `res.json({ error })` directly. Never `res.status(4xx)` directly.
   - Logging: Pino. Never `console.log`. Redact secrets, tokens, PII.
   - Routes prefixed with `/v1/` per api-contract.

6. **Contract immutability**: if you discover the api-contract is missing a needed capability or specifies something incompatible with backend constraints, **stop**. Report the gap; escalate back to `/design`.

7. **Write unit tests** for new services, controllers, and utilities (when test framework exists). If no framework, note and proceed.

8. **Run tests** (if framework exists). Do not commit if tests fail.

9. **Commit** with `<id>: <imperative summary>` messages.

10. **Report success** only when tests pass (or no framework exists) and migrations apply cleanly.

## Constraints

- Stay within the assigned worktree. Do not modify frontend code, `.claude/` artifacts, or `config.yaml`/`rules.md`.
- Never call `res.json({ error: ... })` or `res.status(4xx/5xx)` directly. Throw `AppError` subclasses.
- Never use string literals for error codes. Always reference `ERROR_CODES` enum.
- Never log secrets, tokens, passwords, or full request bodies.
- Never use `$queryRaw` with string interpolation of user input.
- Auth: when adding new auth-related errors, use `UnauthorizedError` / `ForbiddenError` to bring auth into the standard envelope.
- All inputs validated with Zod at the controller boundary. Never trust unvalidated input past the controller.
- TypeScript strict mode. Avoid `any`; if unavoidable, comment why.
- Never check out, merge to, or push to any branch in `protected_branches`.
- Never force-push or rewrite shared history.
- Never edit applied migrations. Create new ones.
