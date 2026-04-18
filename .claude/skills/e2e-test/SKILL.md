---
name: e2e-test
description: Run E2E tests on the current branch and report results. Reads test tooling from CLAUDE.md.
---

# e2e-test

## Purpose

Run end-to-end tests, report pass/fail counts and failure details.

## Inputs

- Current working directory
- `CLAUDE.md` for E2E framework and commands

## Output

Section of test report at `.claude/tests/<id>/test-report.md`.

## Procedure

1. Read `CLAUDE.md` for the project's E2E framework and command.
2. If no E2E framework documented or configured: record "No E2E framework configured." Do not block approval.
3. If exists: start app, run suite, parse results. Pass = all scenarios pass.

## Constraints

- Never modify source code or application data. Never commit.
- Write only to `.claude/tests/<id>/`.
