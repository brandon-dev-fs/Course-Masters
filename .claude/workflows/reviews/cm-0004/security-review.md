---
id: cm-0004
title: Security Review — Enforce Resource-Level Authorization on Mutations
stage: review
status: approved
hand_back_to: null
approver: agent
---

# Security Review: Enforce Resource-Level Authorization on Mutations

## Summary

This second-round review covers the full diff for cm-0004, which adds completion routes (FR-10, FR-11), wires `requireSelf` to the resource-completion POST (FR-12), and introduces a defensive role fallback in `requireCourseOwnership`. Both medium-severity issues from the prior rejection have been resolved. No new authorization gaps, IDOR surfaces, injection vectors, or sensitive data exposure patterns were introduced. The codebase now enforces ownership at every mutation endpoint required by the spec.

## Scope

- Branch: `refactor/code_cleanup`
- Base: `develop`
- Files changed: 14
- Spec: cm-0004

## Issues

### [LOW] `requireCourseOwnership` role fallback throws on unknown roles but passes students silently — authorization logic

- **Severity**: low
- **Location**: `server/src/middleware/authorize-resource.ts:252-270`
- **Category**: authorization
- **Hand back to**: backend
- **Description**: The middleware calls `next()` for students at line 257 with no explicit `return` guard comment confirming the invariant, then throws on any role that is not `teacher` at lines 264-270. This is correct behavior for the current role set (`student`, `teacher`, `admin`). The concern is defense-in-depth: the defensive guard at lines 264-270 fires for any future role other than `teacher`, but only after the student passthrough at line 257 has already allowed students through. The existing `authorize('teacher', 'admin')` preceding this middleware on all teacher-gated routes ensures a student would already be rejected at the role-check layer, so the current behavior is safe by construction. The explicit `AppError` throw for unknown roles (the added fallback) closes the silent passthrough regression that the prior review flagged. This is a documentation and readability concern rather than an active security gap.
- **Suggested Fix**: Add a comment at line 257 stating the invariant explicitly: `// Students are allowed through; their records are stamped with req.user.id by construction. The preceding authorize('teacher', 'admin') ensures only teacher|admin reaches here, so this branch is only reachable if routes omit the role check — the defensive throw below catches that.` No code change required.

### [INFO] `GET /assessments/:assessmentId/attempts` has no role restriction — authorization scope

- **Severity**: info
- **Location**: `server/src/routes/assessment.routes.ts` (line: `assessmentsRouter.get('/:assessmentId/attempts', assessmentController.getAttempts)`)
- **Category**: authorization
- **Hand back to**: backend
- **Description**: This route is behind `authenticate()` (via the global middleware in `index.ts`) but has no `authorize()` or resource-level ownership check. Any authenticated user (student, teacher, or admin) can retrieve all attempts for any assessment by its ID. This was pre-existing before this PR and is outside the mutation scope of cm-0004. The spec explicitly defers read-access restrictions to a future spec. No action is required now, but the surface is noted for the future enrollment/read-scoping spec.
- **Suggested Fix**: No action required for this spec. When the read-access restriction spec is implemented, add an ownership or enrollment check to this GET route.

### [INFO] Structured authorization logging uses `console.error` — logging

- **Severity**: info
- **Location**: `server/src/middleware/authorize-resource.ts:106-119`
- **Category**: other
- **Hand back to**: backend
- **Description**: `logAuthFailure` writes structured JSON via `console.error`. The log payload contains only `userId`, `resourceId`, `action`, and `timestamp` — no passwords, session tokens, or content fields. NFR-03 is satisfied. The code comment acknowledges this is a placeholder for a future logging library. No sensitive data exposure risk present.
- **Suggested Fix**: No immediate action required. When `pino` or an equivalent structured logger is adopted project-wide, update the single `logAuthFailure` function. The centralized design means this is a one-line change.

## Checklist Coverage

| Category | Result |
|---|---|
| Input Validation | pass — resource IDs come from `req.params` (Express-parsed path segments, not user-supplied body fields); no new body fields that could carry a spoofed ID were introduced; `requireSelf` guards against any future body `userId` on resource-completion POST |
| Injection | pass — all DB access uses Prisma parameterized queries exclusively; no raw query interpolation introduced |
| Authentication | pass — all new routes (`/lessons/:lessonId/complete`, `/units/:unitId/complete`) are mounted after `router.use(authenticate())` in `index.ts`; completion controllers reference `req.user!.id` which is only populated post-authentication |
| Authorization | pass — FR-10 and FR-11 completion routes stamp userId from session (safe by construction, no middleware guard needed); FR-12 resource-completion POST is guarded by `requireSelf`; FR-13 attempt POST is gated by `requireStudentRole`; ownership checks cover all teacher-gated mutation endpoints per FR-01 through FR-06 and FR-14 |
| Sensitive Data Exposure | pass — `logAuthFailure` logs userId, resourceId, action, timestamp only; 403 responses return a machine-readable code and generic message; no stack traces, internal paths, or PII in responses |
| Rate Limiting | n/a — no new auth endpoints; existing rate limiting on auth routes unchanged; spec explicitly defers rate limiting changes |
| Dependency Vulnerabilities | pass — no new dependencies introduced |
| Data Layer | pass — no schema migrations; Prisma parameterized queries only; no raw SQL; `upsert` used correctly for idempotent completion records |
| API Security | pass — no CORS changes; no new public endpoints; `NotFoundError` (404) returned for missing resources on ownership checks, preventing existence leakage; completion endpoints return 201 on create and 204 on delete, consistent with existing patterns |

## Verdict

APPROVED — Both medium-severity issues from the prior rejection are resolved: completion routes (FR-10, FR-11) are implemented and self-scoped by construction, and `requireSelf` is wired to the resource-completion POST (FR-12). No issues at medium severity or above remain. One low item is a documentation-only clarification; two info items are pre-existing and out of scope for this spec.
