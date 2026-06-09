# CLAUDE.md

## What Is Course Masters

Course Masters is a self-directed learning platform. Teachers create courses (units → lessons → resources + tools + assessments). Students enroll, consume content, take quizzes and exams, and track progress through a completion system.

---

## Monorepo Structure

```
course-masters/
├── client/          # React SPA (Vite, port 5000)
├── server/          # Express REST API (port 5002)
├── package.json     # npm workspaces root — scripts run both packages
├── tsconfig.base.json  # Shared TypeScript base (extended by each package)
└── .env.example     # Copy to server/.env — Prisma reads directly from there
```

npm workspaces — `npm install` at root installs all dependencies. Scripts in root `package.json` use `concurrently` to run both packages together.

**For package-specific conventions, always read:**
- `client/CLAUDE.md` — React, routing, components, Tailwind, data fetching, auth client
- `server/CLAUDE.md` — Express, Prisma, middleware stack, error handling, validation

---

## Key Commands (run from repo root)

| Command | Description |
|---|---|
| `npm run dev` | Start client + server concurrently |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Prisma Studio |

---

## Environment Setup

Copy `.env.example` → `server/.env`. Prisma and the server read exclusively from `server/.env`.

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `SERVER_PORT` | no | Default: 5002 |
| `NODE_ENV` | no | Default: development |
| `BETTER_AUTH_SECRET` | yes | Minimum 32 characters |
| `CLIENT_URL` | no | Default: http://localhost:5000 (CORS origin) |
| `LOG_LEVEL` | no | Default: info |

Server refuses to start with missing required vars (Zod-validated in `server/src/config.ts`).

---

## Tech Stack Summary

| Layer | Stack |
|---|---|
| Client | React 19, React Router 7, TypeScript 5, Tailwind CSS 4, Vite 6, better-auth 1.5, Tiptap 3, KaTeX |
| Server | Node.js + tsx, Express 5, TypeScript 5, Prisma 6 + PostgreSQL, better-auth 1.5, Zod 3, pino |
| Auth | better-auth (email/password, session cookies, Prisma adapter, admin plugin) |
| Database | PostgreSQL — all IDs are UUIDs |

---

## Authentication Flow (end-to-end)

1. **Client** calls `authClient.signIn.email(...)` — this hits `POST /api/auth/sign-in/email` directly (not through `apiClient`).
2. **Server** — better-auth handles `/api/auth/*` routes before `express.json()`. It validates credentials, creates a session in the DB (`Session` model), and sets a `Set-Cookie` header.
3. **Client** — `AuthContext` stores the user object in React state. All subsequent `apiClient` calls include `credentials: 'include'` so the session cookie is sent automatically.
4. **Server** — `authenticate()` middleware validates the cookie on every protected route, injecting `req.user` and `req.session`. Returns `401` if session is missing or expired.
5. **Client** — on `401`, `apiClient` fires `window.CustomEvent('auth:unauthorized')`, which `AuthContext` catches to clear user state and trigger re-login.

Roles: `student` (default), `teacher`, `admin`. Enforced server-side by `authorize()` middleware.

---

## Database Model Hierarchy

```
User
 └── Course (authorId)
      └── Unit (courseId)
           └── Lesson (unitId)
                ├── LessonResource      (type: note | video | lecture)
                ├── LessonTool          (type: flash_card | practice_problem | vocab)
                ├── StudentNote         (unique per userId + lessonId)
                ├── Assignment          (type: note | video | reading | vocab | practice_problem)
                ├── LessonChecklistItem (per userId + lessonId)
                ├── ActivityBookmark    (marks assignments for later review)
                ├── Assessment          (type: lesson_quiz)
                └── LessonCompletion
      ├── Assessment (type: unit_quiz)
      └── UnitCompletion
 └── Assessment (type: course_exam)
```

Auth tables (managed by better-auth): `User`, `Session`, `Account`, `Verification`.

**Cascade deletes**: soft deletes on `Course`, `Unit`, `Lesson`, `Assessment` (via `deletedAt DateTime?`). Hard deletes elsewhere. Cascade helpers in `server/src/utils/softDelete.ts` walk the hierarchy using `$transaction`.

**Content as JSON**: `LessonResource.content`, `LessonTool.content`, and `AssessmentQuestion.content` are freeform `Json` columns. Shape is determined by the `type` enum value — see server/CLAUDE.md for grading logic per question type.

**Enums**: `UserRole` (student/teacher/admin), `AssessmentType` (lesson_quiz/unit_quiz/course_exam), `QuestionType` (multiple_choice/true_false/matching/fill_in_blank), `ResourceType` (note/video/lecture), `ToolType` (flash_card/practice_problem/vocab), `AssignmentType` (note/video/reading/vocab/practice_problem).

Key completion models: `LessonResourceCompletion`, `LessonToolCompletion`, `AssignmentCompletion` (all track per userId).

---

## API Routes (prefix: `/api`)

All routes require authentication except `GET /health`. Route params use UUID strings.

```
Health:        GET  /health

Courses:       GET  /courses
               POST /courses
               GET  /courses/:courseId
               PUT  /courses/:courseId
               DELETE /courses/:courseId

Units:         GET  /courses/:courseId/units
               POST /courses/:courseId/units
               GET  /courses/:courseId/units/:unitId
               PUT  /courses/:courseId/units/:unitId
               DELETE /courses/:courseId/units/:unitId

Lessons:       GET  /units/:unitId/lessons
               POST /units/:unitId/lessons
               GET  /units/:unitId/lessons/:lessonId
               PUT  /units/:unitId/lessons/:lessonId
               DELETE /units/:unitId/lessons/:lessonId

Resources:     GET  /lessons/:lessonId/resources   (?type=note|video|lecture)
               POST /lessons/:lessonId/resources
               PUT  /resources/:resourceId
               DELETE /resources/:resourceId

Tools:         GET  /lessons/:lessonId/tools        (?type=flash_card|practice_problem|vocab)
               POST /lessons/:lessonId/tools
               PUT  /tools/:toolId
               DELETE /tools/:toolId

Student Notes: GET  /lessons/:lessonId/student-notes
               POST /lessons/:lessonId/student-notes
               DELETE /student-notes/:studentNoteId

Assessments:   GET  /lessons/:lessonId/assessment   (lesson_quiz)
               POST /lessons/:lessonId/assessment
               GET  /units/:unitId/assessment        (unit_quiz)
               POST /units/:unitId/assessment
               GET  /courses/:courseId/assessment    (course_exam)
               POST /courses/:courseId/assessment
               PUT  /assessments/:assessmentId
               GET  /assessments/:assessmentId/attempts
               POST /assessments/:assessmentId/attempts

Completions:   POST   /lessons/:lessonId/complete
               DELETE /lessons/:lessonId/complete
               POST   /units/:unitId/complete
               DELETE /units/:unitId/complete

Assignments:   GET  /lessons/:lessonId/assignments
               POST /lessons/:lessonId/assignments
               PUT  /assignments/:assignmentId
               DELETE /assignments/:assignmentId

Checklist:     GET  /lessons/:lessonId/checklist
               POST /lessons/:lessonId/checklist
               DELETE /checklist-items/:itemId

Res. Complete: GET  /lessons/:lessonId/completions
               POST /lessons/:lessonId/completions

Progress:      GET  /courses/:courseId/progress
               GET  /courses/:courseId/units/:unitId/progress

YouTube:       GET  /youtube/title

Users:         DELETE /users/:userId

Auth:          ALL  /auth/*   (handled by better-auth)
```

---

## Client Routes

| Path | Component | Auth |
|---|---|---|
| `/` | HomePage → LandingPage (guest) or CourseListPage (auth) | none |
| `/login` | LoginPage | none |
| `/register` | RegisterPage | none |
| `/courses/:courseId` | CourseDetailPage | required |
| `/courses/:courseId/units/:unitId/lessons/:lessonId` | LessonDetailPage | required |
| `/profile` | ProfilePage | required |
| `/admin/users` | AdminUsersPage | required + admin role |

---

## Authorization Model

| Role | Can do |
|---|---|
| `student` | Read published content, submit assessment attempts, manage own notes/completions |
| `teacher` | Everything students can, plus create/edit/delete courses they own and their content |
| `admin` | Full access — bypasses ownership checks, manages all users |

Ownership is enforced server-side via `requireCourseOwnership()` middleware, which walks the foreign key chain to verify a resource belongs to the requesting teacher's course. Admins bypass this check entirely.

---

## Progress and Completion Model

- **Resource completion**: tracked per `(userId, resourceId)` — students mark individual resources done.
- **Lesson completion**: `POST /lessons/:lessonId/complete` — requires the lesson's `lesson_quiz` attempt to have `passed === true` (if a quiz exists).
- **Unit completion**: `POST /units/:unitId/complete`.
- **Course progress %**: `Math.round((completedLessons / totalLessons) * 90)`, capped at 100 if `course_exam` passed. **Unit progress %**: `Math.round((completedLessons / totalLessons) * 100)`. Pass threshold is 80%.
- Only the most recent assessment attempt counts for pass/fail status.

---

## Response Shape

All successful responses are wrapped by the envelope middleware:
```json
{ "data": <payload> }
```

All errors follow:
```json
{ "error": { "code": "SNAKE_CASE_CODE", "message": "Human readable", "details": {} } }
```

204 responses send no body. The client's `apiClient` unwraps the `data` envelope automatically.

---

## Cross-Cutting Gotchas

- **Progress routes use absolute paths**: `GET /courses/:courseId/units/:unitId/progress` must be mounted on the root router directly — nesting it under a `/courses` sub-router causes the `:unitId` param to be lost.
- **Soft delete + findFirst**: models with `deletedAt` must use `findFirst` (not `findUnique`) so `{ id, deletedAt: null }` can be combined.
- **better-auth before express.json()**: the auth handler does its own body parsing — mounting it after `express.json()` corrupts requests.
- **`.js` extensions everywhere**: both packages use Node ESM / TypeScript `moduleResolution: bundler`. All local imports must end in `.js`.
- **Two fetch clients on the client**: `authClient` (better-auth) handles `/api/auth/*`; `apiClient` handles everything else. Never mix them.
- **Order matters in LessonResource / LessonTool / Assignment**: all have an `order` field — always sort before rendering or passing to the client.

---

## User Instructions
<!-- Add your personal preferences and workflow notes here -->
