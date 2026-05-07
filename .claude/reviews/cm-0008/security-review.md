---
id: cm-0008
title: Security Review — Add Query Parameter Validation for Resource and Tool List Endpoints
stage: review
status: approved
hand_back_to: null
approver: agent
---

# Security Review: Add Query Parameter Validation for Resource and Tool List Endpoints

## Summary

This review covers a focused backend hardening change that adds Zod-based query parameter validation to two GET endpoints (`GET /lessons/:lessonId/resources` and `GET /lessons/:lessonId/tools`). The change introduces a `validateQuery` middleware factory that mirrors the existing `validate` middleware pattern, adds two narrow enum query schemas, wires both into their respective route files, and adds a safety comment to both controllers. The overall security posture of this changeset is sound: no new attack surface is introduced, and previously unvalidated input that reached the service and Prisma layers is now strictly gated at the middleware boundary.

## Scope

- Branch: refactor/code_cleanup
- Base: develop
- Files changed: 6
- Spec: cm-0008

## Issues

No issues at medium severity or above were found. The following informational notes are recorded for completeness.

### [INFO] Type assertion on validated query data persists in controllers — input-validation

- **Severity**: info
- **Location**: `server/src/controllers/lesson-resource.controller.ts:9`, `server/src/controllers/lesson-tool.controller.ts:9`
- **Category**: input-validation
- **Hand back to**: null
- **Description**: Both controllers still cast `req.query['type']` with `as ResourceType | undefined` / `as ToolType | undefined` rather than reading from a typed validated object. This is safe because the `validateQuery` middleware has already replaced `req.query` with the parsed, validated output before the controller runs. The comment added in the diff documents this dependency. The risk is that if the middleware were ever removed or reordered, the cast would silently pass unvalidated values through to the Prisma query — the same vulnerability this spec was written to fix. This is not a current vulnerability, but it is a fragile coupling.
- **Suggested Fix**: Consider creating a typed helper (e.g., `getValidatedQuery<T>(req)`) that reads from a req-scoped validated store rather than re-casting `req.query`, so the controller cannot accidentally regress to unvalidated access. This is a minor hardening improvement, not a blocker.

### [INFO] `validateQuery` mutation of `req.query` uses a permissive cast — input-validation

- **Severity**: info
- **Location**: `server/src/middleware/validate.ts:26`
- **Category**: input-validation
- **Hand back to**: null
- **Description**: The line `req.query = result.data as Record<string, string>` casts Zod's parsed output back to `Record<string, string>` even though the schema may produce values of other types (e.g., optional fields with `undefined`). In the specific schemas used here (`z.enum([...]).optional()`), the output is `string | undefined` so the cast is practically safe. However, if future schemas pass objects or arrays through `validateQuery`, the cast could mask a type mismatch. This is advisory only.
- **Suggested Fix**: Use `req.query = result.data as ParsedQs` (Express's own query type) or cast to `typeof result.data` to preserve Zod's inferred type more accurately. This does not affect runtime behavior for the current schemas.

## Checklist Coverage

| Category | Result |
|---|---|
| Input Validation | Pass — `validateQuery` correctly gates both GET endpoints; Zod enum schemas are accurate mirrors of the Prisma enums; unvalidated input no longer reaches the service layer |
| Injection (SQL/NoSQL/command/template) | Pass — `findAllByLesson` uses a parameterized Prisma `where` clause; no string interpolation of user input in any query |
| Authentication | Pass — both GET routes sit behind `router.use(authenticate())` in `routes/index.ts` (line 23), which runs before the sub-router is mounted at line 31–32; middleware ordering is correct |
| Authorization | Pass — the GET endpoints are intentionally accessible to any authenticated user (read-only lesson content); write/mutate endpoints (`POST`, `PUT`, `DELETE`) retain `authorize('teacher', 'admin')` and `requireCourseOwnership` guards, which are unchanged by this diff |
| Sensitive Data Exposure | Pass — no secrets, passwords, or PII are introduced or logged; `ValidationError` details surface only field-level Zod errors, not stack traces or internal paths; the global error handler strips internals on non-AppError paths |
| Rate Limiting / Abuse Prevention | Pass — the affected endpoints are read-only and sit behind session authentication, which provides a natural abuse barrier; no new unauthenticated surface is created |
| Dependency Vulnerabilities | Pass — no new dependencies are added; the change uses only existing Zod, Express, and Prisma types |
| Data Layer | N/A — no schema migrations or destructive data changes are included |
| API Security | Pass — CORS and content-type handling are unchanged; no new endpoint paths are added; the change does not alter response shapes for valid requests |

## Verdict

APPROVED — All changed files pass the security checklist; the changeset correctly closes a previously unvalidated input path with no introduction of new attack surface. Two informational notes are recorded but neither blocks merge.
