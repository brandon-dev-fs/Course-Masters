# Global Rules

Loaded by every agent. Universal conventions and guardrails.

## Context budget

- Read only the files listed in your skill's input contract plus the relevant spec.
- Do not read full chat history.
- Do not read other specs' artifacts unless the current spec's frontmatter `depends_on` references them.
- Load only the scoped rules files relevant to your skill (see "Scoped Rules" in your agent definition).

## File ownership

- Architect agents write only to `.claude/specs/`, `.claude/designs/`, or `.claude/plans/` per their skill.
- Reviewer agents write only to `.claude/reviews/`.
- QA agent writes only to `.claude/tests/`.
- Coder agents write only to source code paths and test paths in their assigned worktree. They never modify `.claude/` artifacts.
- No agent writes to `.claude/config.yaml` or any file under `.claude/rules/`.

## Approval gates

- Before any write, verify upstream `status: approved` per your command's prerequisite list. Fail fast with a clear message if not.
- On rejection, set `status: rejected` and include a structured `## Issues` section with `severity`, `location`, `description`, `suggested_fix`, and (for security reviews) `hand_back_to`.

## Severity scale

Used by all reviewers and the test agent.

- **critical** — blocks merge, must fix
- **high** — blocks merge, must fix
- **medium** — blocks merge, must fix
- **low** — agent may approve; human may force hand-back
- **info** — advisory only, never blocks

## Auto-approval thresholds

- Reviewer skills auto-approve only if zero issues at `medium` or above.
- Test skill auto-approves only if all tests pass and coverage ≥ `min_coverage` from `config.yaml`.

## Branching and protected branches

- Default working branch is `develop` (from `config.yaml`).
- All feature branches are created from `develop` and target `develop`.
- **Never check out, merge to, push to, or otherwise modify any branch listed in `protected_branches` in `config.yaml`.** This currently includes `main`. Treat protected branches as read-only.
- Branch names: `feature/<id>-frontend`, `feature/<id>-backend`, `feature/<id>` (integration).

## Commits

- Commit message format: `<id>: <imperative summary>`. Example: `cm-0042: add avatar upload endpoint`.
- Coder agents commit before exiting their worktree.
- Never force push. Never rewrite history on shared branches.

## Frontmatter

Every artifact in `.claude/` begins with YAML frontmatter:

```yaml
---
id: cm-0042
title: Brief feature name
stage: spec | design | implementation | review | test
status: pending | approved | rejected
approver: human | agent | <name>
approved_at: 2026-04-15T10:30:00Z
depends_on: [] # optional
---
```

## API contract immutability

- The `api-contract` doc produced in the design stage is immutable to coder agents.
- Any required contract change is a stop-and-escalate event back to `/design`, not a unilateral edit.

## Spec ID references

- All artifacts, branches, worktrees, and commits reference the spec ID (`cm-<n>`).
- Never invent or modify a spec ID. IDs are generated only by `/spec`.
