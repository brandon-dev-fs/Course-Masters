---
id: cm-0025
title: Landing Page Card & How It Works Updates — Security Review
stage: review
status: approved
---

# Security Review — cm-0025: Landing Page Card & How It Works Updates

## Summary

Six frontend-only files reviewed: `CourseFilters.tsx` (new), `CourseCardMenu.tsx` (new), `HowItWorksSection.tsx` (new), `CourseCard.tsx` (modified), `HomePage.tsx` (modified), and `CourseCard.test.tsx` (modified). No backend, API, or database code was touched. Overall security posture is strong — no user-controlled data reaches a dangerous sink, auth guards are correctly ordered and sequenced, and no sensitive data is exposed anywhere in the diff.

## Issues

No issues found.

## Checklist

| Category | Result | Notes |
|---|---|---|
| XSS / dangerouslySetInnerHTML | Pass | No `dangerouslySetInnerHTML` usage. Search query consumed by `String.prototype.includes()` only — never rendered as HTML. |
| Open redirect | Pass | Only dynamic `<Link to>` is `/courses/${course.id}` (UUID from authenticated API). CTA uses hardcoded `"/register"`. No user-controlled `href` or `to`. |
| Auth bypass | Pass | `HowItWorksSection` renders only when `!loggedIn`. Course grid and mutation controls gated behind `loggedIn`. `canEdit` guards "New Course" button and `CourseCardMenu`. |
| Hardcoded secrets | Pass | No API keys, tokens, or credentials in any changed file. |
| IDOR / privilege escalation | Pass | No direct resource lookup by user-controlled ID. Edit/delete callbacks only rendered inside `canEdit`-guarded block. Server-side ownership enforcement unchanged. |
| Sensitive data exposure | Pass | No email, session token, internal path, or stack trace rendered anywhere in the diff. |
| CSRF | Pass | All mutations go through `apiClient` with `credentials: 'include'`. better-auth session cookie mechanism unchanged. No new mutation pathways. |
| Injection | Pass | `getCourseCategory` uses `String.prototype.includes()` on a local string — no user input reaches a query, shell, or template engine. |
| Rate limiting | N/A | No new API endpoints. |
| Dependency vulnerabilities | Pass | No new npm dependencies added. |
| Data layer | N/A | No schema, migration, or Prisma query changes. |
