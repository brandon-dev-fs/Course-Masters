---
description: Run unit and E2E tests on the integration branch. Produces a test report with coverage. Agent-approved if all tests pass and coverage meets threshold.
argument-hint: <spec id>
---

# /test

You are running the **Test stage** of the agentic development workflow. This command runs the full test suite against the integration branch and produces a test report.

## Arguments

- Spec ID: $ARGUMENTS (required)

If the spec ID is empty, ask the user for one and stop.

## Procedure

### 1. Verify environment

Confirm the following exist:

- `.claude/config.yaml` — read `min_coverage`, `worktree_root`
- `.claude/rules.md`
- `.claude/tests/` directory — create if missing

Derive the repo name from the current working directory.

### 2. Verify prerequisites

Both review docs must be `status: approved`:

- `.claude/reviews/<id>-code-review.md` → `approved`
- `.claude/reviews/<id>-security-review.md` → `approved`

If either is not approved, stop:

```
Cannot test <id>. The following reviews are not approved:
  .claude/reviews/<id>-code-review.md — status: <status>
  .claude/reviews/<id>-security-review.md — status: <status>

Run /review <id> or approve manually: /approve <file path>
```

The integration worktree at `<worktree_root>/<repo>-<id>-integration/` must exist. If not, stop:

```
Cannot test <id>. Integration worktree not found.
Run /implement <id> first.
```

### 3. Run tests

Invoke the `qa-expert` agent with:

- The integration worktree path
- `min_coverage` from `config.yaml`
- The `unit-test` skill
- The `e2e-test` skill
- Rules to load: `.claude/rules.md`

The qa-expert agent runs both skills sequentially:

#### Unit tests (via `unit-test` skill)

1. Check for test framework config in the integration worktree (`jest.config.*`, `vitest.config.*`, `package.json` test script, or equivalent).
2. If framework exists: run the test command, capture pass/fail counts and coverage.
3. If no framework: record "No unit test framework configured."

#### E2E tests (via `e2e-test` skill)

1. Check for E2E framework config (`playwright.config.*`, `cypress.config.*`).
2. If framework exists: start the app (or use dev server), run the suite, capture results.
3. If no framework: record "No E2E framework configured."

### 4. Produce the test report

The qa-expert writes `.claude/tests/<id>-test-report.md` with frontmatter:

```yaml
---
id: <id>
title: <title> — test report
stage: test
status: pending   # set below based on results
approver: agent
---
```

Report body includes:

- **Unit tests**: pass/fail count, failure details (test name, error, file/line), coverage percentage
- **E2E tests**: pass/fail count, failure details (scenario, error)
- **Coverage**: percentage vs. `min_coverage` threshold

### 5. Determine approval

**Agent approval criteria** (all must hold):

1. All unit tests pass (or no unit test framework configured)
2. All E2E tests pass (or no E2E framework configured)
3. Coverage ≥ `min_coverage` from `config.yaml` (or no coverage tool configured)

If all criteria are met:
- Set frontmatter `status: approved`, `approver: agent`, `approved_at: <timestamp>`

If any criterion fails:
- Set frontmatter `status: rejected`
- The failing tests and coverage gap are documented in the report body

**Special case**: if both test frameworks are unconfigured, the test stage is effectively a pass-through. Set `status: approved` with a note that no tests were run. This is expected during early project bootstrapping.

### 6. Verify output

- File exists at `.claude/tests/<id>-test-report.md`
- Frontmatter has `id`, `stage: test`, `status`, `approver`
- Report body has unit test and E2E test sections

### 7. Report to the user

#### Tests passed

```
Test complete for <id>: <title>
Status: approved

Unit tests:  X passed, 0 failed
E2E tests:   Y passed, 0 failed
Coverage:    Z% (threshold: <min_coverage>%)

File: .claude/tests/<id>-test-report.md

Next step: /pr <id>
```

#### Tests failed

```
Test complete for <id>: <title>
Status: rejected

Unit tests:  X passed, Y failed
E2E tests:   A passed, B failed
Coverage:    Z% (threshold: <min_coverage>%)

Failures:
  [unit] <test name> — <error summary>
  [e2e]  <scenario>  — <error summary>

File: .claude/tests/<id>-test-report.md

Next step: Fix issues and re-run:
  /implement <id> .claude/tests/<id>-test-report.md
```

#### No test frameworks configured

```
Test complete for <id>: <title>
Status: approved (no test frameworks configured)

No unit test or E2E framework detected. Test stage passed through.
Consider bootstrapping a test framework before merging.

File: .claude/tests/<id>-test-report.md

Next step: /pr <id>
```

Always include:

```
Note: You can override agent approval decisions.
  To reject an approved test:  edit frontmatter to status: rejected
  To approve a rejected test:  /approve <file path>
```

## Constraints

- Never modify source code. Tests are run read-only against the integration worktree.
- Never commit anything during this stage.
- Never write outside `.claude/tests/`.
- Never modify review docs, plans, specs, `config.yaml`, or `rules.md`.
- Overwrite existing test report on re-run. Git preserves history.
- Run both unit and E2E tests even if unit tests fail. Surface all failures at once.
