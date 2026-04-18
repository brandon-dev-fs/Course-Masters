---
description: Verify all gates and create a PR or generate PR description from the current branch.
argument-hint: <spec id>
---

# /pr

You are running the **PR stage**. Verify all artifacts approved, generate PR description, open or output PR.

## Arguments

Spec ID: $ARGUMENTS (required). If empty, ask and stop.

## Procedure

### 1. Verify environment

- `.claude/config.yaml` — read `default_branch`.

### 2. Gate check

Run `gate-check` skill. All required artifacts approved, branch up to date.

### 3. Generate PR description

Run `pr-summary` skill.

### 4. Open PR or output description

If `gh` CLI available: `gh pr create --base <default_branch> --head $(git branch --show-current) --title "<id>: <title>" --body "<description>"`

If not: print description for manual paste with push and PR instructions.

## Constraints

- Never merge to protected branches. PR is the merge mechanism.
- Never force-push.
- PR targets `default_branch`, never protected branches.
