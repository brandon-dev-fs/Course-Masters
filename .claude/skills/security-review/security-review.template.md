---
id: <prefix>-<n>
title: <Feature name> — security review
stage: review
status: pending           # set to approved or rejected based on issues found
approver: agent           # or human if overridden
# optional: approved_at: 2026-04-15T10:30:00Z
hand_back_to: implement   # earliest stage among issues: implement | design | spec
depends_on:
  - <prefix>-<n>-spec
---

# <Title> — Security Review

## Summary

<2–4 sentences: overall security posture of the change, themes in findings, attack surface introduced or modified.>

## Scope

<What was reviewed: routes, data models, auth changes, new dependencies, etc.>

## Issues

Issues at severity `medium` or above block auto-approval. Each issue includes `hand_back_to` to route the rejection.

For each issue, copy the block below.

---

### Issue: <Short title>

- **Severity**: `critical | high | medium | low | info`
- **Location**: `<file path>:<line number>` or `<endpoint path>` for design-level issues
- **Category**: <e.g., "Unvalidated input", "Missing auth", "Secret in logs", "Authorization gap">
- **Hand back to**: `implement | design | spec`
- **Description**: <What the vulnerability or risk is. Concrete attack scenario if applicable.>
- **Suggested fix**: <Concrete change. If hand-back is `design` or `spec`, describe the architectural change needed.>

---

<Repeat per issue. If no issues at any severity, replace with: "No security issues found." and remove `hand_back_to` from frontmatter.>

## Hand-back routing

Top-level `hand_back_to` in frontmatter is the **earliest** stage among all issues:

- Any issue `hand_back_to: spec` → doc-level `spec`
- Else any issue `hand_back_to: design` → doc-level `design`
- Else `implement`

Human re-runs the appropriate command with this review as argument:

- `/spec <id> .claude/reviews/<id>-security-review.md` — spec-level rework
- `/design <id> .claude/reviews/<id>-security-review.md` — design-level rework
- `/implement <id> .claude/reviews/<id>-security-review.md` — code-level fix

## Approval

If zero issues at severity `medium` or above, set frontmatter `status: approved`, `approver: agent`, `approved_at: <timestamp>`, and remove `hand_back_to`.

Otherwise set `status: rejected` with `hand_back_to` populated.
