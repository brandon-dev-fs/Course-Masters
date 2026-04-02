# CLAUDE.md

## Overview
Course Masters is a self-directed learning app (monorepo, npm workspaces):
- `client` — React SPA, Vite dev server on port 5000, proxies `/api` to port 5000
- `server` — Express REST API on port 5002

## Tech Stack
- **Client**: React 19, react-router-dom 7, Tailwind CSS 4, Tiptap 3, KaTeX, better-auth, Vite 6, TypeScript 5
- **Server**: Express 5, Prisma 6 + PostgreSQL, better-auth 1.5, Zod 3, tsx, TypeScript 5

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
BETTER_AUTH_SECRET=<min 32 chars>
CLIENT_URL=http://localhost:5000
```

## Authentication
- **better-auth** with Prisma adapter, email/password login, session-based (cookies)
- Roles: `student`, `teacher`, `admin` — enforced via `authenticate` + `authorize` middleware
- Admin plugin for user management with role-based access control statements
- Rate limiting on auth endpoints (20 reqs / 15 min)
- Client uses `@better-auth/react` hooks; 401 triggers global `auth:unauthorized` event

## Database Models (15 total)
Core hierarchy (cascade deletes at every level): `User` → `Course` → `Unit` → `Lesson`
- Auth: `User`, `Session`, `Account`, `Verification`
- Lesson content: `LessonResource` (type: `note | video | lecture`, content as Json), `LessonTool` (type: `flash_card | practice_problem | vocab`, content as Json), `StudentNote` (unique per user+lesson)
- Assessments: `Assessment` (type: `lesson_quiz | unit_quiz | course_exam`) / `AssessmentQuestion` (type: `multiple_choice | true_false | matching | fill_in_blank`, content as Json) / `AssessmentAttempt`
- Completions: `LessonCompletion`, `UnitCompletion`
- All IDs are UUIDs. Question content Json holds type-specific answer data (e.g. `{options, correctIndex}` for multiple_choice).
- Enums: `UserRole`, `AssessmentType`, `QuestionType`, `ResourceType`, `ToolType`

## API Routes (prefix: `/api`)
```
Auth:             /auth/*                          (better-auth handles)
Health:           GET /health

Courses:          GET/POST /courses
                  GET/PUT/DELETE /courses/:courseId
Units:            GET/POST /courses/:courseId/units
                  GET/PUT/DELETE /courses/:courseId/units/:unitId
Lessons:          GET/POST /units/:unitId/lessons
                  GET/PUT/DELETE /units/:unitId/lessons/:lessonId

Resources:        GET/POST /lessons/:lessonId/resources  (?type=note|video|lecture)
                  PUT/DELETE /resources/:resourceId
Tools:            GET/POST /lessons/:lessonId/tools       (?type=flash_card|practice_problem|vocab)
                  PUT/DELETE /tools/:toolId
Student Notes:    GET/POST /lessons/:lessonId/student-notes
                  DELETE /student-notes/:studentNoteId
YouTube:          GET /youtube/title

Assessments:      GET/POST /lessons/:lessonId/assessment  (lesson_quiz)
                  GET/POST /units/:unitId/assessment       (unit_quiz)
                  GET/POST /courses/:courseId/assessment   (course_exam)
                  PUT /assessments/:assessmentId
                  GET/POST /assessments/:assessmentId/attempts

Completions:      POST/DELETE /lessons/:lessonId/complete
                  POST/DELETE /units/:unitId/complete
Resource Completions: GET/POST /lessons/:lessonId/resource-completions

Progress:         GET /courses/:courseId/progress
                  GET /courses/:courseId/units/:unitId/progress
```

## Client Routes
| Path | Component |
|---|---|
| `/` | HomePage (CourseListPage if auth, LandingPage if not) |
| `/login` | LoginPage |
| `/register` | RegisterPage |
| `/courses/:courseId` | CourseDetailPage |
| `/courses/:courseId/units/:unitId/lessons/:lessonId` | LessonDetailPage |
| `/profile` | ProfilePage |
| `/admin/users` | AdminUsersPage (admin only) |

## Known Gotchas
- **Progress routes** must be mounted at full absolute paths in the root router — not nested under a `/courses` sub-router prefix (the nested `:unitId` param gets lost otherwise).
- See `client/CLAUDE.md` and `server/CLAUDE.md` for package-specific conventions.

---

## User Instructions
<!-- Add your personal preferences and workflow notes here -->
