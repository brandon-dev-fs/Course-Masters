---
name: Codebase Architecture Patterns
description: Key patterns discovered in the Course Masters codebase for generating accurate implementation tasks - route patterns, service patterns, controller patterns, client conventions
type: project
---

## Server Patterns
- Routes use `asyncHandler()` wrapper, `validate(schema)` middleware, and delegate to controller objects
- Controllers are exported as object literals with methods (e.g., `courseController = { getAll, getOne, create, update, remove }`)
- Services use the Prisma singleton from `src/lib/prisma.js` and throw `NotFoundError` for missing records
- Current auth workaround: `courseService` has `getDefaultUserId()` that calls `prisma.user.findFirst()` - needs to be replaced when auth is added
- Dual-router pattern for lesson content: nested router (e.g., `lessonNotesRouter`) and flat router (`notesRouter`) exported from same file
- Express 5 params: `req.params['courseId'] as string` (bracket notation)
- `app.ts` structure: cors() -> express.json() -> /api router -> errorHandler

## Client Patterns
- All imports use `.js` extension (ESM interop)
- API calls through `apiClient` in `src/api/client.ts` - never raw fetch
- Types in `src/api/types.ts`, per-resource modules in `src/api/`
- Pages own their data via useState + useEffect
- Only context is ThemeContext - no global state library
- Components use semantic tokens (bg-surface, text-foreground) - no `dark:` prefix
- Feature-grouped under `src/features/` with pages, forms, and display components
- Shared primitives in `src/components/` (Button, Input, Modal, etc.)

## Seed Script
- Uses `prisma.user.upsert()` for user, `deleteMany + create` for course data
- Run via `node --env-file=.env --import=tsx/esm prisma/seed.ts`
- Current default user: `default@course-masters.app`

## Config
- `server/src/config.ts` uses Zod to validate env vars, exits on failure
- Current vars: DATABASE_URL, SERVER_PORT, NODE_ENV
