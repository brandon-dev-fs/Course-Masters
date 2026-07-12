---
id: cm-0004
title: Enforce Resource-Level Authorization on Mutations
stage: review
status: approved
approver: agent
---

# Code Review: Enforce Resource-Level Authorization on Mutations

## Summary

Reviewed 14 changed files (all backend) on branch `refactor/code_cleanup` against `develop`. The PR introduces a new `authorize-resource.ts` middleware module with three composable factories (`requireCourseOwnership`, `requireSelf`, `requireStudentRole`) and an internal structured logger. Route files for courses, units, lessons, resources, tools, and assessments are updated to slot these factories into the existing middleware chain. New completion routes (lesson and unit) implement FR-10/FR-11. `requireSelf` is wired to the resource-completion POST (FR-12). The student note service and controller are updated to support role-scoped GET results (FR-07) and admin bypass on DELETE (FR-09/FR-15).

The implementation closely follows the approved backend plan and API contract. All 17 functional requirements are addressed or correctly deferred per the plan. No schema migrations, no new npm dependencies, and no modifications to `.claude/` artifacts were made. All four commits follow the `<id>: <imperative summary>` format.

Two low-severity and two info-level observations are noted. No medium or higher issues were found.

---

## Scope Coverage

- **Backend files reviewed**: `server/src/middleware/authorize-resource.ts` (new), `server/src/controllers/completion.controller.ts` (new), `server/src/routes/completion.routes.ts` (new), `server/src/services/completion.service.ts` (new), `server/src/controllers/student-note.controller.ts`, `server/src/routes/assessment.routes.ts`, `server/src/routes/course.routes.ts`, `server/src/routes/index.ts`, `server/src/routes/lesson-resource.routes.ts`, `server/src/routes/lesson-tool.routes.ts`, `server/src/routes/lesson.routes.ts`, `server/src/routes/resource-completion.routes.ts`, `server/src/routes/unit.routes.ts`, `server/src/services/student-note.service.ts`
- **Frontend files reviewed**: none
- **Config/other files reviewed**: none
- **Rules loaded**: `.claude/rules/rules.md`, `.claude/rules/review.md`, `.claude/rules/backend.md`, `.claude/rules/api.md`, `.claude/rules/data.md`

---

## Issues

### [LOW] `requireStudentRole` is unnecessarily async

- **Location**: `server/src/middleware/authorize-resource.ts:211`
- **Description**: `requireStudentRole` is wrapped in `asyncHandler` and declared `async`, but it contains no `await` expressions. The `asyncHandler` wrapper signals to readers that async work occurs when there is none, and adds an unnecessary microtask tick. All other synchronous middleware in the project (e.g., `authorize.ts`) uses a plain synchronous `RequestHandler`.
- **Suggested Fix**: Return a plain synchronous `RequestHandler`. If the concern is that `asyncHandler` is needed to forward thrown `AppError` instances to Express, use `next(error)` instead of `throw` in the synchronous body, consistent with how `authorize.ts` handles this:
  ```typescript
  export function requireStudentRole(): RequestHandler {
    return (req, _res, next) => {
      if (req.user!.role !== 'student') {
        const resourceId = (req.params['assessmentId'] as string) ?? '';
        logAuthFailure(req.user!.id, resourceId, `${req.method} ${req.path}`);
        return next(new AppError('FORBIDDEN', 'Only students can submit assessment attempts', 403));
      }
      next();
    };
  }
  ```

---

### [LOW] `logAuthFailure` imported from the middleware layer into the service layer — inverted dependency direction

- **Location**: `server/src/middleware/authorize-resource.ts:243` (export) / `server/src/services/student-note.service.ts:4` (import)
- **Description**: `logAuthFailure` is exported from `authorize-resource.ts` and imported directly into `student-note.service.ts`. The established architecture in `server/CLAUDE.md` is Routes → Controllers → Services. Services should not import from the middleware layer; this inverts the dependency direction and couples `studentNoteService` to a specific middleware module. While harmless now, it makes future refactoring (moving the logger, renaming the middleware file) more error-prone.
- **Suggested Fix**: Extract `logAuthFailure` into a shared utility such as `server/src/utils/logAuthFailure.ts`. Both `authorize-resource.ts` and `student-note.service.ts` import from that shared location, keeping the dependency graph clean and matching the single-responsibility expected of a utility module. The plan's note that the function is exported "for use in tests" remains satisfied by the utility location.

---

### [INFO] `completionService` uses two Prisma queries per operation (existence check + write)

- **Location**: `server/src/services/completion.service.ts:6–41`
- **Description**: Each service method performs a separate `findUnique` existence check before the `upsert` or `deleteMany`. For `markLessonComplete` and `markUnitComplete` the upsert already handles the non-existent case gracefully (it would simply create the record if the lesson/unit exists at the FK level — a missing lesson would cause a Prisma foreign key violation that the global `errorHandler` already maps to 404 via P2025). The explicit existence check adds a round-trip that is not strictly required. This is an advisory note only; the current implementation is not incorrect.
- **Suggested Fix**: Consider relying on Prisma's FK constraint violation (caught in `errorHandler.ts` as P2025 → 404) to eliminate the pre-check query, reducing each operation to a single Prisma call and satisfying NFR-01's spirit for the completion endpoints as well. Alternatively, keep the explicit check for clarity — either approach is acceptable.

---

### [INFO] Missing automated tests (deferred per reviewer instruction)

- **Location**: All changed files
- **Description**: NFR-02 requires automated test coverage for every 403/200/201/204 path and all structured logging paths (NFR-03 assertion). No test files were added in this PR. Per the special instruction provided for this review, the absence of tests is treated as info severity only and does not block approval.
- **Suggested Fix**: Address in a follow-up once the test infrastructure is established. Priority test cases: `requireCourseOwnership` 403 vs 200/204 for teacher (non-owner vs owner) and admin bypass; `requireStudentRole` 403 for teacher/admin vs 201 for student on `POST /assessments/:assessmentId/attempts`; `findByLesson` returning scoped single note for students vs full array for teachers/admins; `logAuthFailure` call assertion on each 403 path.

---

## Verdict

**Status**: APPROVED

Zero issues at medium or above. All 17 functional requirements from the approved spec and API contract are correctly implemented or explicitly deferred per the plan:

- FR-01 through FR-06: `requireCourseOwnership` wired to all course/unit/lesson/resource/tool mutations with correct `resourceType` and param extractor in every route file.
- FR-07/FR-08: `studentNoteService.findByLesson` correctly branches on `userRole`; controller passes `req.user!.role`; POST stamps `req.user.id` by construction.
- FR-09: `studentNoteService.remove` enforces ownership with admin bypass and structured log call on rejection.
- FR-10/FR-11: New `lessonCompleteRouter` and `unitCompleteRouter` are mounted under `authenticate()` in `index.ts`; controllers always stamp `req.user!.id` with no body override field.
- FR-12: `requireSelf` is applied to `POST /lessons/:lessonId/completions` as defence-in-depth; the `toggleCompletionSchema` does not include a `userId` field, confirming self-scoping by construction.
- FR-13: `requireStudentRole()` is inserted before `validate` on `POST /assessments/:assessmentId/attempts`; `authenticate()` is confirmed to precede this via the global middleware mount in `index.ts`.
- FR-14: `requireCourseOwnership` wired to all three assessment creation routes and `PUT /assessments/:assessmentId` with correct type discriminators.
- FR-15: Admin bypass is the first branch evaluated in `requireCourseOwnership` and `requireSelf`, executing before any Prisma query.
- FR-16: All 403 responses flow through `AppError('FORBIDDEN', ...)` → `errorHandler` → `{ "error": { "code": "FORBIDDEN", "message": "..." } }`.
- FR-17: The factory pattern and `resolveCourseOwner` helper are explicitly designed as extension points; no route handler changes needed to add enrollment checks.
- NFR-01: `resolveCourseOwner` executes one Prisma query per request (nested selects compiled to a single JOIN); admin bypass skips it entirely.
- NFR-03: `logAuthFailure` emits structured JSON with `event`, `userId`, `resourceId`, `action`, `timestamp` — no sensitive data included.

The `resolveCourseOwner` switch is exhaustive over all nine `ResourceOwnershipType` values. No raw SQL, no Prisma singleton re-instantiation, no secrets in source code, no internal error details exposed to clients. Middleware ordering (`authorize` → `requireCourseOwnership` → `validate` → controller) is consistent across all route files.

Approved by agent.

## Next Steps

Next: `/test cm-0004`

Override: `/approve .claude/reviews/cm-0004/code-review.md` or edit frontmatter to `status: rejected`
