# Course Masters — Claude Code Planning Prompt

## Task

Architect **Course Masters**, a full-stack web application for self-directed learning. Similar to platforms like Khan Academy, edX, or Udemy, Course Masters differs in that **users drive the entire process**. Users create their own courses, organize them into units and lessons, and populate them with publicly available materials of their choosing — lecture videos, textbook PDFs, code snippets, and more. Users learn from those materials and reinforce understanding through practice problems, flash cards, and other study tools. Mastery is measured progressively: each lesson requires passing a quiz, each unit requires passing a test, and each course requires passing a final exam.

Development is split into three phases: **POC**, **Early State**, and **Mature State**. The goal is to architect the application for the POC while establishing a clear path toward Early State and Mature State functionality.

## Tech Stack

- **Frontend:** React + TypeScript (Vite), React Context | **Styling:** Tailwind CSS
- **Backend:** Express.js + TypeScript | **Database:** PostgreSQL via Prisma
- **Dev Environment:** Docker + Docker Compose (Postgres + Express containers)
- **Testing:** Vitest (frontend), Jest + Supertest (backend)

## Architecture Guidelines

- **Monorepo** with `client/` and `server/` directories — extract services only if needed in Mature State
- `docker-compose.yml` at root with Postgres and Express containers; Vite dev server runs on host
- RESTful API conventions; stateless design so auth can layer in without refactoring
- Prisma for all DB interactions — no raw SQL; include a `User` model from the start even if unused in POC
- TypeScript strict mode — no `any` types; validate env vars at startup via a single `server/src/config.ts` module
- Frontend organized by feature (`features/courses/`, `features/lessons/`); scoped React Context — no single global store
- Business logic lives in the backend; frontend is presentational + UI state

## Environment Config

```env
# .env.example (committed) — .env is gitignored
POSTGRES_USER=coursemasters | POSTGRES_PASSWORD=changeme | POSTGRES_DB=coursemasters
DATABASE_URL=postgresql://coursemasters:changeme@localhost:5432/coursemasters
SERVER_PORT=3001 | NODE_ENV=development
VITE_API_URL=http://localhost:3001/api
# Early State: JWT_SECRET, JWT_EXPIRY | Mature State: OPENAI_API_KEY
```

- Server fails fast on missing required vars. Only `VITE_`-prefixed vars are exposed to the client.

## Error Handling

**Backend** — All errors return `{ error: { code, message, details? } }`. Use centralized Express error middleware with typed error classes (`AppError`, `NotFoundError`, `ValidationError`). Catch Prisma errors (P2025, P2002) and map to standard shape. Validate request bodies with Zod.

**Frontend** — Shared API client (`client/src/api/client.ts`) wraps fetch and parses errors into the standard shape. Toast/notification for transient errors; inline states for form errors. Never expose raw errors or stack traces.

## Prisma Schema (key models — all use UUID PKs, cascade deletes on parent)

```
User          → id, email (unique), name, timestamps
Course        → id, title, description?, authorId (FK→User), timestamps
Unit          → id, title, order, courseId (FK→Course)
Lesson        → id, title, order, unitId (FK→Unit)
Note          → id, content, order, lessonId (FK→Lesson)
FlashCard     → id, front, back, order, lessonId (FK→Lesson)
PracticeProblem → id, question, answer, order, lessonId (FK→Lesson)
Quiz          → id, lessonId (unique FK→Lesson)         // 1:1 with Lesson
QuizQuestion  → id, question, options[], correctIndex, order, quizId (FK→Quiz)
QuizAttempt   → id, score, passed, userId (FK→User), quizId (FK→Quiz), timestamp
Test          → id, unitId (unique FK→Unit)              // 1:1 with Unit
TestQuestion  → id, question, options[], correctIndex, order, testId (FK→Test)
TestAttempt   → id, score, passed, userId (FK→User), testId (FK→Test), timestamp
FinalExam     → id, courseId (unique FK→Course)           // 1:1 with Course
FinalExamQuestion → id, question, options[], correctIndex, order, examId (FK→FinalExam)
ExamAttempt   → id, score, passed, userId (FK→User), examId (FK→FinalExam), timestamp
Enrollment    → id, userId (FK→User), courseId (FK→Course), timestamp  // Early State, @@unique([userId, courseId])
```

## API Routes (all prefixed `/api`)

**Courses:** `GET|POST /courses` · `GET|PUT|DELETE /courses/:courseId`
**Units:** `GET|POST /courses/:courseId/units` · `GET|PUT|DELETE /courses/:courseId/units/:unitId`
**Lessons:** `GET|POST /units/:unitId/lessons` · `GET|PUT|DELETE /units/:unitId/lessons/:lessonId`
**Notes:** `POST /lessons/:lessonId/notes` · `PUT|DELETE /notes/:noteId`
**FlashCards:** `POST /lessons/:lessonId/flashcards` · `PUT|DELETE /flashcards/:id`
**Practice Problems:** `POST /lessons/:lessonId/practice-problems` · `PUT|DELETE /practice-problems/:id`
**Quizzes:** `GET|POST /lessons/:lessonId/quiz` · `POST /quizzes/:quizId/attempts`
**Tests:** `GET|POST /units/:unitId/test` · `POST /tests/:testId/attempts`
**Final Exams:** `GET|POST /courses/:courseId/final-exam` · `POST /exams/:examId/attempts`
**Progress:** `GET /courses/:courseId/progress` · `GET /courses/:courseId/units/:unitId/progress`

## Testing Strategy

**Backend:** API integration tests against a real test DB are the priority. Cover all CRUD + assessment scoring. Unit test business logic helpers (e.g., progress calculation). Seed/teardown via Prisma hooks.
**Frontend:** Component tests for forms, quiz UI, flash cards (React Testing Library). Context/state tests for data flow. Mock API at fetch layer.
**Skip in POC:** E2E tests, snapshot tests. **Add in Early State:** Playwright/Cypress for auth + enrollment flows.

---

## POC

No auth — but schema and API designed for it. Core functionality:

- **CRUD:** Courses, units, lessons, notes, flash cards, practice problems
- **Assessments:** Quiz per lesson, test per unit, final exam per course (multiple-choice via options[] + correctIndex)
- **Progress:** Track completion at lesson/unit/course level based on assessment results; display metrics

## Early State

- **Auth:** Registration, login, session management (JWT); scope all data to authenticated users
- **Collaboration:** Invite users to courses; view enrolled users
- **Rich Content:** Embed YouTube videos; upload + render documents in-browser (with size limits); math notation (KaTeX/MathJax)
- **Tools:** Freehand drawing canvas / pen tool

## Mature State

- **AI:** Generate practice problems, quizzes, tests, and flash cards from uploaded materials (PDFs, textbooks)
- **Document Processing:** Extract and format text from uploaded documents (PDF, DOCX)
- **Analytics:** Per-user performance metrics; weak area identification and review suggestions
- **Community:** Browse/search public courses; rate and review; fork/clone courses
