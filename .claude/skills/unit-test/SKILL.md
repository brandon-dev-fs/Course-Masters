---
name: unit-test
description: Run the unit test suite on the integration branch and report results with coverage. Use when /test runs. Currently a stub — test framework not yet bootstrapped in this project.
---

# unit-test

## Purpose

Run unit tests against the integration branch and report pass/fail counts, failures with context, and coverage percentage.

## Inputs

- The integration worktree at `<worktree_root>/<repo>-<id>-integration/`
- `min_coverage` from `.claude/config.yaml`

## Output

A section of the test report at `.claude/tests/<id>-test-report.md` covering unit tests:

- Total tests run
- Passes / failures
- Failure details (test name, error message, file/line)
- Coverage percentage
- Pass/fail decision against `min_coverage`

## Procedure

### Current state (no test framework bootstrapped)

1. Check for a test framework configuration (`jest.config.*`, `vitest.config.*`, `package.json` test script).
2. If none found, write a section noting "No unit test framework configured in this project. Skipping unit test stage." Do not block approval on this.
3. Return.

### Future state (once a framework is in place)

1. Run the project's test command (e.g., `npm test`).
2. Parse output for pass/fail counts and coverage.
3. Write the report section per template structure.
4. Pass criterion: all tests pass AND coverage ≥ `min_coverage`.

## Constraints

- Never modify source code. Tests run as-is from the integration worktree.
- Never commit anything in this skill.
- Do not write outside `.claude/tests/`.
- This skill is a stub until the project bootstraps a test framework. When that happens, expand this SKILL.md with the actual command and output parsing.
