---
name: code-review
description: Review current branch diff against project rules. Split by file scope for token efficiency. Produces .claude/reviews/<id>/code-review.md.
---

# code-review

## Purpose

Diff current branch against the default branch and produce a code review checking project conventions.

## Inputs

- Approved spec at `.claude/specs/<id>/spec.md`
- Approved plans at `.claude/plans/<id>/`
- `CLAUDE.md` for project conventions
- Diff: `git diff <default_branch>..HEAD`

## Output

`.claude/reviews/<id>/code-review.md` matching `template.md`.

## Procedure

1. Read `template.md`.
2. Read `CLAUDE.md` to understand project structure (which directories are backend vs frontend).
3. Get the diff: `git diff <default_branch>..HEAD`.
4. **Split by scope**: for each file group, load only the relevant scoped rules from `.claude/rules/`. Determine backend vs frontend directories from `CLAUDE.md`.
5. Run the checklist from `.claude/rules/review.md` plus any project-specific checks.
6. Create `.claude/reviews/<id>/` if missing.
7. Merge issues from all passes into one review doc.
8. Set `status: approved` if zero issues at `medium`+, otherwise `rejected`.
9. Verify mechanically.

## Constraints

- Never edit code. Doc only.
- Never modify upstream artifacts.
- Write only to `.claude/reviews/<id>/`.
