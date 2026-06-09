# Global Rules

Loaded by every agent. High-level software development best practices and workflow mechanics.

## Stack awareness

- Read `CLAUDE.md` at the project root for tech stack, conventions, and project-specific rules.
- If `CLAUDE.md` is missing, stop and tell the user to run `/init` (Claude Code's built-in command) to generate one for their project before using the workflow.
- Read scoped rules from `.claude/rules/` for domain-specific conventions defined by the user.
- Load scoped rules on-demand based on the files you encounter.

### CLAUDE.md section tagging (token optimization)

To reduce how much of `CLAUDE.md` each agent reads, developers can tag sections with role markers. Agents search for their relevant tag and read only that section.

**Supported tags:**

- `<!-- @backend -->` — backend framework, error handling, validation, logging
- `<!-- @frontend -->` — UI framework, components, state, styling
- `<!-- @data -->` — database, ORM, migrations, queries
- `<!-- @api -->` — API conventions, versioning, response shapes
- `<!-- @design -->` — design system, tokens, accessibility
- `<!-- @testing -->` — test framework, commands, coverage

**Agent reading rules:**

- Backend agents: read `@backend`, `@data`, `@api` sections only
- Frontend agents: read `@frontend`, `@api`, `@design` sections only
- Review/security agents: read `@backend`, `@data`, `@api` sections only
- QA agent: read `@testing` section only
- If a tag is absent, read the full `CLAUDE.md`

**Example CLAUDE.md structure:**

```markdown
# Project Overview

<always read by all agents — keep this short>

<!-- @backend -->

## Backend

...

<!-- /@backend -->

<!-- @frontend -->

## Frontend

...

<!-- /@frontend -->
```

## Context budget

- Start with this file only. Read only the tagged section of `CLAUDE.md` relevant to your role.
- Load scoped rules lazily — only when you encounter files in that domain.
- Read only the files listed in your skill's input contract.
- Do not read full chat history.
- For implementation: read only the task's `### Implementation Notes` and the task description — not the full plan section prose.

## Dialog-driven questions

- When you have questions or need clarification, ask the user directly in the terminal and wait for answers.
- Do not write questions into documents. Resolve all ambiguity through dialog before writing any artifact.

## Artifact paths

All workflow artifacts live in the **project-local** `.claude/workflows/` directory and version with the code. This is separate from user-global `~/.claude/` where commands, skills, and agents may live.

```
<project>/.claude/workflows/
├── specs/<id>/spec.md
├── designs/<id>/wireframe.md
├── plans/<id>/frontend-plan.md
├── plans/<id>/backend-plan.md
├── plans/<id>/api-contract.md
├── reviews/<id>/code-review.md
├── reviews/<id>/security-review.md
```

## File ownership

- Architect agents write only to `.claude/workflows/specs/<id>/`, `.claude/workflows/designs/<id>/`, or `.claude/workflows/plans/<id>/`.
- Reviewer agents write only to `.claude/workflows/reviews/<id>/`.
- Coder agents write only to source code paths in their assigned worktree. They never modify `.claude/` artifacts.
- No agent writes to `config.yaml`, `CLAUDE.md`, or any file under `.claude/rules/`.

## Approval gates

- Before any write, verify upstream `status: approved` per your command's prerequisite list. Fail fast with a clear message.
- On rejection, set `status: rejected` and include a structured `## Issues` section with `severity`, `location`, `description`, `suggested_fix`, and (for security reviews) `hand_back_to`.

## Severity scale

- **critical** — blocks merge, must fix
- **high** — blocks merge, must fix
- **medium** — blocks merge, must fix
- **low** — agent may approve; human may force hand-back
- **info** — advisory only, never blocks

## Auto-approval thresholds

- Reviewer skills auto-approve only if zero issues at `medium` or above.

## Branching and protected branches

- Read `default_branch` and `protected_branches` from `.claude/config.yaml`.
- The user checks out their working branch before running `/implement`. Coder worktrees branch off it and merge back into it.
- **Never check out, merge to, push to, or otherwise modify any protected branch.**
- Coder branch names: `<id>-backend`, `<id>-frontend`. These are temporary — deleted after merge.

## Commits

- Format: `<id>: <imperative summary>`.
- Coder agents commit before exiting their worktree.
- Never force push. Never rewrite history on shared branches.

## Frontmatter

Every artifact begins with YAML frontmatter:

```yaml
---
id: <prefix>-<####>
title: Brief feature name
stage: spec | design | implementation | review
status: pending | approved | rejected
# optional: approver: human | agent
# optional: approved_at: 2026-04-15T10:30:00Z
# optional: depends_on: []
---
```

## API contract immutability

- The api-contract is immutable to coder agents once approved.
- Any required contract change is a stop-and-escalate event back to `/design`.

## Spec ID references

- All artifacts, branches, worktrees, and commits reference the spec ID.
- Never invent or modify a spec ID. IDs are generated only by `/spec`.

## Verification

- After producing an artifact, run mechanical verification (check headings and frontmatter via grep/bash) rather than re-reading the full document for validation.

## Software development best practices

These apply regardless of tech stack:

### Architecture

- Separate concerns: presentation, business logic, and data access should live in distinct layers.
- Depend on abstractions, not concrete implementations where practical.
- Keep components cohesive — each module should have a single clear responsibility.

### Error handling

- Centralize error handling. Do not scatter error formatting across the codebase.
- Use typed/structured errors with machine-readable codes, not raw strings.
- Never expose internal details (stack traces, internal paths) in user-facing error responses.

### Validation

- Validate all external input at the boundary where it enters the system.
- Reject invalid input early. Never trust unvalidated input in business logic or data layers.

### Security

- Never store secrets, tokens, or credentials in source code.
- Never log secrets, passwords, or sensitive user data.
- Parameterize all database queries. Never interpolate user input into queries.
- Apply authentication and authorization checks on every route that handles user data.

### Data

- Make destructive schema changes in phases (expand-contract): deploy code that stops using the old structure first, then remove it in a separate change.
- Make migrations idempotent and reversible where possible.
- Never mix destructive schema changes with code changes in the same commit/PR.

### Testing

- Testing is enforced by CI on PR open. The workflow does not run tests.
- Write code that is testable — pure functions, clear boundaries, no hidden side effects.

### Code quality

- Use the project's type system fully. Avoid escape hatches (e.g., `any` in TypeScript, `Object` in Java) unless justified with a comment.
- New dependencies require justification. Prefer existing dependencies over adding new ones.
- Follow the project's established patterns and conventions documented in `CLAUDE.md` and `.claude/rules/`.

### Logging

- Use structured logging (JSON or equivalent). Never use unstructured print/console statements in production code.
- Include request context (request ID, user ID where appropriate) in log entries.
- Never log sensitive data.

### API design

- Use consistent patterns across all endpoints (naming, response shapes, error formats).
- Version APIs if breaking changes are possible.
- Document every endpoint's contract (request shape, response shape, status codes, error codes).
