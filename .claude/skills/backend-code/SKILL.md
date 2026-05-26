---
name: backend-code
description: Implement a single task from the backend plan in an isolated worktree. Called repeatedly by /implement, one task at a time.
---

# backend-code

## Purpose

Implement **one task** from the backend plan. Called by `/implement` for each unchecked task. Commit the work for that task only, then return for lead-dev review.

## Inputs

- The current task description and its parent section from the plan
- The full section context (not the entire plan — just the relevant section)
- `CLAUDE.md` for backend stack and conventions
- `.claude/rules/backend.md` and `.claude/rules/data.md`
- Optional: lead-dev rejection feedback (if retrying a failed task)
- Worktree path and branch name

## Output

One or more commits implementing the single task. Commit message format: `<id>: <task summary>`.

## Procedure

1. Read `CLAUDE.md` and relevant scoped rules.
2. Read the task description and its parent section for context.
3. If lead-dev feedback provided (retry), read the feedback and address the specific issues.
4. Implement **only what the task describes**. Do not work ahead to other tasks.
5. Write tests for the task's code if a test framework exists and the task involves testable logic.
6. Run tests. Do not commit if tests fail.
7. Commit with `<id>: <task summary>`.
8. Return. The lead-dev will review before the next task is assigned.

## Constraints

- Implement one task only. Do not touch code outside the task's scope.
- Stay in the assigned worktree.
- Follow all conventions from `CLAUDE.md` and scoped rules.
- API contract is immutable. Stop and escalate if a contract change is needed.
- Never touch protected branches.
