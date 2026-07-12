---
id: cm-0016
title: Security Review — Database Schema Data Integrity Fixes
stage: review
status: approved
hand_back_to: null
approver: agent
---

# Security Review: Database Schema Data Integrity Fixes

## Summary

This is the second security review pass for cm-0016. The revision split raw SQL execution from a single multi-statement file read into individual `$executeRawUnsafe` calls per statement, and added `LessonToolCompletion` seed records so the demo user can submit quizzes. Both changes are purely in `seed.ts` (developer/CI only) and do not affect the request-time security surface. The overall security posture remains strong: authentication is global, user IDs are always sourced from the authenticated session, `targetId` is UUID-validated via Zod, the service enforces lesson-scoped ownership before writing completions, and all `$executeRawUnsafe` strings are fully hardcoded static DDL with no runtime-variable interpolation. No regressions were introduced by the revision.

## Scope

- Branch: `refactor/code_cleanup`
- Base: `develop`
- Files changed: 7
- Spec: cm-0016

## Issues

### [INFO] $executeRawUnsafe with static DDL — data-layer

- **Severity**: info
- **Location**: `server/prisma/seed.ts:1220–1290`
- **Category**: data-layer
- **Hand back to**: null
- **Description**: Six DDL statements are issued via `prisma.$executeRawUnsafe`. All six strings are fully hardcoded — no runtime variable is interpolated into any of them. The seed runs only in developer and CI environments, not at request time, so there is no user-facing injection surface. The first review flagged this as low because the previous implementation read the SQL from a file path (adding a theoretical environment-controlled injection vector). The revision eliminates that by inlining each statement as a literal string, which removes the residual concern. This is now informational only.
- **Suggested Fix**: No action required. The comment block in seed.ts already explains the Prisma 6 limitation that prevents use of the safer `$executeRaw` tagged template for DDL. If Prisma adds multi-statement tagged template support in a future version, prefer `$executeRaw`.

### [INFO] requireSelf runs before validate on POST /lessons/:lessonId/completions — api-security

- **Severity**: info
- **Location**: `server/src/routes/resource-completion.routes.ts:12–17`
- **Category**: api-security
- **Hand back to**: null
- **Description**: `requireSelf` is placed before `validate(toggleCompletionSchema)` in the middleware chain. The `requireSelf` extractor reads `req.body?.userId`, which is not a field in the toggle schema (`{ type, targetId }`). When the extractor returns `undefined`, `requireSelf` immediately calls `next()` per its documented contract. No security gap exists: the controller stamps completions with `req.user!.id` exclusively. The ordering is intentional defence-in-depth and is explained in the route file comment.
- **Suggested Fix**: No action required. If a `userId` field is ever added to the body schema, the `requireSelf` extractor will automatically enforce self-scope without any route changes.

### [INFO] Trigger semantics deviate from spec wording (AFTER DEFERRED vs BEFORE) — data-layer

- **Severity**: info
- **Location**: `server/prisma/raw/cm-0016-constraints.sql:58–66`
- **Category**: data-layer
- **Hand back to**: null
- **Description**: The spec (Requirement 4) states "A BEFORE INSERT OR UPDATE trigger." The implemented trigger is `CONSTRAINT TRIGGER AFTER INSERT OR UPDATE ... DEFERRABLE INITIALLY DEFERRED`. A deferred AFTER trigger fires at transaction commit, which correctly allows inserting the `assignment` row and its sub-table row within the same transaction. A BEFORE trigger would fire before the sub-table insert, always raising an exception. The security enforcement is equivalent — the constraint cannot be bypassed by any application code. This is a correct implementation choice that conflicts only with the spec's stated timing, not with its intent.
- **Suggested Fix**: No security remediation required. Update the spec's Requirement 4 wording to reflect the implemented behavior to avoid future developer confusion.

## Checklist Coverage

| Category | Result |
|---|---|
| Input validation — UUID on targetId | pass — Zod schema enforces `z.string().uuid()` |
| Input validation — type enum | pass — Zod schema enforces `z.enum(['resource', 'tool'])` |
| Injection — $executeRawUnsafe in seed | pass — all strings are hardcoded static DDL; no interpolation |
| Injection — Prisma ORM queries | pass — all runtime queries use Prisma parameterized APIs |
| Authentication | pass — `authenticate()` applied globally at `router.use` before all routes including completions |
| Authorization — self-scope on writes | pass — `userId` sourced from `req.user!.id`; `requireSelf` guards against future body userId injection |
| Authorization — IDOR (cross-lesson) | pass — service verifies `resource.lessonId === lessonId` and `tool.lessonId === lessonId` before writing |
| Authorization — horizontal escalation | pass — completion reads filtered by `userId` in Prisma where clause |
| Authorization — vertical escalation | n/a — no role restriction needed; all authenticated roles may track own completions |
| Sensitive data exposure — logs | pass — no PII or secrets logged in changed code |
| Sensitive data exposure — API response | pass — responses contain only completion metadata (IDs, timestamps, isRequired flags) |
| Sensitive data exposure — secrets in SQL/seed | pass — no credentials or secrets in cm-0016-constraints.sql or seed.ts |
| Rate limiting | n/a — no new rate-limited surface; existing auth rate limiting unchanged |
| Dependency vulnerabilities | n/a — no new dependencies introduced |
| Data layer — migration safety | pass — seed applies DDL idempotently (`DROP CONSTRAINT IF EXISTS`, `CREATE OR REPLACE FUNCTION`, `DROP TRIGGER IF EXISTS`) |
| API security — CORS | n/a — no CORS changes |
| API security — content-type validation | pass — `validate` middleware enforces body shape via Zod before controller |
| API security — resource existence leakage | pass — service returns NotFoundError for both "not found" and "wrong lesson" cases; no ownership-revealing 403 vs 404 distinction |

## Verdict

APPROVED — Zero issues at medium severity or above. Three informational notes documented (static DDL via $executeRawUnsafe, non-standard middleware ordering by design, trigger timing vs spec wording). No security regressions from the revision.
