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
    schema.prisma          # All 15 models, enums, @@map directives
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

```ts
// Correct
router.use('/courses/:courseId/units/:unitId/progress', unitProgressRouter);

// Wrong — do not nest under a courseRouter that already has /:courseId
```

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
Ensures a student can only operate on their own records. Admin bypasses. If `getUserId` returns `undefined`, the controller stamps `req.user.id` by construction — no check needed.

### requireStudentRole()
Ensures only students can submit assessment attempts (teachers/admins blocked).

### better-auth setup (lib/auth.ts)
- Email/password enabled, default role: `student`
- Admin plugin with access control for `course`, `content`, `user` resource types
- Handles: `/api/auth/*` (login, logout, register, session)
- `UserRole` Prisma enum values (`student`, `teacher`, `admin`) must match better-auth role strings

## Request Validation

Schemas in `src/schemas/`. Apply `validate(schema)` for body, `validateQuery(schema)` for query params. Export both the schema and its inferred type (`z.infer<typeof schema>`). Update schemas use `.partial()`. After `validate()` passes, `req.body` is the parsed, typed value — services never re-validate. `validateQuery()` result lands in `res.locals['validatedQuery']` (not `req.query`). Both throw `ValidationError` with flattened Zod `details` on failure.

## Prisma Usage

**Singleton**: import from `src/lib/prisma.ts` only — never instantiate `PrismaClient` elsewhere.

**Soft deletes**: Course, Unit, Lesson, Assessment have `deletedAt DateTime?`. Always filter `where: { deletedAt: null }` on reads. Use `findFirst` (not `findUnique`) when combining `id` with `deletedAt: null`.

**Soft delete cascades**: implemented manually in `utils/softDelete.ts` using `$transaction`. The helpers (`softDeleteCourse`, `softDeleteUnit`, `softDeleteLesson`, `softDeleteUser`) use `updateMany` for batch operations to avoid N+1. Always call within `prisma.$transaction(async tx => { ... })`.

**assertExists utility**: for simple existence checks on non-soft-deleted models:
```ts
const record = await assertExists(prisma.lessonResource, id, 'Resource');
```
Not suitable for soft-deleted models — use `findFirst({ where: { id, deletedAt: null } })` manually.

**Payload types**: derive from `Prisma.ModelGetPayload<{ include: ... }>` for typed service return values that stay in sync with schema changes automatically.

**Transactions**: use `prisma.$transaction(async tx => { ... })` for multi-step writes. The `tx` parameter type is `Omit<PrismaClient, '$connect' | ...>` (see `softDelete.ts`).

## Error Handling

All errors return the same envelope:
```json
{ "error": { "code": "SNAKE_CASE_CODE", "message": "Human readable", "details": {} } }
```

The `errorHandler` middleware handles:
| Error type | Status | Code |
|---|---|---|
| `AppError` (and subclasses) | `err.statusCode` | `err.code` |
| Prisma `P2025` | 404 | `NOT_FOUND` |
| Prisma `P2002` | 409 | `CONFLICT` |
| Prisma `P2003` | 409 | `CONFLICT` |
| Prisma `P2014` | 409 | `CONFLICT` |
| Prisma `P2034` | 409 | `TRANSACTION_CONFLICT` |
| `PrismaClientValidationError` | 400 | `VALIDATION_ERROR` |
| Unhandled | 500 | `INTERNAL_ERROR` |

Use typed subclasses — never raw `AppError` for 404/400/409: `throw new NotFoundError('Course not found')`, `throw new ValidationError(msg, details)`, `throw new ConflictError(msg)`. Use raw `AppError` only for 403: `throw new AppError('FORBIDDEN', msg, 403)`.

Wrap every async handler with `asyncHandler()` — it forwards thrown errors to `next()`, reaching `errorHandler`.

## Response Shape Conventions

- Success: `envelopeMiddleware` wraps `res.json(payload)` → `{ data: payload }`
- Error: `errorHandler` writes `{ error: { code, message, details? } }` — envelope is bypassed for `statusCode >= 400`
- 204 responses use `res.status(204).send()` — `res.json()` is never called, envelope is never triggered

## Logging

Structured JSON via pino (`src/lib/logger.ts`). Log level from `LOG_LEVEL` env var (default: `info`). Import as `import { logger } from '../lib/logger.js'`. Always pass context as first arg: `logger.info({ port }, 'Server started')`. Sensitive fields (`password`, `token`, `secret`, `authorization`, `req.headers.cookie`, `req.body.password`, etc.) are redacted. Never use `console.log` in production code. Auth route bodies are stripped by the pino-http serializer. Every request gets a UUID at `req.requestId` (forwarded as `X-Request-Id`) reused by pino-http for log correlation.

## Environment Variables (server/.env)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `SERVER_PORT` | no (5002) | Express listen port |
| `NODE_ENV` | no (development) | `development` \| `production` \| `test` |
| `BETTER_AUTH_SECRET` | yes (≥32 chars) | Session signing secret |
| `CLIENT_URL` | no (localhost:5000) | Allowed CORS origin |
| `LOG_LEVEL` | no (info) | pino log level |

Validated by Zod in `config.ts` at startup — server will not start with invalid config.

## TypeScript Conventions

- All imports use `.js` extension (required for Node ESM)
- Params accessed via bracket notation: `req.params['id'] as string`
- `req.user!` (non-null assertion) is safe after `authenticate()` middleware
- Schema types inferred with `z.infer<typeof schema>` — never written by hand
- `Prisma.ModelGetPayload<...>` for complex include-typed return values
- No `any` except `syllabus: z.any()` (intentional freeform JSON field)

## Domain-Specific Gotchas

- **Soft deletes on assessments**: assessments have `deletedAt` but are retrieved with `findFirst` (not `findUnique`) so `deletedAt: null` can be combined with the parent FK filter.
- **Assessment JSON content**: `LessonResource.content`, `LessonTool.content`, and `AssessmentQuestion.content` are freeform `Json` columns — no server-side shape enforcement beyond the type enum. Grading logic reads `content.correctIndex`, `content.correctAnswer`, `content.acceptedAnswers[]`, `content.pairs` depending on question type.
- **StudentNote unique constraint**: `(lessonId, userId)` — one note per student per lesson. Prisma will throw `P2002` on duplicate; the error handler returns 409.
- **Assessment attempts**: only the most recent attempt counts for progress. Query with `orderBy: { createdAt: 'desc' }, take: 1`.
- **Progress scoring**: lesson complete = `lesson_quiz` exists + latest attempt `passed === true`. Course % = `Math.round((completedLessons / totalLessons) * 90)`, then 100 if `course_exam` passed.
- **Assessment pass threshold**: 80% (`PASS_THRESHOLD = 0.8` in `assessment.service.ts`). Grading is always server-side.
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

Or from within `server/`:
| Command | Description |
|---|---|
| `npm test` | Single-run, no coverage |
| `npm run test:watch` | Watch mode |
| `npm run test:coverage` | Coverage with threshold |

### File Naming and Directory Structure

```
server/src/__tests__/
  mocks/
    prisma.ts           # Shared Prisma mock factory (prismaMock)
  services/
    *.service.test.ts   # Service layer tests
  controllers/
    *.controller.test.ts
  middleware/
    *.test.ts
  utils/
    *.test.ts
```

- Test files: `*.test.ts`
- Location: `server/src/__tests__/<layer>/<name>.test.ts` where `<layer>` is `services`, `controllers`, `middleware`, or `utils`
- One test file per source module
- Test file names mirror the source file: `assessment.service.ts` → `assessment.service.test.ts`

### Mocking Prisma

The Prisma singleton (`src/lib/prisma.ts`) must be mocked in every test file that exercises service code. Use the shared proxy-based mock factory:

```ts
import type { Prisma, ModelName } from '@prisma/client';
import { prismaMock } from '../mocks/prisma.js';

vi.mock('../../lib/prisma.js', () => ({ default: prismaMock }));

// Configure return values per test
prismaMock.assessment.findFirst.mockResolvedValue(makeAssessment());
```

### Fixture Typing

Use Prisma-inferred types for test fixtures — never `Record<string, unknown>` or `any`. This ensures schema changes surface as compile errors in tests:

```ts
import type { Prisma, AssessmentQuestion } from '@prisma/client';

type AssessmentWithQuestions = Prisma.AssessmentGetPayload<{ include: { questions: true } }>;

function makeQuestion(overrides: Partial<AssessmentQuestion>): AssessmentQuestion { ... }
function makeAssessment(overrides: Partial<AssessmentWithQuestions> = {}): AssessmentWithQuestions { ... }
```

### Coverage Threshold

The 70% threshold is enforced only by `test:coverage` (`vitest run --coverage`), not by `npm test`. The aggregate will be below 70% until broader test coverage is added — this is expected while establishing the infrastructure. `json-summary` reporter is included for future CI integration.
