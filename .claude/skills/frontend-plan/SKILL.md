---
name: frontend-plan
description: Generate a frontend implementation plan with per-section task lists. Produces .claude/plans/<id>/frontend-plan.md. Requires api-contract to exist first.
---

# frontend-plan

## Purpose

Produce a technical plan with per-section task lists that the frontend coder agent will execute one at a time. Each section describes the design, and its `### Tasks` subsection breaks it into discrete, ordered, implementable units of work.

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
2. Read `CLAUDE.md` and `.claude/rules/frontend.md` for conventions.
3. Verify spec approved and api-contract exists.
4. **Ask clarifying questions in the terminal.** Wait for answers.
5. Fill each section with the design details.
6. **For each section**, generate a `### Tasks` subsection containing an ordered checklist. Each task must be:
    - **Small**: one component, one hook, one API integration — not "build the whole feature"
    - **Specific**: names the exact file, component, hook, or function
    - **Ordered**: dependencies respected (e.g., create shared types before components that use them)
    - **Verifiable**: lead-dev can check the diff and confirm correctness
    - **Self-contained**: includes enough context for the coder to work from just the section and task
7. API call tasks must reference the api-contract endpoint. If a needed capability is missing, **ask the user**.
8. Write with `status: pending`.
9. Verify mechanically.

## Task examples

Good tasks:

- `Create AvatarUpload component with file input accepting jpg/png, max 5MB`
- `Create useAvatarUpload hook calling POST /v1/users/:id/avatar from api-contract`
- `Add avatar display to ProfileHeader component using existing user data`
- `Add avatar-related design tokens to config: avatar-size-sm (32px), avatar-size-lg (96px)`

Bad tasks (too vague):

- `Build the avatar feature`
- `Add components`
- `Wire up the API`

## Constraints

- Follow the project's conventions from `CLAUDE.md`.
- All API calls through the project's API client.
- Every section with implementation work must have a `### Tasks` subsection.
- Write only to `.claude/plans/<id>/`.
