---
name: gate-check
description: Verify all required artifacts are approved and current branch is up to date before opening a PR. Mechanical skill.
---

# gate-check

## Purpose

Verify every required artifact has `status: approved` and the current branch is up to date with the default branch.

## Inputs

- Spec ID
- `default_branch` from `.claude/config.yaml`

## Output

Pass/fail with list of unapproved artifacts and/or branch staleness.

## Procedure

1. Read spec at `.claude/specs/<id>/spec.md`. Get Required Design Artifacts checklist.
2. Build required list:
   - Always: `specs/<id>/spec.md`
   - If checked: `designs/<id>/wireframe.md`, `plans/<id>/frontend-plan.md`, `plans/<id>/backend-plan.md`, `plans/<id>/api-contract.md`
   - Always: `reviews/<id>/code-review.md`, `reviews/<id>/security-review.md`
   - If test framework exists: `tests/<id>/test-report.md`
3. Check each artifact's frontmatter for `status: approved`.
4. Check branch freshness: `git merge-base --is-ancestor origin/<default_branch> HEAD`
5. Return pass or fail with gaps listed.

## Constraints

- Read-only. Never modifies anything.
