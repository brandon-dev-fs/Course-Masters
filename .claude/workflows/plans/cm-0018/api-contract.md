---
id: cm-0018
title: Add Soft Delete to Core Models
stage: design
status: approved
approver: human
approved_at: 2026-05-13T00:00:00Z
---

# API Contract — cm-0018: Add Soft Delete to Core Models

This contract documents every endpoint whose behavior changes as part of soft delete. No new endpoints are added except `DELETE /api/users/:userId`. Request and response shapes are unchanged from the existing contract for all other endpoints unless explicitly noted below. The only behavioral changes are: DELETE endpoints now soft-delete instead of hard-delete, read endpoints exclude soft-deleted records, and detail/update/attempt endpoints return 404 for soft-deleted records.

---

## General Conventions

- All routes are prefixed with `/api`
- All protected routes require `authenticate` middleware (session cookie)
- Error shape: `{ "error": { "code": "<ERROR_CODE>", "message": "<string>" } }`
- Success on deletion: `204 No Content` (no body)
- Success on list: `200 OK` with array (soft-deleted records excluded — no change to response shape)
- Success on detail: `200 OK` (unchanged response shape for non-deleted records)

---

## Courses

### `GET /api/courses`

**Auth**: `authenticate`

**Behavior change**: Excludes courses where `deletedAt IS NOT NULL`.

**Request**: No change.

**Response `200`**: No change to shape. Soft-deleted courses simply do not appear in the array.

**Error codes**: No change.

---

### `GET /api/courses/:courseId`

**Auth**: `authenticate`

**Behavior change**: Returns `404` if the course exists but has a non-null `deletedAt`.

**Request**: No change.

**Response `200`**: No change to shape. The nested `units` and `lessons` arrays within the response also exclude soft-deleted records.

**Response `404`**:
```json
{ "error": { "code": "NOT_FOUND", "message": "Course not found" } }
```

Returned for both: record does not exist, and record exists but is soft-deleted. No distinction is made.

---

### `PUT /api/courses/:courseId`

**Auth**: `authenticate`, `authorize(['teacher', 'admin'])`, ownership check

**Behavior change**: Returns `404` if the course is soft-deleted.

**Request**: No change.

**Response `200`**: No change.

**Response `404`**:
```json
{ "error": { "code": "NOT_FOUND", "message": "Course not found" } }
```

---

### `DELETE /api/courses/:courseId`

**Auth**: `authenticate`, `authorize(['teacher', 'admin'])`, ownership check

**Behavior change**: No longer hard-deletes the row. Instead sets `deletedAt = now()` on the Course and cascades soft delete to all Units, Lessons, and Assessments belonging to this Course. All cascade operations are atomic (single transaction).

**Request**: No change (no body).

**Response `204`**: No body. Unchanged status code.

**Response `404`**:
```json
{ "error": { "code": "NOT_FOUND", "message": "Course not found" } }
```
Returned if the course does not exist or is already soft-deleted.

**Error codes**:

| Code | HTTP | Condition |
|---|---|---|
| `NOT_FOUND` | 404 | Course not found or already soft-deleted |
| `FORBIDDEN` | 403 | Caller does not own the course and is not admin |

**Notes**: Only records with `deletedAt IS NULL` at each cascade level are updated. Records already soft-deleted are skipped (idempotent cascade).

---

## Units

### `GET /api/courses/:courseId/units`

**Auth**: `authenticate`

**Behavior change**: Excludes units where `deletedAt IS NOT NULL`. Parent Course check also treats a soft-deleted Course as non-existent (returns 404).

**Response `200`**: No change to shape.

**Response `404`**:
```json
{ "error": { "code": "NOT_FOUND", "message": "Course not found" } }
```

---

### `GET /api/courses/:courseId/units/:unitId`

**Auth**: `authenticate`

**Behavior change**: Returns `404` if the unit is soft-deleted. The nested `lessons` array excludes soft-deleted lessons.

**Response `200`**: No change to shape.

**Response `404`**:
```json
{ "error": { "code": "NOT_FOUND", "message": "Unit not found" } }
```

---

### `POST /api/courses/:courseId/units`

**Auth**: `authenticate`, `authorize(['teacher', 'admin'])`

**Behavior change**: Returns `404` if the parent Course is soft-deleted (Course is treated as non-existent).

**Request**: No change.

**Response `201`**: No change.

**Response `404`**:
```json
{ "error": { "code": "NOT_FOUND", "message": "Course not found" } }
```

---

### `PUT /api/courses/:courseId/units/:unitId`

**Auth**: `authenticate`, `authorize(['teacher', 'admin'])`

**Behavior change**: Returns `404` if the unit is soft-deleted.

**Request**: No change.

**Response `200`**: No change.

**Response `404`**:
```json
{ "error": { "code": "NOT_FOUND", "message": "Unit not found" } }
```

---

### `DELETE /api/courses/:courseId/units/:unitId`

**Auth**: `authenticate`, `authorize(['teacher', 'admin'])`

**Behavior change**: No longer hard-deletes. Sets `deletedAt = now()` on the Unit and cascades soft delete to all Lessons and Assessments belonging to this Unit. Single transaction.

**Request**: No change.

**Response `204`**: No body. Unchanged.

**Response `404`**:
```json
{ "error": { "code": "NOT_FOUND", "message": "Unit not found" } }
```

**Error codes**:

| Code | HTTP | Condition |
|---|---|---|
| `NOT_FOUND` | 404 | Unit not found or already soft-deleted |

---

## Lessons

### `GET /api/units/:unitId/lessons`

**Auth**: `authenticate`

**Behavior change**: Excludes lessons where `deletedAt IS NOT NULL`. Parent Unit check treats a soft-deleted Unit as non-existent.

**Response `200`**: No change to shape.

**Response `404`**:
```json
{ "error": { "code": "NOT_FOUND", "message": "Unit not found" } }
```

---

### `GET /api/units/:unitId/lessons/:lessonId`

**Auth**: `authenticate`

**Behavior change**: Returns `404` if the lesson is soft-deleted.

**Response `200`**: No change.

**Response `404`**:
```json
{ "error": { "code": "NOT_FOUND", "message": "Lesson not found" } }
```

---

### `POST /api/units/:unitId/lessons`

**Auth**: `authenticate`, `authorize(['teacher', 'admin'])`

**Behavior change**: Returns `404` if the parent Unit is soft-deleted.

**Request**: No change.

**Response `201`**: No change.

**Response `404`**:
```json
{ "error": { "code": "NOT_FOUND", "message": "Unit not found" } }
```

---

### `PUT /api/units/:unitId/lessons/:lessonId`

**Auth**: `authenticate`, `authorize(['teacher', 'admin'])`

**Behavior change**: Returns `404` if the lesson is soft-deleted.

**Request**: No change.

**Response `200`**: No change.

**Response `404`**:
```json
{ "error": { "code": "NOT_FOUND", "message": "Lesson not found" } }
```

---

### `DELETE /api/units/:unitId/lessons/:lessonId`

**Auth**: `authenticate`, `authorize(['teacher', 'admin'])`

**Behavior change**: No longer hard-deletes. Sets `deletedAt = now()` on the Lesson and cascades soft delete to the Lesson's Assessment (if any). Single transaction.

**Request**: No change.

**Response `204`**: No body. Unchanged.

**Response `404`**:
```json
{ "error": { "code": "NOT_FOUND", "message": "Lesson not found" } }
```

**Error codes**:

| Code | HTTP | Condition |
|---|---|---|
| `NOT_FOUND` | 404 | Lesson not found or already soft-deleted |

---

## Assessments

### `GET /api/lessons/:lessonId/assessment`

**Auth**: `authenticate`

**Behavior change**: If the Assessment for this lesson is soft-deleted, the endpoint returns `null` (the assessment is treated as absent). If the parent Lesson is soft-deleted, returns `404`.

**Response `200`**: No change to shape. Returns `null` data field if no (non-deleted) assessment exists.

**Response `404`**:
```json
{ "error": { "code": "NOT_FOUND", "message": "Lesson not found" } }
```

---

### `GET /api/units/:unitId/assessment`

**Auth**: `authenticate`

**Behavior change**: Same as lesson assessment — soft-deleted Assessment treated as absent. Soft-deleted parent Unit returns `404`.

**Response `200`**: No change.

**Response `404`**:
```json
{ "error": { "code": "NOT_FOUND", "message": "Unit not found" } }
```

---

### `GET /api/courses/:courseId/assessment`

**Auth**: `authenticate`

**Behavior change**: Same pattern — soft-deleted Assessment treated as absent. Soft-deleted parent Course returns `404`.

**Response `200`**: No change.

**Response `404`**:
```json
{ "error": { "code": "NOT_FOUND", "message": "Course not found" } }
```

---

### `POST /api/lessons/:lessonId/assessment`

**Auth**: `authenticate`, `authorize(['teacher', 'admin'])`

**Behavior change**: Returns `404` if the parent Lesson is soft-deleted.

**Request**: No change.

**Response `201`**: No change.

**Response `404`**:
```json
{ "error": { "code": "NOT_FOUND", "message": "Lesson not found" } }
```

---

### `POST /api/units/:unitId/assessment` and `POST /api/courses/:courseId/assessment`

**Auth**: `authenticate`, `authorize(['teacher', 'admin'])`

**Behavior change**: Returns `404` if the parent Unit/Course is soft-deleted.

**Response `404`**:
```json
{ "error": { "code": "NOT_FOUND", "message": "Unit not found" } }
```
or
```json
{ "error": { "code": "NOT_FOUND", "message": "Course not found" } }
```

---

### `PUT /api/assessments/:assessmentId`

**Auth**: `authenticate`, `authorize(['teacher', 'admin'])`

**Behavior change**: Returns `404` if the Assessment is soft-deleted.

**Request**: No change.

**Response `200`**: No change.

**Response `404`**:
```json
{ "error": { "code": "NOT_FOUND", "message": "Assessment not found" } }
```

---

### `POST /api/assessments/:assessmentId/attempts`

**Auth**: `authenticate`

**Behavior change**: Returns `404` if the Assessment is soft-deleted (FR-12).

**Request**: No change.

**Response `201`**: No change.

**Response `404`**:
```json
{ "error": { "code": "NOT_FOUND", "message": "Assessment not found" } }
```

**Error codes**:

| Code | HTTP | Condition |
|---|---|---|
| `NOT_FOUND` | 404 | Assessment not found or soft-deleted |
| `REQUIRED_ASSIGNMENTS_INCOMPLETE` | 400 | Required resources/tools not completed (existing behavior, unchanged) |

---

### `GET /api/assessments/:assessmentId/attempts`

**Auth**: `authenticate`

**Behavior change**: No behavioral change. Attempts are not soft-deleted and can still be retrieved even if the parent Assessment is soft-deleted (historical read). The assessment lookup is not gated here.

**Response `200`**: No change.

---

## Progress

### `GET /api/courses/:courseId/progress`

**Auth**: `authenticate`

**Behavior change**: Soft-deleted Units, Lessons, and Assessments are excluded from progress calculations. `totalUnits`, `totalLessons`, `completedLessons`, `completedUnits`, and `percentComplete` reflect only non-deleted entities. Returns `404` if the Course is soft-deleted.

**Request**: No change.

**Response `200`**: No change to shape. Values change to reflect filtered totals.

**Response `404`**:
```json
{ "error": { "code": "NOT_FOUND", "message": "Course not found" } }
```

---

### `GET /api/courses/:courseId/units/:unitId/progress`

**Auth**: `authenticate`

**Behavior change**: Soft-deleted Lessons and Assessments excluded. Returns `404` if the Unit is soft-deleted.

**Request**: No change.

**Response `200`**: No change to shape.

**Response `404`**:
```json
{ "error": { "code": "NOT_FOUND", "message": "Unit not found" } }
```

---

## Users (New Endpoint)

### `DELETE /api/users/:userId`

**Auth**: `authenticate`, `authorize(['admin'])`

**Purpose**: Soft-delete a user and cascade soft-delete to all of their Courses, Units, Lessons, and Assessments. This is the canonical user-delete endpoint. The better-auth admin plugin's built-in delete endpoint performs a hard delete and must not be used in normal operation.

**Path params**:

| Param | Type | Description |
|---|---|---|
| `userId` | `string` (UUID) | ID of the user to soft-delete |

**Request body**: None.

**Response `204`**: No body.

**Response `404`**:
```json
{ "error": { "code": "NOT_FOUND", "message": "User not found" } }
```
Returned if the user does not exist or is already soft-deleted.

**Response `403`**:
```json
{ "error": { "code": "FORBIDDEN", "message": "Forbidden" } }
```
Returned if the caller is not an admin.

**Error codes**:

| Code | HTTP | Condition |
|---|---|---|
| `NOT_FOUND` | 404 | User does not exist or is already soft-deleted |
| `FORBIDDEN` | 403 | Caller role is not `admin` |
| `UNAUTHORIZED` | 401 | No valid session |

**Notes**:
- The cascade includes all of the user's Courses (and their Units, Lessons, and Assessments). This is atomic: if any step fails, the entire transaction rolls back and no partial changes are committed.
- Session records, Account records, and completion/attempt records are NOT soft-deleted. They remain in the database as historical data.
- The better-auth admin plugin route `DELETE /api/auth/admin/delete-user` performs a hard delete and is not affected by this feature. Operators must use this endpoint instead.
