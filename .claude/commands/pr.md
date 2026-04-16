---
description: Verify all gates are green and create a PR (or generate a PR description) for the integration branch. Final stage of the workflow.
argument-hint: <spec id>
---

# /pr

You are running the **PR stage** of the agentic development workflow. This command verifies all artifacts are approved, generates a PR description, and either opens the PR via `gh` CLI or outputs the description for manual submission.

## Arguments

- Spec ID: $ARGUMENTS (required)

If the spec ID is empty, ask the user for one and stop.

## Procedure

### 1. Verify environment

Confirm the following exist:

- `.claude/config.yaml` — read `default_branch`, `worktree_root`
- `.claude/rules.md`

Derive the repo name from the current working directory.

### 2. Run gate check

Use the `gate-check` skill to verify all gates are green.

The gate-check skill:

1. Reads the spec at `.claude/specs/<id>-spec.md` and its `## Required Design Artifacts` checklist.
2. Builds the list of required artifacts based on the checklist.
3. Checks each artifact's frontmatter for `status: approved`:
   - Spec (always required)
   - Wireframe (if `ui-design` checked)
   - Frontend plan (if `frontend-plan` checked)
   - Backend plan (if `backend-plan` checked)
   - API contract (if `api-contract` checked)
   - Code review (always required after implementation)
   - Security review (always required after implementation)
   - Test report (required if test framework exists; optional if no framework bootstrapped)
4. Checks branch freshness: `feature/<id>` is up to date with `<default_branch>`.

If gate-check fails, stop and report:

```
PR gate check failed for <id>: <title>

Unapproved artifacts:
  .claude/reviews/<id>-security-review.md — status: rejected

Branch status:
  feature/<id> is behind <default_branch> by X commits

Fix the above before running /pr <id> again.
```

If the branch is behind, suggest:

```
To update the integration branch:
  cd <worktree_root>/<repo>-<id>-integration
  git merge <default_branch>
  (resolve any conflicts, re-run /test <id>)
```

### 3. Generate PR description

Use the `pr-summary` skill to produce the PR description.

The pr-summary skill reads all artifacts for the spec and fills its template:

- Title: `<id>: <spec title>`
- Summary from spec's Problem Statement
- Changes (backend, frontend, data) from plans
- API changes from api-contract
- Testing results from test report
- Review status from review docs
- Artifact paths
- Deployment notes (if applicable)
- Checklist (all items should be checked since gate-check passed)

### 4. Open the PR or output the description

**Check if `gh` CLI is available**: `which gh`

#### If `gh` is available and authenticated

Open the PR:

```bash
cd <worktree_root>/<repo>-<id>-integration
gh pr create \
  --base <default_branch> \
  --head feature/<id> \
  --title "<id>: <spec title>" \
  --body "<generated PR description>"
```

Report:

```
PR created for <id>: <title>
  URL: <pr url>
  Base: <default_branch>
  Head: feature/<id>

The PR is ready for human review and merge.

After merge, clean up:
  git worktree remove <worktree_root>/<repo>-<id>-integration
  git branch -d feature/<id>
  git branch -d feature/<id>-frontend   (if exists)
  git branch -d feature/<id>-backend    (if exists)
```

#### If `gh` is not available

Output the description for manual use:

```
PR description generated for <id>: <title>

Title: <id>: <spec title>
Base:  <default_branch>
Head:  feature/<id>

--- PR DESCRIPTION ---
<generated description>
--- END ---

To create the PR manually:
  1. Push the integration branch: git push origin feature/<id>
  2. Open a PR from feature/<id> → <default_branch> in your Git host
  3. Paste the description above

After merge, clean up:
  git worktree remove <worktree_root>/<repo>-<id>-integration
  git branch -d feature/<id>
  git branch -d feature/<id>-frontend   (if exists)
  git branch -d feature/<id>-backend    (if exists)
```

### 5. Cleanup guidance

Whether the PR was opened via `gh` or manually, always include cleanup instructions. Do **not** auto-cleanup — the user may need the worktree if the PR gets feedback during human review.

The integration worktree and branches should be cleaned up after the PR is merged:

```
Post-merge cleanup (run after PR is merged):
  git worktree remove <worktree_root>/<repo>-<id>-integration
  git branch -d feature/<id>
  git branch -d feature/<id>-frontend
  git branch -d feature/<id>-backend
```

## Constraints

- Never merge to `<default_branch>` or any protected branch. The PR is the merge mechanism.
- Never force-push.
- Never modify artifacts, source code, `config.yaml`, or `rules.md`.
- Never auto-clean worktrees or branches. Provide instructions only.
- If `gh pr create` fails (auth issue, network, etc.), fall back to outputting the description for manual use. Do not retry or prompt for credentials.
- The PR targets `<default_branch>` (which is `develop`), never `main` or any protected branch.
