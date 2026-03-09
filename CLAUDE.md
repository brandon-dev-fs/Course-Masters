# CLAUDE.md

## Overview
Course Masters is a self-directed learning app (monorepo, npm workspaces):
- `client` — React SPA, Vite dev server on port 5000, proxies `/api` to port 5002
- `server` — Express REST API on port 5002

## Tech Stack
- **Client**: React 19, react-router-dom 7, Tailwind CSS 4, Vite 6, TypeScript 5
- **Server**: Express 5, Prisma 6 + PostgreSQL, Zod 3, tsx, TypeScript 5

## Key Commands (run from repo root)
| Command | Description |
|---|---|
| `npm run dev` | Start client + server concurrently |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | `node --env-file=.env --import=tsx/esm prisma/seed.ts` |
| `npm run db:studio` | Prisma Studio UI |

## Environment
Copy `.env.example` → `server/.env` (Prisma reads from here directly):
```
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/<dbname>
SERVER_PORT=5002
NODE_ENV=development
```

## Database Models (16 total)
Core hierarchy (cascade deletes at every level): `User` → `Course` → `Unit` → `Lesson`
- Lesson content: `Note`, `FlashCard`, `PracticeProblem`
- Assessments: `Quiz`/`QuizQuestion`/`QuizAttempt`, `Test`/`TestQuestion`/`TestAttempt`, `FinalExam`/`FinalExamQuestion`/`ExamAttempt`
- All IDs are UUIDs. Questions: multiple-choice, options as JSON array, `correctIndex` as Int.

## Authentication
No auth in POC — server resolves active user as the first DB record. JWT-ready (`authorId`/`userId` FKs exist on all relevant models).

## API Routes (prefix: `/api`)
```
GET/POST          /courses
GET/PUT/DELETE    /courses/:courseId
GET/POST          /courses/:courseId/units
GET/PUT/DELETE    /courses/:courseId/units/:unitId
GET/POST          /units/:unitId/lessons
GET/PUT/DELETE    /units/:unitId/lessons/:lessonId
GET/POST          /lessons/:lessonId/notes
PUT/DELETE        /notes/:id
GET/POST          /lessons/:lessonId/flashcards
PUT/DELETE        /flashcards/:id
GET/POST          /lessons/:lessonId/practice-problems
PUT/DELETE        /practice-problems/:id
GET/POST          /lessons/:lessonId/quiz
POST              /quizzes/:quizId/attempts
GET/POST          /units/:unitId/test
POST              /tests/:testId/attempts
GET/POST          /courses/:courseId/final-exam
POST              /exams/:examId/attempts
GET               /courses/:courseId/progress
GET               /courses/:courseId/units/:unitId/progress
```

## Client Routes
| Path | Component |
|---|---|
| `/` | CourseListPage |
| `/courses/:courseId` | CourseDetailPage |
| `/courses/:courseId/units/:unitId` | UnitDetailPage |
| `/courses/:courseId/units/:unitId/lessons/:lessonId` | LessonDetailPage |

## Known Gotchas
**Progress routes** must be mounted at their full absolute paths in the root router — not nested under a `/courses` sub-router prefix (the nested `:unitId` param gets lost otherwise).

See `server/CLAUDE.md` for Express 5 param casting, `mergeParams`, and Prisma seed gotchas.

---

## User Instructions
<!-- Add your personal preferences and workflow notes here -->
