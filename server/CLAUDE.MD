# CLAUDE.md

## Architecture
- RESTful API, stateless, business logic in the service layer
- Routes → Controllers → Services (Prisma). Controllers must not use Prisma directly.
- All sub-routers that access parent params must use `{ mergeParams: true }`
- Express 5: always cast params with bracket notation — `req.params['courseId'] as string`
- Wrap every async route handler with `asyncHandler()` from `src/utils/asyncHandler.ts`

## Error Handling
All errors return:
```json
{ "error": { "code": "NOT_FOUND", "message": "...", "details": {} } }
```
- Use `AppError`, `NotFoundError`, `ValidationError` from `src/errors/`
- Prisma `P2025` → 404, `P2002` → 409. Never leak Prisma internals to the client.

## Validation
- Zod schemas live in `src/schemas/`. Apply via `validate(schema)` middleware before the controller.
- On success, `req.body` is the parsed, typed data. Services do not re-validate.

## Database
- Prisma singleton from `src/lib/prisma.ts` — never instantiate `PrismaClient` elsewhere.
- Cascade deletes are schema-configured — do not implement manual cascade logic.
- Seed: `node --env-file=.env --import=tsx/esm prisma/seed.ts` (do NOT use `prisma db seed`)

## Progress Scoring (`src/services/progress.service.ts`)
- Lesson complete: quiz exists + latest `QuizAttempt.passed === true`
- Unit complete: all lessons complete + latest `TestAttempt.passed === true`
- Course %: `Math.round((completedLessons / totalLessons) * 100)`
- Only the most recent attempt counts (`orderBy: createdAt desc, take: 1`)

## Testing
- Jest + Supertest, API integration tests against a real test DB
- Cover all CRUD routes, cascade deletes, and progress scoring logic

## Project Structure
```
src/
  routes/        # Thin — validate + asyncHandler only
  controllers/   # Extract params, call service, send response
  services/      # All business logic and Prisma queries
  schemas/       # Zod validation schemas
  middleware/    # errorHandler.ts, validate.ts
  errors/        # AppError, NotFoundError, ValidationError
  lib/prisma.ts  # Prisma singleton
  utils/asyncHandler.ts
```

---

## User Instructions
<!-- Add your personal workflow preferences and conventions here -->
