# Course Masters — Server

REST API backend for the Course Masters self-directed learning application.

## Overview

Express 5 + TypeScript REST API serving the Course Masters client. Built as an ESM module, it uses Prisma 6 for database access against PostgreSQL, Zod for request validation, and tsx for zero-config TypeScript execution in development. All routes are mounted under `/api`.

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Express | 5 | HTTP framework |
| TypeScript | 5 | Language (ESM output) |
| Prisma | 6 | ORM and migrations |
| PostgreSQL | — | Primary database |
| Zod | 3 | Request body validation |
| tsx | 4 | TypeScript execution (dev) |
| cors | — | Cross-origin request handling |

## Architecture

The server follows a three-layer pattern:

```
Route → Controller → Service
```

- **Routes** — Define endpoints, apply validation middleware, and delegate to controllers.
- **Controllers** — Handle HTTP concerns: parse request data, call services, send responses.
- **Services** — Contain all business logic and Prisma database calls. No HTTP objects here.

### Error Handling

A centralized `errorHandler` middleware catches all errors thrown by route handlers. Errors are normalized to a consistent JSON shape before being sent to the client:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Course not found",
    "details": {}
  }
}
```

Typed error classes (`AppError`, `NotFoundError`, `ValidationError`) are thrown from controllers and services. Prisma-specific errors are mapped in the middleware — Prisma internals are never leaked to the client.

## Project Structure

```
server/
  prisma/
    schema.prisma       # Database schema (16 models)
    seed.ts             # Database seed script
    migrations/         # Prisma migration history
  src/
    index.ts            # Entry point — starts HTTP server on port 3001
    app.ts              # Express app setup (middleware, router, error handler)
    routes/             # Route definitions, one file per resource
    controllers/        # HTTP request/response handling
    services/           # Business logic and database queries
    schemas/            # Zod validation schemas
    middleware/         # Express middleware (errorHandler, etc.)
    errors/             # Typed error classes (AppError, NotFoundError, ValidationError)
```

## Database

PostgreSQL via Prisma 6. The schema defines 16 models:

- **Users & Courses**: `User`, `Course`, `Unit`, `Lesson`
- **Lesson Content**: `Note`, `FlashCard`, `PracticeProblem`
- **Assessments**: `Quiz`, `QuizQuestion`, `QuizAttempt`, `Test`, `TestQuestion`, `TestAttempt`, `FinalExam`, `FinalExamQuestion`, `ExamAttempt`

All relationships use cascade deletes — removing a course removes all descendant records.

## API Routes

All routes are prefixed with `/api`.

### Health

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |

### Courses

| Method | Path | Description |
|---|---|---|
| GET | `/courses` | List all courses |
| POST | `/courses` | Create a course |
| GET | `/courses/:courseId` | Get a course |
| PUT | `/courses/:courseId` | Update a course |
| DELETE | `/courses/:courseId` | Delete a course |

### Units

| Method | Path | Description |
|---|---|---|
| GET | `/courses/:courseId/units` | List units for a course |
| POST | `/courses/:courseId/units` | Create a unit |
| GET | `/courses/:courseId/units/:unitId` | Get a unit |
| PUT | `/courses/:courseId/units/:unitId` | Update a unit |
| DELETE | `/courses/:courseId/units/:unitId` | Delete a unit |

### Lessons

| Method | Path | Description |
|---|---|---|
| GET | `/units/:unitId/lessons` | List lessons for a unit |
| POST | `/units/:unitId/lessons` | Create a lesson |
| GET | `/units/:unitId/lessons/:lessonId` | Get a lesson |
| PUT | `/units/:unitId/lessons/:lessonId` | Update a lesson |
| DELETE | `/units/:unitId/lessons/:lessonId` | Delete a lesson |

### Notes

| Method | Path | Description |
|---|---|---|
| GET | `/lessons/:lessonId/notes` | List notes for a lesson |
| POST | `/lessons/:lessonId/notes` | Create a note |
| PUT | `/notes/:id` | Update a note |
| DELETE | `/notes/:id` | Delete a note |

### Flashcards

| Method | Path | Description |
|---|---|---|
| GET | `/lessons/:lessonId/flashcards` | List flashcards for a lesson |
| POST | `/lessons/:lessonId/flashcards` | Create a flashcard |
| PUT | `/flashcards/:id` | Update a flashcard |
| DELETE | `/flashcards/:id` | Delete a flashcard |

### Practice Problems

| Method | Path | Description |
|---|---|---|
| GET | `/lessons/:lessonId/practice-problems` | List practice problems for a lesson |
| POST | `/lessons/:lessonId/practice-problems` | Create a practice problem |
| PUT | `/practice-problems/:id` | Update a practice problem |
| DELETE | `/practice-problems/:id` | Delete a practice problem |

### Quizzes

| Method | Path | Description |
|---|---|---|
| GET | `/lessons/:lessonId/quiz` | Get quiz for a lesson |
| POST | `/lessons/:lessonId/quiz` | Create quiz for a lesson |
| POST | `/quizzes/:quizId/attempts` | Submit a quiz attempt |

### Tests

| Method | Path | Description |
|---|---|---|
| GET | `/units/:unitId/test` | Get test for a unit |
| POST | `/units/:unitId/test` | Create test for a unit |
| POST | `/tests/:testId/attempts` | Submit a test attempt |

### Final Exams

| Method | Path | Description |
|---|---|---|
| GET | `/courses/:courseId/final-exam` | Get final exam for a course |
| POST | `/courses/:courseId/final-exam` | Create final exam for a course |
| POST | `/exams/:examId/attempts` | Submit an exam attempt |

### Progress

| Method | Path | Description |
|---|---|---|
| GET | `/courses/:courseId/progress` | Get progress summary for a course |
| GET | `/courses/:courseId/units/:unitId/progress` | Get progress summary for a unit |

## Environment Variables

Create a `.env` file in the `server/` directory (not the project root — Prisma does not support `--env-file`):

```
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>
```

This file must be present for both the dev server and all Prisma CLI commands to function.

## Scripts

Run these from the `server/` directory, or from the project root using `npm run <script> -w server`.

| Script | Command | Description |
|---|---|---|
| `dev` | `node --env-file=.env --watch --import=tsx/esm src/index.ts` | Start dev server with watch mode |
| `build` | `tsc` | Compile TypeScript to JavaScript |
| `db:migrate` | `prisma migrate dev` | Run pending migrations |
| `db:seed` | `node --env-file=.env --import=tsx/esm prisma/seed.ts` | Seed the database |
| `db:studio` | `prisma studio` | Open Prisma Studio GUI |

The dev server starts on **port 3001**.

## Authentication

There is no authentication in the current proof-of-concept. All requests resolve to the first user found in the database (the default seeded user). The architecture is stateless and designed to accept a JWT middleware layer in a future iteration.
