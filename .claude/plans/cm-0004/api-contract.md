---
id: cm-0004
title: Enforce Resource-Level Authorization on Mutations
stage: design
status: approved
approver: human
approved_at: 2026-05-06T00:00:00Z
---

# API Contract: Enforce Resource-Level Authorization on Mutations

No new endpoints are introduced. All changes are authorization enforcement additions to existing endpoints. The request and response shapes are unchanged. This contract documents the authorization layer, the full 403 error shape, and any behavioral changes (student-note GET scoping).

---

## Global Conventions

**Auth middleware chain for all protected mutation endpoints (teacher/admin):**

```
authenticate() → authorize('teacher', 'admin') → requireCourseOwnership(...) → validate(schema) → controller
```

**Auth middleware chain for student self-scoped endpoints:**

```
authenticate() → [requireStudentRole() or controller-level self-stamp]
```

**403 error response shape** (all ownership and role violations):

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to modify this resource"
  }
}
```

**403 error response shape** (assessment attempt role violation):

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Only students can submit assessment attempts"
  }
}
```

**404 when resource does not exist** (returned instead of 403 to prevent existence leaking):

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

---

## Course Endpoints

### PUT /api/courses/:courseId

**Auth:** `authenticate` + `authorize('teacher', 'admin')` + `requireCourseOwnership('course')`

**Path params:** `courseId` (UUID)

**Request body:** `UpdateCourseInput` (unchanged from existing schema)

**Authorization behavior:**
- Admin: ownership check bypassed; proceeds to handler
- Teacher who owns the course: proceeds to handler
- Teacher who does not own the course: 403

| Status | Code | Description |
|---|---|---|
| 200 | — | Course updated |
| 400 | `VALIDATION_ERROR` | Invalid request body |
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `FORBIDDEN` | Teacher does not own this course |
| 404 | `NOT_FOUND` | Course not found |

---

### DELETE /api/courses/:courseId

**Auth:** `authenticate` + `authorize('teacher', 'admin')` + `requireCourseOwnership('course')`

**Path params:** `courseId` (UUID)

**Authorization behavior:** same as PUT above

| Status | Code | Description |
|---|---|---|
| 204 | — | Course deleted |
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `FORBIDDEN` | Teacher does not own this course |
| 404 | `NOT_FOUND` | Course not found |

---

### POST /api/courses

**Auth:** `authenticate` + `authorize('teacher', 'admin')`

**No ownership check.** Any teacher may create a course. The authenticated user is automatically set as `authorId`. No behavioral change from current implementation.

---

## Unit Endpoints

### POST /api/courses/:courseId/units

**Auth:** `authenticate` + `authorize('teacher', 'admin')` + `requireCourseOwnership('course', courseId)`

**Path params:** `courseId` (UUID)

**Authorization behavior:**
- Admin: bypassed
- Teacher who owns the course identified by `:courseId`: proceeds
- Teacher who does not own the course: 403

| Status | Code | Description |
|---|---|---|
| 201 | — | Unit created |
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `FORBIDDEN` | Teacher does not own this course |
| 404 | `NOT_FOUND` | Course not found |

---

### PUT /api/courses/:courseId/units/:unitId

**Auth:** `authenticate` + `authorize('teacher', 'admin')` + `requireCourseOwnership('unit', unitId)`

**Path params:** `courseId` (UUID), `unitId` (UUID)

**Authorization behavior:**
- Ownership resolved via `unit → course.authorId`. The `courseId` path param is not used for ownership resolution (the unit's own `courseId` FK is the authoritative source).

| Status | Code | Description |
|---|---|---|
| 200 | — | Unit updated |
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `FORBIDDEN` | Teacher does not own the course containing this unit |
| 404 | `NOT_FOUND` | Unit not found |

---

### DELETE /api/courses/:courseId/units/:unitId

**Auth:** `authenticate` + `authorize('teacher', 'admin')` + `requireCourseOwnership('unit', unitId)`

Same authorization behavior as PUT above.

| Status | Code | Description |
|---|---|---|
| 204 | — | Unit deleted |
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `FORBIDDEN` | Teacher does not own the course containing this unit |
| 404 | `NOT_FOUND` | Unit not found |

---

## Lesson Endpoints

### POST /api/units/:unitId/lessons

**Auth:** `authenticate` + `authorize('teacher', 'admin')` + `requireCourseOwnership('unit', unitId)`

**Authorization behavior:** Ownership resolved via `unit → course.authorId`.

| Status | Code | Description |
|---|---|---|
| 201 | — | Lesson created |
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `FORBIDDEN` | Teacher does not own the course containing this unit |
| 404 | `NOT_FOUND` | Unit not found |

---

### PUT /api/units/:unitId/lessons/:lessonId

**Auth:** `authenticate` + `authorize('teacher', 'admin')` + `requireCourseOwnership('lesson', lessonId)`

**Authorization behavior:** Ownership resolved via `lesson → unit → course.authorId`.

| Status | Code | Description |
|---|---|---|
| 200 | — | Lesson updated |
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `FORBIDDEN` | Teacher does not own the course containing this lesson |
| 404 | `NOT_FOUND` | Lesson not found |

---

### DELETE /api/units/:unitId/lessons/:lessonId

**Auth:** `authenticate` + `authorize('teacher', 'admin')` + `requireCourseOwnership('lesson', lessonId)`

Same authorization behavior as PUT above.

| Status | Code | Description |
|---|---|---|
| 204 | — | Lesson deleted |
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `FORBIDDEN` | Teacher does not own the course containing this lesson |
| 404 | `NOT_FOUND` | Lesson not found |

---

## Resource Endpoints

### POST /api/lessons/:lessonId/resources

**Auth:** `authenticate` + `authorize('teacher', 'admin')` + `requireCourseOwnership('lesson', lessonId)`

**Authorization behavior:** Ownership resolved via `lesson → unit → course.authorId`.

| Status | Code | Description |
|---|---|---|
| 201 | — | Resource created |
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `FORBIDDEN` | Teacher does not own the course containing this lesson |
| 404 | `NOT_FOUND` | Lesson not found |

---

### PUT /api/resources/:resourceId

**Auth:** `authenticate` + `authorize('teacher', 'admin')` + `requireCourseOwnership('resource', resourceId)`

**Authorization behavior:** Ownership resolved via `lessonResource → lesson → unit → course.authorId` (single Prisma JOIN query).

| Status | Code | Description |
|---|---|---|
| 200 | — | Resource updated |
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `FORBIDDEN` | Teacher does not own the course containing this resource |
| 404 | `NOT_FOUND` | Resource not found |

---

### DELETE /api/resources/:resourceId

**Auth:** `authenticate` + `authorize('teacher', 'admin')` + `requireCourseOwnership('resource', resourceId)`

Same authorization behavior as PUT above.

| Status | Code | Description |
|---|---|---|
| 204 | — | Resource deleted |
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `FORBIDDEN` | Teacher does not own the course containing this resource |
| 404 | `NOT_FOUND` | Resource not found |

---

## Tool Endpoints

### POST /api/lessons/:lessonId/tools

**Auth:** `authenticate` + `authorize('teacher', 'admin')` + `requireCourseOwnership('lesson', lessonId)`

Same authorization behavior as POST resources above.

| Status | Code | Description |
|---|---|---|
| 201 | — | Tool created |
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `FORBIDDEN` | Teacher does not own the course containing this lesson |
| 404 | `NOT_FOUND` | Lesson not found |

---

### PUT /api/tools/:toolId

**Auth:** `authenticate` + `authorize('teacher', 'admin')` + `requireCourseOwnership('tool', toolId)`

**Authorization behavior:** Ownership resolved via `lessonTool → lesson → unit → course.authorId` (single Prisma JOIN query).

| Status | Code | Description |
|---|---|---|
| 200 | — | Tool updated |
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `FORBIDDEN` | Teacher does not own the course containing this tool |
| 404 | `NOT_FOUND` | Tool not found |

---

### DELETE /api/tools/:toolId

Same authorization behavior as PUT above.

| Status | Code | Description |
|---|---|---|
| 204 | — | Tool deleted |
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `FORBIDDEN` | Teacher does not own the course containing this tool |
| 404 | `NOT_FOUND` | Tool not found |

---

## Student Note Endpoints

### GET /api/lessons/:lessonId/student-notes

**Auth:** `authenticate` (no role restriction — students, teachers, and admins may access)

**Behavioral change (FR-07):** Response is now scoped by role.

| Caller role | Response |
|---|---|
| `student` | Returns the single `StudentNote` record belonging to the requesting user for this lesson (or `null` if none exists). Shape: `StudentNote \| null` |
| `teacher` | Returns all `StudentNote` records for the lesson. Shape: `StudentNote[]` |
| `admin` | Returns all `StudentNote` records for the lesson. Shape: `StudentNote[]` |

**Response shape — student (200):**

```json
{
  "id": "uuid",
  "lessonId": "uuid",
  "userId": "uuid",
  "content": "...",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

Or `null` if no note exists.

**Response shape — teacher/admin (200):**

```json
[
  {
    "id": "uuid",
    "lessonId": "uuid",
    "userId": "uuid",
    "content": "...",
    "createdAt": "ISO-8601",
    "updatedAt": "ISO-8601"
  }
]
```

| Status | Code | Description |
|---|---|---|
| 200 | — | Note(s) returned |
| 401 | `UNAUTHENTICATED` | No valid session |
| 404 | `NOT_FOUND` | Lesson not found |

---

### POST /api/lessons/:lessonId/student-notes

**Auth:** `authenticate` (no role restriction)

**Behavioral guarantee (FR-08):** The note is always created/updated for `req.user.id`. The request body schema must not accept a `userId` field. The authenticated user's ID is always stamped server-side.

No behavioral change to response shape. Upsert behavior unchanged.

| Status | Code | Description |
|---|---|---|
| 200 | — | Note upserted |
| 400 | `VALIDATION_ERROR` | Invalid request body |
| 401 | `UNAUTHENTICATED` | No valid session |
| 404 | `NOT_FOUND` | Lesson not found |

---

### DELETE /api/student-notes/:studentNoteId

**Auth:** `authenticate` (no role restriction — ownership enforced in service layer)

**Authorization behavior (FR-09, existing + logging):**
- Student who owns the note: 204
- Student who does not own the note: 403
- Admin: bypass (admins can delete any note)

**Note:** The `admin` bypass is handled in `studentNoteService.remove` — when `userRole === 'admin'`, the ownership check is skipped.

| Status | Code | Description |
|---|---|---|
| 204 | — | Note deleted |
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `FORBIDDEN` | Student does not own this note |
| 404 | `NOT_FOUND` | Note not found |

---

## Assessment Endpoints

### POST /api/lessons/:lessonId/assessment

**Auth:** `authenticate` + `authorize('teacher', 'admin')` + `requireCourseOwnership('lesson_assessment', lessonId)`

**Authorization behavior:** Ownership resolved via `lesson → unit → course.authorId`.

| Status | Code | Description |
|---|---|---|
| 201 | — | Assessment created |
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `FORBIDDEN` | Teacher does not own the course containing this lesson |
| 404 | `NOT_FOUND` | Lesson not found |
| 409 | `CONFLICT` | Assessment already exists for this lesson |

---

### POST /api/units/:unitId/assessment

**Auth:** `authenticate` + `authorize('teacher', 'admin')` + `requireCourseOwnership('unit_assessment', unitId)`

| Status | Code | Description |
|---|---|---|
| 201 | — | Assessment created |
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `FORBIDDEN` | Teacher does not own the course containing this unit |
| 404 | `NOT_FOUND` | Unit not found |
| 409 | `CONFLICT` | Assessment already exists for this unit |

---

### POST /api/courses/:courseId/assessment

**Auth:** `authenticate` + `authorize('teacher', 'admin')` + `requireCourseOwnership('course_assessment', courseId)`

| Status | Code | Description |
|---|---|---|
| 201 | — | Assessment created |
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `FORBIDDEN` | Teacher does not own this course |
| 404 | `NOT_FOUND` | Course not found |
| 409 | `CONFLICT` | Assessment already exists for this course |

---

### PUT /api/assessments/:assessmentId

**Auth:** `authenticate` + `authorize('teacher', 'admin')` + `requireCourseOwnership('assessment', assessmentId)`

**Authorization behavior:** Ownership resolved by looking up the `Assessment` record, then following its `lessonId`, `unitId`, or `courseId` FK (whichever is non-null) up to `Course.authorId`. Single Prisma query with nested selects.

| Status | Code | Description |
|---|---|---|
| 200 | — | Assessment updated |
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `FORBIDDEN` | Teacher does not own the course containing this assessment |
| 404 | `NOT_FOUND` | Assessment not found |

---

### POST /api/assessments/:assessmentId/attempts

**Auth:** `authenticate` + `requireStudentRole()`

**Authorization behavior (FR-13):** Only users with `role === 'student'` may submit attempts. Teachers and admins receive 403.

**No change to request body shape.** Existing `SubmitAttemptInput` schema unchanged.

| Status | Code | Description |
|---|---|---|
| 201 | — | Attempt recorded, graded result returned |
| 400 | `VALIDATION_ERROR` | Invalid answers payload |
| 400 | `REQUIRED_ASSIGNMENTS_INCOMPLETE` | Required resources not completed |
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `FORBIDDEN` | Only students can submit assessment attempts |
| 404 | `NOT_FOUND` | Assessment not found |

---

## Completion Endpoints

### POST /api/lessons/:lessonId/complete

**Auth:** `authenticate`

**Authorization behavior (FR-10):** Completion record is always created for `req.user.id`. No request body field exists to specify a different user. Self-scoping is enforced by construction.

**Note:** This route is documented in CLAUDE.md and swagger but not yet implemented in the route files. When implemented, no additional ownership middleware is required beyond `authenticate()`, provided the controller always uses `req.user.id`.

| Status | Code | Description |
|---|---|---|
| 200 | — | Completion recorded or already exists |
| 401 | `UNAUTHENTICATED` | No valid session |
| 404 | `NOT_FOUND` | Lesson not found |

---

### DELETE /api/lessons/:lessonId/complete

**Auth:** `authenticate`

**Authorization behavior (FR-10):** Only removes the completion record belonging to `req.user.id`. No mechanism to remove another user's completion.

| Status | Code | Description |
|---|---|---|
| 204 | — | Completion removed |
| 401 | `UNAUTHENTICATED` | No valid session |
| 404 | `NOT_FOUND` | Lesson not found or no completion to remove |

---

### POST /api/units/:unitId/complete

**Auth:** `authenticate`

**Authorization behavior (FR-11):** Same self-scoping by construction as lesson completion.

| Status | Code | Description |
|---|---|---|
| 200 | — | Completion recorded or already exists |
| 401 | `UNAUTHENTICATED` | No valid session |
| 404 | `NOT_FOUND` | Unit not found |

---

### DELETE /api/units/:unitId/complete

**Auth:** `authenticate`

| Status | Code | Description |
|---|---|---|
| 204 | — | Completion removed |
| 401 | `UNAUTHENTICATED` | No valid session |
| 404 | `NOT_FOUND` | Unit not found or no completion to remove |

---

## Resource Completion Endpoints

### POST /api/lessons/:lessonId/completions

**Auth:** `authenticate`

**Authorization behavior (FR-12):** Toggle always operates on `req.user.id`. The request body contains `resourceType` and `resourceId` to identify which resource to toggle — it does not accept a `userId` field. Self-scoping is enforced by construction in the controller.

No behavioral change to request or response shape.

| Status | Code | Description |
|---|---|---|
| 200 | — | Completion toggled; returns updated completion state |
| 400 | `VALIDATION_ERROR` | Invalid request body |
| 401 | `UNAUTHENTICATED` | No valid session |
| 404 | `NOT_FOUND` | Lesson not found |

---

## Error Code Reference

| Code | HTTP Status | Description |
|---|---|---|
| `UNAUTHENTICATED` | 401 | No valid session cookie |
| `FORBIDDEN` | 403 | Role insufficient or resource not owned by requesting user |
| `NOT_FOUND` | 404 | Resource does not exist (also returned when a non-owner accesses a resource to prevent existence leaking) |
| `VALIDATION_ERROR` | 400 | Zod schema validation failed on request body |
| `REQUIRED_ASSIGNMENTS_INCOMPLETE` | 400 | Attempt submission blocked by incomplete required resources |
| `CONFLICT` | 409 | Unique constraint violation (e.g. duplicate assessment) |
| `INTERNAL_ERROR` | 500 | Unhandled server error |
