# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

Course Masters is a self-directed learning application. Users create courses, organize them into units, and break units down into lessons. Each lesson holds notes, flash cards, and practice problems. Progress is assessed at three levels: a quiz at the end of each lesson, a test at the end of each unit, and a final exam at the end of each course. A progress API aggregates completion data across all levels.

The project is a monorepo using npm workspaces with two workspaces:
- `client` — React SPA served by Vite on port 5173
- `server` — Express REST API running on port 3001

The Vite dev server proxies `/api` requests to `http://localhost:3001`, so the client never needs to know the server port.

---

## Tech Stack

### Client (`client/`)
- React 19
- react-router-dom 7
- Tailwind CSS 4 (via `@tailwindcss/vite` plugin)
- Vite 6
- TypeScript 5

### Server (`server/`)
- Express 5
- Prisma 6 (`@prisma/client`) with `prisma-client-js` generator
- PostgreSQL (datasource)
- Zod 3 (request validation)
- tsx (ESM dev runner via Node `--import=tsx/esm`)
- TypeScript 5

### Root
- concurrently 9 (runs both workspaces together)

---

## Monorepo Structure

```
course-masters/
  package.json          # Root — npm workspaces, shared dev scripts
  .env.example          # Template for environment variables
  client/
    package.json
    vite.config.ts
    src/
      App.tsx           # Route definitions (react-router-dom)
      context/          # ThemeContext (class-based dark mode)
      components/       # Shared UI (Layout, etc.)
      features/         # Feature-based organization
        courses/
        units/
        lessons/
      api/              # API client wrappers
  server/
    package.json
    .env                # Local only — must contain DATABASE_URL (not committed)
    prisma/
      schema.prisma     # 16-model schema
      seed.ts           # Database seeder
    src/
      index.ts          # Server entry point
      app.ts            # Express app setup (cors, json, routes, error handler)
      routes/           # index.ts mounts all sub-routers
      middleware/       # errorHandler.ts, etc.
      errors/           # AppError, NotFoundError, ValidationError
      services/         # Business logic (called by controllers)
      controllers/      # Request handlers
```

---

## Key Commands

All of the following are run from the **repository root** unless noted.

| Command | Description |
|---|---|
| `npm run dev` | Start client (port 5173) and server (port 3001) concurrently |
| `npm run db:migrate` | Run Prisma migrations (`prisma migrate dev`) |
| `npm run db:seed` | Seed the database using `node --env-file=.env --import=tsx/esm prisma/seed.ts` |
| `npm run db:studio` | Open Prisma Studio UI |

The `db:*` commands delegate to the `server` workspace. To run them directly from `server/`, omit the `-w server` delegation and run them as shown in `server/package.json`.

---

## Environment Setup

Copy `.env.example` to `server/.env` and fill in the values:

```
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/<dbname>
SERVER_PORT=3001
NODE_ENV=development
```

The file must live at `server/.env` (not the root). The server dev script loads it with `node --env-file=.env`, and Prisma reads `DATABASE_URL` from that file at migration/generation time.

Do not commit `server/.env`.

---

## Database

PostgreSQL via Prisma 6. All IDs are UUIDs. Cascade deletes propagate from parent to child at every level.

### Models (16 total)

**Core hierarchy**
- `User` — owns courses; tracks quiz, test, and exam attempts
- `Course` — belongs to a User; has many Units and one optional FinalExam
- `Unit` — belongs to a Course (ordered); has many Lessons and one optional Test
- `Lesson` — belongs to a Unit (ordered); has many lesson-content records and one optional Quiz

**Lesson content**
- `Note` — ordered text content on a Lesson
- `FlashCard` — front/back card on a Lesson
- `PracticeProblem` — question + answer on a Lesson

**Assessments**
- `Quiz` — one per Lesson; has many QuizQuestions and QuizAttempts
- `QuizQuestion` — multiple-choice (options stored as JSON, correctIndex as Int)
- `QuizAttempt` — score (Float), passed (Boolean), linked to User + Quiz
- `Test` — one per Unit; has many TestQuestions and TestAttempts
- `TestQuestion` — same shape as QuizQuestion
- `TestAttempt` — same shape as QuizAttempt, linked to User + Test
- `FinalExam` — one per Course; has many FinalExamQuestions and ExamAttempts
- `FinalExamQuestion` — same shape as QuizQuestion
- `ExamAttempt` — same shape as QuizAttempt, linked to User + FinalExam

Cascade delete chain: deleting a User removes their Courses; deleting a Course removes its Units and FinalExam; deleting a Unit removes its Lessons and Test; deleting a Lesson removes its Notes, FlashCards, PracticeProblems, and Quiz; deleting a Quiz/Test/FinalExam removes its questions and attempts.

---

## Authentication

There is no authentication in the current POC. The server resolves the active user by selecting the first User record in the database. The system is designed to accept a standard JWT middleware layer later — the `authorId` / `userId` foreign keys are already present on all relevant models.

---

## API Route Map

All routes are prefixed with `/api`.

```
GET    /health

# Courses
GET    /courses
POST   /courses
GET    /courses/:courseId
PUT    /courses/:courseId
DELETE /courses/:courseId

# Units
GET    /courses/:courseId/units
POST   /courses/:courseId/units
GET    /courses/:courseId/units/:unitId
PUT    /courses/:courseId/units/:unitId
DELETE /courses/:courseId/units/:unitId

# Lessons
GET    /units/:unitId/lessons
POST   /units/:unitId/lessons
GET    /units/:unitId/lessons/:lessonId
PUT    /units/:unitId/lessons/:lessonId
DELETE /units/:unitId/lessons/:lessonId

# Lesson content
GET    /lessons/:lessonId/notes
POST   /lessons/:lessonId/notes
PUT    /notes/:id
DELETE /notes/:id

GET    /lessons/:lessonId/flashcards
POST   /lessons/:lessonId/flashcards
PUT    /flashcards/:id
DELETE /flashcards/:id

GET    /lessons/:lessonId/practice-problems
POST   /lessons/:lessonId/practice-problems
PUT    /practice-problems/:id
DELETE /practice-problems/:id

# Assessments
GET    /lessons/:lessonId/quiz
POST   /lessons/:lessonId/quiz
POST   /quizzes/:quizId/attempts

GET    /units/:unitId/test
POST   /units/:unitId/test
POST   /tests/:testId/attempts

GET    /courses/:courseId/final-exam
POST   /courses/:courseId/final-exam
POST   /exams/:examId/attempts

# Progress
GET    /courses/:courseId/progress
GET    /courses/:courseId/units/:unitId/progress
```

---

## Client Routes

Defined in `client/src/App.tsx` using react-router-dom v7:

| Path | Component |
|---|---|
| `/` | CourseListPage |
| `/courses/:courseId` | CourseDetailPage |
| `/courses/:courseId/units/:unitId` | UnitDetailPage |
| `/courses/:courseId/units/:unitId/lessons/:lessonId` | LessonDetailPage |

All routes share a common `Layout` wrapper. Theme (light/dark) is managed by `ThemeContext` using a class on `<html>`, persisted to localStorage.

---

## Known Gotchas

**Prisma 6 does not support `--env-file`.**
Prisma CLI commands (`migrate`, `generate`, `studio`) cannot use the Node `--env-file` flag. They read environment variables from `server/.env` directly via `dotenv` convention. Always ensure `DATABASE_URL` is present in `server/.env`, not just in a root `.env`.

**Do not use `prisma db seed` to run the seeder.**
The `prisma.seed` config key in `server/package.json` points to `tsx prisma/seed.ts` but this path is unreliable through `prisma db seed`. Use the explicit command instead:
```bash
# from server/
node --env-file=.env --import=tsx/esm prisma/seed.ts
```
Or from the root: `npm run db:seed`.

**Express 5 route params require explicit casting.**
Express 5 changed the type of `req.params` entries. Always cast them explicitly:
```ts
const courseId = req.params['courseId'] as string;
```

**All sub-routers must use `mergeParams: true`.**
Sub-routers mounted under parameterized parent paths will not see the parent's params unless created with:
```ts
const router = Router({ mergeParams: true });
```

**Progress routes must be mounted at their full paths.**
The progress routes (`/courses/:courseId/progress` and `/courses/:courseId/units/:unitId/progress`) must be mounted at their full absolute paths in the root router, not as sub-prefixes under a `/courses` sub-router. Mounting them as sub-prefixes causes the nested `:unitId` segment to be lost.
