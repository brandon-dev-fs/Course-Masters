---
id: cm-0001
title: Per-Question Calculator Toggle
stage: design
status: approved
approver: human
approved_at: 2026-04-19T00:00:00Z
---

# cm-0001 API Contract: Per-Question Calculator Toggle

This document is the immutable interface contract for cm-0001. Coder agents must implement exactly what is specified here. Any required deviation is a stop-and-escalate event back to `/design`.

---

## Shared Conventions

**Base URL:** `/api`

**Authentication:** All endpoints below require a valid session cookie. The global `authenticate()` middleware is applied at the root router level. A missing or expired session returns `401 UNAUTHENTICATED` on every protected route.

**Error envelope (all errors):**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
```

**Question object shape** (updated — appears in all assessment responses after migration):
```json
{
  "id": "uuid",
  "type": "multiple_choice | true_false | matching | fill_in_blank",
  "question": "string",
  "content": {},
  "order": 0,
  "assessmentId": "uuid",
  "calculatorEnabled": false
}
```
The `calculatorEnabled` field is new. All other fields are unchanged from the existing contract.

---

## Endpoint 1: Update Assessment (existing — extended)

### `PUT /api/assessments/:assessmentId`

Updates the full question list for an assessment. Questions are replaced wholesale (delete-all, re-create). Now accepts `calculatorEnabled` per question.

**Auth:** Session required. Role: `teacher` or `admin`.

**Path Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `assessmentId` | UUID string | ID of the assessment to update |

**Request Body:**
```json
{
  "questions": [
    {
      "type": "multiple_choice",
      "question": "What is 2 + 2?",
      "content": { "options": ["3", "4", "5"], "correctIndex": 1 },
      "order": 0,
      "calculatorEnabled": true
    }
  ]
}
```

**Request Body Schema (Zod-compatible):**
```ts
{
  questions: Array<{
    type: "multiple_choice" | "true_false" | "matching" | "fill_in_blank",  // default: "multiple_choice"
    question: string,          // min length: 1
    content: Record<string, unknown>,
    order: number,             // integer >= 0
    calculatorEnabled: boolean // default: false — NEW FIELD, optional
  }>                           // min 1 item
}
```

**Response `200 OK`:**
```json
{
  "id": "uuid",
  "type": "lesson_quiz | unit_quiz | course_exam",
  "lessonId": "uuid | null",
  "unitId": "uuid | null",
  "courseId": "uuid | null",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601",
  "questions": [
    {
      "id": "uuid",
      "type": "multiple_choice",
      "question": "string",
      "content": {},
      "order": 0,
      "assessmentId": "uuid",
      "calculatorEnabled": true
    }
  ]
}
```

**Status Codes:**

| Status | Code | Condition |
|---|---|---|
| 200 | — | Success |
| 400 | `VALIDATION_FAILED` | Request body fails Zod validation; `details` contains field-level errors |
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `FORBIDDEN` | Authenticated user is not `teacher` or `admin` |
| 404 | `NOT_FOUND` | Assessment with `assessmentId` does not exist |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

**Notes:**
- `calculatorEnabled` is optional in the request body. If omitted, it defaults to `false` for the newly created question records.
- The entire question list is replaced on each PUT. To preserve `calculatorEnabled` state on existing questions, the client must include the current `calculatorEnabled` value for each question in the request body.

---

## Endpoint 2: Create Assessment (existing — extended)

### `POST /api/lessons/:lessonId/assessment`
### `POST /api/units/:unitId/assessment`
### `POST /api/courses/:courseId/assessment`

Creates an assessment with its questions. Now accepts `calculatorEnabled` per question. The request/response body shape is identical to PUT above (same `questions` array). The question shape change is documented here for completeness; the full endpoint contract is unchanged otherwise.

**Auth:** Session required. Role: `teacher` or `admin`.

**Request body:** Same schema as PUT `/api/assessments/:assessmentId` above.

**Response `201 Created`:** Same shape as PUT `200` response above.

**Status Codes:** Same as PUT above except 201 replaces 200 on success.

---

## Endpoint 3: Bulk Update Calculator Flag (new)

### `PATCH /api/assessments/:assessmentId/questions/calculator`

Sets `calculatorEnabled` to the same value for a specified list of questions within an assessment. Intended for the teacher "enable/disable all" bulk action in the assessment editor.

**Auth:** Session required. Role: `teacher` or `admin`.

**Path Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `assessmentId` | UUID string | ID of the assessment whose questions are being updated |

**Request Body:**
```json
{
  "questionIds": ["uuid1", "uuid2", "uuid3"],
  "calculatorEnabled": true
}
```

**Request Body Schema (Zod-compatible):**
```ts
{
  questionIds: string[],     // array of UUID strings, min length: 1
  calculatorEnabled: boolean // the value to apply to all specified questions
}
```

**Response `200 OK`:**

Returns the full assessment with all questions (not only the updated subset), ordered by `order` ascending. This allows the client to synchronize its full question list in a single response.

```json
{
  "id": "uuid",
  "type": "lesson_quiz | unit_quiz | course_exam",
  "lessonId": "uuid | null",
  "unitId": "uuid | null",
  "courseId": "uuid | null",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601",
  "questions": [
    {
      "id": "uuid",
      "type": "multiple_choice",
      "question": "string",
      "content": {},
      "order": 0,
      "assessmentId": "uuid",
      "calculatorEnabled": true
    }
  ]
}
```

**Status Codes:**

| Status | Code | Condition |
|---|---|---|
| 200 | — | Success |
| 400 | `VALIDATION_FAILED` | Request body fails Zod validation; `details` contains field-level errors |
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `FORBIDDEN` | Authenticated user is not `teacher` or `admin` |
| 404 | `NOT_FOUND` | Assessment with `assessmentId` does not exist |
| 422 | `QUESTION_NOT_IN_ASSESSMENT` | One or more `questionIds` do not belong to the specified assessment |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

**Notes:**
- The `questionIds` array may contain a subset of the assessment's questions (partial update) or all of them (full bulk apply). The server does not infer "all questions" from an empty array — `questionIds` must always be explicit.
- If any `questionId` in the array does not belong to the specified assessment, the entire operation is rejected with `422 QUESTION_NOT_IN_ASSESSMENT`. No partial updates are applied.
- The response always returns the complete assessment question list, not only the updated questions. The client should replace its local question list with the response data.

---

## Assessment GET Response (updated)

### `GET /api/lessons/:lessonId/assessment`
### `GET /api/units/:unitId/assessment`
### `GET /api/courses/:courseId/assessment`

These existing endpoints are unchanged in their request shape. Their responses now include `calculatorEnabled` on each question object automatically, because the field is added to the database schema with a default value and Prisma returns all scalar fields by default.

**Affected response shape** — each question in `questions[]` now includes:
```json
{
  "id": "uuid",
  "type": "multiple_choice",
  "question": "string",
  "content": {},
  "order": 0,
  "assessmentId": "uuid",
  "calculatorEnabled": false
}
```

No request changes needed. No client-side breaking change — `calculatorEnabled` is additive.

---

## Complete Error Code Reference (this feature)

| Code | HTTP Status | Description |
|---|---|---|
| `UNAUTHENTICATED` | 401 | No valid session cookie |
| `FORBIDDEN` | 403 | Role is not `teacher` or `admin` |
| `NOT_FOUND` | 404 | Assessment or question not found |
| `VALIDATION_FAILED` | 400 | Zod validation failure; check `details` for field errors |
| `QUESTION_NOT_IN_ASSESSMENT` | 422 | Bulk update: one or more `questionIds` not in the given assessment |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
