---
id: cm-0009
title: Add Structured Logging and Request Middleware
stage: design
status: approved
approver: human
approved_at: 2026-05-07T00:00:00Z
---

# Backend Implementation Plan: Structured Logging and Request Middleware

## Overview

This plan covers integrating pino structured logging, per-request UUID middleware, tiered rate limiting, and replacing all `console.log`/`console.error` calls in the server. No schema changes. No new endpoints. The only observable API change is a new `X-Request-Id` response header on all responses.

---

## Schema Changes

None. This feature does not modify any Prisma models, fields, enums, or relationships.

---

## Layer Structure

### New Files

| Path | Purpose |
|---|---|
| `server/src/lib/logger.ts` | Pino logger singleton — configured once, imported everywhere |
| `server/src/middleware/requestId.ts` | Generates UUID per request, attaches to `req` and sets response header |
| `server/src/middleware/httpLogger.ts` | pino-http middleware factory — wraps the pino logger |
| `server/src/middleware/rateLimiter.ts` | Tiered rate limiter definitions; replaces the inline `authLimiter` in `app.ts` |

### Modified Files

| Path | Change |
|---|---|
| `server/src/app.ts` | Register new middleware in correct order; remove inline `authLimiter`; import from `rateLimiter.ts` |
| `server/src/index.ts` | Replace `console.log` startup message with `logger.info` |
| `server/src/config.ts` | Add `LOG_LEVEL` to env schema; replace `console.error` with process.stderr write (see note below) |
| `server/src/middleware/errorHandler.ts` | Replace `console.error` with `logger.error` |
| `server/src/middleware/authorize-resource.ts` | Replace `console.error` in `logAuthFailure` with `logger.warn` |
| `server/.env.example` | Add `LOG_LEVEL=info` entry |
| `server/src/types/express.d.ts` | Add `requestId: string` to the Express `Request` interface |

> **Note on `config.ts`**: The pino logger instance depends on `config` (for `LOG_LEVEL`). `config.ts` runs before the logger can be initialized, so the two `console.error` calls in the startup validation block must write to `process.stderr` directly (e.g., `process.stderr.write(...)`) rather than using the logger. This avoids a circular initialization dependency.

---

## New Dependencies

| Package | Runtime/Dev | Justification |
|---|---|---|
| `pino` | runtime | Structured JSON logging — spec explicitly requires pino (NFR-02) |
| `pino-http` | runtime | HTTP request/response logging middleware wrapping pino (NFR-02) |
| `@types/pino-http` | dev | TypeScript types for pino-http |

> `pino` ships its own TypeScript types in the main package; no `@types/pino` needed. `uuid` is not required — Node.js 14.17+ provides `crypto.randomUUID()` natively, which satisfies FR-02 without a new dependency.

---

## Detailed Implementation

### 1. `server/src/lib/logger.ts`

Creates and exports the single pino logger instance used across the entire server.

```typescript
import pino from 'pino';
import { config } from '../config.js';

export const logger = pino({
  level: config.LOG_LEVEL,   // e.g. 'debug' | 'info' | 'warn' | 'error'
  redact: {
    paths: [
      'password',
      'token',
      'secret',
      'authorization',
      '*.password',
      '*.token',
      '*.secret',
      '*.authorization',
      'req.headers.authorization',
      'req.headers.cookie',
    ],
    censor: '[REDACTED]',
  },
});
```

**Key decisions:**
- `redact.paths` uses pino's built-in redaction (FR-05). The dot-star variants (`*.password` etc.) catch nested objects.
- `req.headers.authorization` and `req.headers.cookie` are redacted to prevent session token leakage in HTTP logs.
- Level defaults to `'info'` via the `config.ts` schema default (FR-06).

---

### 2. `server/src/config.ts` — Add `LOG_LEVEL`

Add to the existing `envSchema`:

```typescript
LOG_LEVEL: z
  .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'])
  .default('info'),
```

The two existing `console.error` calls in the validation failure block must be replaced with direct stderr writes to avoid the circular dependency:

```typescript
process.stderr.write('Invalid environment variables:\n');
process.stderr.write(JSON.stringify(parsed.error.flatten().fieldErrors) + '\n');
```

---

### 3. `server/src/types/express.d.ts` — Augment Request

Add `requestId` to the existing `Request` augmentation so downstream handlers can reference it with full type safety (FR-10):

```typescript
interface Request {
  requestId: string;
  // existing: user?, session?
}
```

---

### 4. `server/src/middleware/requestId.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const id = randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}
```

**Notes:**
- `crypto.randomUUID()` is available in Node.js 14.17+ — no `uuid` package needed.
- The header name `X-Request-Id` is conventional and matches common reverse-proxy expectations.

---

### 5. `server/src/middleware/httpLogger.ts`

```typescript
import pinoHttp from 'pino-http';
import { logger } from '../lib/logger.js';

export const httpLogger = pinoHttp({
  logger,

  // Use the requestId already set by requestIdMiddleware
  genReqId: (req) => (req as any).requestId,

  // Exclude /api/auth/* request bodies entirely (FR-04)
  customReceivedObject: (req) => {
    const url = (req as any).url ?? '';
    if (url.startsWith('/api/auth/')) {
      return { msg: 'incoming request (auth body excluded)' };
    }
    return {};
  },

  // Serializers: suppress req.body on auth routes at the serializer level
  serializers: {
    req(req) {
      const base = {
        id: req.id,
        method: req.method,
        url: req.url,
      };
      // Do not log body for auth routes (FR-04)
      if (req.url?.startsWith('/api/auth/')) {
        return base;
      }
      return { ...base, body: req.raw?.body };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});
```

**Notes:**
- `genReqId` reuses the ID already set by `requestIdMiddleware` so all logs share the same correlation ID.
- Auth route body exclusion is enforced at the serializer level (FR-04). Even if pino-http version differences change `customReceivedObject` behavior, the serializer remains the authoritative guard.

---

### 6. `server/src/middleware/rateLimiter.ts`

Replaces the inline `authLimiter` in `app.ts` with a named, centralized module.

**Tiers:**

| Tier | Routes | Max Requests | Window |
|---|---|---|---|
| `authLimiter` | `/api/auth/*` | 20 req | 15 min |
| `apiLimiter` | All `/api/*` routes | 300 req | 15 min |

The `apiLimiter` is a broad safety net against bulk scraping; the `authLimiter` preserves the existing brute-force protection on auth endpoints. Both limits are generous enough to not affect normal single-user sessions.

```typescript
import rateLimit from 'express-rate-limit';

const rateLimitError = {
  error: {
    code: 'RATE_LIMITED',
    message: 'Too many requests, please try again later.',
  },
};

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitError,
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitError,
});
```

**Notes:**
- Both limiters use `standardHeaders: true` (RateLimit-* headers per RFC 6585 draft) and `legacyHeaders: false` (no X-RateLimit-* headers).
- The `message` shape matches the existing error envelope: `{ error: { code, message } }` (FR-09).
- `express-rate-limit` is already in `package.json`; no new dependency needed.

---

### 7. `server/src/app.ts` — Middleware Registration Order

The revised app setup:

```
1. cors
2. requestIdMiddleware          ← new: must be first for ID propagation
3. httpLogger                   ← new: pino-http (reads req.requestId via genReqId)
4. authLimiter (on /api/auth/*) ← migrated from inline to rateLimiter.ts
5. better-auth handler          ← unchanged
6. apiLimiter (on /api/*)       ← new: broad API rate limit
7. express.json()               ← unchanged
8. swagger docs                 ← unchanged
9. envelopeMiddleware           ← unchanged
10. router                      ← unchanged
11. errorHandler                ← unchanged
```

The inline `authLimiter` block in `app.ts` is removed. The rate limiters are imported from `rateLimiter.ts`. The `requestIdMiddleware` and `httpLogger` are imported from their respective files.

---

### 8. Replace `console.log`/`console.error` Across Files

**`server/src/index.ts`**
```typescript
// Before:
console.log(`Server running on http://localhost:${config.SERVER_PORT}`);

// After:
import { logger } from './lib/logger.js';
logger.info({ port: config.SERVER_PORT }, 'Server started');
```

**`server/src/middleware/errorHandler.ts`**
```typescript
// Before:
console.error('Unhandled error:', err);

// After:
import { logger } from '../lib/logger.js';
logger.error({ err }, 'Unhandled error');
```

**`server/src/middleware/authorize-resource.ts`** — `logAuthFailure`
```typescript
// Before: structured JSON.stringify to console.error

// After:
import { logger } from '../lib/logger.js';

function logAuthFailure(userId: string, resourceId: string, action: string): void {
  logger.warn({ event: 'authorization_failure', userId, resourceId, action }, 'Authorization failure');
}
```

**`server/src/config.ts`** — startup validation failure
```typescript
// Before: console.error(...)

// After: process.stderr.write(...) — see Section 2 above
```

---

## Error Handling

No new error classes are introduced. Rate limit responses use the existing error envelope shape (`{ error: { code, message } }`) via the `message` option of `express-rate-limit` (FR-09). Rate limit errors are returned by `express-rate-limit` directly before the request reaches the centralized `errorHandler`, so no changes to `errorHandler.ts` are needed for rate limiting.

The `errorHandler.ts` itself gains a structured `logger.error` call instead of `console.error` for the unhandled-error fallback path.

---

## Validation

No Zod schema changes. The only env schema change is adding `LOG_LEVEL` to `envSchema` in `config.ts`.

---

## Middleware Execution Order Rationale

1. **`requestIdMiddleware` before `httpLogger`**: pino-http reads the ID via `genReqId`; the ID must already be on `req` when pino-http initializes the log context.
2. **`httpLogger` before rate limiters**: ensures all requests — including rejected ones — are logged with timing and status.
3. **`authLimiter` before `toNodeHandler(auth)`**: rate limiting must gate the better-auth handler, not the reverse.
4. **`apiLimiter` after better-auth, before `express.json()`**: broad API limit applies to all application routes but not to the better-auth handler (which manages its own body parsing).

---

## `.env.example` Update

Add the following line to `server/.env.example`:

```
LOG_LEVEL=info
```

---

## Verification Checklist

After implementation, verify:
- [ ] `grep -rn "console\." server/src` returns zero results (all replaced)
- [ ] `curl -I <endpoint>` shows `X-Request-Id` header on every response
- [ ] `LOG_LEVEL=debug npm run dev` produces debug-level log lines
- [ ] POST `/api/auth/sign-in` logs do not include the request body
- [ ] A request log entry for any other route does not contain `password`, `token`, `secret`, or `authorization` fields
- [ ] Exceeding auth rate limit returns `{ "error": { "code": "RATE_LIMITED", ... } }` with HTTP 429
