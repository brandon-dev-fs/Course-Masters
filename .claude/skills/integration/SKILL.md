---
name: integration
description: Merge frontend and backend feature branches into a single integration branch and verify the merged result builds and tests pass. Use when /implement has completed both coder worktrees. Mechanical skill — no agent needed.
---

# integration

## Purpose

Merge `feature/<id>-frontend` and `feature/<id>-backend` into `feature/<id>` in a fresh integration worktree. Verify the merged result builds and tests pass. This is the early-detection point for merge conflicts and contract drift between parallel coders.

## Inputs

- Spec ID
- Both `feature/<id>-frontend` and `feature/<id>-backend` branches exist with passing tests in their respective worktrees
- `worktree_root` from `.claude/config.yaml`

## Output

- Integration worktree at `<worktree_root>/<repo>-<id>-integration/` on branch `feature/<id>`
- Both feature branches merged into `feature/<id>`
- Build and test results
- Frontend and backend worktrees removed on success
- Integration worktree persists for `/review` and `/test`

## Procedure

1. **Verify** both `feature/<id>-frontend` and `feature/<id>-backend` exist and have passing tests recorded by the coder skills.

2. **Create integration worktree**: branch `feature/<id>` off the default branch (`develop`). Place worktree at `<worktree_root>/<repo>-<id>-integration/`.

   ```
   git worktree add <worktree_root>/<repo>-<id>-integration -b feature/<id> develop
   ```

3. **Merge backend first**:

   ```
   cd <worktree_root>/<repo>-<id>-integration
   git merge feature/<id>-backend --no-ff -m "<id>: integrate backend"
   ```

   If conflicts: stop, report which files conflicted, leave worktree in place for inspection. Do not auto-resolve.

4. **Merge frontend**:

   ```
   git merge feature/<id>-frontend --no-ff -m "<id>: integrate frontend"
   ```

   If conflicts: stop, report, leave for inspection.

5. **Run build** in the integration worktree (frontend and backend builds).

6. **Run unit tests** on the merged result (when test framework exists). Even if individual worktrees passed, the merge can break things.

7. **On success**:
   - Remove the frontend worktree: `git worktree remove <worktree_root>/<repo>-<id>-frontend`
   - Remove the backend worktree: `git worktree remove <worktree_root>/<repo>-<id>-backend`
   - Leave integration worktree in place.
   - Return success.

8. **On failure** (conflict, build, or test):
   - Leave all worktrees in place for inspection.
   - Report which step failed and where.
   - Return failure with enough context for the human to decide whether to re-run `/implement` or hand back to `/design`.

## Constraints

- Backend merges first (frontend depends on backend's API surface).
- Never auto-resolve merge conflicts. Surface them.
- Never force-push.
- Never check out, merge to, or push to any branch in `protected_branches`.
- This skill is mechanical — no LLM creativity required. If procedure fails, report and stop.
