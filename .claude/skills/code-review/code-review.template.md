---
id: <prefix>-<n>
title: <Feature name> — code review
stage: review
status: pending          # set to approved or rejected based on issues found
approver: agent          # or human if overridden
# optional: approved_at: 2026-04-15T10:30:00Z
depends_on:
  - <prefix>-<n>-spec
---

# <Title> — Code Review

## Summary

<2–4 sentences: overall quality, major themes in the issues found, anything notable about the implementation.>

## Files Reviewed

<List of files in the diff. Group by frontend/backend/data if useful.>

- `server/src/...`
- `client/src/features/.../...`
- `server/prisma/schema.prisma`

## Issues

Issues at severity `medium` or above block auto-approval. `low` and `info` are advisory; human may force hand-back via override.

For each issue, copy the block below.

---

### Issue: <Short title>

- **Severity**: `critical | high | medium | low | info`
- **Location**: `<file path>:<line number>`
- **Rule**: <Which rule from `review.md` or stack rules; e.g., "backend.md: never call res.json error directly">
- **Description**: <What's wrong and why it matters.>
- **Suggested fix**: <Concrete change to make.>

---

<Repeat per issue. If no issues at any severity, replace with: "No issues found.">

## Approval

If zero issues at severity `medium` or above, set frontmatter `status: approved`, `approver: agent`, `approved_at: <timestamp>`.

Otherwise set `status: rejected`. Human re-runs `/implement <id> .claude/reviews/<id>-code-review.md` to address.
