---
description: Run the implementation stage. Creates worktrees for frontend/backend off the current branch, dispatches coders, merges back. Agent-approved.
argument-hint: <spec id> [review.md]
---

# /implement

You are running the **Implementation stage**. Read approved design artifacts, create worktrees off the current branch, dispatch coders, merge results back.

## Arguments

- Spec ID: $ARGUMENTS (first argument, required)
- Review doc path: (optional second argument) — rejected review/test doc for revision

If spec ID is empty, ask and stop.

## Procedure

### 1. Verify environment

- `CLAUDE.md` exists. If missing: `Run /init to generate CLAUDE.md first.`
- `.claude/config.yaml` — read `worktree_root`, `protected_branches`.
- `.claude/rules.md` — load.
- Read current branch: `git branch --show-current`. Verify not in `protected_branches`.

### 2. Determine tracks

Read spec's Required Design Artifacts: backend-plan → backend track, frontend-plan → frontend track.

### 3. Verify prerequisites

All required design artifacts must be `status: approved`.

### 4. Check review feedback

If review doc provided: pass to coder agents as primary input.

### 5. Handle existing worktrees

With review doc: reuse. Without: warn and ask.

### 6. Create worktrees

Branch off the **current branch**:
```bash
CURRENT=$(git branch --show-current)
git worktree add <worktree_root>/<repo>-<id>-backend -b <id>-backend $CURRENT
git worktree add <worktree_root>/<repo>-<id>-frontend -b <id>-frontend $CURRENT
```

### 7. Dispatch coders

Each coder agent reads `CLAUDE.md` and relevant scoped rules for stack conventions.

Single session: backend first, then frontend. Parallel across separate sessions.

### 8. Handle coder failures

Leave worktree, report. Contract conflicts escalate to `/design`.

### 9. Merge back into current branch

1. Merge backend: `git merge <id>-backend --no-ff -m "<id>: integrate backend"`
2. Merge frontend: `git merge <id>-frontend --no-ff -m "<id>: integrate frontend"`
3. Run build (using project's build command from `CLAUDE.md`).
4. Run tests (using project's test command from `CLAUDE.md`, if configured).

### 10. Cleanup

On success: remove worktrees, delete coder branches.
On failure: preserve everything.

### 11. Agent approval

All must hold: tests pass per worktree, zero conflicts, tests pass merged, build succeeds.

## Constraints

- Never create a new feature branch. Work on the user's current branch.
- Never modify `.claude/` artifacts.
- Never touch protected branches.
- Never force-push. Never auto-resolve conflicts.
- API contract is immutable to coders.
