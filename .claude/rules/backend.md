# Backend Rules

Loaded by: `backend-architect`, `backend-developer`, `code-reviewer`, `security-reviewer`.

## Stack

- Runtime: Node.js
- Language: TypeScript (strict mode)
- Framework: Express
- ORM: Prisma (see `data.md`)
- Validation: Zod
- Auth: Better Auth
- Logging: Pino

## Folder structure

All backend code lives under `server/src/`. Prisma schema and migrations live under `server/prisma/`.

Within `server/src/`, follow these conventions:

- `errors/` — `AppError` base class and subclasses, `codes.ts` enum
- `middleware/` — Express middleware including `errorHandler` and `asyncHandler`
- `routes/` — route definitions, organized by resource
- `controllers/` — request/response handling, calls services
- `services/` — business logic, calls repositories or Prisma directly
- `lib/` — shared utilities

Controllers contain no business logic. Services contain no Express types (`req`, `res`).

## Validation

- All request bodies, query params, and route params are validated with Zod schemas at the controller boundary.
- A failed parse throws `ValidationError` with the Zod issue map as `details`.
- Never trust unvalidated input past the controller layer.

## Error handling

The error pattern is end-to-end: server throws typed errors, central middleware serializes them, client deserializes back into typed `ApiClientError`.

### Pattern

1. **Throw** an `AppError` subclass anywhere in a controller, service, or repository.
2. **`asyncHandler`** wraps every async route handler and forwards thrown errors to Express's `next(err)`.
3. **`errorHandler`** middleware is the single place that calls `res.json({ error: { code, message, details } })` for non-2xx responses.

### Rules

- **Never call `res.json({ error: ... })` directly in a route, controller, or service.** Always throw.
- **Never call `res.status(4xx)` or `res.status(5xx)` directly.** Throw an `AppError` subclass; the middleware sets the status.
- Wrap every async route handler in `asyncHandler`.
- All non-2xx responses must conform to `{ error: { code, message, details } }`.

### Existing error classes

Located in `server/src/errors/`:

- `NotFoundError` — 404, code `NOT_FOUND`
- `ValidationError` — 400, code `VALIDATION_ERROR`, accepts a `details` field-errors map

### Error codes

- All error codes are defined in `server/src/errors/codes.ts` as a const enum.
- Before throwing a new kind of error, **add the code to `codes.ts` first**, then create the `AppError` subclass that uses it.
- Never use a free-form string literal for an error code. Always reference the enum.
- Codes are `SCREAMING_SNAKE_CASE`.

### Auth errors (desired state)

Current state: auth failures bypass `AppError` and return early in middleware without the standard envelope. This is a known gap.

Desired state going forward: when adding new auth-related error handling, create and use:

- `UnauthorizedError` — 401, code `UNAUTHORIZED` (caller is not authenticated)
- `ForbiddenError` — 403, code `FORBIDDEN` (caller is authenticated but lacks permission)

Bring auth into the standard envelope incrementally as auth code is touched.

### Prisma special cases

`P2002` (unique constraint violation) is handled inline in `errorHandler` and converted to a `409 CONFLICT` response. There is no `ConflictError` class. If adding new Prisma-specific handling, prefer creating a typed subclass over inline handling.

## Logging

- Logger: Pino. Use `pino-http` for request logging.
- Log structured JSON only. Never `console.log`.
- Log levels: `trace`, `debug`, `info`, `warn`, `error`, `fatal`.
- **Never log secrets, tokens, passwords, or full request bodies that may contain PII.** Redact with Pino's `redact` config.
- Errors caught by `errorHandler` are logged at `error` level with the error object and request context.

## Async patterns

- Use `async`/`await` throughout. Never mix with `.then()`/`.catch()` chains.
- Never use `try`/`catch` purely to swallow errors. Either handle meaningfully or let the error propagate to `asyncHandler`.

## Dependencies

- New runtime dependencies require justification in the implementation plan.
- Prefer the standard library and existing dependencies before adding new ones.
- Never add a dependency that duplicates the function of an existing one.
