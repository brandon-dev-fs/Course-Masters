---
id: cm-0028
title: Lesson Activities — Activity Bookmarks, Lesson Checklist, StudentVocabFlashCard Removal
stage: design
status: approved
approver: human
approved_at: 2026-06-06T00:00:00Z
---

# API Contract — cm-0028

All endpoints are prefixed `/api`. Responses are wrapped by `envelopeMiddleware`: `{ "data": <payload> }`. Errors follow `{ "error": { "code": "SNAKE_CASE_CODE", "message": "...", "details": {} } }`. 204 responses send no body.

Authentication: `authenticate()` is applied at the root router. All endpoints below require a valid session cookie. `req.user!.id` is safe to use in all handlers after authentication.

---

## Activity Bookmarks

### GET /assignments/:assignmentId/bookmark

Returns the requesting student's bookmark for the given assignment.

**Auth**: `authenticate()` (student, teacher, or admin — but the service scopes to `req.user!.id`, so only the student who created the bookmark will ever get a non-404 result)

**Path params**:
- `assignmentId` — UUID

**Response 200**:
```json
{
  "data": {
    "id": "uuid",
    "assignmentId": "uuid",
    "note": "Page 3, section on photosynthesis",
    "createdAt": "2026-06-04T10:00:00.000Z",
    "updatedAt": "2026-06-04T11:00:00.000Z"
  }
}
```

**Error cases**:

| Status | Code | Condition |
|--------|------|-----------|
| 401 | `UNAUTHENTICATED` | No valid session |
| 404 | `NOT_FOUND` | No bookmark exists for this `(userId, assignmentId)` pair |

---

### POST /assignments/:assignmentId/bookmark

Creates a new bookmark for the requesting student on the given assignment.

**Auth**: `authenticate()`

**Path params**:
- `assignmentId` — UUID

**Request body**:
```json
{
  "note": "string (required, 1–500 chars)"
}
```

**Zod schema**: `createBookmarkSchema`
- `note`: `z.string().min(1).max(500)`

**Response 201**:
```json
{
  "data": {
    "id": "uuid",
    "assignmentId": "uuid",
    "note": "Page 3, section on photosynthesis",
    "createdAt": "2026-06-04T10:00:00.000Z",
    "updatedAt": "2026-06-04T10:00:00.000Z"
  }
}
```

**Error cases**:

| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | Missing or invalid `note` field |
| 401 | `UNAUTHENTICATED` | No valid session |
| 404 | `NOT_FOUND` | `assignmentId` does not exist |
| 409 | `CONFLICT` | Bookmark already exists for this `(userId, assignmentId)` — use PUT to update |

---

### PUT /assignments/:assignmentId/bookmark

Creates or updates the requesting student's bookmark for the given assignment (upsert). Safe to call whether or not a bookmark already exists.

**Auth**: `authenticate()`

**Path params**:
- `assignmentId` — UUID

**Request body**:
```json
{
  "note": "string (required, 1–500 chars)"
}
```

**Zod schema**: `updateBookmarkSchema`
- `note`: `z.string().min(1).max(500)`

**Response 200**:
```json
{
  "data": {
    "id": "uuid",
    "assignmentId": "uuid",
    "note": "Updated note text",
    "createdAt": "2026-06-04T10:00:00.000Z",
    "updatedAt": "2026-06-04T12:00:00.000Z"
  }
}
```

**Error cases**:

| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | Missing or invalid `note` field |
| 401 | `UNAUTHENTICATED` | No valid session |
| 404 | `NOT_FOUND` | `assignmentId` does not exist |

---

### DELETE /assignments/:assignmentId/bookmark

Removes the requesting student's bookmark for the given assignment.

**Auth**: `authenticate()`

**Path params**:
- `assignmentId` — UUID

**Response 204**: No body.

**Error cases**:

| Status | Code | Condition |
|--------|------|-----------|
| 401 | `UNAUTHENTICATED` | No valid session |
| 404 | `NOT_FOUND` | No bookmark exists for this `(userId, assignmentId)` pair |

---

## Lesson Checklist

### GET /lessons/:lessonId/checklist

Returns all checklist items for the requesting student in the given lesson, ordered by `order asc`.

**Auth**: `authenticate()`

**Path params**:
- `lessonId` — UUID

**Response 200**:
```json
{
  "data": [
    {
      "id": "uuid",
      "text": "Read introduction",
      "checked": false,
      "order": 1,
      "createdAt": "2026-06-04T10:00:00.000Z",
      "updatedAt": "2026-06-04T10:00:00.000Z"
    },
    {
      "id": "uuid",
      "text": "Complete vocab exercise",
      "checked": true,
      "order": 2,
      "createdAt": "2026-06-04T10:05:00.000Z",
      "updatedAt": "2026-06-04T10:30:00.000Z"
    }
  ]
}
```

Returns an empty array `[]` if the student has no items for this lesson. Never returns 404 for an empty list.

**Error cases**:

| Status | Code | Condition |
|--------|------|-----------|
| 401 | `UNAUTHENTICATED` | No valid session |
| 404 | `NOT_FOUND` | `lessonId` does not exist |

---

### POST /lessons/:lessonId/checklist

Creates a new checklist item for the requesting student. The `order` is automatically assigned as `max(existing order for this student/lesson) + 1`, defaulting to 1 if no items exist.

**Auth**: `authenticate()`

**Path params**:
- `lessonId` — UUID

**Request body**:
```json
{
  "text": "string (required, 1–200 chars)"
}
```

**Zod schema**: `createChecklistItemSchema`
- `text`: `z.string().min(1).max(200)`

**Response 201**:
```json
{
  "data": {
    "id": "uuid",
    "text": "Read introduction",
    "checked": false,
    "order": 1,
    "createdAt": "2026-06-04T10:00:00.000Z",
    "updatedAt": "2026-06-04T10:00:00.000Z"
  }
}
```

**Error cases**:

| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | Missing or invalid `text` field |
| 401 | `UNAUTHENTICATED` | No valid session |
| 404 | `NOT_FOUND` | `lessonId` does not exist |

---

### PUT /checklist-items/:itemId

Updates the `text` and/or `checked` state of a single checklist item. At least one field must be provided.

**Auth**: `authenticate()`

**Path params**:
- `itemId` — UUID

**Request body** (all fields optional, but at least one required):
```json
{
  "text": "string (optional, 1–200 chars)",
  "checked": "boolean (optional)"
}
```

**Zod schema**: `updateChecklistItemSchema`
- `text`: `z.string().min(1).max(200).optional()`
- `checked`: `z.boolean().optional()`
- `.refine`: at least one of `text` or `checked` must be provided

**Response 200**:
```json
{
  "data": {
    "id": "uuid",
    "text": "Read introduction",
    "checked": true,
    "order": 1,
    "createdAt": "2026-06-04T10:00:00.000Z",
    "updatedAt": "2026-06-04T11:00:00.000Z"
  }
}
```

**Error cases**:

| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | Neither `text` nor `checked` provided, or field type is invalid |
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `FORBIDDEN` | Item exists but belongs to a different user |
| 404 | `NOT_FOUND` | `itemId` does not exist |

---

### DELETE /checklist-items/:itemId

Hard-deletes a single checklist item.

**Auth**: `authenticate()`

**Path params**:
- `itemId` — UUID

**Response 204**: No body.

**Error cases**:

| Status | Code | Condition |
|--------|------|-----------|
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `FORBIDDEN` | Item exists but belongs to a different user |
| 404 | `NOT_FOUND` | `itemId` does not exist |

---

### PUT /lessons/:lessonId/checklist/reorder

Reorders all checklist items for the requesting student in the given lesson. The `itemIds` array must contain exactly all item IDs belonging to this student for this lesson, in the desired new order. Partial reorder lists are rejected.

**Auth**: `authenticate()`

**Path params**:
- `lessonId` — UUID

**Request body**:
```json
{
  "itemIds": ["uuid", "uuid", "uuid"]
}
```

**Zod schema**: `reorderChecklistSchema`
- `itemIds`: `z.array(z.string().uuid()).min(1)`

**Response 200**: Returns the full updated checklist for this student/lesson, ordered by the new `order` values.

```json
{
  "data": [
    {
      "id": "uuid",
      "text": "Complete vocab exercise",
      "checked": true,
      "order": 1,
      "createdAt": "2026-06-04T10:05:00.000Z",
      "updatedAt": "2026-06-04T12:00:00.000Z"
    },
    {
      "id": "uuid",
      "text": "Read introduction",
      "checked": false,
      "order": 2,
      "createdAt": "2026-06-04T10:00:00.000Z",
      "updatedAt": "2026-06-04T12:00:00.000Z"
    }
  ]
}
```

**Error cases**:

| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | `itemIds` is empty, contains non-UUIDs, contains IDs not owned by the student, or does not include all items for this lesson |
| 401 | `UNAUTHENTICATED` | No valid session |
| 404 | `NOT_FOUND` | `lessonId` does not exist |

---

## Modified Endpoint — Assignment List

### GET /lessons/:lessonId/assignments (modified)

This existing endpoint is modified to include each assignment's bookmark for the requesting student. No path, method, or status code changes.

**Change**: The `Assignment` object in the response array gains a `bookmark` field:

```json
{
  "data": [
    {
      "id": "uuid",
      "lessonId": "uuid",
      "order": 1,
      "title": "Introduction Reading",
      "objective": null,
      "type": "reading",
      "completed": false,
      "readingAssignment": { "url": "https://example.com", "description": null, "estimatedMinutes": null },
      "noteAssignment": null,
      "videoAssignment": null,
      "vocabAssignment": null,
      "practiceProblemAssignment": null,
      "bookmark": {
        "id": "uuid",
        "note": "Page 3 is most important",
        "updatedAt": "2026-06-04T10:00:00.000Z"
      }
    }
  ]
}
```

`bookmark` is `null` when the student has no bookmark for the assignment. The `userId` field is not included in the bookmark select — it is redundant because the bookmark always belongs to the requesting user.

**Implementation note**: The `userId` from `req.user!.id` is passed into `findAllByLesson` (already a parameter) and forwarded to `buildAssignmentInclude(userId)`. When `userId` is `null` (e.g., in tests or internal calls), the bookmark include is omitted.

---

## Vocab Assignment Flashcards

Students can save individual vocab entries from a vocab assignment as personal flashcards. These are stored as `StudentVocabAssignmentFlashCard` records. The flash card study experience uses the same student flash cards panel already present in the lesson.

### GET /lessons/:lessonId/assignments/vocab-flashcards

Returns all vocab entries the requesting student has saved as flashcards within the given lesson (across all vocab assignments in that lesson), ordered by entry `order asc`.

**Auth**: `authenticate()`

**Path params**:
- `lessonId` — UUID

**Response 200**:
```json
{
  "data": [
    {
      "id": "uuid",
      "term": "photosynthesis",
      "definition": "The process by which plants convert sunlight to energy",
      "example": "Leaves perform photosynthesis using chlorophyll.",
      "order": 1
    }
  ]
}
```

Returns an empty array `[]` if the student has no saved vocab flashcards in this lesson.

**Error cases**:

| Status | Code | Condition |
|--------|------|-----------|
| 401 | `UNAUTHENTICATED` | No valid session |
| 404 | `NOT_FOUND` | `lessonId` does not exist |

---

### POST /vocab-entries/:entryId/flashcard

Saves a single vocab assignment entry as a personal flashcard for the requesting student.

**Auth**: `authenticate()`

**Path params**:
- `entryId` — UUID

**Request body**: None.

**Response 201**:
```json
{
  "data": {
    "id": "uuid",
    "entryId": "uuid",
    "createdAt": "2026-06-04T10:00:00.000Z"
  }
}
```

**Error cases**:

| Status | Code | Condition |
|--------|------|-----------|
| 401 | `UNAUTHENTICATED` | No valid session |
| 404 | `NOT_FOUND` | `entryId` does not exist |
| 409 | `CONFLICT` | Student has already saved this entry as a flashcard |

---

### DELETE /vocab-entries/:entryId/flashcard

Removes the requesting student's saved flashcard for the given vocab entry.

**Auth**: `authenticate()`

**Path params**:
- `entryId` — UUID

**Response 204**: No body.

**Error cases**:

| Status | Code | Condition |
|--------|------|-----------|
| 401 | `UNAUTHENTICATED` | No valid session |
| 404 | `NOT_FOUND` | No saved flashcard exists for this `(userId, entryId)` pair |

---

## Route Registration Summary

| Method | Path | Router | Notes |
|--------|------|--------|-------|
| GET | `/assignments/:assignmentId/bookmark` | `assignmentsRouter` via `bookmarkRouter` | Nested sub-router with `mergeParams: true` |
| POST | `/assignments/:assignmentId/bookmark` | `assignmentsRouter` via `bookmarkRouter` | |
| PUT | `/assignments/:assignmentId/bookmark` | `assignmentsRouter` via `bookmarkRouter` | |
| DELETE | `/assignments/:assignmentId/bookmark` | `assignmentsRouter` via `bookmarkRouter` | |
| GET | `/lessons/:lessonId/checklist` | `lessonChecklistRouter` (mounted in `routes/index.ts`) | `mergeParams: true` |
| POST | `/lessons/:lessonId/checklist` | `lessonChecklistRouter` | |
| PUT | `/lessons/:lessonId/checklist/reorder` | `lessonChecklistRouter` | Must be registered before `/:itemId` — no param conflict since this is the lesson router |
| PUT | `/checklist-items/:itemId` | `checklistItemsRouter` (mounted in `routes/index.ts`) | Flat router |
| DELETE | `/checklist-items/:itemId` | `checklistItemsRouter` | Flat router |
| GET | `/lessons/:lessonId/assignments/vocab-flashcards` | `lessonAssignmentsRouter` (sub-router of `lessonChecklistRouter`) | Must be registered before `/:assignmentId` to avoid param capture |
| POST | `/vocab-entries/:entryId/flashcard` | `vocabEntriesRouter` (mounted in `routes/index.ts`) | Flat router |
| DELETE | `/vocab-entries/:entryId/flashcard` | `vocabEntriesRouter` | Flat router |

---

## Response Field Exclusions

- `ActivityBookmark.userId` is never returned in API responses — scoped by auth, redundant to the client.
- `LessonChecklistItem.userId` and `LessonChecklistItem.lessonId` are not returned in item-level responses (the client knows both from context). Only `id`, `text`, `checked`, `order`, `createdAt`, `updatedAt` are returned.
- `ActivityBookmark.assignmentId` is included in single-bookmark responses (GET/POST/PUT) but omitted from the embedded `bookmark` object within assignment list items (the client already knows the `assignmentId`).
- `StudentVocabAssignmentFlashCard.userId` is never returned — redundant. Only `id`, `entryId`, `createdAt` are returned for POST responses. GET responses return entry data only (term, definition, example, order).
