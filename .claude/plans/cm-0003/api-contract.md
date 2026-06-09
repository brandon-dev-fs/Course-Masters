---
id: cm-0003
title: Add Assignment Layer to Lessons
stage: design
status: approved
approver: human
approved_at: 2026-04-28T00:00:00Z
---

# API Contract — cm-0003: Add Assignment Layer to Lessons

This document is immutable to coder agents once approved. Any required change is a stop-and-escalate event back to `/design`.

---

## Shared Definitions

### Assignment Object (full response shape)

```json
{
  "id": "uuid",
  "lessonId": "uuid",
  "order": 1,
  "title": "string",
  "objective": "string | null",
  "type": "note | video | reading | vocab | practice_problem",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601",
  "completed": false,
  "noteAssignment": null,
  "videoAssignment": null,
  "readingAssignment": null,
  "vocabAssignment": null,
  "practiceProblemAssignment": null
}
```

Exactly one child object will be non-null, matching `type`. All others are `null`.

**`noteAssignment`:**
```json
{ "id": "uuid", "content": { } }
```

**`videoAssignment`:**
```json
{ "id": "uuid", "url": "string", "displayTitle": "string | null" }
```

**`readingAssignment`:**
```json
{ "id": "uuid", "url": "string", "description": "string | null", "estimatedMinutes": "number | null" }
```

**`vocabAssignment`:**
```json
{ "id": "uuid", "entries": [{ "term": "string", "definition": "string" }] }
```

**`practiceProblemAssignment`:**
```json
{
  "id": "uuid",
  "passingPercentage": "number | null",
  "questions": [
    { "id": "uuid", "order": 1, "type": "multiple_choice | true_false | matching | fill_in_blank", "content": { } }
  ]
}
```

### Question Content Shapes

**`multiple_choice`:**
```json
{ "question": "string", "options": ["string"], "correctIndex": 0 }
```

**`true_false`:**
```json
{ "question": "string", "correct": true }
```

**`matching`:**
```json
{ "question": "string", "leftItems": ["string"], "rightItems": ["string"], "correctPairs": [[0, 1]] }
```

**`fill_in_blank`:**
```json
{ "question": "string", "blanks": [{ "answer": "string", "alternatives": ["string"] }] }
```

### Error Shape

All errors use:
```json
{ "error": { "code": "ERROR_CODE", "message": "Human-readable message", "details": {} } }
```

### Auth Notes

- All assignment endpoints require `authenticate` middleware (applied globally in `routes/index.ts`).
- Mutation endpoints additionally require `authorize('teacher', 'admin')`.
- Completion endpoints (`POST`/`DELETE` `/assignments/:id/complete`) require only authentication (any role).
- `completed` field on assignment responses is always relative to the requesting user's session.

---

## Endpoints

---

### GET /lessons/:lessonId/assignments

List all assignments for a lesson in ascending order, with type-specific child data and completion status for the requesting user.

**Auth:** `authenticate` (all authenticated roles)

**Path Parameters:**
| Param | Type | Description |
|---|---|---|
| `lessonId` | UUID string | ID of the parent lesson |

**Query Parameters:** None

**Request Body:** None

**Response 200:**
```json
[
  {
    "id": "uuid",
    "lessonId": "uuid",
    "order": 1,
    "title": "string",
    "objective": "string | null",
    "type": "reading",
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601",
    "completed": false,
    "noteAssignment": null,
    "videoAssignment": null,
    "readingAssignment": { "id": "uuid", "url": "https://...", "description": "string | null", "estimatedMinutes": 10 },
    "vocabAssignment": null,
    "practiceProblemAssignment": null
  }
]
```

**Status Codes:**
| Code | Condition |
|---|---|
| 200 | Success (empty array if no assignments) |
| 401 | Not authenticated |
| 404 | Lesson not found |
| 500 | Unexpected server error |

**Error Codes:**
| Code | HTTP | Condition |
|---|---|---|
| `NOT_FOUND` | 404 | Lesson does not exist |
| `INTERNAL_ERROR` | 500 | Unexpected failure |

---

### POST /lessons/:lessonId/assignments

Create a new assignment. The assignment is appended at the end (order = current max + 1). Parent + child records are created atomically in a transaction.

**Auth:** `authenticate` + `authorize('teacher', 'admin')`

**Path Parameters:**
| Param | Type | Description |
|---|---|---|
| `lessonId` | UUID string | ID of the parent lesson |

**Request Body (discriminated by `type`):**

Common fields (all types):
```json
{
  "title": "string (required, min 1)",
  "objective": "string (optional)",
  "type": "note | video | reading | vocab | practice_problem (required)"
}
```

Type-specific additional fields:

**`note`:**
```json
{ "content": { } }
```
`content` is a rich-text Json object (same structure as `LessonResource` note content). Required.

**`video`:**
```json
{ "url": "string (valid URL, required)", "displayTitle": "string (optional)" }
```
Note: `displayTitle` is the video's own display title, named distinctly from the shared assignment `title` to avoid a key collision in the flat request body.

**`reading`:**
```json
{ "url": "string (valid URL, required)", "description": "string (optional)", "estimatedMinutes": "integer >= 1 (optional)" }
```

**`vocab`:**
```json
{ "entries": [{ "term": "string (min 1)", "definition": "string (min 1)" }] }
```
`entries` array is required and must have at least 1 item.

**`practice_problem`:**
```json
{
  "passingPercentage": "integer 0–100 (optional)",
  "questions": [
    { "type": "multiple_choice | true_false | matching | fill_in_blank", "order": "integer >= 1", "content": { } }
  ]
}
```
`questions` array is required and must have at least 1 item.

**Response 201:** Full assignment object (see Shared Definitions).

**Status Codes:**
| Code | Condition |
|---|---|
| 201 | Assignment created |
| 400 | Validation error (missing required field, invalid URL, etc.) |
| 401 | Not authenticated |
| 403 | Authenticated but not teacher or admin |
| 404 | Lesson not found |
| 500 | Unexpected server error |

**Error Codes:**
| Code | HTTP | Condition |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Zod schema failure |
| `NOT_FOUND` | 404 | Lesson does not exist |
| `INTERNAL_ERROR` | 500 | Unexpected failure |

---

### GET /assignments/:assignmentId

Fetch a single assignment with type-specific child data and completion status for the requesting user.

**Auth:** `authenticate` (all authenticated roles)

**Path Parameters:**
| Param | Type | Description |
|---|---|---|
| `assignmentId` | UUID string | ID of the assignment |

**Request Body:** None

**Response 200:** Full assignment object (see Shared Definitions).

**Status Codes:**
| Code | Condition |
|---|---|
| 200 | Success |
| 401 | Not authenticated |
| 404 | Assignment not found |
| 500 | Unexpected server error |

**Error Codes:**
| Code | HTTP | Condition |
|---|---|---|
| `NOT_FOUND` | 404 | Assignment does not exist |
| `INTERNAL_ERROR` | 500 | Unexpected failure |

---

### PUT /assignments/:assignmentId

Update shared fields and/or type-specific fields of an existing assignment. The assignment `type` is immutable and cannot be changed after creation.

**Auth:** `authenticate` + `authorize('teacher', 'admin')`

**Path Parameters:**
| Param | Type | Description |
|---|---|---|
| `assignmentId` | UUID string | ID of the assignment to update |

**Request Body:** All fields are optional. Provide only the fields to change.

```json
{
  "title": "string (optional, min 1)",
  "objective": "string (optional)",
  "content": "Json object (optional — note assignments only)",
  "url": "string valid URL (optional — video/reading assignments)",
  "displayTitle": "string (optional — video assignments only)",
  "description": "string (optional — reading assignments only)",
  "estimatedMinutes": "integer >= 1 (optional — reading assignments only)",
  "entries": [{ "term": "string", "definition": "string" }],
  "passingPercentage": "integer 0–100 | null (optional — practice_problem only)",
  "questions": [{ "type": "...", "order": 1, "content": { } }]
}
```

Notes:
- For `practice_problem` assignments, providing `questions` replaces the entire question set (all existing questions are deleted and re-created in order).
- `type` is ignored if included in the body.

**Response 200:** Full updated assignment object (see Shared Definitions). `completed` reflects the teacher's own completion state (typically `false`).

**Status Codes:**
| Code | Condition |
|---|---|
| 200 | Update applied |
| 400 | Validation error |
| 401 | Not authenticated |
| 403 | Authenticated but not teacher or admin |
| 404 | Assignment not found |
| 500 | Unexpected server error |

**Error Codes:**
| Code | HTTP | Condition |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Zod schema failure |
| `NOT_FOUND` | 404 | Assignment does not exist |
| `INTERNAL_ERROR` | 500 | Unexpected failure |

---

### DELETE /assignments/:assignmentId

Delete an assignment and its child records. Recalculates order for remaining assignments in the same lesson to be sequential from 1.

**Auth:** `authenticate` + `authorize('teacher', 'admin')`

**Path Parameters:**
| Param | Type | Description |
|---|---|---|
| `assignmentId` | UUID string | ID of the assignment to delete |

**Request Body:** None

**Response 204:** No content.

**Status Codes:**
| Code | Condition |
|---|---|
| 204 | Deleted successfully |
| 401 | Not authenticated |
| 403 | Authenticated but not teacher or admin |
| 404 | Assignment not found |
| 500 | Unexpected server error |

**Error Codes:**
| Code | HTTP | Condition |
|---|---|---|
| `NOT_FOUND` | 404 | Assignment does not exist |
| `INTERNAL_ERROR` | 500 | Unexpected failure |

---

### PUT /lessons/:lessonId/assignments/reorder

Reorder all assignments in a lesson by supplying the complete ordered list of assignment IDs. Order values are recalculated atomically (no gaps, starting from 1). The operation is all-or-nothing.

**Auth:** `authenticate` + `authorize('teacher', 'admin')`

**Path Parameters:**
| Param | Type | Description |
|---|---|---|
| `lessonId` | UUID string | ID of the lesson whose assignments are being reordered |

**Request Body:**
```json
{
  "assignmentIds": ["uuid", "uuid", "uuid"]
}
```

`assignmentIds` must contain every assignment ID that belongs to the lesson — no more, no fewer. The array length must match the lesson's current assignment count. Providing a subset or superset is an error.

**Response 200:** Array of all assignments in new order (same shape as GET /lessons/:lessonId/assignments).

**Status Codes:**
| Code | Condition |
|---|---|
| 200 | Reorder applied |
| 400 | Validation error or ID set mismatch |
| 401 | Not authenticated |
| 403 | Authenticated but not teacher or admin |
| 404 | Lesson not found (validation step) |
| 500 | Unexpected server error |

**Error Codes:**
| Code | HTTP | Condition |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Zod schema failure (e.g. not all UUIDs) |
| `INVALID_REORDER` | 400 | Provided IDs do not match lesson's assignment set |
| `NOT_FOUND` | 404 | Lesson does not exist |
| `INTERNAL_ERROR` | 500 | Unexpected failure |

---

### POST /assignments/:assignmentId/complete

Mark an assignment as complete for the authenticated user. Idempotent — calling again on an already-completed assignment updates `completedAt` and returns 201 without error.

**Auth:** `authenticate` (any role — students, teachers, admins)

**Path Parameters:**
| Param | Type | Description |
|---|---|---|
| `assignmentId` | UUID string | ID of the assignment to mark complete |

**Request Body:** None

**Response 201:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "assignmentId": "uuid",
  "completedAt": "ISO8601"
}
```

**Status Codes:**
| Code | Condition |
|---|---|
| 201 | Marked complete (or re-completed) |
| 401 | Not authenticated |
| 404 | Assignment not found |
| 500 | Unexpected server error |

**Error Codes:**
| Code | HTTP | Condition |
|---|---|---|
| `NOT_FOUND` | 404 | Assignment does not exist |
| `INTERNAL_ERROR` | 500 | Unexpected failure |

---

### DELETE /assignments/:assignmentId/complete

Remove the completion record for the authenticated user (unmark as complete). The student may re-complete the assignment later.

**Auth:** `authenticate` (any role — students, teachers, admins)

**Path Parameters:**
| Param | Type | Description |
|---|---|---|
| `assignmentId` | UUID string | ID of the assignment to unmark |

**Request Body:** None

**Response 204:** No content.

**Status Codes:**
| Code | Condition |
|---|---|
| 204 | Completion removed |
| 401 | Not authenticated |
| 404 | Assignment not found, or no completion record exists for this user |
| 500 | Unexpected server error |

**Error Codes:**
| Code | HTTP | Condition |
|---|---|---|
| `NOT_FOUND` | 404 | Assignment does not exist, or completion record not found |
| `INTERNAL_ERROR` | 500 | Unexpected failure |

---

## Endpoint Summary

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/lessons/:lessonId/assignments` | authenticated | List all assignments for a lesson |
| POST | `/lessons/:lessonId/assignments` | teacher, admin | Create a new assignment |
| PUT | `/lessons/:lessonId/assignments/reorder` | teacher, admin | Reorder assignments atomically |
| GET | `/assignments/:assignmentId` | authenticated | Get a single assignment |
| PUT | `/assignments/:assignmentId` | teacher, admin | Update an assignment |
| DELETE | `/assignments/:assignmentId` | teacher, admin | Delete an assignment |
| POST | `/assignments/:assignmentId/complete` | authenticated | Mark assignment complete |
| DELETE | `/assignments/:assignmentId/complete` | authenticated | Unmark assignment complete |
