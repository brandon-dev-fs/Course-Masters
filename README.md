# Course Masters

A self-directed learning platform where you build and study your own courses. Organize content into units and lessons, add rich text notes, flashcards, vocabulary terms, practice problems, and YouTube videos, then test your knowledge with quizzes, unit tests, and final exams. Track progress across your entire curriculum.

---

## Tech Stack

| Layer      | Technology                                      |
| ---------- | ----------------------------------------------- |
| Monorepo   | npm workspaces                                  |
| Client     | React 19, Vite 6, TypeScript, Tailwind CSS v4   |
| Routing    | React Router v7                                 |
| Rich Text  | Tiptap 3 with KaTeX (LaTeX math)                |
| Auth       | better-auth (email/password, role-based access) |
| Server     | Express 5, TypeScript (ESM), tsx                |
| Database   | PostgreSQL, Prisma 6                            |
| Validation | Zod                                             |

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
SERVER_PORT=5002
NODE_ENV=development
BETTER_AUTH_SECRET=<random string, minimum 32 characters>
CLIENT_URL=http://localhost:5000
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

| Service | URL                   |
| ------- | --------------------- |
| Client  | http://localhost:5000 |
| API     | http://localhost:5002 |

The Vite dev server proxies all `/api` requests to `http://localhost:5002`, so no CORS configuration is needed during development.

---

## Running with Docker

Docker Compose runs the full stack — client, server, and PostgreSQL — in containers with a single command. No local Node.js or PostgreSQL installation required.

**Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose).

### 1. Create your secrets file

Docker Compose reads a `.env` file at the repository root for variable substitution. Copy the example and fill in the two required values:

```bash
cp docker.env.example .env
```

Then open `.env` and set:

```
POSTGRES_PASSWORD=<any password>
BETTER_AUTH_SECRET=<random string, minimum 32 characters>
```

This file is gitignored and never committed.

### 2. Build and start

```bash
docker-compose up --build
```

This builds the client and server images, starts PostgreSQL, runs database migrations automatically, and brings up all three services. The first build takes a few minutes; subsequent starts are faster.

| Service  | URL                    |
| -------- | ---------------------- |
| App      | http://localhost:5000  |
| API      | http://localhost:5002  |
| Database | localhost:5432         |

### 3. Seed the database (optional)

To populate the database with sample data on startup, set `SEED_DB: 'true'` on the `server` service in `docker-compose.yml`, then restart:

```bash
docker-compose up --build
```

Reset `SEED_DB` back to `'false'` after the first run to avoid re-seeding on every restart.

### Rebuilding after code changes

Docker images are not rebuilt automatically when source files change. Run `docker-compose up --build` again after any changes to rebuild:

```bash
docker-compose up --build
```

### Stopping

```bash
docker-compose down          # Stop containers — database data is preserved
docker-compose down -v       # Stop containers AND delete the database volume
```

The PostgreSQL data is stored in a named Docker volume (`postgres_data`) and persists across normal `docker-compose down` / `up` cycles. Only `down -v` destroys the data.

### Direct database access

The PostgreSQL container exposes port `5432` to the host. Connect with any PostgreSQL client using:

```
Host:     localhost
Port:     5432
User:     coursemasters
Password: <value of POSTGRES_PASSWORD from your .env>
Database: coursemasters
```

To use Prisma Studio against the Docker database, update `server/.env` to point `DATABASE_URL` at `localhost:5432` and run `npm run db:studio`.

---

## Available Scripts

All scripts are run from the repository root.

| Script               | Description                                  |
| -------------------- | -------------------------------------------- |
| `npm run dev`        | Start the client and server concurrently     |
| `npm run db:migrate` | Run Prisma migrations (`prisma migrate dev`) |
| `npm run db:seed`    | Seed the database with initial data          |
| `npm run db:studio`  | Open Prisma Studio to inspect the database   |

---

## Project Structure

```
course-masters/
  client/               # React + Vite frontend (@course-masters/client)
    src/
      api/              # Typed fetch wrappers for the API
      components/       # Shared UI primitives (Button, Modal, RichTextEditor, etc.)
      context/          # ThemeContext, AuthContext
      features/         # Feature-based component organization (17 feature dirs)
      hooks/            # Reusable hooks (useResourceList, useAssessment, etc.)
  server/               # Express API backend (@course-masters/server)
    prisma/
      schema.prisma     # Database schema (15 models)
      seed.ts           # Database seed script
    src/
      routes/           # Route definitions
      controllers/      # Request handling
      services/         # Business logic and Prisma queries
      schemas/          # Zod validation schemas
      middleware/       # authenticate, authorize, validate, errorHandler
      errors/           # Typed error classes (AppError, NotFoundError, etc.)
      lib/              # Prisma singleton, better-auth setup
  package.json          # Root workspace manifest and shared scripts
  .env.example          # Environment variable template
```

### Data Model Overview

The schema defines 15 models organized around the core learning hierarchy:

- **User**, **Session**, **Account**, **Verification** — authentication and identity
- **Course** > **Unit** > **Lesson** — the primary content hierarchy
- **LessonResource** — rich content attached to a lesson (types: `note`, `lecture`, `video`); content stored as Json with type-specific shape (e.g. `{body}` for notes/lectures, `{url}` for videos)
- **LessonTool** — interactive study tools attached to a lesson (types: `flash_card`, `practice_problem`, `vocab`); content stored as Json (e.g. `{front, back}`, `{question, options, correctIndex}`, `{term, definition}`)
- **StudentNote** — plain text per-student notes (unique per user + lesson)
- **Assessment** — unified assessment model with type `lesson_quiz`, `unit_quiz`, or `course_exam`
- **AssessmentQuestion** — question with `question` text, `type` enum, and `content` Json for answer data
- **AssessmentAttempt** — records score and pass/fail per user per assessment
- **LessonCompletion**, **UnitCompletion** — completion tracking

All cascade deletes are enforced at the database level via Prisma relations.

---

## Authentication & Roles

Course Masters uses [better-auth](https://www.better-auth.com/) for session-based authentication with three roles:

| Role        | Capabilities                                                                |
| ----------- | --------------------------------------------------------------------------- |
| **student** | Browse courses, take assessments, create personal notes                     |
| **teacher** | All student capabilities + create/edit courses, units, lessons, and content |
| **admin**   | All teacher capabilities + user management                                  |
