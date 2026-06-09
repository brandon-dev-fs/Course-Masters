---
id: cm-0018
title: Security Review — Add Soft Delete to Core Models
stage: review
status: approved
hand_back_to: null
approver: agent
---

# Security Review: Add Soft Delete to Core Models

## Summary

This review covers the soft-delete implementation for User, Course, Unit, Lesson, and Assessment models, including a new admin-only `DELETE /api/users/:userId` endpoint, cascade soft-delete utilities, and query-level filtering across all affected services. The overall security posture is strong: authentication and authorization are correctly ordered, no secrets are present, no injection vectors were found, and error responses do not leak internal details. One low-severity input validation gap and one info-level middleware observation are documented below.

## Scope

- Branch: `refactor/code_cleanup`
- Base: `develop`
- Files changed: 12
- Spec: cm-0018

## Issues

### [LOW] Missing UUID format validation on `:userId` path parameter — input-validation

- **Severity**: low
- **Location**: `server/src/controllers/user.controller.ts:7`, `server/src/routes/user.routes.ts:13`
- **Category**: input-validation
- **Hand back to**: backend
- **Description**: The `userId` path parameter is read from `req.params['userId']` and passed directly to `userService.remove()` without any format validation. Prisma's `findFirst` with a malformed string (e.g., a non-UUID like `../admin` or a 1000-character string) will simply return `null` and produce a 404 — no injection is possible since Prisma uses parameterized queries — but the lack of early rejection means malformed inputs traverse the full middleware and database round-trip unnecessarily. This is consistent with how other routes in the codebase handle path parameters, but the new endpoint introduces an admin-privileged operation where early rejection is especially desirable.
- **Suggested Fix**: Add a Zod UUID validation step to the route, consistent with how `validate()` is used on request bodies elsewhere. Either add a `validateParams` variant of the existing `validate` middleware, or inline a UUID check at the top of the controller action:
  ```typescript
  import { z } from 'zod';
  const uuidSchema = z.string().uuid();
  // In the controller:
  if (!uuidSchema.safeParse(req.params['userId']).success) {
    res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid user ID format' } });
    return;
  }
  ```

### [INFO] `authorize` used without explicit `authenticate` in user router — authentication

- **Severity**: info
- **Location**: `server/src/routes/user.routes.ts:13`
- **Category**: authentication
- **Description**: The user router applies only `authorize('admin')` without a co-located `authenticate()` call. This is safe because the global router in `index.ts` mounts `authenticate()` at line 25 before all sub-routers including `/users`. The `authorize` middleware correctly guards against an unauthenticated `req.user` by returning 401 if `req.user` is absent. No authentication gap exists. Documented for future maintainers: if the user router is ever extracted and mounted independently (e.g., a separate Express app or test harness), it would lose authentication protection.
- **Suggested Fix**: No immediate action required. For defense-in-depth, consider adding `authenticate()` as the first middleware on the delete route to make the router self-contained, matching the pattern used in other protected sub-routers in the project.

### [INFO] Admin self-deletion is permitted — authorization

- **Severity**: info
- **Location**: `server/src/services/user.service.ts:12-17`
- **Category**: authorization
- **Description**: There is no guard preventing an admin from soft-deleting their own account. If the application has only one admin, a self-delete would leave no active admin, potentially locking out all admin functionality. This is an application-logic concern rather than a direct security vulnerability, since soft-delete is irreversible by design (per spec) and the action requires admin role.
- **Suggested Fix**: Consider adding a guard in `userService.remove` that checks whether the target `userId` matches the requesting user's ID (available via the session), and returns a `403 FORBIDDEN` if they match. Additionally consider whether the system should enforce a minimum-admin-count invariant before allowing deletion.

## Checklist Coverage

| Category | Result |
|---|---|
| Input Validation | Low issue found (missing UUID format check on path param) |
| Injection (SQL/NoSQL/command/template) | Pass — all queries use Prisma parameterized ORM calls; no string interpolation |
| Authentication | Pass — global `authenticate()` middleware covers all routes including `/users` |
| Authorization | Pass — `authorize('admin')` correctly guards the delete endpoint; `authorize` checks `req.user` presence as a secondary auth guard |
| Sensitive Data Exposure (responses) | Pass — 204 returns no body; errors return structured codes only; no stack traces or paths |
| Sensitive Data Exposure (logs) | Pass — no logging of user PII or sensitive fields in new code |
| Secrets in source | Pass — no hardcoded credentials, API keys, or secrets |
| Rate Limiting / Abuse Prevention | Pass — endpoint requires admin role; admin-gated endpoints are not flagged per project conventions |
| Dependency Vulnerabilities | Pass — no new dependencies introduced |
| Data Layer (migrations) | Pass — migration is purely additive (nullable columns + partial indexes); non-destructive; backward-compatible |
| API Security (CORS, content-type, resource existence leakage) | Pass — 404 response is identical for non-existent and soft-deleted users; no existence leakage |
| Insecure Direct Object References | Pass — admin role required; no cross-user data access path in the new endpoint |
| Middleware Ordering | Pass — `authenticate()` precedes all sub-routers in `index.ts` |

## Verdict

APPROVED — Zero issues at medium severity or above; one low-severity input validation gap (missing UUID format check on path parameter) and two informational observations documented for future reference.
