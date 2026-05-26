---
description: Run the implementation stage. Creates worktrees, executes plan tasks one at a time with lead-dev review after each. Agent-approved.
argument-hint: <spec id> [review.md]
---

# /implement

You are running the **Implementation stage**. Create worktrees, then execute each task from the plan sequentially with a lead-dev review after every task.

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

If review doc provided: this is a revision pass. The coder agents receive the review doc alongside their tasks.

### 5. Handle existing worktrees

With review doc: reuse. Without: warn and ask.

### 6. Create worktrees

Ensure the worktrees directory exists and is gitignored:

```bash
mkdir -p worktrees
grep -qxF 'worktrees/' .gitignore 2>/dev/null || echo 'worktrees/' >> .gitignore
```

Branch off the **current branch**:

```bash
CURRENT=$(git branch --show-current)
git worktree add worktrees/<id>-backend -b <id>-backend $CURRENT
git worktree add worktrees/<id>-frontend -b <id>-frontend $CURRENT
```

If branch already exists (re-run): `git worktree add <path> <branch>` (no `-b`).

### 7. Execute tasks (per track)

For each track (backend, frontend — backend first in single session):

1. **Parse the plan**: read the plan document, collect all `### Tasks` sections. Build an ordered list of all unchecked (`- [ ]`) tasks across all sections, preserving section context.

2. **For each unchecked task**, run the task loop:

    ```
    a. Assign task to coder agent
       - Pass: task description, parent section context, CLAUDE.md, scoped rules
       - Pass: review doc if this is a revision pass
       - Coder implements the single task and commits

    b. Lead-dev reviews the task
       - Pass: task description, section context, coder's diff
       - Lead-dev checks: completeness, correctness, conventions, scope, tests

    c. If lead-dev approves:
       - Check the task off in the plan: - [ ] → - [x]
       - Proceed to next task

    d. If lead-dev rejects:
       - Pass feedback to the coder
       - Coder retries the task (up to 3 attempts)
       - After 3 failures, escalate to human and stop:
         "Task '<description>' failed review 3 times. Escalating."
    ```

3. **Track complete** when all tasks are checked off.

### 8. Handle coder failures

If a coder fails (tests don't pass, contract conflict):

- Leave worktree in place.
- Report which task failed and why.
- Contract conflicts: `Contract conflict — escalate to /design.`

### 9. Merge back into current branch

Once both tracks complete (or the single track completes):

1. Return to the main repo working directory.
2. Merge backend first:
    ```bash
    git merge <id>-backend --no-ff -m "<id>: integrate backend"
    ```
3. If conflicts: stop, report, leave worktrees.
4. Merge frontend:
    ```bash
    git merge <id>-frontend --no-ff -m "<id>: integrate frontend"
    ```
5. If conflicts: stop, report, leave worktrees.
6. Run build (using project's build command from `CLAUDE.md`).
7. Run tests (using project's test command from `CLAUDE.md`, if configured).

### 10. Cleanup

On success:

```bash
git worktree remove worktrees/<id>-backend
git worktree remove worktrees/<id>-frontend
git branch -d <id>-backend
git branch -d <id>-frontend
```

On failure: preserve everything.

### 11. Agent approval

All must hold:

1. All tasks checked off in both plans
2. Tests pass per worktree
3. Merge with zero conflicts
4. Tests pass on current branch after merge
5. Build succeeds on current branch after merge

**Pass:**

```
Implementation complete: <id>
Branch: <current branch>
Tasks completed: X/X backend, Y/Y frontend
Worktrees and coder branches cleaned up.
Next: /review <id>
```

**Fail:**

```
Implementation incomplete: <id>
Failure: <step and details>
Tasks completed: X/N backend, Y/M frontend
Worktrees preserved for inspection.
```

## Constraints

- Never create a new feature branch. Work on the user's current branch.
- Never modify `.claude/` artifacts except checking off tasks in plan documents.
- Never touch protected branches.
- Never force-push. Never auto-resolve conflicts.
- API contract is immutable to coders.
- Clean up worktrees and coder branches only on success.
- The lead-dev review loop is fully automated — no HITL unless a task fails 3 times.
