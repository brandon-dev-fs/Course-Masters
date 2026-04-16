---
name: code-review
description: Review the integration branch diff against project rules and produce a structured code review document. Use when /review runs. Auto-approves only if zero issues at severity medium or above.
---

# code-review

## Purpose

Diff `feature/<id>` against the default branch (`develop`) and produce a code review identifying violations of project rules. Each issue is classified by severity, located by file and line, and given a suggested fix.

## Inputs

- The approved spec at `.claude/specs/<id>-spec.md`
- The approved plans at `.claude/plans/<id>-*.md`
- The diff between `feature/<id>` and `develop`

## Output

A single file at `.claude/reviews/<id>-code-review.md` matching `template.md` in this skill's directory.

## Procedure

1. **Read** `template.md` in this skill directory.

2. **Get the diff**: `git diff develop..feature/<id>` from the integration worktree.

3. **Run the checklist** from `review.md` against every changed file. The checklist covers:
   - Direct error responses (`res.json({ error })`, `res.status(4xx)` outside `errorHandler`) → `medium`
   - Missing `asyncHandler` on async routes → `medium`
   - Hardcoded error code strings → `medium`
   - Direct `fetch` outside `ApiClient` → `medium`
   - Hardcoded design values (hex, arbitrary px, arbitrary font sizes) → `low`
   - `console.log` in committed code → `low`
   - `any` without comment → `low`
   - Type assertions outside boundaries → `low`
   - New unjustified dependencies → `medium`
   - Cross-feature imports on frontend → `medium`
   - Migration drops/renames combined with code changes → `high`
   - Missing Zod validation on new endpoints → `high`
   - New code without unit tests → `info` (downgraded until test framework exists; flip to `medium` once it does)
   - Wrong-layer placement (business logic in controllers, Express types in services) → `medium`
   - Naming convention violations → `low`
   - Commit message format → `low`

4. **For each issue found**, copy the issue block in the template and fill: severity, location (`file:line`), rule reference, description, suggested fix.

5. **Determine status**:
   - Zero issues at `medium` or above → frontmatter `status: approved`, `approver: agent`, `approved_at: <timestamp>`.
   - Otherwise → `status: rejected`. Human re-runs `/implement <id> .claude/reviews/<id>-code-review.md`.

6. **Write** to `.claude/reviews/<id>-code-review.md`.

7. **Report** the file path and status.

## Constraints

- Never edit code. Produce the review doc only.
- Never modify upstream artifacts (spec, designs, plans).
- Never approve based on partial review. Cover the full diff.
- Apply rules from `backend.md`, `frontend.md`, `data.md`, `api.md` based on which files appear in the diff.
- Do not duplicate security checks — that's `security-review`'s job. If something is both a code quality issue and a security issue, flag the code-quality angle here and let the security review cover the rest.
- Do not write outside `.claude/reviews/`.
