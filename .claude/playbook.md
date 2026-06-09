# Workflow Playbook

## Prerequisites

1. Your repo has a `CLAUDE.md` at the root. If missing, run `/init` in Claude Code to generate one.
2. Create `.claude/config.yaml` with your project prefix and default branch.
3. Create `.claude/rules.md` (copy the starter from the workflow files).
4. Optionally fill in scoped rules in `.claude/rules/` for project-specific conventions.

## Running the workflow

### 1. Spec → `/spec <what you want to build>`

Creates `.claude/specs/<prefix>-0001/spec.md`. **Approve it:**
```
/approve .claude/specs/<prefix>-0001/spec.md
```

### 2. Design → `/design <id>`

Creates plans and wireframes. **Approve each file** listed in the output.

### 3. Implement → `/implement <id>`

Make sure you're on your feature branch first. Creates temporary worktrees, writes code, merges back. Auto-approved if tests pass and build succeeds.

### 4. Review → `/review <id>`

Runs code + security review. Auto-approved if no blocking issues.

### 5. Test → `/test <id>`

Runs unit and E2E tests. Auto-approved if all pass.

### 6. PR → `/pr <id>`

Opens or generates the pull request. Merge when ready.

## Useful commands

- `/status <id>` — see where a feature stands
- `/approve <file>` — approve any artifact

## When something gets rejected

The output tells you what failed and which command to re-run:
```
/implement <id> .claude/reviews/<id>/code-review.md
```

## After merge

Worktrees and coder branches are cleaned up automatically. Delete your feature branch after the PR merges if desired.
