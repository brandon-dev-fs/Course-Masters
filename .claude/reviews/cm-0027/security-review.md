---
id: cm-0027
title: Security Review — Refactor Lesson Detail Page Layout and Navigation
stage: review
status: approved
hand_back_to: null
approver: agent
---

# Security Review: Refactor Lesson Detail Page Layout and Navigation

## Summary

This review covers five frontend-only files changed on the `refactor/lessons-page` branch: `AssignmentStepper.tsx`, `LessonDetailPage.tsx`, `UnitLessonSidebar.tsx`, `StudentToolsBar.tsx`, and `StudentMaterialsModal.tsx`. The changes are a pure UI/layout refactor — no new API endpoints, no new dependencies, no backend changes, and no new data flows into or out of the system. The overall security posture is sound. One informational finding about ARIA role usage is documented but does not block approval.

## Scope

- Branch: `refactor/lessons-page`
- Base: `develop`
- Files changed: 5 source files + 3 test files
- Spec: cm-0027

## Issues

### [INFO] ARIA role mismatch on mobile tab bar — api-security

- **Severity**: info
- **Location**: `client/src/features/student-notes/StudentToolsBar.tsx` (mobile `<nav>` block, `role="tab"` buttons)
- **Category**: other
- **Hand back to**: frontend
- **Description**: The mobile bottom bar renders `<button role="tab" aria-selected={isActive}>` elements inside a `<nav>` element. The WAI-ARIA spec requires `role="tab"` elements to be owned by a `role="tablist"` container. Without `tablist`, assistive technologies may announce the buttons inconsistently. This is an accessibility correctness issue rather than a security vulnerability; it carries no exploitable security risk.
- **Suggested Fix**: Either wrap the buttons in `<div role="tablist" aria-label="Student tools">` (replacing the `<nav>`), or remove `role="tab"` and `aria-selected` from the buttons and rely on `aria-pressed` (for toggle buttons) or simply the `aria-label` on each button. Because the `<nav>` already has `aria-label="Student tools"`, the simpler fix is to drop the tab role entirely and use `aria-pressed={isActive}` on each button.

## Checklist Coverage

| Category | Result |
|---|---|
| Input Validation — unvalidated input to DB/filesystem/shell | pass — no new user input enters any data layer |
| Injection — SQL/NoSQL/command/template | pass — no queries or shell calls in scope |
| Authentication — missing middleware, ordering, hardcoded secrets | pass — no new routes; existing auth gate unchanged |
| Authorization — IDOR, privilege escalation, missing role checks | pass — no new resource access patterns |
| Sensitive Data Exposure — secrets in logs, PII in responses, sensitive fields | pass — only non-sensitive boolean stored in localStorage (`cm-sidebar-collapsed`) |
| XSS — dangerouslySetInnerHTML, unsanitized HTML | pass — no innerHTML usage; all user-sourced strings rendered as React text nodes (auto-escaped) |
| Open Redirect — user-supplied URLs | pass — all `Link` components use internal React Router paths built from UUID params |
| localStorage misuse — tokens, PII, sensitive state | pass — only UI preference (sidebar collapsed boolean) persisted |
| Rate Limiting — missing limits on new endpoints | n/a — no new endpoints |
| Dependency Vulnerabilities — new packages | pass — no new dependencies added |
| Data Layer — unparameterized queries, destructive migrations | n/a — no backend or schema changes |
| API Security — CORS, content-type, resource existence leakage | n/a — no new API surface |
| Event listener hygiene — leaks, prototype pollution | pass — `keydown` listener in `UnitLessonSidebar` properly cleaned up via `useEffect` return |

## Verdict

APPROVED — Zero issues at medium severity or above. One informational ARIA role mismatch noted for the frontend team to address at their discretion.
