---
name: integration
description: Merge frontend and backend coder branches back into the current branch, verify build + tests pass, clean up. Mechanical skill.
---

# integration

## Purpose

Merge `<id>-backend` and `<id>-frontend` back into the user's current branch. Verify merged result builds and tests pass. Clean up worktrees and coder branches on success.

## Inputs

- Spec ID
- Current branch name (merge target)
- Both coder branches with passing tests
- `worktree_root` from `.claude/config.yaml`
- `CLAUDE.md` for build and test commands

## Output

Coder branches merged, worktrees and branches deleted on success, everything preserved on failure.

## Procedure

1. Verify both coder branches exist with passing tests.
2. Return to main repo working directory.
3. Merge backend first: `git merge <id>-backend --no-ff -m "<id>: integrate backend"`
4. If conflicts: stop, report, leave everything.
5. Merge frontend: `git merge <id>-frontend --no-ff -m "<id>: integrate frontend"`
6. If conflicts: stop, report, leave everything.
7. Run build (using the project's build command from `CLAUDE.md`).
8. Run unit tests (using the project's test command from `CLAUDE.md`, if configured).
9. On success:
    - `git worktree remove worktrees/<id>-backend`
    - `git worktree remove worktrees/<id>-frontend`
    - `git branch -d <id>-backend`
    - `git branch -d <id>-frontend`
10. On failure: leave everything, report which step failed.

## Constraints

- Backend merges first.
- Never auto-resolve conflicts.
- Never force-push.
- Never touch protected branches.
