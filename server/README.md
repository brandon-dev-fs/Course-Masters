# Course Masters — Server

REST API backend for the Course Masters self-directed learning platform.

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Express | 5 | HTTP framework |
| TypeScript | 5 | Language (ESM output) |
| Prisma | 6 | ORM and migrations |
| PostgreSQL | — | Primary database |
| better-auth | 1.5 | Session-based authentication |
| Zod | 3 | Request and env validation |
| pino | 10 | Structured JSON logging |
| express-rate-limit | — | API rate limiting |
| swagger-ui-express | — | OpenAPI docs at `/api/docs` |
| tsx | 4 | TypeScript execution (dev) |

## Architecture

The server follows a three-layer pattern: **Route → Controller → Service**. Routes define endpoints and apply middleware; controllers handle HTTP concerns (extracting params, calling services, sending responses); services contain all business logic and Prisma database access. Errors are normalized through typed classes (`AppError`, `NotFoundError`, `ValidationError`, `ConflictError`) and a centralized error handler. Authentication is session-based via better-auth with three roles: student, teacher, and admin. Four models (Course, Unit, Lesson, Assessment) support soft deletes via a `deletedAt` field.

## Project Structure

```
server/
  prisma/
    schema.prisma       # 29 models + 6 enums
    seed.ts             # Database seed script
    migrations/         # Migration history
  src/
    index.ts            # Entry point — starts HTTP server
    app.ts              # Express setup: middleware stack, routers, error handler
    config.ts           # Zod env validation (fails fast on startup)
    swagger.ts          # OpenAPI document definition
    routes/             # Route definitions (one file per resource)
      index.ts          # Root router: health, authenticate(), sub-router mounts
    controllers/        # HTTP request/response handling (thin layer)
    services/           # Business logic + all Prisma queries (no HTTP objects)
    schemas/            # Zod validation schemas and inferred types
    middleware/
      authenticate.ts   # Session validation → injects req.user, req.session
      authorize.ts      # Role-based access control
      authorize-resource.ts  # Ownership checks (requireCourseOwnership, requireSelf)
      validate.ts       # Body/query validation via Zod
      envelope.ts       # Wraps successful responses in { data: payload }
      errorHandler.ts   # Centralized error handler (last middleware)
      rateLimiter.ts    # authLimiter (20/15min), apiLimiter (300/15min)
      requestId.ts      # UUID per request + X-Request-Id header
      httpLogger.ts     # pino-http structured request logging
    errors/             # AppError, NotFoundError, ValidationError, ConflictError
    lib/                # prisma.ts, auth.ts, logger.ts singletons
    utils/              # asyncHandler, assertExists, softDelete helpers
    types/
      express.d.ts      # Augments Request: requestId, user?, session?
```

## Authentication & Authorization

**Authentication**: Session-based via better-auth (email/password). Sessions stored in `Session` table and validated on every request via `authenticate()` middleware.

**Roles**: `student` (default), `teacher`, `admin`. Middleware chain on write routes: `authorize()` → `requireCourseOwnership()` → `validate()` → controller.

**Access patterns**: Students read/enroll; teachers own and manage course content; admins have full access and bypass ownership checks.

## API Routes

All routes prefixed `/api`. Health check requires no auth; all others require an active session.

| Resource | Methods | Paths |
|---|---|---|
| Health | GET | `/health` |
| Courses | GET, POST, PUT, DELETE | `/courses`, `/courses/:courseId` |
| Units | GET, POST, PUT, DELETE | `/courses/:courseId/units[/:unitId]` |
| Lessons | GET, POST, PUT, DELETE | `/units/:unitId/lessons[/:lessonId]` |
| Resources | GET, POST, PUT, DELETE | `/lessons/:lessonId/resources`, `/resources/:id` |
| Tools | GET, POST, PUT, DELETE | `/lessons/:lessonId/tools`, `/tools/:id` |
| Student Notes | GET, POST, DELETE | `/lessons/:lessonId/student-notes`, `/student-notes/:id` |
| Assessments | GET, POST, PUT | `/lessons/:lessonId/assessment`, `/units/:unitId/assessment`, `/courses/:courseId/assessment`, `/assessments/:id` |
| Assessment Attempts | GET, POST | `/assessments/:id/attempts` |
| Assignments | GET, POST, PUT, DELETE | `/lessons/:lessonId/assignments`, `/assignments/:id` |
| Checklist | GET, POST, DELETE | `/lessons/:lessonId/checklist`, `/checklist-items/:id` |
| Completions | POST, DELETE | `/lessons/:lessonId/complete`, `/units/:unitId/complete` |
| Resource Completions | GET, POST | `/lessons/:lessonId/completions` |
| Progress | GET | `/courses/:courseId/progress`, `/courses/:courseId/units/:unitId/progress` |
| Users | DELETE | `/users/:userId` |
| YouTube | GET | `/youtube/title` |
| Auth | ALL | `/auth/*` (handled by better-auth) |

## Database

PostgreSQL via Prisma 6. The schema defines **29 models** across these groups:

- **Auth**: User, Session, Account, Verification
- **Content hierarchy**: Course → Unit → Lesson (soft-delete cascade)
- **Lesson content**: LessonResource, LessonTool (with LessonResourceCompletion, LessonToolCompletion)
- **Assessments**: Assessment, AssessmentQuestion, AssessmentAttempt
- **Assignments**: Assignment + subtypes (NoteAssignment, VideoAssignment, ReadingAssignment, VocabAssignment, PracticeProblemAssignment) with VocabAssignmentEntry, PracticeProblemQuestion, StudentVocabAssignmentFlashCard, AssignmentCompletion
- **Tracking**: StudentNote, LessonCompletion, UnitCompletion, ActivityBookmark, LessonChecklistItem

All primary keys are UUIDs. Soft deletes (`deletedAt DateTime?`) on Course, Unit, Lesson, Assessment — always filter `where: { deletedAt: null }` on reads.

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | yes | — | PostgreSQL connection string |
| `SERVER_PORT` | no | 5002 | Express listen port |
| `NODE_ENV` | no | development | `development` \| `production` \| `test` |
| `BETTER_AUTH_SECRET` | yes | — | Session signing secret (≥32 chars) |
| `CLIENT_URL` | no | http://localhost:5000 | Allowed CORS origin |
| `LOG_LEVEL` | no | info | pino log level |

Create `server/.env` (not the project root). Validated by Zod at startup — server will not start with invalid config.

## Scripts

Run from the `server/` directory or project root with `-w server`.

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with tsx watch mode (port 5002) |
| `npm run build` | Compile TypeScript |
| `npm test` | Run tests once (Vitest, no coverage) |
| `npm run test:watch` | Watch mode |
| `npm run test:coverage` | Run with V8 coverage (70% threshold) |
| `npm run db:migrate` | Run pending Prisma migrations |
| `npm run db:seed` | Seed database (`node --env-file=.env --import=tsx/esm prisma/seed.ts`) |
| `npm run db:studio` | Open Prisma Studio GUI |
