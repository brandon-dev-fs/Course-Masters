# Backend Rules

Load on-demand when encountering backend source files.
Read `CLAUDE.md` for the project's backend tech stack and conventions.

## Folder Structure

- Follow the established layout: `routes/` → `controllers/` → `services/`.
- New domain features get one file per layer: `<resource>.routes.ts`, `<resource>.controller.ts`, `<resource>.service.ts`.
- Zod schemas go in `src/schemas/<resource>.schema.ts`. Export both the schema and `z.infer<typeof schema>` type.
- Custom error classes go in `src/errors/`. Utility functions go in `src/utils/`. Library singletons go in `src/lib/`.
- Never create catch-all files like `helpers.ts` or `utils.ts` at the root — place utilities in `src/utils/` with a descriptive name.
- Express type augmentations go in `src/types/express.d.ts` — do not scatter `.d.ts` files.

## Layering Rules

- **Routes**: wire middleware and call controller methods. No business logic, no Prisma imports.
- **Controllers**: extract params/body/user from the request, call exactly one service method, send the HTTP response. Never import Prisma directly. Never call multiple service methods in sequence — if the operation needs coordination, that belongs in the service layer.
- **Services**: all business logic and Prisma queries. No HTTP concerns (`req`, `res`, `next` never appear). Services may call other services for cross-domain operations.
- Middleware chain order on write routes: `authorize()` → `requireCourseOwnership()` → `validate()` → controller.

## Error Handling

- Use the typed error subclasses — never throw raw `Error` or generic `AppError` for known cases:
  - `NotFoundError` for 404
  - `ValidationError` for 400 (with `details` for field-level errors)
  - `ConflictError` for 409
  - `AppError('FORBIDDEN', msg, 403)` for authorization failures (the only acceptable raw `AppError` usage)
- Never catch errors in controllers just to re-throw or transform them — let them propagate to `errorHandler`.
- Never return error responses manually (`res.status(4xx).json(...)`) — throw the appropriate error class and let the centralized handler format it.
- In services, throw errors for business rule violations. Do not return null/undefined to signal errors.

## Validation

- Every endpoint that accepts a request body must have a Zod schema applied via `validate()` middleware.
- Every endpoint that accepts query params must use `validateQuery()`.
- Schemas live in `src/schemas/`. Name them `create<Resource>Schema`, `update<Resource>Schema`, `<resource>QuerySchema`.
- Update schemas should use `.partial()` on the create schema when all fields are optional.
- After `validate()` runs, `req.body` is the parsed, typed value — services must never re-validate the same fields.
- After `validateQuery()` runs, the result is in `res.locals['validatedQuery']` — never read raw `req.query` after validation.
- Validate at the boundary only. Internal service-to-service calls trust their inputs.

## Logging

- Use the pino singleton from `src/lib/logger.ts` — never `console.log`, `console.error`, or `console.warn`.
- Always pass structured context as the first argument: `logger.info({ courseId, userId }, 'Course created')`.
- Use appropriate log levels:
  - `error`: unrecoverable failures, unhandled exceptions
  - `warn`: recoverable issues, deprecated usage, rate limit hits
  - `info`: significant business events (user created, course published)
  - `debug`: detailed operational data useful during development
- Never log request/response bodies in full — pino-http handles request logging with redaction.
- Never log passwords, tokens, secrets, or PII. The pino redaction config in `logger.ts` handles known fields, but be vigilant with new fields.
- Include `requestId` in manual log entries where available for correlation.

## Async Patterns

- Wrap every async route handler with `asyncHandler()` — this forwards thrown errors to `next()` so they reach `errorHandler`. Never use raw `async (req, res) => {}` in route definitions.
- Use `prisma.$transaction(async tx => { ... })` for multi-step writes that must be atomic. Pass `tx` to all queries within the transaction — never mix `tx` and `prisma` in the same transaction block.
- Never use `Promise.all()` for writes that depend on each other — use sequential awaits. Use `Promise.all()` only for independent reads.
- Never use `setTimeout`, `setInterval`, or fire-and-forget promises in request handlers. All work must complete before the response is sent.

## Import Conventions

- All imports use `.js` extension (Node ESM requirement).
- Import order:
  1. Node built-ins (`node:path`, `node:crypto`)
  2. Express / third-party types (`express`, `zod`, `@prisma/client`)
  3. Local lib/singletons (`../lib/prisma.js`, `../lib/logger.js`)
  4. Local services and controllers
  5. Local errors and utilities
  6. Type-only imports (`import type { ... }` — always use `import type` for type-only imports)
- Separate each group with a blank line.

## Dependencies

- Justify any new dependency in the PR description. Prefer existing dependencies over new ones.
- Never add a dependency for something achievable with the existing stack in under 20 lines.
- Pin exact versions in `package.json` (no `^` or `~`) for server dependencies. The lockfile provides reproducibility but explicit pins signal intent.
- Dev dependencies (`@types/*`, test utilities) may use `^` ranges.

## TypeScript

- Avoid `any` — use `unknown` and narrow. The only acceptable `any` is in Zod's `.passthrough()` or freeform JSON columns (documented in `server/CLAUDE.md`).
- Access route params via bracket notation: `req.params['courseId'] as string` (Express 5 convention).
- `req.user!` non-null assertion is safe after `authenticate()` middleware — do not add redundant null checks.
- Derive payload types from `Prisma.ModelGetPayload<{ include: ... }>` — never hand-write types that mirror the schema.
