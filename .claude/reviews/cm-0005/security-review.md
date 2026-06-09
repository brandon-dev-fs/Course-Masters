---
id: cm-0005
title: Security Review — Refactor Backend Service Layer for Clean Separation and Centralized Error Handling
stage: review
status: approved
hand_back_to: null
approver: agent
---

# Security Review: Refactor Backend Service Layer for Clean Separation and Centralized Error Handling

## Summary

This diff is a pure backend refactor touching 14 files: a new `ConflictError` subclass, a shared `assertExists` utility, expanded Prisma error mappings in the global error handler, a data/computation split in `progress.service.ts`, and rollout of `assertExists` across 9 service files. No new endpoints, schema changes, or auth/authz middleware modifications were introduced. The overall security posture of the change is sound — error messages are static, query parameters are fully Prisma-parameterized, and no Prisma internals reach the client.

## Scope

- Branch: `refactor/code_cleanup`
- Base: `develop`
- Files changed: 14
- Spec: cm-0005

## Issues

No issues at medium severity or above.

### [INFO] assertExists entityName is caller-supplied — confirm call-site discipline

- **Severity**: info
- **Location**: `server/src/utils/assertExists.ts:13`
- **Category**: injection
- **Hand back to**: null
- **Description**: The `entityName` parameter is interpolated into the `NotFoundError` message (`${entityName} not found`). All 22 current call sites in the diff pass hard-coded string literals (`'Lesson'`, `'Course'`, `'Unit'`, `'Assessment'`, `'Resource'`, `'Tool'`, `'Assignment'`, `'Student note'`). No call site derives the value from request input, so there is currently no injection risk. Noted for awareness when future call sites are added.
- **Suggested Fix**: No action required. Consider adding a JSDoc comment on the utility parameter clarifying that `entityName` must always be a static string literal, not a value derived from user input.

## Checklist Coverage

| Category | Result |
|---|---|
| Input Validation | pass — `assertExists` accepts only hard-coded `entityName` literals at every call site; no user input reaches error messages |
| Injection | pass — `id` and `userId` parameters flow exclusively into Prisma parameterized query arguments (`{ where: { id } }`, `{ where: { userId } }`); no raw query construction anywhere in the diff |
| Authentication | pass — no auth middleware modified; `authenticate` + `authorize` chain is unchanged |
| Authorization | pass — no route or controller changes; existing resource-level checks (`requireSelf`, `authorize`) are untouched |
| Sensitive Data Exposure | pass — all three new Prisma error responses (P2003, P2014, PrismaClientValidationError) use static strings with no `err.meta`, model names, or stack traces; the fallthrough `console.error` logs server-side only, client receives the static `INTERNAL_ERROR` message |
| Rate Limiting | n/a — no new public endpoints introduced |
| Dependency Vulnerabilities | pass — no new dependencies added |
| Data Layer | pass — no raw queries; all Prisma operations are parameterized; no schema or migration changes |
| API Security | pass — no CORS or content-type changes; no new endpoints that could leak resource existence |

### Key concern assessed: Prisma internals in error responses

The three new error handler branches were examined in full:

- `P2003`: responds with `{ code: 'CONFLICT', message: 'Operation conflicts with an existing relation' }` — static string only.
- `P2014`: responds with `{ code: 'CONFLICT', message: 'Operation would violate a required relation' }` — static string only.
- `PrismaClientValidationError`: responds with `{ code: 'VALIDATION_ERROR', message: 'Invalid request data' }` — static string only.

None of the branches reference `err.meta`, `err.message`, model names, table names, column names, or stack traces. FR-10 from the spec is satisfied.

### assertExists entity name injection assessment

All 22 call sites in the diff pass hard-coded string literals. No call site passes a value derived from request input. There is no path for attacker-controlled content to appear in error messages under current usage.

## Verdict

APPROVED — zero issues at medium severity or above; all new error mappings use static strings with no Prisma internals exposed, and all query parameters remain fully parameterized throughout the refactor.
