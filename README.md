# Course Masters

A self-directed learning platform where you build and study your own courses. Organize content into units and lessons, add notes, flashcards, and practice problems, then test your knowledge with quizzes, unit tests, and final exams. Track progress across your entire curriculum.

> **Note:** Authentication is not implemented in the current proof-of-concept. All requests are associated with a hardcoded default user (the first user in the database). The data model and service layer are designed to support a JWT-based auth layer in the future.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | npm workspaces |
| Client | React 19, Vite 6, TypeScript, Tailwind CSS v4 |
| Routing | React Router v7 |
| Server | Express 5, TypeScript (ESM), tsx |
| Database | PostgreSQL, Prisma 6 |
| Validation | Zod |

---

## Prerequisites

- **Node.js** v20 or later
- **PostgreSQL** running locally (or accessible via a connection string)

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd course-masters
```

### 2. Install dependencies

Run this from the repository root. npm workspaces will install dependencies for both the `client` and `server` packages in a single step.

```bash
npm install
```

### 3. Configure environment variables

The server reads its configuration from `server/.env`. Copy the example file and update the values to match your local PostgreSQL instance.

```bash
cp .env.example server/.env
```

`.env.example`:

```
DATABASE_URL=postgresql://coursemasters:changeme@localhost:5432/coursemasters
SERVER_PORT=3001
NODE_ENV=development
```

### 4. Run database migrations

```bash
npm run db:migrate
```

This runs `prisma migrate dev` inside the `server` workspace and applies all pending migrations to your database.

### 5. Seed the database

```bash
npm run db:seed
```

This creates the default user and any initial seed data required by the application.

### 6. Start the development servers

```bash
npm run dev
```

This starts both the Vite client dev server and the Express API server concurrently.

| Service | URL |
|---|---|
| Client | http://localhost:5173 |
| API | http://localhost:3001 |

The Vite dev server proxies all `/api` requests to `http://localhost:3001`, so no CORS configuration is needed during development.

---

## Available Scripts

All scripts are run from the repository root.

| Script | Description |
|---|---|
| `npm run dev` | Start the client and server concurrently |
| `npm run db:migrate` | Run Prisma migrations (`prisma migrate dev`) |
| `npm run db:seed` | Seed the database with initial data |
| `npm run db:studio` | Open Prisma Studio to inspect the database |

---

## Project Structure

```
course-masters/
  client/               # React + Vite frontend (@course-masters/client)
    src/
      api/              # Typed fetch wrappers for the API
      features/         # Feature-based component organization
      ...
  server/               # Express API backend (@course-masters/server)
    prisma/
      schema.prisma     # Database schema (16 models)
      seed.ts           # Database seed script
      migrations/       # Prisma migration history
    src/
      errors/           # Typed error classes (AppError, NotFoundError, etc.)
      middleware/       # Express middleware (error handler, etc.)
      ...               # Service -> Controller -> Route modules per feature
  package.json          # Root workspace manifest and shared scripts
  .env.example          # Environment variable template
```

### Data Model Overview

The schema defines 16 models organized around the core learning hierarchy:

- **User** — owns courses and records assessment attempts
- **Course** > **Unit** > **Lesson** — the primary content hierarchy
- **Note**, **FlashCard**, **PracticeProblem** — lesson-level study materials
- **Quiz** / **QuizAttempt** — per-lesson assessments
- **Test** / **TestAttempt** — per-unit assessments
- **FinalExam** / **ExamAttempt** — per-course assessments

All cascade deletes are enforced at the database level via Prisma relations.
