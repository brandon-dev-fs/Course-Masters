---
id: cm-0009
title: Add Structured Logging and Request Middleware
stage: review
status: approved
approver: agent
approved_at: 2026-05-07T00:00:00Z
---

# Code Review: cm-0009 — Add Structured Logging and Request Middleware (revision 2)

**Verdict: APPROVED** — zero issues at medium or above

## Summary

Reviewed 12 files, all in `server/`. Four new middleware/lib files, eight modified files. No frontend, no schema, no new endpoints. This revision added three deliberate hardening improvements over the original implementation:

1. `app.set('trust proxy', 1)` — ensures `express-rate-limit` uses the real client IP behind nginx/Docker
2. Expanded `redact.paths` — adds `req.body.password/token/secret/authorization` and `req.session.token`
3. Removed `req.raw?.body` from httpLogger serializer — was always `undefined` before `express.json()`, posed latent data-leakage risk

## FR Verification

| Req | Result |
|---|---|
| FR-01 All output via pino | Zero `console.*` remain in `server/src/` |
| FR-02 UUID + `X-Request-Id` header | `crypto.randomUUID()` in `requestIdMiddleware` |
| FR-03 pino-http logs method/URL/status/time/ID | `httpLogger` wraps singleton logger via `genReqId` |
| FR-04 Auth bodies excluded | Serializer returns `base` only for every route |
| FR-05 Sensitive fields redacted | Expanded paths cover all required field names |
| FR-06 `LOG_LEVEL` configurable | `envSchema` + `.default('info')` + `.env.example` updated |
| FR-07 All `console.*` replaced | Confirmed |
| FR-08 Multiple rate tiers | `authLimiter` 20/15min, `apiLimiter` 300/15min |
| FR-09 Rate limit error shape | `{ error: { code: 'RATE_LIMITED', message: '...' } }` |
| FR-10 `requestId` typed downstream | `express-serve-static-core.Request` augmented |

## Issues

### [LOW] `genReqId` double cast lacks explanatory comment

- **Location**: `server/src/middleware/httpLogger.ts:9`
- **Description**: `(req as unknown as Record<string, string>)['requestId']` is correct (pino-http passes `http.IncomingMessage` to `genReqId`, not the augmented Express `Request`) but opaque without an inline note.
- **Suggested Fix**: Add comment: `// req is express Request at runtime; cast needed because genReqId receives http.IncomingMessage which lacks our augmented requestId field`

### [INFO] Rate limit responses bypass centralized error handler

- **Location**: `server/src/middleware/rateLimiter.ts:3-8`
- **Description**: FR-09 mentions flowing through `errorHandler.ts` but `express-rate-limit`'s `message` option responds directly. Backend plan explicitly sanctions this; response shape matches the error envelope. No change needed.

### [INFO] `@types/pino-http` omitted correctly

- **Description**: Backend plan listed it as a dev dependency but `pino-http` v11 bundles its own types. Omission is correct.
