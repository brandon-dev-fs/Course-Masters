---
id: cm-0010
title: Security Review — Fix Assignment Reorder Race Condition and Add Pagination
stage: review
status: approved
hand_back_to: null
approver: agent
approved_at: 2026-05-07T00:00:00Z
---

# Security Review: Fix Assignment Reorder Race Condition and Add Pagination

## Summary

Re-review of cm-0010 following remediation of two blocking issues found in the prior pass. The HIGH (missing `authenticate()` on POST `/:assessmentId/attempts`) and MEDIUM (client `getAttempts` typed as `AttemptSummary[]` against a paginated server response) issues are both confirmed fixed. The new pagination additions — Zod query schema, service-layer LIMIT/OFFSET, paginated response envelope, and client pagination state — introduce no new security concerns. No issues at medium or above remain.

## Scope

- Branch: refactor/code_cleanup
- Base: develop
- Files changed: 7
- Spec: cm-0010

## Issues

### [LOW] assertExists(lesson) runs outside the transaction in reorder — pre-existing, unresolved

- **Severity**: low
- **Location**: `server/src/services/assignment.service.ts`
- **Category**: other
- **Hand back to**: backend
- **Description**: The lesson existence check runs before the Serializable interactive transaction opens. A concurrent lesson deletion in that narrow window would produce a misleading 400 `INVALID_REORDER` instead of a 404 `NOT_FOUND`. This is not a security risk — it is an incorrect error code under a very narrow race condition. Carried forward from the prior review unchanged.
- **Suggested Fix**: Accept as a documented edge case or move the existence assertion inside the transaction alongside the `FOR UPDATE` read. Does not block approval.

---

### [INFO] POST /:assessmentId/attempts — authenticate() fix verified

- **Location**: `server/src/routes/assessment.routes.ts`
- **Category**: authentication
- **Description**: `authenticate()` is now present before `requireStudentRole()` on the POST route. The prior HIGH issue is resolved. Both GET and POST attempts routes are correctly guarded.

---

### [INFO] Client getAttempts type mismatch — fix verified

- **Location**: `client/src/api/assessments.ts`, `client/src/api/types.ts`, `client/src/hooks/useAssessment.ts`
- **Category**: api-security
- **Description**: `PaginatedAttempts` type is now declared and used. `getAttempts` returns `PaginatedAttempts`. Both call sites in `useAssessment` extract `.data` before passing to `setAttempts`. The prior MEDIUM issue is resolved.

---

### [INFO] attemptsQuerySchema — max pageSize cap confirmed

- **Location**: `server/src/schemas/assessment.schema.ts`
- **Category**: input-validation
- **Description**: `pageSize` is capped at 100 via `z.coerce.number().int().min(1).max(100)`. Prevents unbounded result set requests. No abuse vector.

---

### [INFO] $queryRaw FOR UPDATE template — confirmed safe (carried forward)

- **Location**: `server/src/services/assignment.service.ts`
- **Category**: injection
- **Description**: `${lessonId}` in the `$queryRaw` tagged template is passed as a Prisma bind parameter, not string-interpolated. No injection risk.

---

### [INFO] submitAttemptSchema uses z.array(z.any()) — pre-existing, out of scope (carried forward)

- **Location**: `server/src/schemas/assessment.schema.ts`
- **Category**: input-validation
- **Description**: Pre-existing permissive answer schema. Grading is server-side; no injection vector. Future PR should validate answer shape per question type.

---

### [INFO] P2034 error handler — no internal detail leakage

- **Location**: `server/src/middleware/errorHandler.ts`
- **Category**: sensitive-data-exposure
- **Description**: The new P2034 (transaction conflict) branch returns `{ error: { code: 'TRANSACTION_CONFLICT', message: 'Concurrent modification detected; please retry.' } }` — a generic, user-safe message. No stack trace or internal path is exposed.

---

### [INFO] AdminUsersPage pagination — no new auth bypass

- **Location**: `client/src/features/auth/AdminUsersPage.tsx`
- **Category**: authorization
- **Description**: Admin user list pagination is client-side only. The route is protected server-side by better-auth's admin plugin, which enforces admin role. The client change (replacing hardcoded `limit: 100` with offset-based paging) introduces no new authorization surface.

---

## Checklist Coverage

| Category | Result |
|---|---|
| Input Validation | Pass — attemptsQuerySchema with int/min/max coercion; pageSize capped at 100 |
| Injection | Pass — $queryRaw uses Prisma tagged template bind parameters |
| Authentication | Pass — authenticate() confirmed on both GET and POST attempts routes |
| Authorization | Pass — getAttempts scoped to req.user.id; admin list protected by better-auth admin plugin |
| Sensitive Data Exposure | Pass — P2034 handler emits no internal detail; no PII in logs |
| Rate Limiting | Pass — no new unprotected high-cost endpoints |
| Dependency Vulnerabilities | Pass — no new packages introduced |
| Data Layer | Pass — Serializable isolation + FOR UPDATE + parallel count/findMany with LIMIT/OFFSET |
| API Security | Pass — client/server type contract now aligned via PaginatedAttempts |

## Verdict

APPROVED — all blocking issues from the prior review are resolved; no new issues at medium or above introduced.
