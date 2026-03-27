# Server CLAUDE.md

## Architecture
- RESTful API, stateless, business logic in the service layer
- Routes → Controllers → Services (Prisma). Controllers must not use Prisma directly.
- All sub-routers that access parent params must use `{ mergeParams: true }`
- Express 5: always cast params with bracket notation — `req.params['courseId'] as string`
- Wrap every async route handler with `asyncHandler()` from `src/utils/asyncHandler.ts`

## Middleware
| File | Purpose |
|---|---|
| `authenticate.ts` | Validates better-auth session, injects `req.user` (id, name, email, role) and `req.session` |
| `authorize.ts` | Role-based gating — accepts `allowedRoles` array, checks `req.user.role` |
| `validate.ts` | Zod schema validation on `req.body`, forwards errors to errorHandler |
| `errorHandler.ts` | Global error handler: AppError → structured JSON, Prisma P2025 → 404, P2002 → 409 |

## Error Handling
All errors return:
```json
{ "error": { "code": "NOT_FOUND", "message": "...", "details": {} } }
```
- Use `AppError`, `NotFoundError`, `ValidationError` from `src/errors/`
- Never leak Prisma internals to the client

## Validation
- Zod schemas live in `src/schemas/`. Apply via `validate(schema)` middleware before the controller.
- On success, `req.body` is the parsed, typed data. Services do not re-validate.

## Database
- Prisma singleton from `src/lib/prisma.ts` — never instantiate `PrismaClient` elsewhere
- Cascade deletes are schema-configured — do not implement manual cascade logic
- Seed: `node --env-file=.env --import=tsx/esm prisma/seed.ts` (do NOT use `prisma db seed`)
- Schema applied via `prisma db push` (dev) — migration history in `prisma/migrations/` is superseded
- LessonResource/LessonTool content is a freeform Json field — no server-side shape enforcement beyond the type enum
- AssessmentQuestion: `question String` holds display text; `content Json` holds answer data (`{options, correctIndex}` etc.)
- StudentNote has unique constraint on `(lessonId, userId)` — one note per student per lesson

## Auth Configuration (`src/lib/auth.ts`)
- better-auth with Prisma adapter, email/password enabled
- Admin plugin with access control statements for course/content/user permissions
- Rate limiting: 20 requests per 15 minutes on auth endpoints
- Config validated via Zod in `src/config.ts` (requires `BETTER_AUTH_SECRET` min 32 chars)
- `UserRole` Prisma enum values (`student`, `teacher`, `admin`) match the string values better-auth uses

## Progress Scoring (`src/services/progress.service.ts`)
- Lesson complete: assessment (lesson_quiz) exists + latest `AssessmentAttempt.passed === true`
- Unit complete: all lessons complete + latest unit_quiz `AssessmentAttempt.passed === true`
- Course %: `lessonPercent = Math.round((completedLessons / totalLessons) * 90)`, then 100 if course_exam passed
- Only the most recent attempt counts (`orderBy: createdAt desc, take: 1`)

## Assessment Grading (`src/services/assessment.service.ts`)
- Pass threshold: 80% (`PASS_THRESHOLD = 0.8`)
- `multiple_choice` / `true_false`: answer compared against `content.correctIndex` / `content.correctAnswer`
- `fill_in_blank`: case-insensitive match against `content.acceptedAnswers[]`
- `matching`: JSON equality against `content.pairs`
- Grading is always server-side — full question content is returned to clients (no answer stripping)

## Project Structure
```
src/
  index.ts             # Entry point
  app.ts               # Express setup (CORS, rate limiting, auth handler)
  config.ts            # Zod env validation
  routes/              # assessment, lesson-resource, lesson-tool, completion + core routes
  controllers/         # assessment, lesson-resource, lesson-tool, completion + core controllers
  services/            # assessment, lesson-resource, lesson-tool, completion, progress + core services
  schemas/             # Zod schemas (assessment, lesson-resource, lesson-tool, lesson, etc.)
  middleware/          # authenticate, authorize, validate, errorHandler
  errors/              # AppError, NotFoundError, ValidationError
  lib/prisma.ts        # Prisma singleton
  lib/auth.ts          # better-auth setup
  utils/asyncHandler.ts
  types/express.d.ts   # req.user & req.session type augmentation
```

---

## User Instructions

