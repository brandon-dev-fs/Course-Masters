# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Guidelines
- Follow RESTful API conventions for all endpoints
- Use Prisma for all database interactions — no raw SQL unless absolutely necessary
- Keep business logic in the backend
- Write the API to be stateless

## Error Handling Conventions

Consistent error handling across the backend and frontend. The goal is predictable error shapes so the client can always parse and display errors reliably.

All API errors should return a consistent JSON shape:
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Course not found",
    "details": {}
  }
}
```

- `code` — A machine-readable string constant (e.g., `NOT_FOUND`, `VALIDATION_ERROR`, `INTERNAL_ERROR`)
- `message` — A human-readable description
- `details` — Optional object for field-level validation errors (e.g., `{ "title": "Title is required" }`)

Use a centralized error-handling middleware in Express. Route handlers should throw or pass typed errors; the middleware catches them and formats the response.

```
server/src/
  middleware/
    errorHandler.ts    // Central Express error middleware
  errors/
    AppError.ts        // Base error class with code, message, statusCode
    NotFoundError.ts   // 404
    ValidationError.ts // 400 with field details
```

- **Prisma errors** — Catch Prisma-specific errors (e.g., `P2025` for record not found, `P2002` for unique constraint) in the error middleware and map them to the standard error shape. Do not leak Prisma internals to the client.
- **Validation** — Validate request bodies at the route level before they reach the service layer. Use a validation library like Zod to define schemas for request payloads and parse them in middleware or at the top of each handler.
- **Unhandled errors** — The error middleware should catch anything unexpected, log the full error server-side, and return a generic `INTERNAL_ERROR` to the client.

## Testing Strategy

Testing should be pragmatic — focus coverage on the areas most likely to break and provide the most value.

### Jest + Supertest
- **API integration tests** are the priority. Test each route against a real test database (use a separate Postgres container or test schema). Verify status codes, response shapes, and side effects (e.g., cascade deletes).
- **Prisma service/helper unit tests** for any business logic that lives outside route handlers (e.g., progress calculation).
- Use `beforeAll` / `afterAll` hooks to seed and tear down test data. Prisma makes this straightforward.
- Aim for full coverage of CRUD operations and assessment attempt scoring.

## Project Structure

```
src/
  index.ts                  // Entry point — creates HTTP server, binds port
  app.ts                    // Express app setup (CORS, JSON body parsing, router, error handler)
  config.ts                 // Environment config (port, etc.)

  routes/                   // Express routers — thin layer that maps HTTP verbs to controllers
    index.ts                // Root router — mounts all sub-routers under /api
    course.routes.ts
    unit.routes.ts
    lesson.routes.ts
    note.routes.ts
    flashcard.routes.ts
    practice-problem.routes.ts
    quiz.routes.ts
    test.routes.ts
    exam.routes.ts
    progress.routes.ts

  controllers/              // Request/response layer — extracts params, calls service, sends response
    course.controller.ts
    unit.controller.ts
    lesson.controller.ts
    note.controller.ts
    flashcard.controller.ts
    practice-problem.controller.ts
    quiz.controller.ts
    test.controller.ts
    exam.controller.ts
    progress.controller.ts

  services/                 // Business logic and all Prisma queries
    course.service.ts
    unit.service.ts
    lesson.service.ts
    note.service.ts
    flashcard.service.ts
    practice-problem.service.ts
    quiz.service.ts
    test.service.ts
    exam.service.ts
    progress.service.ts

  schemas/                  // Zod schemas for request body validation
    course.schema.ts
    unit.schema.ts
    lesson.schema.ts
    note.schema.ts
    flashcard.schema.ts
    practice-problem.schema.ts
    assessment.schema.ts    // Shared schemas for quiz/test/exam question payloads

  middleware/
    errorHandler.ts         // Central Express error middleware — formats all errors to standard shape
    validate.ts             // Zod validation middleware factory

  errors/
    AppError.ts             // Base error class (code, message, statusCode)
    NotFoundError.ts        // 404 — extends AppError
    ValidationError.ts      // 400 with field-level details — extends AppError
    index.ts                // Re-exports all error classes

  lib/
    prisma.ts               // Prisma client singleton

  utils/
    asyncHandler.ts         // Wraps async route handlers to forward errors to Express next()
```

## Route Conventions

All routes are mounted under `/api` in `app.ts`. The root router in `src/routes/index.ts` organizes them as follows.

### Core CRUD

```
/courses                               → course.routes.ts
/courses/:courseId/units               → unit.routes.ts        (mergeParams: true)
/units/:unitId/lessons                 → lesson.routes.ts       (mergeParams: true)
```

### Lesson Content

```
/lessons/:lessonId/notes               → lessonNotesRouter      (mergeParams: true)
/lessons/:lessonId/flashcards          → lessonFlashCardsRouter  (mergeParams: true)
/lessons/:lessonId/practice-problems   → lessonProblemsRouter   (mergeParams: true)
/notes                                 → notesRouter            (individual note operations)
/flashcards                            → flashCardsRouter       (individual flashcard operations)
/practice-problems                     → problemsRouter         (individual problem operations)
```

### Assessments

```
/lessons/:lessonId/quiz                → lessonQuizRouter       (mergeParams: true)
/units/:unitId/test                    → unitTestRouter         (mergeParams: true)
/courses/:courseId/final-exam          → courseExamRouter       (mergeParams: true)
/quizzes                               → quizzesRouter          (attempt submission)
/tests                                 → testsRouter            (attempt submission)
/exams                                 → examsRouter            (attempt submission)
```

### Progress

```
/courses/:courseId/progress            → courseProgressRouter   (mergeParams: true)
/courses/:courseId/units/:unitId/progress → unitProgressRouter  (mergeParams: true)
```

### Conventions

- All sub-routers that access parent route params (e.g., `:courseId`, `:unitId`, `:lessonId`) must be created with `{ mergeParams: true }`.
- Express 5 requires explicit string casting for route params: `req.params['courseId'] as string`. Do not use the shorthand `req.params.courseId` — TypeScript types in Express 5 require bracket notation.
- Route files stay thin: validate middleware, then asyncHandler-wrapped controller call, nothing more.

## Validation

Zod schemas are defined in `src/schemas/` and applied at the route level using the `validate` middleware from `src/middleware/validate.ts`.

### How it works

1. Define a Zod schema in the appropriate schema file.
2. Apply `validate(schema)` as middleware on the route before the controller.
3. On success, `req.body` is replaced with the parsed (typed) data — no further parsing needed in the controller or service.
4. On failure, `validate` calls `next(new ValidationError(...))` with field-level errors from `result.error.flatten().fieldErrors`. The error middleware formats this into the standard error shape with a `details` field.

```ts
// Example route
router.post('/', validate(createCourseSchema), asyncHandler(courseController.create));

// Example schema
export const createCourseSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
});
```

Services receive already-validated data from `req.body` — they should not re-validate.

## Database Conventions

- The Prisma client is a singleton exported from `src/lib/prisma.ts`. Import it as `import prisma from '../lib/prisma.js'`. Never instantiate `PrismaClient` directly in service files.
- All database access belongs in the service layer. Controllers must not import or use `prisma` directly.
- Prisma errors are caught and mapped in `errorHandler.ts`:
  - `P2025` (record not found) → `404 NOT_FOUND`
  - `P2002` (unique constraint violation) → `409 CONFLICT`
- Never let raw Prisma error messages reach the client response.
- Cascade deletes are configured in the schema (e.g., deleting a Course deletes its Units, Lessons, and all associated content). Do not implement manual cascade logic in services.
- Seed command (run from `server/` directory):
  ```bash
  node --env-file=.env --import=tsx/esm prisma/seed.ts
  ```
  Note: `prisma db seed` via the config file is broken — always use the command above directly.

## asyncHandler

All async route handler functions must be wrapped with `asyncHandler()` from `src/utils/asyncHandler.ts`. Express 5 does not automatically catch promise rejections in all cases — the wrapper ensures any thrown error or rejected promise is forwarded to the Express error middleware via `next`.

```ts
import { asyncHandler } from '../utils/asyncHandler.js';

router.get('/:courseId', asyncHandler(courseController.getById));
```

Never define an async route handler without `asyncHandler`. Unhandled rejections will bypass the error middleware and result in unformatted responses or server crashes.

## Progress Scoring

Progress is calculated in `src/services/progress.service.ts` by querying the latest attempt for each assessment.

- **Lesson completion** — A lesson is considered complete when its quiz exists and the most recent `QuizAttempt` for that lesson has `passed: true`.
- **Unit completion** — A unit is complete when every lesson in it is complete (quiz passed) AND the unit's most recent `TestAttempt` has `passed: true`.
- **Course percent complete** — `Math.round((completedLessons / totalLessons) * 100)`. Based on lesson count only, not units.
- **Exam** — `examPassed` is a boolean derived from the most recent `ExamAttempt` on the course's `FinalExam`.
- Only the most recent attempt is considered (ordered by `createdAt desc`, `take: 1`). Previous failed attempts do not block progress if the latest attempt passed.