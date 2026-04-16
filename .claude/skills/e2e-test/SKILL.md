---
name: e2e-test
description: Run the E2E test suite on the integration branch and report results. Use when /test runs. Currently a stub — E2E framework not yet bootstrapped in this project.
---

# e2e-test

## Purpose

Run end-to-end tests against the integration branch and report pass/fail counts and failure details.

## Inputs

- The integration worktree at `<worktree_root>/<repo>-<id>-integration/`

## Output

A section of the test report at `.claude/tests/<id>-test-report.md` covering E2E tests:

- Total scenarios run
- Passes / failures
- Failure details (scenario, screenshot reference if applicable, error)

## Procedure

### Current state (no E2E framework bootstrapped)

1. Check for an E2E framework config (`playwright.config.*`, `cypress.config.*`).
2. If none found, write a section noting "No E2E framework configured. Skipping E2E test stage." Do not block approval on this.
3. Return.

### Future state (once a framework is in place)

1. Start the application (or rely on a dev server config).
2. Run the E2E suite.
3. Parse results, write the report section.
4. Pass criterion: all scenarios pass.

## Constraints

- Never modify source code or the application's data.
- Never commit anything.
- Do not write outside `.claude/tests/`.
- Stub until the project bootstraps an E2E framework. Expand this SKILL.md when that happens.
