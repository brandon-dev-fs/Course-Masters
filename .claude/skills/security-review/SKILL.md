---
name: security-review
description: Review the integration branch diff for security issues and produce a structured security review with hand-back routing. Use when /review runs. Auto-approves only if zero issues at severity medium or above. Each issue carries a hand_back_to field routing rejections to the right earlier stage.
---

# security-review

## Purpose

Diff `feature/<id>` against the default branch (`develop`) and identify security issues: attack surface, data exposure, auth gaps, dependency risks. Each issue includes `hand_back_to` so the rejection routes to the correct earlier stage (spec, design, or implement).

## Inputs

- The approved spec at `.claude/specs/<id>-spec.md`
- The approved plans at `.claude/plans/<id>-*.md`
- The diff between `feature/<id>` and `develop`

## Output

A single file at `.claude/reviews/<id>-security-review.md` matching `template.md` in this skill's directory.

## Procedure

1. **Read** `template.md` in this skill directory.

2. **Get the diff**: `git diff develop..feature/<id>` from the integration worktree.

3. **Run the security checklist** from `review.md`. Each finding includes `hand_back_to`:

   - Unvalidated input reaching DB/FS/shell/external API → `critical`, `implement`
   - SQL injection (`$queryRaw` with interpolated user input) → `critical`, `implement`
   - Secrets in code → `critical`, `implement`
   - Secrets in logs (tokens, passwords, PII in log statements) → `high`, `implement`
   - Missing auth on routes handling user data → `critical`, `design` (architectural) or `implement` (oversight)
   - Authorization gap (user A can access user B's resource) → `high`, `design`
   - PII exposure in responses (password hashes, internal fields) → `high`, `implement`
   - Stack traces in error responses → `high`, `implement`
   - CORS misconfiguration on credentialed routes → `high`, `implement`
   - Missing rate limiting on new public endpoints → `medium`, `design`
   - Dependency CVEs → `high`, `implement`
   - Insecure direct object reference → `high`, `design`
   - Destructive migration in same PR as dependent code change → `high`, `implement`
   - Migration affecting columns referenced by code in `develop` → `critical`, `design`

4. **For each issue**, copy the issue block in the template and fill: severity, location, category, hand_back_to, description (with attack scenario if applicable), suggested fix.

5. **Determine doc-level `hand_back_to`** — the **earliest** stage among all issues:
   - Any `spec` → doc-level `spec`
   - Else any `design` → doc-level `design`
   - Else `implement`
   
   Set this in frontmatter.

6. **Determine status**:
   - Zero issues at `medium` or above → `status: approved`, `approver: agent`, `approved_at: <timestamp>`. Remove `hand_back_to` from frontmatter.
   - Otherwise → `status: rejected` with `hand_back_to` populated. Human re-runs the appropriate command:
     - `/spec <id> .claude/reviews/<id>-security-review.md`
     - `/design <id> .claude/reviews/<id>-security-review.md`
     - `/implement <id> .claude/reviews/<id>-security-review.md`

7. **Write** to `.claude/reviews/<id>-security-review.md`.

8. **Report** the file path, status, and `hand_back_to` if rejected.

## Constraints

- Focus on security: attack surface, data exposure, auth, dependencies. Do not duplicate code-review's stylistic checks.
- Never edit code or upstream artifacts.
- Approve nothing without reviewing the full diff.
- Apply rules from `backend.md`, `data.md`, `api.md` for the security-relevant patterns (Zod validation, parameterized queries, error envelopes, auth middleware).
- Auth-related findings should prefer `UnauthorizedError`/`ForbiddenError` recommendations to bring auth into the standard envelope (desired-state migration noted in `backend.md`).
- Do not write outside `.claude/reviews/`.
