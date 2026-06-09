---
name: security-review
description: Review current branch diff for security issues with hand-back routing. Produces .claude/reviews/<id>/security-review.md.
---

# security-review

## Purpose

Diff current branch against the default branch and identify security issues. Single pass. Each issue carries `hand_back_to`.

## Inputs

- Approved spec at `.claude/specs/<id>/spec.md`
- Approved plans at `.claude/plans/<id>/`
- `CLAUDE.md` for project conventions and auth patterns
- Diff: `git diff <default_branch>..HEAD`

## Output

`.claude/reviews/<id>/security-review.md` matching `template.md`.

## Procedure

1. Read `template.md`.
2. Read `CLAUDE.md` and scoped rules for auth patterns and security conventions.
3. Get the diff.
4. Run security checklist from `.claude/rules/review.md`.
5. Each issue gets `hand_back_to: implement | design | spec`.
6. Create `.claude/reviews/<id>/` if missing.
7. Doc-level `hand_back_to` = earliest stage among all issues.
8. Set `status: approved` if zero at `medium`+, otherwise `rejected`.
9. Verify mechanically.

## Constraints

- Focus on security, not style.
- Never edit code or upstream artifacts.
- Write only to `.claude/reviews/<id>/`.
