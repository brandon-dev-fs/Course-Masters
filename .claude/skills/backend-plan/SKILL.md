---
name: backend-plan
description: Generate a technical implementation plan for the backend portion of a feature. Use when /design runs and the spec's Required Design Artifacts includes backend-plan. Produces .claude/plans/<id>-backend-plan.md covering controllers, services, error codes, and Prisma schema changes.
---

# backend-plan

## Purpose

Produce a technical plan the backend developer agent will implement: folder layout, controllers with request validation, services, repository/Prisma calls, new error codes and `AppError` subclasses, and Prisma schema changes (with expand-contract migration steps if destructive).

## Inputs

- The approved spec at `.claude/specs/<id>-spec.md`
- The wireframe at `.claude/designs/<id>-wireframe.md` (if produced — useful for understanding UI needs)

## Output

A single file at `.claude/plans/<id>-backend-plan.md` matching `template.md` in this skill's directory.

## Procedure

1. **Read** `template.md` in this skill directory.

2. **Verify** the spec is `status: approved`.

3. **Fill the template**:
   - **Folder Layout**: files to create under `server/src/`. Routes, controllers, services, repositories.
   - **Controllers**: per controller action, list HTTP method/path, auth requirement, Zod validation schema sketch, the service it calls, success response shape and status, errors thrown.
   - **Services**: function signatures, responsibility, repositories called, errors thrown.
   - **Repositories / Prisma calls**: data access patterns. Use `select`/`include` to limit fields (especially for sensitive data). Document any `$queryRaw` with justification.
   - **Error Codes**: every new code to add to `server/src/errors/codes.ts`. Include the `AppError` subclass that carries it. New subclasses to create.
   - **Schema Changes**: Prisma additions/modifications. For destructive changes, lay out the multi-phase expand-contract plan from `data.md`.
   - **Pseudocode**: non-obvious logic only.

4. **Coordinate with api-contract**: this skill's plan and the `api-contract` skill's output must agree on routes, request shapes, and response shapes. If both run for the same spec, the api-contract is the source of truth for the wire format; the backend plan describes the implementation behind it.

5. **Write** to `.claude/plans/<id>-backend-plan.md` with `status: pending`.

6. **Report** the file path and note that the plan requires human approval.

## Constraints

- All new error codes go through `server/src/errors/codes.ts`. Never plan to use a string literal code.
- All routes wrapped in `asyncHandler`; all errors thrown via `AppError` subclasses; `errorHandler` middleware is the only place that calls `res.json({ error })`.
- All input validated with Zod at the controller boundary.
- Logging via Pino; never `console.log`. Never log secrets, tokens, or full request bodies.
- Destructive schema changes follow expand-contract. Never drop or rename a column in the same migration as the code change that depends on it.
- Auth: when adding new auth-related error handling, prefer creating `UnauthorizedError` / `ForbiddenError` to bring auth into the standard envelope (desired-state migration).
- Do not write outside `.claude/plans/`.
