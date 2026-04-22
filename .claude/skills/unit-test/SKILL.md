---
name: unit-test
description: Run unit tests on the current branch and report results with coverage. Reads test tooling from CLAUDE.md.
---

# unit-test

## Purpose

Run unit tests, report pass/fail counts, failure details, and coverage percentage.

## Inputs

- Current working directory
- `min_coverage` from `.claude/config.yaml`
- `CLAUDE.md` for test framework and commands

## Output

Section of test report at `.claude/tests/<id>/test-report.md`.

## Procedure

1. Read `CLAUDE.md` for the project's test framework and test command.
2. If no test framework documented or configured: record "No unit test framework configured." Do not block approval.
3. If exists: run the test command, parse pass/fail/coverage. Pass = all pass AND coverage ≥ `min_coverage`.

## Constraints

- Never modify source code. Never commit.
- Write only to `.claude/tests/<id>/`.
