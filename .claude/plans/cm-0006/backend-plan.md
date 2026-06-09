---
id: cm-0006
title: Standardize API Response Envelope
stage: design
status: approved
approver: human
approved_at: 2026-05-06T00:00:00Z
---

# Backend Plan — Standardize API Response Envelope

## Overview

Wrap every successful JSON response from non-auth Express routes in `{ "data": <payload> }` by overriding `res.json` centrally in a middleware. No route handler or controller changes are required. DELETE 204 responses continue to use `res.status(204).send()` and are therefore naturally excluded. `/auth/*` routes are handled by `toNodeHandler(auth)` before the envelope middleware is reached and are also naturally excluded.

---

## Layer Structure

### No New Layers Required

This feature touches exactly one new file (the envelope middleware) and two existing files (the router index for the health route, and `app.ts` for middleware mounting order). No controller, service, or data-access code changes.

### New File: `server/src/middleware/envelope.ts`

**Purpose**: Override `res.json` on every request that passes through the non-auth router so that any call to `res.json(payload)` automatically sends `{ "data": payload }` instead.

**Middleware signature**:
```ts
import { Request, Response, NextFunction } from 'express';

export function envelopeMiddleware(req: Request, res: Response, next: NextFunction): void
```

**Implementation approach — `res.json` override (chosen approach):**

Override `res.json` on the response object before handing control to the next middleware. The override wraps the argument in `{ data: payload }` and delegates to the original `res.json`. This approach:
- Requires zero changes to any controller or route handler
- Does not buffer the response body (no stream interception)
- Satisfies NFR-01 (no extra serialization passes — the override calls the original serializer once with the wrapped object)
- Does not affect error responses because `errorHandler` also calls `res.json`, and at the point that middleware runs the override is already in place — but error responses carry `{ error: ... }` at the top level, not `{ data: ... }`. To prevent double-wrapping of error responses, the override must check whether the payload already has a top-level `error` key (or alternatively, the override must be removed before the error handler runs).

**Chosen guard — skip wrapping if payload has an `error` key:**

```ts
export function envelopeMiddleware(_req: Request, res: Response, next: NextFunction): void {
  const originalJson = res.json.bind(res);

  res.json = function (payload: unknown): Response {
    // Do not wrap error responses — they carry { error: { code, message } }
    if (
      payload !== null &&
      typeof payload === 'object' &&
      'error' in (payload as object)
    ) {
      return originalJson(payload);
    }
    return originalJson({ data: payload });
  };

  next();
}
```

This guard is intentional and safe: no successful response in this codebase uses a top-level `error` key, and all structured errors produced by `errorHandler` use `{ error: { code, message } }`.

### Modified File: `server/src/app.ts`

Mount `envelopeMiddleware` after `express.json()` but before `router`. It must NOT be mounted before the `better-auth` handler (which is mounted at `/api/auth/*splat` before `express.json()`).

**New mount order:**
```ts
app.all('/api/auth/*splat', authLimiter, toNodeHandler(auth)); // unchanged — before express.json
app.use(express.json());                                        // unchanged
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument)); // unchanged
app.use(envelopeMiddleware);                                    // NEW — wraps all /api routes except /auth/*
app.use('/api', router);                                        // unchanged
app.use(errorHandler);                                          // unchanged
```

Because `envelopeMiddleware` is mounted at the application level (not scoped to `/api`), but `res.json` is overridden per-request regardless of path, any path that might call `res.json` will be wrapped. In practice the only routes that ever call `res.json` are under `/api` (auth is handled by `toNodeHandler` and never calls `res.json`), so this is safe. If desired, the mount can be scoped to `/api` to be explicit: `app.use('/api', envelopeMiddleware)` — this is the preferred approach to make the scope self-documenting.

**Final preferred mount:**
```ts
app.use('/api', envelopeMiddleware); // applied to /api/* only; /api/auth/* never reaches this (handled above)
app.use('/api', router);
```

Note: Express processes `app.use('/api', ...)` calls in registration order. The auth handler is registered with `app.all('/api/auth/*splat', ...)` (not `app.use`), which means it pattern-matches before any `use` middleware and short-circuits — auth requests never reach `envelopeMiddleware` or `router`.

### Modified File: `server/src/routes/index.ts` — health endpoint

The health route currently returns `res.json({ status: 'ok' })`. With the envelope middleware in place, this becomes `{ "data": { "status": "ok" } }` automatically. No code change to the health handler is needed.

---

## Schema Changes

None. This change is purely at the HTTP response layer.

---

## Error Handling

### Protection Against Double-Wrapping

The `errorHandler` middleware calls `res.json({ error: { code, message, ...details } })`. The envelope override inspects the payload for a top-level `error` key and passes it through unmodified. This guarantees error responses are never double-wrapped into `{ data: { error: ... } }`.

### Error Response Shape (unchanged)

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

This shape does not change. The `error` key guard in the middleware ensures this.

### Edge Cases

- `res.json(null)`: `null` does not have an `error` key; it wraps to `{ "data": null }`. No current handler returns `null` but this behavior is defined and safe.
- `res.json(undefined)`: Express 5 treats `res.json(undefined)` as sending `undefined`; this does not occur in the codebase but would be wrapped to `{ "data": undefined }`, which Express serializes as `{}`. Not a concern since no handler does this.
- `res.status(204).send()`: Uses `res.send()`, not `res.json()`. The override is never invoked. 204 responses remain body-less.

---

## Validation

No new Zod schemas. No changes to request validation. This feature touches only the response path.

---

## Test Strategy

### Unit Tests

Test `envelopeMiddleware` in isolation with mock `req`/`res`/`next`:

1. **Wraps a plain object**: `res.json({ foo: 'bar' })` → body sent is `{ data: { foo: 'bar' } }`.
2. **Wraps an array**: `res.json([1, 2, 3])` → body sent is `{ data: [1, 2, 3] }`.
3. **Wraps a primitive-like value** (e.g., health status object): `res.json({ status: 'ok' })` → `{ data: { status: 'ok' } }`.
4. **Does not wrap error payloads**: `res.json({ error: { code: 'NOT_FOUND', message: '...' } })` → passes through unchanged.
5. **Does not interfere with 204**: `res.status(204).send()` → `res.json` is never called; no wrapping occurs.

### Integration Tests (if applicable)

- `GET /api/health` → 200 with `{ data: { status: 'ok' } }`.
- `GET /api/courses` → 200 with `{ data: [...] }`.
- `POST /api/courses` → 201 with `{ data: { id: '...', ... } }`.
- `DELETE /api/courses/:courseId` → 204 with no body.
- A forced 404 → `{ error: { code: 'NOT_FOUND', ... } }` (no `data` key).

---

## Dependencies

No new npm packages required. The middleware is pure Express/TypeScript.

---

## Files Changed Summary

| File | Change |
|---|---|
| `server/src/middleware/envelope.ts` | **New** — `envelopeMiddleware` function |
| `server/src/app.ts` | **Modified** — import and mount `envelopeMiddleware` at `/api` before `router` |

No controllers, services, schemas, or route files require modification.
