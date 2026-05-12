---
id: cm-0014
title: Security Review — Standardize Form State Management and Error Display
stage: review
status: approved
approver: agent
approved_at: 2026-05-12T00:00:00Z
hand_back_to: null
---

# Security Review: Standardize Form State Management and Error Display

## Summary

This is a pure frontend refactor migrating eight form components off the `useFormSubmit` hook to inline async submit handlers, and standardizing all ad-hoc `<p className="text-sm text-destructive">` error elements to use the shared `ErrorMessage` component. No backend code, API contracts, authentication flows, or data models were changed. The security posture of the diff is sound.

## Scope

- Branch: `refactor/code_cleanup`
- Base: `develop`
- Files changed: 19 (18 modified, 1 deleted)
- Spec: cm-0014

## Issues

No issues found at any severity level.

## Checklist Coverage

| Category | Result |
|---|---|
| Input Validation — unvalidated input entering backend/data layers | n/a (pure frontend UI refactor; all input still validated client-side before API call) |
| Injection — SQL/NoSQL, command, template | n/a (no backend changes) |
| Authentication — missing middleware, hardcoded credentials, session config | pass — no auth flow changes; no secrets or credentials added to source |
| Authorization — IDOR, privilege escalation, missing role checks | pass — no authorization logic changed; `RequireAuth`/`RequireRole` wrappers untouched |
| Sensitive Data Exposure — secrets in logs, PII in responses, sensitive fields returned | pass — error messages displayed to users come exclusively from `classifyError`, which maps error classes to generic user-facing strings with no internal details; no logging of sensitive data added |
| Internal Details in Error Responses | pass — `classifyError` returns opaque category-level strings ("A server error occurred."); validation errors are developer-written literals with no stack traces or DB paths |
| Rate Limiting — missing limits on public/auth endpoints | n/a (no new endpoints; no auth form changes) |
| Dependency Vulnerabilities — new packages introduced | pass — `client/package.json` unchanged; no new runtime dependencies |
| Data Layer — unparameterized queries, destructive migrations | n/a (no backend or schema changes) |
| API Security — CORS, content-type, resource existence leakage | n/a (no API changes) |
| XSS via rendered user content | pass — `ErrorMessage` renders `message` as a React text node, not `dangerouslySetInnerHTML`; no raw HTML interpolation introduced |

## Additional Notes

- **`classifyError` safety (info):** The refactor inlines the same error-classification pattern that `useFormSubmit` previously centralized. In the new code, each form catches `ApiClientError` and calls `classifyError`, falling back to `err.message` for plain `Error` instances. The fallback path (`err.message`) displays developer-authored validation strings (e.g., "Title is required") which are all hardcoded literals — not server-originated data — so there is no risk of leaking internal server details through this path.
- **`ErrorMessage` variant (info):** The new `variant="inline"` renders a `<p role="alert">` with Tailwind text classes only, maintaining the same `role="alert"` accessibility attribute used previously. No security concern.

## Verdict

APPROVED — Zero security issues found. The refactor is a structural reorganization of client-side form state with no changes to authentication, authorization, API contracts, data handling, or dependencies.
