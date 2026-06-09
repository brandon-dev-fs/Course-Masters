---
description: Run unit and E2E tests on the current branch. Agent-approved if all pass and coverage meets threshold.
argument-hint: <spec id>
---

# /test

You are running the **Test stage**. Run full test suite against the current branch.

## Arguments

Spec ID: $ARGUMENTS (required). If empty, ask and stop.

## Procedure

### 1. Verify environment

- `CLAUDE.md` exists. If missing: `Run /init to generate CLAUDE.md first.`
- `.claude/config.yaml` — read `min_coverage`.
- Create `.claude/tests/<id>/` if missing.

### 2. Verify prerequisites

Both reviews must be `status: approved`.

### 3. Run tests

Invoke `qa-expert` agent with `unit-test` and `e2e-test` skills. Agent reads `CLAUDE.md` for test frameworks and commands.

### 4. Agent approval

All must hold: unit tests pass (or no framework), E2E pass (or no framework), coverage ≥ `min_coverage` (or no tool). Both unconfigured → pass-through.

### 5. Report

Pass → `Next: /pr <id>`
Fail → `Next: /implement <id> .claude/tests/<id>/test-report.md`

Always: `Override: /approve <file> or edit frontmatter to status: rejected`

## Constraints

- Never modify source code. Never commit.
- Write only to `.claude/tests/<id>/`.
