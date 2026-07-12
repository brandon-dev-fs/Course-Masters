---
id: cm-0001
title: Per-Question Calculator Toggle — Security Review (re-run)
stage: review
status: approved
hand_back_to: null
approver: agent
---

# Security Review: Per-Question Calculator Toggle

## Summary

This is a re-run of the cm-0001 security review to confirm that two post-approval fixes — a null-guard in `bulkUpdateCalculator` and unique per-instance ARIA panel IDs — did not introduce any new security concerns. The overall security posture remains sound. All new inputs are Zod-validated before reaching the service layer, no raw SQL interpolation is present, the bulk-update endpoint is correctly gated behind `authenticate` + `authorize('teacher','admin')`, and the client-side calculator performs all arithmetic within the `decimal.js` library with no use of `eval` or string interpolation.

## Scope

- Branch: `feature/calculator-v2`
- Base: `develop`
- Files changed: 19 (source files; excluding `.claude/` workflow artifacts)
- Spec: cm-0001

## Issues

### [LOW] `authorize` middleware depends on `authenticate` having run — contract is implicit
- **Severity**: low
- **Location**: `server/src/middleware/authorize.ts`, `server/src/routes/assessment.routes.ts:25`
- **Category**: authentication
- **Hand back to**: backend
- **Description**: `authorize()` reads `req.user` which is injected by `authenticate()`. The global `authenticate()` call in `server/src/routes/index.ts:21` ensures correct ordering for all current routes including the new `PATCH /:assessmentId/questions/calculator` endpoint. However, the contract between the two middleware functions is implicit and undocumented. If a future developer mounts an `assessmentsRouter` sub-path outside the authenticated root router, the `authorize` middleware would silently issue a 401 rather than loudly signalling the misconfiguration. This is a latent design smell, not an active vulnerability in the current codebase.
- **Suggested Fix**: Either document the required ordering contract with a comment in `authorize.ts`, or replace the silent fallback with a hard `throw new Error('authorize() requires authenticate() to have run first')` that surfaces the bug immediately during development.

---

### [LOW] Bulk-update endpoint does not verify requesting teacher owns the target assessment's course
- **Severity**: low
- **Location**: `server/src/services/assessment.service.ts:110–138`
- **Category**: authorization
- **Hand back to**: backend
- **Description**: `bulkUpdateCalculator` correctly validates that all supplied `questionIds` belong to the given `assessmentId` (preventing cross-assessment manipulation), but neither the service nor the controller verifies that the authenticated teacher is the author of the course that owns the assessment. A teacher could call `PATCH /assessments/<another-teacher's-assessment-id>/questions/calculator` and toggle calculator flags on questions they did not author. The existing `PUT /assessments/:assessmentId` endpoint carries the same gap; this is a pre-existing cross-cutting issue that the new endpoint surfaces rather than introduces. Admin users can legitimately act on any assessment, so the fix should exempt the `admin` role.
- **Suggested Fix**: In `bulkUpdateCalculator` (and the pre-existing `update` function), resolve `assessment.lesson.unit.course.authorId` (or the equivalent join path for unit/course-level assessments) and assert `authorId === req.user.id || req.user.role === 'admin'`, throwing a `403 AppError` on mismatch.

---

### [INFO] `content` field on `AssessmentQuestion` uses `z.record(z.any())` — no server-side shape enforcement
- **Severity**: info
- **Location**: `server/src/schemas/assessment.schema.ts:6`
- **Category**: input-validation
- **Hand back to**: backend
- **Description**: The `content` field accepts any key-value structure. This matches the documented project convention in `server/CLAUDE.md` ("freeform Json field — no server-side shape enforcement beyond the type enum") and is intentional. Grading logic accesses specific keys with type assertions and does not interpolate content into queries or shell commands. No active injection path exists. Noted for awareness: malformed content would silently misgrade questions rather than throw a validation error at creation time.
- **Suggested Fix**: No immediate action required. Consider per-type discriminated union validation in a follow-up hardening pass.

---

### [INFO] `decimal.js@^10.6.0` added as a new production client dependency
- **Severity**: info
- **Location**: `client/package.json:21`
- **Category**: dependency
- **Hand back to**: frontend
- **Description**: `decimal.js` 10.x is mature, widely used, MIT-licensed, and has no known CVEs as of the review date (`npm audit` returned no findings for this package). The dependency is used appropriately: all calculator inputs are parsed through the `Decimal` constructor inside the `useCalculator` reducer, division-by-zero is explicitly guarded, and there is no `eval` or dynamic expression string execution anywhere in the calculator logic.
- **Suggested Fix**: No action required. Pre-existing audit findings for `vite`, `picomatch`, and `kysely` are not introduced by this diff and are out of scope for this review.

---

## Checklist Coverage

| Category | Result |
|---|---|
| Input Validation | Pass — Zod validates all new fields: `calculatorEnabled` (boolean, default false) on `questionSchema`; `questionIds` (UUID array, min 1) and `calculatorEnabled` (boolean, required) on `bulkUpdateCalculatorSchema` |
| Injection | Pass — No raw SQL; all Prisma calls use parameterized `where: { id: { in: data.questionIds }, assessmentId }` double-binding; calculator arithmetic uses `decimal.js` exclusively, no `eval` or string interpolation |
| Authentication | Pass — `authenticate()` applied globally in root router (`index.ts:21`) before all sub-routers including `assessmentsRouter`; new PATCH endpoint inherits this correctly |
| Authorization | Low — New PATCH endpoint correctly requires `teacher` or `admin` role via `authorize('teacher', 'admin')`; course-ownership check is absent (pre-existing gap, surfaced by new endpoint) |
| Sensitive Data Exposure | Pass — No secrets, passwords, or PII in new log statements or API responses; `calculatorEnabled` is a non-sensitive boolean; server grading notes remain consistent with documented convention of returning full question content |
| Rate Limiting | Pass — Bulk update endpoint is behind full auth stack; no new unauthenticated or public endpoints introduced; existing auth rate limit (20 req/15 min) unchanged |
| Dependency Vulnerabilities | Pass — `decimal.js` 10.6.0 has no known CVEs; no new server-side runtime dependencies; pre-existing `vite`/`picomatch`/`kysely` audit findings pre-date this branch |
| Data Layer | Pass — Migration is purely additive (`ADD COLUMN "calculatorEnabled" BOOLEAN NOT NULL DEFAULT false`); safe for zero-downtime deploy; no destructive schema changes; no expand-contract concerns for a boolean default column |
| API Security | Pass — CORS is configured to single `CLIENT_URL` origin; new endpoint follows existing REST conventions; unique `panelId` prop prevents duplicate `aria-controls` references in pages with multiple calculator panels |

## Verdict

APPROVED — Zero issues at `medium` severity or above. The two post-approval fixes (null guard in `bulkUpdateCalculator`, unique `panelId`/`aria-controls` per `CalculatorPanel` instance) are correctly implemented and introduce no new security concerns. Two pre-existing low-severity observations (implicit middleware ordering contract, missing course-ownership assertion on write endpoints) and two informational notes are documented but do not block merge.
