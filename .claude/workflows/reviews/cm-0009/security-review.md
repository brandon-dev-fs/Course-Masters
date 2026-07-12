---
id: cm-0009
title: Add Structured Logging and Request Middleware
stage: review
status: approved
approver: agent
approved_at: 2026-05-07T00:00:00Z
---

# Security Review: cm-0009 — Add Structured Logging and Request Middleware (revision 2)

**Status: APPROVED**

## Prior Rejection Issues — All Resolved

**Issue 1 — Shallow redact paths (was MEDIUM)**
RESOLVED. `server/src/lib/logger.ts` adds `req.body.password`, `req.body.token`, `req.body.secret`, `req.body.authorization`, and `req.session.token` explicitly. A comment documents pino's single-level wildcard limitation and the requirement to add new nested sensitive fields manually.

**Issue 2 — Missing `trust proxy` (was MEDIUM)**
RESOLVED. `server/src/app.ts` sets `app.set('trust proxy', 1)` as the first statement after `express()` — before CORS, `requestIdMiddleware`, `httpLogger`, and both rate limiters. Comment explains the Docker/reverse-proxy rationale.

**Issue 3 — Dead body field in httpLogger serializer (was LOW)**
RESOLVED. Both the auth-route branch and the default branch in `server/src/middleware/httpLogger.ts` now return only `base` (`{ id, method, url }`). No body field is present in either path.

## Full-Pass Findings

| # | Severity | Location | Finding |
|---|---|---|---|
| 1 | info | `errorHandler.ts:47` | `logger.error({ err })` serializes stack traces to server logs — correct for observability; HTTP response returns only the generic `INTERNAL_ERROR` code |
| 2 | info | `config.ts:11-13` | `LOG_LEVEL=trace/debug` in production increases verbosity; redact paths remain active at all levels; document `info` as recommended production level |
| 3 | info | `requestId.ts:4-8` | IDs generated via `crypto.randomUUID()` server-side; no inbound client header trusted — correct |
| 4 | info | `httpLogger.ts:22-25` | Auth-route serializer guard retained as intent documentation per FR-04 — correct |
| 5 | info | dependencies | `pino` and `pino-http` spec-justified by NFR-02; `express-rate-limit` pre-existing |

## Checklist

| Category | Result |
|---|---|
| Input Validation | pass |
| Injection | pass |
| Authentication | pass |
| Authorization | pass |
| Sensitive Data Exposure | pass |
| Rate Limiting & Abuse Prevention | pass |
| Dependency Vulnerabilities | pass |
| Data Layer | n/a |
| API Security | pass |
