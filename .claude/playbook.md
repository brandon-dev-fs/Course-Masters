# Workflow Playbook

## Prerequisites

1. Your repo has a `CLAUDE.md` at the root. If missing, run `/init` in Claude Code to generate one.
2. Create `.claude/config.yaml` with your project prefix and default branch.
3. Create `.claude/rules.md` (copy the starter from the workflow files).
4. Optionally fill in scoped rules in `.claude/rules/` for project-specific conventions.

## Running the workflow

### 1. Spec → `/spec <what you want to build>`

Creates `.claude/workflows/specs/<id>/spec.md`. **Approve it:**
```
/approve .claude/workflows/specs/<id>/spec.md
```

### 2. Design → `/design <id>`

Creates plans and wireframes with per-section task lists. **Approve each file** listed in the output.

### 3. Implement → `/implement <id>`

Make sure you're on your feature branch first. Executes tasks one at a time. Code and security review runs automatically after each task. Review docs are built during implementation. Auto-approved if all tasks pass review and build succeeds.

### 4. PR → `/pr <id>`

Opens or generates the pull request. Merge when ready.

## Useful commands

- `/status <id>` — see where a feature stands
- `/approve <file>` — approve any artifact
- `/review <id>` — optional re-review after manual changes

## When something gets rejected

During implementation, code and security review runs after each task automatically. If a task fails review 3 times, it escalates to you.

After implementation, if you want to re-run a full review:
```
/review <id>
```

## After merge

Worktrees and coder branches are cleaned up automatically. Delete your feature branch after the PR merges if desired.