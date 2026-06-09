# Server CLAUDE.md

## Tech Stack

- **Runtime**: Node.js with tsx (ESM, TypeScript executed directly)
- **Framework**: Express 5
- **ORM**: Prisma 6 + PostgreSQL
- **Auth**: better-auth 1.5 (Prisma adapter, admin plugin)
- **Validation**: Zod 3
- **Logging**: pino + pino-http
- **Rate limiting**: express-rate-limit
- **Docs**: swagger-ui-express (`/api/docs`)
- TypeScript 5 with `.js` extension on all imports (ESM requirement)

## Folder Structure

```
server/
  prisma/
    schema.prisma          # All 29 models, enums, @@map directives
    migrations/            # Migration history
    seed.ts                # Seed script
  src/
    index.ts               # Entry point — validates env, starts server
    app.ts                 # Express app factory — middleware stack wired here
    config.ts              # Zod env validation — fails fast on bad config
    swagger.ts             # OpenAPI document definition
    routes/
      index.ts             # Root router — mounts all sub-routers, applies authenticate()
      course.routes.ts
      unit.routes.ts
      lesson.routes.ts
      lesson-resource.routes.ts
      lesson-tool.routes.ts
      student-note.routes.ts
      assessment.routes.ts
      assignment.routes.ts
      bookmark.routes.ts     # Activity bookmarks
      checklist.routes.ts    # Lesson checklist items
      completion.routes.ts
      resource-completion.routes.ts
      progress.routes.ts
      user.routes.ts
      youtube.routes.ts
    controllers/           # Thin HTTP layer — extract params, call service, send response
    services/              # Business logic + all Prisma queries
    schemas/               # Zod schemas and inferred TypeScript types
    middleware/
      authenticate.ts      # Session validation → injects req.user, req.session
      authorize.ts         # Role-based gating
      authorize-resource.ts # Ownership checks (requireCourseOwnership, requireSelf, requireStudentRole)
      validate.ts          # Body + query validation via Zod
      envelope.ts          # Wraps successful res.json() in { data: payload }
      errorHandler.ts      # Centralized error handler (must be last app.use)
      rateLimiter.ts       # authLimiter (20/15min), apiLimiter (300/15min)
      requestId.ts         # Attaches UUID to req.requestId, sets X-Request-Id header
      httpLogger.ts        # pino-http structured request logging
    errors/
      AppError.ts          # Base error class: code, message, statusCode, details?
      NotFoundError.ts     # 404 — code: NOT_FOUND
      ValidationError.ts   # 400 — code: VALIDATION_ERROR, details: fieldErrors
      ConflictError.ts     # 409 — code: CONFLICT
      index.ts             # Re-exports all errors
    lib/
      prisma.ts            # PrismaClient singleton
      auth.ts              # better-auth instance + access control setup
      logger.ts            # pino instance with sensitive-field redaction
    utils/
      asyncHandler.ts      # Wraps async route handlers, forwards errors to next()
      assertExists.ts      # findUnique + throw NotFoundError helper
      softDelete.ts        # Cascade soft-delete helpers (Course, Unit, Lesson, User)
    types/
      express.d.ts         # Augments Request: requestId, user?, session?
```

## Express App Setup (app.ts — order is critical)

```
app.set('trust proxy', 1)          // real IP from X-Forwarded-For behind nginx/Docker
cors({ origin: CLIENT_URL, credentials: true })
requestIdMiddleware                 // UUID on req.requestId + X-Request-Id header
httpLogger                          // pino-http structured logging
app.all('/api/auth/*splat', authLimiter, toNodeHandler(auth))  // BEFORE express.json()
app.use('/api', apiLimiter)
express.json()
/api/docs → swagger UI
/api → envelopeMiddleware           // wraps successful res.json in { data: ... }
/api → router
errorHandler                        // LAST — four-arg signature required by Express
```

**Critical**: better-auth must be mounted before `express.json()` — it handles its own body parsing.

## Route Organization

All API routes are prefixed `/api`. The root router (`routes/index.ts`):

- Exposes `GET /health` without auth
- Applies `authenticate()` to everything below
- Mounts sub-routers at resource paths

Sub-routers that access parent route params (e.g., `:courseId` from a parent router) **must** be created with `Router({ mergeParams: true })`. Without it, parent params are undefined.

Progress routes are mounted at full absolute paths on the root router — not nested under a `/courses` sub-router — because nested `:unitId` params get lost when layering routers.

## Architecture: Routes → Controllers → Services

- **Routes**: wire middleware chain, call controller method
- **Controllers**: extract params/body/user, call one service method, send HTTP response. Never import Prisma directly.
- **Services**: all business logic and Prisma queries. No HTTP concerns.

Route middleware order: `authorize()` → `requireCourseOwnership()` → `validate()` → controller.

Controllers always use `asyncHandler()`. Params use bracket notation (Express 5): `req.params['courseId'] as string`. Delete handlers return `res.status(204).send()` — never `res.json()` for 204.

## Authentication and Authorization

### authenticate()
Validates better-auth session cookie. On success injects `req.user` and `req.session`. On failure returns `401 UNAUTHENTICATED`. Applied once to the entire router in `routes/index.ts`.

### authorize(...roles)
Checks `req.user.role` against the allowed roles array. Returns `403 FORBIDDEN` if not matched.

### requireCourseOwnership(resourceType, getResourceId)
Teacher-only ownership enforcement. Issues one Prisma query (single JOIN) to walk up the hierarchy to the course's `authorId`. Admin bypasses the query entirely. Students bypass (they have no write access by role). Throws `NotFoundError` (not 403) when the resource doesn't exist — prevents existence leaking.

### requireSelf(getUserId)
Ensures a student can only operate on their own records. Admin bypasses.

### requireStudentRole()
Ensures only students can submit assessment attempts (teachers/admins blocked).

### better-auth setup (lib/auth.ts)
- Email/password enabled, default role: `student`
- Admin plugin with access control for `course`, `content`, `user` resource types
- `UserRole` Prisma enum values must match better-auth role strings

## Request Validation

Schemas in `src/schemas/`. Apply `validate(schema)` for body, `validateQuery(schema)` for query params. Export both the schema and its inferred type (`z.infer<typeof schema>`). Update schemas use `.partial()`. After `validate()` passes, `req.body` is the parsed, typed value — services never re-validate. `validateQuery()` result lands in `res.locals['validatedQuery']` (not `req.query`). Both throw `ValidationError` with flattened Zod `details` on failure.

## Prisma Usage

**Singleton**: import from `src/lib/prisma.ts` only — never instantiate `PrismaClient` elsewhere.

**Soft deletes**: Course, Unit, Lesson, Assessment have `deletedAt DateTime?`. Always filter `where: { deletedAt: null }` on reads. Use `findFirst` (not `findUnique`) when combining `id` with `deletedAt: null`.

**Soft delete cascades**: implemented manually in `utils/softDelete.ts` using `$transaction`. The helpers (`softDeleteCourse`, `softDeleteUnit`, `softDeleteLesson`, `softDeleteUser`) use `updateMany` for batch operations to avoid N+1.

**assertExists utility**: for simple existence checks on non-soft-deleted models:
```ts
const record = await assertExists(prisma.lessonResource, id, 'Resource');
```
Not suitable for soft-deleted models — use `findFirst({ where: { id, deletedAt: null } })` manually.

**Payload types**: derive from `Prisma.ModelGetPayload<{ include: ... }>` for typed service return values.

**Transactions**: use `prisma.$transaction(async tx => { ... })` for multi-step writes. Never mix `tx` and global `prisma` inside a transaction.

## Error Handling

The `errorHandler` middleware handles:

| Error type | Status | Code |
|---|---|---|
| `AppError` (and subclasses) | `err.statusCode` | `err.code` |
| Prisma `P2025` | 404 | `NOT_FOUND` |
| Prisma `P2002` | 409 | `CONFLICT` |
| Prisma `P2003` | 409 | `CONFLICT` |
| Prisma `P2034` | 409 | `TRANSACTION_CONFLICT` |
| `PrismaClientValidationError` | 400 | `VALIDATION_ERROR` |
| Unhandled | 500 | `INTERNAL_ERROR` |

Use typed subclasses: `throw new NotFoundError('...')`, `throw new ValidationError(msg, details)`, `throw new ConflictError(msg)`. Raw `AppError` only for 403: `throw new AppError('FORBIDDEN', msg, 403)`.

## Response Shape Conventions

- Success: `envelopeMiddleware` wraps `res.json(payload)` → `{ data: payload }`
- Error: `errorHandler` writes `{ error: { code, message, details? } }` — envelope bypassed for `statusCode >= 400`
- 204: `res.status(204).send()` — never call `res.json()` for deletes

## Logging

Structured JSON via pino (`src/lib/logger.ts`). Import as `import { logger } from '../lib/logger.js'`. Always pass context as first arg: `logger.info({ courseId }, 'Course created')`. Sensitive fields are redacted. Never use `console.log` in production code.

## Environment Variables (server/.env)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `SERVER_PORT` | no (5002) | Express listen port |
| `NODE_ENV` | no (development) | `development` \| `production` \| `test` |
| `BETTER_AUTH_SECRET` | yes (≥32 chars) | Session signing secret |
| `CLIENT_URL` | no (localhost:5000) | Allowed CORS origin |
| `LOG_LEVEL` | no (info) | pino log level |

## TypeScript Conventions

- All imports use `.js` extension (required for Node ESM)
- Params accessed via bracket notation: `req.params['id'] as string`
- `req.user!` (non-null assertion) is safe after `authenticate()` middleware
- Schema types inferred with `z.infer<typeof schema>` — never written by hand
- `Prisma.ModelGetPayload<...>` for complex include-typed return values
- No `any` except intentional freeform JSON fields

## Domain-Specific Gotchas

- **Soft deletes on assessments**: use `findFirst` (not `findUnique`) so `deletedAt: null` can be combined with the parent FK filter.
- **Assessment JSON content**: `LessonResource.content`, `LessonTool.content`, and `AssessmentQuestion.content` are freeform `Json` columns. Grading reads `content.correctIndex`, `content.correctAnswer`, `content.acceptedAnswers[]`, `content.pairs` depending on question type.
- **StudentNote unique constraint**: `(lessonId, userId)` — one note per student per lesson. Prisma throws `P2002` on duplicate → 409.
- **Assessment attempts**: only the most recent attempt counts for progress. Query with `orderBy: { createdAt: 'desc' }, take: 1`.
- **Progress scoring**: lesson complete = `lesson_quiz` exists + latest attempt `passed === true`. Course % = `Math.round((completedLessons / totalLessons) * 90)`, then 100 if `course_exam` passed. Unit % = `Math.round((completedLessons / totalLessons) * 100)`. Pass threshold is 80%.
- **Seed command**: `node --env-file=.env --import=tsx/esm prisma/seed.ts` — do NOT use `prisma db seed`.

---

## Unit Testing

### Test Runner
Vitest with `node` environment. No DOM simulation — tests run in plain Node.js context.

### Running Tests

| Command | Description |
|---|---|
| `npm test -w server` | Single-run, no coverage (fast feedback) |
| `npm run test:watch -w server` | Watch mode for local development |
| `npm run test:coverage -w server` | Single-run with V8 coverage + threshold enforcement |

### File Location and Naming
Test files: `server/src/__tests__/<layer>/<name>.test.ts` where `<layer>` is `services`, `controllers`, `middleware`, `schemas`, or `utils`. One test file per source module. Names mirror the source: `assessment.service.ts` → `assessment.service.test.ts`.

### Mocking Prisma
Mock the Prisma singleton via the shared proxy factory at `src/__tests__/mocks/prisma.ts`:

```ts
import { prismaMock } from '../mocks/prisma.js';
vi.mock('../../lib/prisma.js', () => ({ default: prismaMock }));
prismaMock.assessment.findFirst.mockResolvedValue(makeAssessment());
```

Use Prisma-inferred types for fixtures (`Prisma.AssessmentGetPayload<{ include: ... }>`) to ensure schema changes surface as compile errors.

### Coverage Threshold
70% enforced by `npm run test:coverage` only — not by `npm test`.
