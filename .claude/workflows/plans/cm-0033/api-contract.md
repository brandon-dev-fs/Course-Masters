---
id: cm-0033
title: Course Builder — API Contract
stage: design
status: approved
---

# Course Builder — API Contract

> **Data model note**: The spec references separate "resources" and "tools" reorder endpoints, but the current schema has consolidated all lesson activities into the `Assignment` model. The `LessonResource` and `LessonTool` models no longer exist. The existing `PUT /api/lessons/:lessonId/assignments/reorder` endpoint handles all activity reordering. This contract defines only the endpoints that need to be created.

---

## 1. GET /api/courses/:courseId/builder/outline

Fetch the full course outline tree optimized for the builder view. Returns the complete hierarchy in a single response: course metadata, units with lessons, and per-lesson assignments and assessment summaries.

### Auth

- `authenticate()` (applied globally)
- `authorize('teacher', 'admin')`
- `requireCourseOwnership('course', req => req.params['courseId'])`

### Request

**Path params:**

| Param | Type | Description |
|-------|------|-------------|
| `courseId` | `string (UUID)` | The course to fetch |

**Query params:** None

**Request body:** None

### Response

**200 OK**

```json
{
  "data": {
    "course": {
      "id": "uuid",
      "title": "string",
      "description": "string"
    },
    "units": [
      {
        "id": "uuid",
        "title": "string",
        "order": 1,
        "lessons": [
          {
            "id": "uuid",
            "title": "string",
            "order": 1,
            "assignments": [
              {
                "id": "uuid",
                "title": "string",
                "type": "note | video | reading | vocab | practice_problem | file",
                "order": 1
              }
            ],
            "assessment": {
              "id": "uuid",
              "type": "lesson_quiz",
              "questionCount": 5
            } | null
          }
        ],
        "assessment": {
          "id": "uuid",
          "type": "unit_quiz",
          "questionCount": 10
        } | null
      }
    ],
    "courseAssessment": {
      "id": "uuid",
      "type": "course_exam",
      "questionCount": 20
    } | null
  }
}
```

**Shape notes:**

- `units` array is ordered by `order` ascending
- `lessons` array within each unit is ordered by `order` ascending
- `assignments` array within each lesson is ordered by `order` ascending
- `assessment` is `null` if no assessment exists for that lesson/unit
- `courseAssessment` is `null` if no course exam exists
- `questionCount` is the count of `AssessmentQuestion` records for that assessment
- All soft-deleted records (`deletedAt != null`) are excluded
- `deletedAt` fields are never returned

### Error Responses

| Status | Code | When |
|--------|------|------|
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `FORBIDDEN` | User is a student (not teacher/admin) |
| 404 | `NOT_FOUND` | Course does not exist, is soft-deleted, or user is a teacher who does not own it |

---

## 2. PUT /api/courses/:courseId/units/reorder

Batch-update the `order` field of all units within a course. All unit IDs belonging to the course must be included in the request.

### Auth

- `authenticate()` (applied globally)
- `authorize('teacher', 'admin')`
- `requireCourseOwnership('course', req => req.params['courseId'])`

### Request

**Path params:**

| Param | Type | Description |
|-------|------|-------------|
| `courseId` | `string (UUID)` | The course whose units to reorder |

**Request body:**

```json
{
  "items": [
    { "id": "uuid", "order": 1 },
    { "id": "uuid", "order": 2 }
  ]
}
```

**Zod schema:**

```typescript
z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      order: z.number().int().min(1),
    })
  ).min(1),
})
```

**Validation rules:**

- `items` must be a non-empty array
- Each `id` must be a valid UUID
- Each `order` must be a positive integer
- Every non-deleted unit in the course must appear in `items`, and no extra IDs are allowed (enforced in service, not Zod)

### Response

**204 No Content** (no body)

### Error Responses

| Status | Code | When |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | Request body fails Zod validation |
| 400 | `VALIDATION_ERROR` | Provided unit IDs do not match the course's actual units |
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `FORBIDDEN` | User is a student |
| 404 | `NOT_FOUND` | Course does not exist, is soft-deleted, or teacher does not own it |
| 409 | `TRANSACTION_CONFLICT` | Concurrent reorder request (Prisma P2034) |

---

## 3. PUT /api/units/:unitId/lessons/reorder

Batch-update the `order` field of all lessons within a unit. All lesson IDs belonging to the unit must be included in the request.

### Auth

- `authenticate()` (applied globally)
- `authorize('teacher', 'admin')`
- `requireCourseOwnership('unit', req => req.params['unitId'])`

### Request

**Path params:**

| Param | Type | Description |
|-------|------|-------------|
| `unitId` | `string (UUID)` | The unit whose lessons to reorder |

**Request body:**

```json
{
  "items": [
    { "id": "uuid", "order": 1 },
    { "id": "uuid", "order": 2 }
  ]
}
```

**Zod schema:** Same as endpoint 2 (`reorderItemsSchema`).

**Validation rules:**

- Same structural rules as endpoint 2
- Every non-deleted lesson in the unit must appear in `items`, and no extra IDs are allowed (enforced in service)

### Response

**204 No Content** (no body)

### Error Responses

| Status | Code | When |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | Request body fails Zod validation |
| 400 | `VALIDATION_ERROR` | Provided lesson IDs do not match the unit's actual lessons |
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `FORBIDDEN` | User is a student |
| 404 | `NOT_FOUND` | Unit does not exist, is soft-deleted, or teacher does not own its course |
| 409 | `TRANSACTION_CONFLICT` | Concurrent reorder request (Prisma P2034) |

---

## Existing Endpoint (No Changes Required)

### PUT /api/lessons/:lessonId/assignments/reorder

This endpoint already exists and handles reordering of all assignment types (note, video, reading, vocab, practice_problem, file) within a lesson. The builder frontend will call this endpoint directly.

**Current request body:**

```json
{
  "assignmentIds": ["uuid", "uuid", "uuid"]
}
```

> Note: The existing assignment reorder uses an ordered array of IDs (position = order) rather than explicit `{ id, order }` pairs. The builder frontend must conform to this existing contract.

---

## Summary

| # | Method | Path | Auth | Response |
|---|--------|------|------|----------|
| 1 | GET | `/api/courses/:courseId/builder/outline` | teacher/admin + ownership | 200 with outline tree |
| 2 | PUT | `/api/courses/:courseId/units/reorder` | teacher/admin + ownership | 204 |
| 3 | PUT | `/api/units/:unitId/lessons/reorder` | teacher/admin + ownership | 204 |
| - | PUT | `/api/lessons/:lessonId/assignments/reorder` | teacher/admin (existing) | 200 (existing) |
