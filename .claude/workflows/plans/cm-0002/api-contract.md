---
id: cm-0002
title: Redesign Lesson Detail Page Layout
stage: design
status: approved
approver: human
approved_at: 2026-04-27T00:00:00Z
---

# API Contract — cm-0002: Redesign Lesson Detail Page Layout

This document is the **immutable interface contract** between the backend and frontend for this feature. Coder agents must not deviate from these shapes. Any required change after approval is a stop-and-escalate event back to `/design`.

---

## Overview of Changes

| Endpoint | Change Type | Summary |
|---|---|---|
| `PUT /api/resources/:resourceId` | Modified | Accepts new optional `isRequired` field |
| `PUT /api/tools/:toolId` | Modified | Accepts new optional `isRequired` field |
| `GET /api/lessons/:lessonId/resources` | Modified | Response now includes `isRequired` per resource |
| `GET /api/lessons/:lessonId/tools` | Modified | Response now includes `isRequired` per tool |
| `GET /api/lessons/:lessonId/completions` | Modified | Response shape enriched with `requiredItems` |
| `POST /api/assessments/:assessmentId/attempts` | Modified | New 400 error when required assignments are incomplete (lesson_quiz only) |

No new endpoint paths. No route path changes.

---

## Endpoint Contracts

---

### 1. GET /api/lessons/:lessonId/resources

**Auth:** `authenticate` (all authenticated users)

**Path params:**
- `lessonId` — UUID

**Query params:**
- `type` — optional, one of `note | video | lecture`

**Response 200:**
```json
[
  {
    "id": "uuid",
    "type": "note | video | lecture",
    "title": "string",
    "content": {},
    "order": 0,
    "lessonId": "uuid",
    "isRequired": true
  }
]
```

**Notes:** `isRequired` defaults to `true` for all existing and new resources. No client behavior change except that `isRequired` is now available for rendering the optional/required badge in the sidebar.

**Status Codes:**
- `200` — success
- `401` — not authenticated
- `404` — lesson not found (via Prisma P2025 handler)

---

### 2. GET /api/lessons/:lessonId/tools

**Auth:** `authenticate` (all authenticated users)

**Path params:**
- `lessonId` — UUID

**Query params:**
- `type` — optional, one of `flash_card | practice_problem | vocab`

**Response 200:**
```json
[
  {
    "id": "uuid",
    "type": "flash_card | practice_problem | vocab",
    "title": "string",
    "content": {},
    "order": 0,
    "lessonId": "uuid",
    "isRequired": true
  }
]
```

**Notes:** Same as resources — `isRequired` is now included in every tool record.

**Status Codes:**
- `200` — success
- `401` — not authenticated
- `404` — lesson not found

---

### 3. PUT /api/resources/:resourceId

**Auth:** `authenticate` + `authorize(['teacher', 'admin'])`

**Path params:**
- `resourceId` — UUID

**Request body** (all fields optional, at least one expected):
```json
{
  "type": "note | video | lecture",
  "title": "string (min 1)",
  "content": {},
  "order": 0,
  "isRequired": true
}
```

**Zod schema (updateLessonResourceSchema):**
```typescript
z.object({
  type: z.enum(['note', 'video', 'lecture']).optional(),
  title: z.string().min(1).optional(),
  content: z.record(z.any()).optional(),
  order: z.number().int().min(0).optional(),
  isRequired: z.boolean().optional(),
})
```

**Response 200:**
```json
{
  "id": "uuid",
  "type": "note | video | lecture",
  "title": "string",
  "content": {},
  "order": 0,
  "lessonId": "uuid",
  "isRequired": true
}
```

**Status Codes:**
- `200` — updated successfully
- `400` — validation error (`VALIDATION_ERROR`)
- `401` — not authenticated
- `403` — not teacher or admin (`FORBIDDEN`)
- `404` — resource not found (`NOT_FOUND`)

**Error codes:**
| Code | Status | Trigger |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Invalid body shape |
| `FORBIDDEN` | 403 | Caller role is `student` |
| `NOT_FOUND` | 404 | `resourceId` does not exist |

---

### 4. PUT /api/tools/:toolId

**Auth:** `authenticate` + `authorize(['teacher', 'admin'])`

**Path params:**
- `toolId` — UUID

**Request body** (all fields optional, at least one expected):
```json
{
  "type": "flash_card | practice_problem | vocab",
  "title": "string (min 1)",
  "content": {},
  "order": 0,
  "isRequired": true
}
```

**Zod schema (updateLessonToolSchema):**
```typescript
z.object({
  type: z.enum(['flash_card', 'practice_problem', 'vocab']).optional(),
  title: z.string().min(1).optional(),
  content: z.record(z.any()).optional(),
  order: z.number().int().min(0).optional(),
  isRequired: z.boolean().optional(),
})
```

**Response 200:**
```json
{
  "id": "uuid",
  "type": "flash_card | practice_problem | vocab",
  "title": "string",
  "content": {},
  "order": 0,
  "lessonId": "uuid",
  "isRequired": true
}
```

**Status Codes:**
- `200` — updated successfully
- `400` — validation error (`VALIDATION_ERROR`)
- `401` — not authenticated
- `403` — not teacher or admin (`FORBIDDEN`)
- `404` — tool not found (`NOT_FOUND`)

**Error codes:**
| Code | Status | Trigger |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Invalid body shape |
| `FORBIDDEN` | 403 | Caller role is `student` |
| `NOT_FOUND` | 404 | `toolId` does not exist |

---

### 5. GET /api/lessons/:lessonId/completions

**Auth:** `authenticate` (all authenticated users; returns data scoped to the calling user)

**Path params:**
- `lessonId` — UUID

**Response 200:**
```json
{
  "completions": [
    {
      "resourceType": "resource | tool",
      "resourceId": "uuid",
      "isRequired": true
    }
  ],
  "requiredItems": [
    {
      "resourceType": "resource | tool",
      "resourceId": "uuid",
      "isRequired": true
    }
  ]
}
```

**Field descriptions:**
- `completions` — array of items this user has marked complete for this lesson, each annotated with `isRequired`
- `requiredItems` — full list of all resources and tools for the lesson, with their `isRequired` flag. This allows the client to determine quiz lock state without fetching resources/tools separately.

**Notes:**
- `resourceType` values distinguish between `LessonResource` records (`"resource"`) and `LessonTool` records (`"tool"`). This matches the existing `resourceType` string stored in `LessonResourceCompletion`.
- A resource or tool with `isRequired: false` that the user has completed will still appear in `completions` (completions are tracked regardless of required status).
- The quiz unlock condition (client-side): all items in `requiredItems` where `isRequired === true` have a matching entry in `completions`.

**Status Codes:**
- `200` — success
- `401` — not authenticated
- `404` — lesson not found

---

### 6. POST /api/assessments/:assessmentId/attempts

**Auth:** `authenticate` (all authenticated users)

**Path params:**
- `assessmentId` — UUID

**Request body:** unchanged from existing contract

**Response 200/201:** unchanged from existing contract

**New error — required assignments incomplete (lesson_quiz only):**

**Status 400:**
```json
{
  "error": {
    "code": "REQUIRED_ASSIGNMENTS_INCOMPLETE",
    "message": "All required assignments must be completed before taking the quiz",
    "details": {}
  }
}
```

**Status Codes (additions only):**
- `400` `REQUIRED_ASSIGNMENTS_INCOMPLETE` — caller is attempting a `lesson_quiz` attempt but has not completed all items where `isRequired === true` for that lesson

**Notes:**
- This guard only applies to assessments of type `lesson_quiz`. Unit quiz and course exam attempts are not affected.
- If a lesson has zero required resources and zero required tools (all optional or none), the guard passes immediately.
- The guard is server-side enforcement of the same lock the client shows in the sidebar (FR-06, FR-08).

---

## Unchanged Endpoints

The following endpoints are called by this feature's UI but their contracts are unchanged:

| Endpoint | Used For |
|---|---|
| `GET /api/courses/:courseId/units` | Unit dropdown in sidebar |
| `GET /api/units/:unitId/lessons` | Lesson list in sidebar |
| `GET /api/units/:unitId/lessons/:lessonId` | Current lesson data |
| `POST /api/lessons/:lessonId/completions` | Toggle resource completion |
| `GET /api/courses/:courseId/progress` | Course progress |
| `GET /api/courses/:courseId/units/:unitId/progress` | Unit progress |
| `GET/POST/DELETE /api/lessons/:lessonId/student-notes` | Student notes in right aside |
| `POST /api/lessons/:lessonId/assessment` | Quiz access |

---

## Breaking Change Analysis

**`GET /api/lessons/:lessonId/completions` response shape change** is additive:
- Existing `completions` array is preserved; it gains a new `isRequired` field per entry.
- New `requiredItems` array is added at the top level.
- Any existing client code reading only `completions[].resourceType` and `completions[].resourceId` continues to work.

**`GET /api/lessons/:lessonId/resources` and tools** responses gain `isRequired` field — purely additive.

**`PUT /api/resources/:resourceId` and tools** request body gains optional `isRequired` — purely additive; existing callers sending only previous fields are unaffected.

**`POST /api/assessments/:assessmentId/attempts`** gains a new 400 error case. This is a behavioral change for `lesson_quiz` attempts. Frontend must handle `REQUIRED_ASSIGNMENTS_INCOMPLETE` and display appropriate messaging.
