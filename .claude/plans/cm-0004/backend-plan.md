---
id: cm-0004
title: Enforce Resource-Level Authorization on Mutations
stage: design
status: approved
approver: human
approved_at: 2026-05-06T00:00:00Z
---

# Backend Plan: Enforce Resource-Level Authorization on Mutations

## Overview

This plan hardens all mutation endpoints by adding resource-level ownership checks on top of the existing role-based middleware. No new database models, fields, or migrations are required. All ownership is resolved by traversing existing FK chains in the schema.

The central design decision is a single new file — `server/src/middleware/authorize-resource.ts` — containing composable async middleware factories and utility functions. Route files slot these into the existing middleware chain between `authorize(role)` and the controller. Service functions are updated to enforce self-scoping where the authorization cannot be expressed as pure middleware (student notes GET, assessment attempt role check).

---

## Schema Changes

No schema changes required. All ownership resolution traverses existing FK relationships:

- `Course.authorId` → `User.id`
- `Unit.courseId` → `Course.authorId`
- `Lesson.unitId` → `Unit.courseId` → `Course.authorId`
- `LessonResource.lessonId` / `LessonTool.lessonId` → lesson chain above
- `StudentNote.userId` → `User.id`
- `LessonResourceCompletion.userId` → `User.id`
- `Assessment.(lessonId|unitId|courseId)` → course chain above
- `AssessmentAttempt` — no ownership traversal needed; creation is gated to `student` role only

---

## Layer Structure

### New File: `server/src/middleware/authorize-resource.ts`

This module is the single location for all resource-level authorization logic. It exports:

**1. `resolveCourseOwner(resourceId, resourceType)` — internal async helper**

Accepts a resource identifier and a resource type discriminator string. Executes ONE Prisma query to traverse the FK chain up to `Course.authorId`. Returns the course author's user ID, or `null` if the resource does not exist.

Resource types and their single-query strategy:

| `resourceType` | Prisma query | Select |
|---|---|---|
| `'course'` | `prisma.course.findUnique({ where: { id } })` | `{ authorId }` |
| `'unit'` | `prisma.unit.findUnique({ where: { id }, select: { course: { select: { authorId: true } } } })` | nested |
| `'lesson'` | `prisma.lesson.findUnique({ where: { id }, select: { unit: { select: { course: { select: { authorId: true } } } } } })` | nested |
| `'resource'` | `prisma.lessonResource.findUnique({ where: { id }, select: { lesson: { select: { unit: { select: { course: { select: { authorId: true } } } } } } } })` | nested |
| `'tool'` | `prisma.lessonTool.findUnique({ where: { id }, select: { lesson: { select: { unit: { select: { course: { select: { authorId: true } } } } } } } })` | nested |
| `'assessment'` | `prisma.assessment.findUnique({ where: { id }, select: { course: { select: { authorId: true } }, unit: { select: { course: { select: { authorId: true } } } }, lesson: { select: { unit: { select: { course: { select: { authorId: true } } } } } } } })` | nested (pick first non-null branch) |
| `'lesson_assessment'` | `prisma.lesson.findUnique({ where: { id }, select: { unit: { select: { course: { select: { authorId: true } } } } } })` | same as `'lesson'` |
| `'unit_assessment'` | `prisma.unit.findUnique({ where: { id }, select: { course: { select: { authorId: true } } } })` | same as `'unit'` |
| `'course_assessment'` | `prisma.course.findUnique({ where: { id } })` | same as `'course'` |

Each path is exactly one Prisma call. NFR-01 (at most one additional query per request) is satisfied because this helper is called at most once per request in the middleware layer, before the route handler fires.

**2. `requireCourseOwnership(resourceType, getResourceId)` — Express middleware factory**

```typescript
function requireCourseOwnership(
  resourceType: ResourceOwnershipType,
  getResourceId: (req: Request) => string,
): RequestHandler
```

Returns an Express async middleware. Logic flow:

```
if req.user.role === 'admin' → next()  // admin bypass (FR-15)
if req.user.role !== 'teacher' → next()  // non-teachers are not checked by this middleware
authorId = await resolveCourseOwner(getResourceId(req), resourceType)
if authorId === null → throw NotFoundError (404 — do not leak existence)
if authorId !== req.user.id → log authorization failure + throw AppError('FORBIDDEN', ..., 403)
next()
```

The admin bypass is evaluated first before any database query, ensuring zero overhead for admin requests.

**3. `requireSelf(getUserId)` — Express middleware factory**

```typescript
function requireSelf(
  getUserId: (req: Request) => string | undefined,
): RequestHandler
```

Used for student-owned records (completions, resource-completions). Logic flow:

```
targetUserId = getUserId(req)
if targetUserId === undefined → next()  // record uses req.user.id, no risk
if targetUserId !== req.user.id && req.user.role !== 'admin' → log + throw AppError('FORBIDDEN', ..., 403)
next()
```

This middleware is used where a request body or path param could name a different user.

**4. `requireStudentRole()` — Express middleware factory**

```typescript
function requireStudentRole(): RequestHandler
```

Used exclusively on `POST /assessments/:assessmentId/attempts` (FR-13). Logic:

```
if req.user.role !== 'student' → log + throw AppError('FORBIDDEN', 'Only students can submit assessment attempts', 403)
next()
```

**5. `logAuthFailure(userId, resourceId, action)` — internal utility**

Writes a structured log entry. Uses `console.error` formatted as JSON (consistent with current unstructured logging in `errorHandler.ts` — if the project adopts structured logging, this is the single place to update):

```json
{
  "event": "authorization_failure",
  "userId": "<uuid>",
  "resourceId": "<id-or-param>",
  "action": "<HTTP_METHOD route>",
  "timestamp": "<ISO-8601>"
}
```

NFR-03 is fully satisfied here. No sensitive data (no content fields, passwords, or session tokens) is logged.

---

### Modified Files: Route Files

Each mutation route gains one or more middleware from `authorize-resource.ts` inserted after `authorize(role)` and before `validate(schema)` / the controller. The pattern follows the existing chain:

```
authenticate() → authorize('teacher', 'admin') → requireCourseOwnership(...) → validate(schema) → controller
```

#### `server/src/routes/course.routes.ts`

- `PUT /:courseId` — add `requireCourseOwnership('course', req => req.params['courseId'])`
- `DELETE /:courseId` — same

Course `POST /` (FR-02): No ownership check needed. Any teacher may create. The `create` service already stamps `authorId: userId`. No change.

#### `server/src/routes/unit.routes.ts`

- `POST /` — add `requireCourseOwnership('course', req => req.params['courseId'])`
- `PUT /:unitId` — add `requireCourseOwnership('unit', req => req.params['unitId'])`
- `DELETE /:unitId` — same as PUT

#### `server/src/routes/lesson.routes.ts`

- `POST /` — add `requireCourseOwnership('unit', req => req.params['unitId'])`
- `PUT /:lessonId` — add `requireCourseOwnership('lesson', req => req.params['lessonId'])`
- `DELETE /:lessonId` — same as PUT

#### `server/src/routes/lesson-resource.routes.ts`

- `POST /` (on `lessonResourcesRouter`) — add `requireCourseOwnership('lesson', req => req.params['lessonId'])`
- `PUT /:resourceId` (on `resourcesRouter`) — add `requireCourseOwnership('resource', req => req.params['resourceId'])`
- `DELETE /:resourceId` — same as PUT

#### `server/src/routes/lesson-tool.routes.ts`

- `POST /` (on `lessonToolsRouter`) — add `requireCourseOwnership('lesson', req => req.params['lessonId'])`
- `PUT /:toolId` (on `toolsRouter`) — add `requireCourseOwnership('tool', req => req.params['toolId'])`
- `DELETE /:toolId` — same as PUT

#### `server/src/routes/assessment.routes.ts`

- `POST /` on `lessonAssessmentRouter` — add `requireCourseOwnership('lesson_assessment', req => req.params['lessonId'])`
- `POST /` on `unitAssessmentRouter` — add `requireCourseOwnership('unit_assessment', req => req.params['unitId'])`
- `POST /` on `courseAssessmentRouter` — add `requireCourseOwnership('course_assessment', req => req.params['courseId'])`
- `PUT /:assessmentId` on `assessmentsRouter` — add `requireCourseOwnership('assessment', req => req.params['assessmentId'])`
- `POST /:assessmentId/attempts` — **remove** `authorize('teacher', 'admin')` if present (currently absent), add `requireStudentRole()`

Note: `assessmentId`-level resolution (for `PUT /assessments/:assessmentId`) requires the `'assessment'` resource type which resolves via the Assessment record's own `lessonId`, `unitId`, or `courseId` field. The single query selects all three optional FK branches and picks the non-null one.

#### `server/src/routes/student-note.routes.ts`

Student notes require a different treatment. GET scoping (FR-07) cannot be expressed as a blocking middleware because the behavior branches on role (students see only their own; teachers/admins see all). This logic belongs in the service layer.

- `GET /` — no new middleware; service change handles scoping (see below)
- `POST /` — no new route middleware; service already stamps `userId: req.user.id`; no `requireSelf` needed since users cannot specify a different `userId` in the request body (schema enforces this)
- `DELETE /:studentNoteId` on `studentNotesRouter` — add `requireSelf(async req => { const note = await prisma.studentNote.findUnique({ where: { id: req.params['studentNoteId'] }, select: { userId: true } }); return note?.userId; })` — **however** this would add a query; instead, keep this check in the service layer where `studentNoteService.remove` already enforces it (FR-09 is already implemented)

After reviewing the existing service: `studentNoteService.remove` already throws `AppError('FORBIDDEN', ...)` if `note.userId !== userId`. The gap is that it does not log the failure (NFR-03) and the error code is the generic `FORBIDDEN` rather than a specific code. These need to be updated in the service but no route middleware change is needed for DELETE.

For GET (FR-07): update `studentNoteService.findByLesson` to accept `userRole` in addition to `userId`, and when role is `student`, filter `where: { lessonId, userId }` instead of `where: { lessonId }`. The controller passes `req.user.role`.

#### `server/src/routes/resource-completion.routes.ts`

The `POST /` toggle endpoint creates a completion record for `req.user.id` (see controller: `const userId = req.user!.id`). There is no request body field for a different user, so no `requireSelf` middleware is needed. Self-scoping is already enforced by construction (FR-12).

#### Lesson/Unit Completion Routes (FR-10, FR-11)

`POST /lessons/:lessonId/complete` and `DELETE /lessons/:lessonId/complete` (and unit equivalents) do not currently exist in the route files — the progress service derives completion state from assessment attempts rather than `LessonCompletion` records. The spec lists authorization requirements for these endpoints.

**Implementation note for the coder agent**: If these routes are implemented as part of this spec, apply `requireSelf` checking `req.body.userId` if present. If the endpoints always create completions for `req.user.id` with no body field for overriding the user, no additional middleware is needed beyond `authenticate()`. The plan covers the authorization pattern; whether to implement the routes themselves is out of scope per the spec (scope: "no new endpoints").

---

### Modified Files: Service Layer

#### `server/src/services/student-note.service.ts`

**`findByLesson(lessonId, userId, userRole)`** — add `userRole: string` parameter.

```
if userRole === 'student':
  query: prisma.studentNote.findUnique({ where: { lessonId_userId: { lessonId, userId } } })
else:
  query: prisma.studentNote.findMany({ where: { lessonId } })
return result (single record or array)
```

The return type changes from a single `StudentNote | null` to `StudentNote | null | StudentNote[]` depending on role. The controller must be updated to pass `req.user.role` and handle the response shape.

**`remove(id, userId)`** — add structured log call on authorization failure:

```
if note.userId !== userId:
  logAuthFailure(userId, id, 'DELETE student-note')
  throw AppError('FORBIDDEN', 'You can only delete your own notes', 403)
```

#### `server/src/services/assessment.service.ts`

**`submitAttempt`** — The student-role gate is moved to the route middleware layer (`requireStudentRole()`). No service change needed for the role check itself.

---

### Modified Files: Controller Layer

#### `server/src/controllers/student-note.controller.ts`

The `get` handler must pass `req.user.role` to `studentNoteService.findByLesson`. The response shape must handle both the single-note (student) and array (teacher/admin) return values.

---

## Error Handling

All authorization failures in `authorize-resource.ts` middleware throw `AppError` instances:

- Ownership mismatch: `new AppError('FORBIDDEN', 'You do not have permission to modify this resource', 403)`
- Student-role violation on attempt submission: `new AppError('FORBIDDEN', 'Only students can submit assessment attempts', 403)`

These propagate to the existing `errorHandler` middleware, which serializes them to:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to modify this resource"
  }
}
```

No new error classes are needed. `AppError` with `statusCode: 403` covers all cases. The `FORBIDDEN` code is consistent with the existing `authorize` middleware.

404 is returned (instead of 403) when the resource does not exist at all, to avoid leaking existence information to unauthorized requestors. This is handled by `NotFoundError` thrown from `resolveCourseOwner` when the Prisma query returns `null`.

---

## Validation

No new Zod schemas are required. The new middleware layer does not parse request bodies; it only reads `req.user`, `req.params`, and performs Prisma lookups. Existing Zod schemas continue to validate bodies before reaching controllers.

---

## Pseudocode: `requireCourseOwnership` middleware factory

```typescript
export function requireCourseOwnership(
  resourceType: ResourceOwnershipType,
  getResourceId: (req: Request) => string,
): RequestHandler {
  return asyncHandler(async (req, _res, next) => {
    // Admin bypass — no DB query
    if (req.user!.role === 'admin') return next();

    // Non-teachers (students) are not subject to course ownership checks
    // (student self-checks are handled separately)
    if (req.user!.role !== 'teacher') return next();

    const resourceId = getResourceId(req);
    const authorId = await resolveCourseOwner(resourceId, resourceType);

    if (authorId === null) throw new NotFoundError('Resource not found');

    if (authorId !== req.user!.id) {
      logAuthFailure(req.user!.id, resourceId, `${req.method} ${req.path}`);
      throw new AppError('FORBIDDEN', 'You do not have permission to modify this resource', 403);
    }

    next();
  });
}
```

## Pseudocode: `resolveCourseOwner` for `'resource'` type

```typescript
case 'resource': {
  const row = await prisma.lessonResource.findUnique({
    where: { id: resourceId },
    select: {
      lesson: {
        select: {
          unit: {
            select: {
              course: { select: { authorId: true } },
            },
          },
        },
      },
    },
  });
  return row?.lesson.unit.course.authorId ?? null;
}
```

This is a single Prisma query — Prisma emits one JOIN across `lesson_resource → lesson → unit → course`. NFR-01 is satisfied.

---

## Enrollment Extension Point (FR-17)

The `requireCourseOwnership` factory and `resolveCourseOwner` helper are the natural extension points for future enrollment-based read restrictions. A future `requireEnrollment(resourceType, getResourceId)` factory would call the same `resolveCourseOwner` pattern to retrieve the course ID, then check an enrollment table. Route handlers require no changes — new middleware is simply inserted into the chain.

---

## New npm Dependencies

None. All logic uses existing dependencies: Express 5, Prisma 6, TypeScript 5. No new packages required.

---

## Test Coverage (NFR-02)

The coder agent must write unit/integration tests covering:

For each mutating endpoint with ownership enforcement:
- 403 response when a teacher attempts to modify a resource they do not own
- 200/201/204 response when the owning teacher mutates the resource
- 200/201/204 response when an admin mutates any resource (bypass)
- 404 response when the resource does not exist (not leaked as 403)

For student-note GET:
- Student receives only their own note (not other students' notes for the same lesson)
- Teacher receives all notes for the lesson

For assessment attempt submission:
- 403 when a teacher submits an attempt
- 403 when an admin submits an attempt
- 201 when a student submits an attempt

For structured logging (NFR-03):
- Assert that `logAuthFailure` is called (or the log entry is written) on each 403 path, with the correct `userId`, `resourceId`, and `action` fields.
