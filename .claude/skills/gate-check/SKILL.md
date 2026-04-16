---
name: gate-check
description: Verify all required artifacts for a spec ID are approved before opening a PR. Use when /pr runs. Mechanical skill — no agent needed. Returns pass/fail with a list of unapproved artifacts.
---

# gate-check

## Purpose

Verify that every required artifact for a spec ID has `status: approved` and that the integration branch is up to date with the default branch. Blocks `/pr` if any gate is unmet.

## Inputs

- Spec ID
- `default_branch` from `.claude/config.yaml`

## Output

Pass/fail decision with:

- List of missing or unapproved artifacts (if fail)
- Branch staleness status (if fail)

## Procedure

1. **Read the spec** at `.claude/specs/<id>-spec.md`. Get its `## Required Design Artifacts` checklist.

2. **Build the required-artifacts list** based on the checklist:
   - Always: `specs/<id>-spec.md`
   - If `ui-design` checked: `designs/<id>-wireframe.md`
   - If `frontend-plan` checked: `plans/<id>-frontend-plan.md`
   - If `backend-plan` checked: `plans/<id>-backend-plan.md`
   - If `api-contract` checked: `plans/<id>-api-contract.md`
   - Always: `reviews/<id>-code-review.md`, `reviews/<id>-security-review.md`
   - Always (if framework exists): `tests/<id>-test-report.md`. If test framework not yet bootstrapped, this is optional.

3. **Check each artifact's frontmatter** for `status: approved`. List any that are missing or not approved.

4. **Check branch freshness**: verify `feature/<id>` is up to date with `<default_branch>`:
   ```
   git fetch origin <default_branch>
   git merge-base --is-ancestor origin/<default_branch> feature/<id>
   ```
   
   If `feature/<id>` is behind, mark as stale.

5. **Return**:
   - **Pass**: all artifacts approved AND branch up to date.
   - **Fail**: structured report listing unapproved artifacts and/or branch staleness.

## Constraints

- Read-only. Never modifies any artifact.
- Mechanical — no LLM creativity. Either the gates pass or they don't.
- Never approve anything itself. Approval is human or other agents' job.
