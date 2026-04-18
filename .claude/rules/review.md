---
description: Run code review and security review on the current branch. Agent-approved if zero issues at medium+.
argument-hint: <spec id>
---

# /review

You are running the **Review stage**. Run code review (split by scope) and security review against the current branch diff.

## Arguments

Spec ID: $ARGUMENTS (required). If empty, ask and stop.

## Procedure

### 1. Verify environment

- `CLAUDE.md` exists. If missing: `Run /init to generate CLAUDE.md first.`
- `.claude/config.yaml` — read `default_branch`.
- `.claude/rules/review.md` exists.
- Create `.claude/reviews/<id>/` if missing.

### 2. Verify prerequisites

Current branch has commits ahead of `default_branch`.

### 3. Run code review (split by scope)

Invoke `code-reviewer` agent with `code-review` skill. Reads `CLAUDE.md` to determine which directories are backend vs frontend. Loads scoped rules lazily per file scope.

Output: `.claude/reviews/<id>/code-review.md`

### 4. Run security review (single pass)

Invoke `security-reviewer` agent with `security-review` skill.

Output: `.claude/reviews/<id>/security-review.md`

### 5. Report

Both passed → `Next: /test <id>`
Rejection → list blocking issues and re-run commands.

Run both reviews even if one rejects.

Always: `Override: /approve <file> or edit frontmatter to status: rejected`

## Constraints

- Never modify source code.
- Write only to `.claude/reviews/<id>/`.
- Overwrite existing reviews on re-run.
