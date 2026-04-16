---
description: Run the implementation stage for an approved design. Creates worktrees, dispatches frontend and backend coders (sequentially or in parallel), integrates branches, and verifies the merged result builds and tests pass. Agent-approved.
argument-hint: <spec id> [review.md]
---

# /implement

You are running the **Implementation stage** of the agentic development workflow. This command reads approved design artifacts, creates git worktrees, dispatches coder agents to implement the code, integrates the results, and verifies the merged build.

## Arguments

- Spec ID: $ARGUMENTS (first argument, required)
- Review doc path: (optional, second argument) — a rejected review file from `/review` or `/test` that flagged implementation-level issues. If provided, this is primary input for revision.

If the spec ID is empty, ask the user for one and stop.

## Procedure

### 1. Verify environment

Confirm the following exist:

- `.claude/config.yaml` — read `project_prefix`, `default_branch`, `worktree_root`
- `.claude/rules.md`

Derive the repo name from the current working directory (basename of the repo root). This is used for worktree directory naming.

### 2. Read the spec and determine what to implement

- Load `.claude/specs/<id>-spec.md`. If not found, stop and report.
- Read the `## Required Design Artifacts` checklist.
- Determine which implementation tracks are needed:
    - `backend-plan` checked → backend track
    - `frontend-plan` checked → frontend track
    - Both checked → both tracks

### 3. Verify prerequisites

**All required design artifacts must be `status: approved`.** Check each:

- `.claude/specs/<id>-spec.md` → `approved`
- `.claude/designs/<id>-wireframe.md` → `approved` (if `ui-design` was required)
- `.claude/plans/<id>-frontend-plan.md` → `approved` (if `frontend-plan` was required)
- `.claude/plans/<id>-backend-plan.md` → `approved` (if `backend-plan` was required)
- `.claude/plans/<id>-api-contract.md` → `approved` (if `api-contract` was required)

If any required artifact is not approved, stop and report which artifacts need approval:

```
Cannot implement <id>. The following artifacts are not approved:
  .claude/plans/<id>-backend-plan.md — status: pending
  .claude/plans/<id>-api-contract.md — status: pending

Approve them first: /approve <file path>
```

### 4. Check for review feedback

If a review doc path was provided:

- Read it and verify `status: rejected`.
- Extract `## Issues` section. These are the primary input for the coder agents — each issue at severity `medium` or above must be addressed.

### 5. Check for existing worktrees and branches

Before creating worktrees, check if they already exist from a prior run:

- `<worktree_root>/<repo>-<id>-frontend/`
- `<worktree_root>/<repo>-<id>-backend/`
- `<worktree_root>/<repo>-<id>-integration/`
- Branches: `feature/<id>-frontend`, `feature/<id>-backend`, `feature/<id>`

If worktrees or branches exist from a prior failed run:

- If the review doc was provided (re-run after rejection), **reuse existing worktrees and branches**. The coder agents will amend the existing work.
- If no review doc was provided but worktrees exist, warn the user:
    ```
    Existing worktrees found for <id>. This may be from a prior run.
    Options:
      1. Continue with existing worktrees (will commit on top of prior work)
      2. Clean up and start fresh (removes worktrees and deletes branches)
    ```
    Wait for user input before proceeding.

### 6. Create worktrees

For each required track, create a worktree if one doesn't already exist.

**Backend worktree** (if backend track):

```bash
git worktree add <worktree_root>/<repo>-<id>-backend -b feature/<id>-backend <default_branch>
```

If branch already exists (re-run):

```bash
git worktree add <worktree_root>/<repo>-<id>-backend feature/<id>-backend
```

**Frontend worktree** (if frontend track):

```bash
git worktree add <worktree_root>/<repo>-<id>-frontend -b feature/<id>-frontend <default_branch>
```

Same branch-exists handling as backend.

Verify each worktree was created successfully. If creation fails, report the git error and stop.

### 7. Dispatch coder agents

#### Single track (backend only or frontend only)

Run the single coder agent sequentially.

#### Both tracks

Both coders **may run in parallel** since they operate in isolated worktrees on separate branches. The user may invoke `/implement` in two separate Claude Code sessions to achieve actual parallelism. Within a single session, run them sequentially: **backend first, then frontend**.

**Backend coder** — invoke the `backend-developer` agent with:

- The approved spec
- The approved backend plan at `.claude/plans/<id>-backend-plan.md`
- The approved api-contract at `.claude/plans/<id>-api-contract.md`
- The review doc (if provided)
- Worktree path: `<worktree_root>/<repo>-<id>-backend/`
- Branch: `feature/<id>-backend`
- Rules to load: `.claude/rules.md`, `.claude/rules/backend.md`, `.claude/rules/data.md`, `.claude/rules/api.md`

The backend-developer uses the `backend-code` skill to:

- Add new error codes to `server/src/errors/codes.ts`
- Create `AppError` subclasses if needed
- Run Prisma migrations if needed
- Implement controllers, services, routes per the plan
- Write unit tests (if test framework exists)
- Run tests — **fail the track if tests don't pass**
- Commit with `<id>: <imperative summary>` format

**Frontend coder** — invoke the `frontend-developer` agent with:

- The approved spec
- The approved frontend plan at `.claude/plans/<id>-frontend-plan.md`
- The approved api-contract at `.claude/plans/<id>-api-contract.md`
- The wireframe at `.claude/designs/<id>-wireframe.md` (for token additions)
- The review doc (if provided)
- Worktree path: `<worktree_root>/<repo>-<id>-frontend/`
- Branch: `feature/<id>-frontend`
- Rules to load: `.claude/rules.md`, `.claude/rules/frontend.md`, `.claude/rules/api.md`, `.claude/rules/design.md`

The frontend-developer uses the `frontend-code` skill to:

- Add Tailwind tokens from wireframe's Required Token Additions
- Implement components, hooks, API calls per the plan
- Write unit tests (if test framework exists)
- Run tests — **fail the track if tests don't pass**
- Commit with `<id>: <imperative summary>` format

### 8. Handle coder failures

If either coder agent fails (tests don't pass, contract conflict, escalation needed):

- **Leave the worktree in place** for inspection.
- Report which track failed and why.
- Do not proceed to integration.
- If the failure is a contract conflict (coder needs api-contract change), report:
    ```
    Contract conflict in <track>: <description>
    This requires escalation back to /design to revise the api-contract.
    Worktrees preserved for inspection.
    ```

### 9. Integration

Once both tracks succeed (or the single track succeeds), run the `integration` skill.

The integration skill:

1. Creates an integration worktree at `<worktree_root>/<repo>-<id>-integration/` on branch `feature/<id>` off `<default_branch>`.
2. Merges backend first: `git merge feature/<id>-backend --no-ff -m "<id>: integrate backend"`
3. Merges frontend: `git merge feature/<id>-frontend --no-ff -m "<id>: integrate frontend"`
4. Runs the build (frontend and backend).
5. Runs unit tests on the merged result (if framework exists).

**If integration fails** (merge conflict, build failure, test failure):

- Leave all worktrees in place.
- Report which step failed with details (conflicted files, build errors, failing tests).
- Do not approve. Let the user decide whether to fix manually, re-run `/implement`, or hand back to `/design`.

**If integration succeeds**:

- Remove the frontend worktree: `git worktree remove <worktree_root>/<repo>-<id>-frontend`
- Remove the backend worktree: `git worktree remove <worktree_root>/<repo>-<id>-backend`
- Leave the integration worktree in place for `/review` and `/test`.

### 10. Agent approval

If all of the following hold, set implementation as approved:

1. Unit tests pass in each individual worktree before merge
2. Integration merge completes with zero conflicts
3. Unit tests pass on the merged integration branch
4. Build succeeds on the integration branch

Report success:

```
Implementation complete for <id>: <title>
Status: approved (agent)

Integration branch: feature/<id>
Integration worktree: <worktree_root>/<repo>-<id>-integration/

Tracks completed:
  Backend:  feature/<id>-backend   ✓ tests pass
  Frontend: feature/<id>-frontend  ✓ tests pass
  Merged:   feature/<id>           ✓ build + tests pass

Worktrees cleaned up: backend, frontend
Worktree preserved: integration (for /review and /test)

Next step: /review <id>
```

If any criterion fails, report failure without approving:

```
Implementation incomplete for <id>: <title>
Status: not approved

Failure: <which step failed>
Details: <error output>

Worktrees preserved for inspection:
  <worktree_root>/<repo>-<id>-backend/
  <worktree_root>/<repo>-<id>-frontend/
  <worktree_root>/<repo>-<id>-integration/   (if created)
```

## Protected branches

**Before any git operation**, verify the target branch is not in `protected_branches` from `config.yaml`. All worktrees branch from `<default_branch>` (which is `develop`, not `main`). Never check out, merge to, or push to `main` or any other protected branch.

## Constraints

- Never modify `.claude/` artifacts (specs, designs, plans, reviews). Coder agents write source code only.
- Never modify `config.yaml` or `rules.md`.
- Never force-push or rewrite history on any branch.
- Never auto-resolve merge conflicts. Surface them and stop.
- The api-contract is immutable to coder agents. Contract changes escalate to `/design`.
- Worktrees are created at `<worktree_root>/<repo>-<id>-<track>/`. Never create worktrees inside the main repo working directory.
- Clean up frontend and backend worktrees only on successful integration. On failure, preserve all worktrees.
- The integration worktree persists after success — it's needed by `/review` and `/test`. It gets cleaned up after `/pr`.
