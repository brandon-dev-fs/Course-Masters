# Server CLAUDE.md

## Architecture
- RESTful API, stateless, business logic in the service layer
- Routes → Controllers → Services (Prisma). Controllers must not use Prisma directly.
- All sub-routers that access parent params must use `{ mergeParams: true }`
- Express 5: always cast params with bracket notation — `req.params['courseId'] as string`
- Wrap every async route handler with `asyncHandler()` from `src/utils/asyncHandler.ts`

## Factory Patterns (DRY)
Lesson content types (flashcards, practice problems, videos, vocab) share identical CRUD shapes:
- `factories/createLessonContentRoutes.ts` — generates parent + standalone routes
- `factories/createLessonContentController.ts` — generates getAll, create, update, remove
- `factories/createLessonContentService.ts` — generates findAllByLesson, create, update, remove
- `factories/createAssessmentRoutes.ts` + `createAssessmentService.ts` — shared assessment CRUD + attempts

When adding a new lesson content type, use these factories instead of writing boilerplate.

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
- Note content stored as JSON (`Prisma.InputJsonValue`) for rich text editor support
- StudentNote has unique constraint on `(lessonId, userId)` — one note per student per lesson
- Video model includes nullable `transcript` and `summary` fields for future AI features

## Auth Configuration (`src/lib/auth.ts`)
- better-auth with Prisma adapter, email/password enabled
- Admin plugin with access control statements for course/content/user permissions
- Rate limiting: 20 requests per 15 minutes on auth endpoints
- Config validated via Zod in `src/config.ts` (requires `BETTER_AUTH_SECRET` min 32 chars)

## Progress Scoring (`src/services/progress.service.ts`)
- Lesson complete: quiz exists + latest `QuizAttempt.passed === true`
- Unit complete: all lessons complete + latest `TestAttempt.passed === true`
- Course %: `lessonPercent = Math.round((completedLessons / totalLessons) * 90)`, then 100 if exam passed
- Only the most recent attempt counts (`orderBy: createdAt desc, take: 1`)

## Project Structure
```
src/
  index.ts             # Entry point
  app.ts               # Express setup (CORS, rate limiting, auth handler)
  config.ts            # Zod env validation
  routes/              # 14 route files + factories/
  controllers/         # 13 controllers + factories/
  services/            # 13 services + factories/
  schemas/             # 11 Zod schemas
  middleware/           # authenticate, authorize, validate, errorHandler
  errors/              # AppError, NotFoundError, ValidationError
  lib/prisma.ts        # Prisma singleton
  lib/auth.ts          # better-auth setup
  utils/asyncHandler.ts
  types/express.d.ts   # req.user & req.session type augmentation
```

---

## User Instructions
<!-- Add your personal workflow preferences and conventions here -->
