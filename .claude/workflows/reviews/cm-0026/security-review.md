---
id: cm-0026
title: Security Review — Course Page Roadmap Refactor (Pass 3)
stage: review
status: approved
hand_back_to: null
approver: agent
---

# Security Review: Course Page Roadmap Refactor (Pass 3)

## Summary

This is the third and final security review pass on the `refactor/course-page-update` branch against `develop`. The two latest commits (`cm-0026: add missing type=button to RoadmapUnitCard edit button` and `cm-0026: add opacity-60 to locked unit li, add aria-hidden to decorative icons`) add no new security surface. The `opacity-60` class is a pure CSS visual change on a locked `<li>` element; the `aria-hidden="true"` additions are decorative accessibility attributes on icon elements. Neither change touches API calls, authentication, authorization, data handling, URL construction, or any other security-relevant path. All prior approved findings are unchanged.

## Scope

- Branch: `refactor/course-page-update`
- Base: `develop`
- Files changed: 20 (16 source, 4 test)
- Spec: cm-0026

## Issues

### [INFO] Final Exam `Link` resolves to a fragment anchor (`to="#exam"`) rather than a real route

- **Severity**: info
- **Location**: `client/src/features/courses/UnitRoadmap.tsx:1024`
- **Category**: api-security
- **Hand back to**: null
- **Description**: When all units are complete, the Final Exam item renders `<Link to="#exam">`. This is not a security vulnerability — React Router's `to="#exam"` produces a same-page hash anchor and cannot be influenced by user-controlled data. Carried forward from prior passes because when the real exam route is wired up it will need server-side auth protection. The spec explicitly defers this, so no action is required now.
- **Suggested Fix**: No security action required in this PR. When the exam route is implemented, replace `to="#exam"` with the real exam path (e.g., `/courses/${courseId}/exam`) and confirm the destination route is protected by `authenticate()` middleware server-side.

## Checklist Coverage

| Category | Result |
|---|---|
| Input validation | Pass — search query mutates local React state only; no user input reaches API calls |
| Injection (SQL/NoSQL/template) | Pass — no backend calls; URL segments use server-returned UUIDs exclusively |
| XSS — dangerouslySetInnerHTML, href injection | Pass — no `dangerouslySetInnerHTML`; all user-origin strings rendered via JSX auto-escaping or controlled `value=` bindings |
| Authentication | Pass — page wrapped in `RequireAuth`; no credentials in source; `credentials: 'include'` pattern unchanged |
| Authorization | Pass — `canEdit` UI gating sourced from `useCanEdit()`; server-side `authorize()` and `requireCourseOwnership()` middleware untouched |
| Sensitive data exposure | Pass — no logging statements; no new PII fields rendered; `course.author.name` is a JSX text child only |
| URL construction / open redirect | Pass — all route paths constructed from server-issued UUIDs; no user-controlled string interpolated into navigation targets |
| Rate limiting | Pass — no new API endpoints or mutation calls introduced |
| Dependency vulnerabilities | Pass — no new packages added |
| Data layer | N/A — frontend-only change; no schema or migration changes |
| API security / CORS | N/A — no new endpoints; existing CORS and `apiClient` configuration unchanged |
| Latest commits (opacity-60, aria-hidden) | Pass — CSS visual attribute and ARIA decorative attribute; zero security impact |

## Verdict

APPROVED — zero issues at medium severity or above. No new security findings introduced in this pass. The single [INFO] advisory (placeholder exam route) is a pre-existing deferral and does not block merge.
