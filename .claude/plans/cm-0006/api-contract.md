---
id: cm-0006
title: Standardize API Response Envelope
stage: design
status: approved
approver: human
approved_at: 2026-05-06T00:00:00Z
---

# API Contract — Standardize API Response Envelope

## Envelope Shape

All successful JSON responses from non-auth routes now use:

```json
{ "data": <payload> }
```

Where `<payload>` is the value previously returned as the top-level body. The `data` field may be an object, an array, or any JSON-serializable value depending on the endpoint.

**Error responses are unchanged.** They continue to use:

```json
{ "error": { "code": "ERROR_CODE", "message": "Human-readable message" } }
```

---

## Exclusions (No Change)

| Scope | Reason |
|---|---|
| `DELETE` endpoints returning 204 | No body is sent; envelope is not applicable |
| `/api/auth/*` | Controlled by better-auth; not modified |

---

## Endpoint Contracts

### Health

#### `GET /api/health`

- **Auth**: Public (no session required)
- **Response 200**:
  ```json
  { "data": { "status": "ok" } }
  ```

---

### Courses

#### `GET /api/courses`

- **Auth**: `authenticate`
- **Response 200**:
  ```json
  { "data": [ { "id": "uuid", "title": "string", "description": "string", "createdAt": "ISO8601", "updatedAt": "ISO8601" } ] }
  ```

#### `POST /api/courses`

- **Auth**: `authenticate`
- **Response 201**:
  ```json
  { "data": { "id": "uuid", "title": "string", "description": "string", "createdAt": "ISO8601", "updatedAt": "ISO8601" } }
  ```
- **Status Codes**: 400 (validation), 401 (unauthenticated)

#### `GET /api/courses/:courseId`

- **Auth**: `authenticate`
- **Response 200**:
  ```json
  { "data": { "id": "uuid", "title": "string", "description": "string", "units": [...], "createdAt": "ISO8601", "updatedAt": "ISO8601" } }
  ```
- **Status Codes**: 401, 404

#### `PUT /api/courses/:courseId`

- **Auth**: `authenticate`
- **Response 200**:
  ```json
  { "data": { "id": "uuid", "title": "string", "description": "string", "updatedAt": "ISO8601" } }
  ```
- **Status Codes**: 400, 401, 403, 404

#### `DELETE /api/courses/:courseId`

- **Auth**: `authenticate`
- **Response**: `204 No Content` — **no body, no envelope**
- **Status Codes**: 401, 403, 404

---

### Units

#### `GET /api/courses/:courseId/units`

- **Auth**: `authenticate`
- **Response 200**:
  ```json
  { "data": [ { "id": "uuid", "title": "string", "order": 0, "courseId": "uuid" } ] }
  ```

#### `POST /api/courses/:courseId/units`

- **Auth**: `authenticate`
- **Response 201**:
  ```json
  { "data": { "id": "uuid", "title": "string", "order": 0, "courseId": "uuid" } }
  ```
- **Status Codes**: 400, 401, 403, 404

#### `GET /api/courses/:courseId/units/:unitId`

- **Auth**: `authenticate`
- **Response 200**:
  ```json
  { "data": { "id": "uuid", "title": "string", "order": 0, "courseId": "uuid", "lessons": [...] } }
  ```
- **Status Codes**: 401, 404

#### `PUT /api/courses/:courseId/units/:unitId`

- **Auth**: `authenticate`
- **Response 200**:
  ```json
  { "data": { "id": "uuid", "title": "string", "order": 0, "courseId": "uuid" } }
  ```
- **Status Codes**: 400, 401, 403, 404

#### `DELETE /api/courses/:courseId/units/:unitId`

- **Response**: `204 No Content` — **no body, no envelope**

---

### Lessons

#### `GET /api/units/:unitId/lessons`

- **Auth**: `authenticate`
- **Response 200**:
  ```json
  { "data": [ { "id": "uuid", "title": "string", "order": 0, "unitId": "uuid" } ] }
  ```

#### `POST /api/units/:unitId/lessons`

- **Auth**: `authenticate`
- **Response 201**:
  ```json
  { "data": { "id": "uuid", "title": "string", "order": 0, "unitId": "uuid" } }
  ```
- **Status Codes**: 400, 401, 403, 404

#### `GET /api/units/:unitId/lessons/:lessonId`

- **Auth**: `authenticate`
- **Response 200**:
  ```json
  { "data": { "id": "uuid", "title": "string", "order": 0, "unitId": "uuid" } }
  ```
- **Status Codes**: 401, 404

#### `PUT /api/units/:unitId/lessons/:lessonId`

- **Auth**: `authenticate`
- **Response 200**:
  ```json
  { "data": { "id": "uuid", "title": "string", "order": 0, "unitId": "uuid" } }
  ```
- **Status Codes**: 400, 401, 403, 404

#### `DELETE /api/units/:unitId/lessons/:lessonId`

- **Response**: `204 No Content` — **no body, no envelope**

---

### Lesson Resources

#### `GET /api/lessons/:lessonId/resources`

- **Auth**: `authenticate`
- **Query**: `?type=note|video|lecture` (optional filter)
- **Response 200**:
  ```json
  { "data": [ { "id": "uuid", "type": "note", "content": {}, "lessonId": "uuid" } ] }
  ```

#### `POST /api/lessons/:lessonId/resources`

- **Auth**: `authenticate`
- **Response 201**:
  ```json
  { "data": { "id": "uuid", "type": "note", "content": {}, "lessonId": "uuid" } }
  ```
- **Status Codes**: 400, 401, 403, 404

#### `PUT /api/resources/:resourceId`

- **Auth**: `authenticate`
- **Response 200**:
  ```json
  { "data": { "id": "uuid", "type": "note", "content": {}, "lessonId": "uuid" } }
  ```
- **Status Codes**: 400, 401, 403, 404

#### `DELETE /api/resources/:resourceId`

- **Response**: `204 No Content` — **no body, no envelope**

---

### Lesson Tools

#### `GET /api/lessons/:lessonId/tools`

- **Auth**: `authenticate`
- **Query**: `?type=flash_card|practice_problem|vocab` (optional filter)
- **Response 200**:
  ```json
  { "data": [ { "id": "uuid", "type": "flash_card", "content": {}, "lessonId": "uuid" } ] }
  ```

#### `POST /api/lessons/:lessonId/tools`

- **Auth**: `authenticate`
- **Response 201**:
  ```json
  { "data": { "id": "uuid", "type": "flash_card", "content": {}, "lessonId": "uuid" } }
  ```
- **Status Codes**: 400, 401, 403, 404

#### `PUT /api/tools/:toolId`

- **Auth**: `authenticate`
- **Response 200**:
  ```json
  { "data": { "id": "uuid", "type": "flash_card", "content": {}, "lessonId": "uuid" } }
  ```
- **Status Codes**: 400, 401, 403, 404

#### `DELETE /api/tools/:toolId`

- **Response**: `204 No Content` — **no body, no envelope**

---

### Student Notes

#### `GET /api/lessons/:lessonId/student-notes`

- **Auth**: `authenticate`
- **Response 200**:
  ```json
  { "data": { "id": "uuid", "content": "string", "lessonId": "uuid", "userId": "uuid" } }
  ```
  Note: returns a single note object (unique per user+lesson), not an array.

#### `POST /api/lessons/:lessonId/student-notes`

- **Auth**: `authenticate`
- **Response 201**:
  ```json
  { "data": { "id": "uuid", "content": "string", "lessonId": "uuid", "userId": "uuid" } }
  ```
- **Status Codes**: 400, 401, 409 (note already exists)

#### `DELETE /api/student-notes/:studentNoteId`

- **Response**: `204 No Content` — **no body, no envelope**

---

### YouTube

#### `GET /api/youtube/title`

- **Auth**: `authenticate`
- **Query**: `?url=<youtube_url>`
- **Response 200**:
  ```json
  { "data": { "title": "string" } }
  ```
- **Status Codes**: 400, 401, 502 (upstream YouTube error)

---

### Assessments

#### `GET /api/lessons/:lessonId/assessment`

- **Auth**: `authenticate`
- **Response 200**:
  ```json
  { "data": { "id": "uuid", "type": "lesson_quiz", "questions": [...] } }
  ```
- **Status Codes**: 401, 404

#### `POST /api/lessons/:lessonId/assessment`

- **Auth**: `authenticate`
- **Response 201**:
  ```json
  { "data": { "id": "uuid", "type": "lesson_quiz", "questions": [...] } }
  ```
- **Status Codes**: 400, 401, 403, 404, 409

#### `GET /api/units/:unitId/assessment`

- **Auth**: `authenticate`
- **Response 200**:
  ```json
  { "data": { "id": "uuid", "type": "unit_quiz", "questions": [...] } }
  ```
- **Status Codes**: 401, 404

#### `POST /api/units/:unitId/assessment`

- **Auth**: `authenticate`
- **Response 201**:
  ```json
  { "data": { "id": "uuid", "type": "unit_quiz", "questions": [...] } }
  ```
- **Status Codes**: 400, 401, 403, 404, 409

#### `GET /api/courses/:courseId/assessment`

- **Auth**: `authenticate`
- **Response 200**:
  ```json
  { "data": { "id": "uuid", "type": "course_exam", "questions": [...] } }
  ```
- **Status Codes**: 401, 404

#### `POST /api/courses/:courseId/assessment`

- **Auth**: `authenticate`
- **Response 201**:
  ```json
  { "data": { "id": "uuid", "type": "course_exam", "questions": [...] } }
  ```
- **Status Codes**: 400, 401, 403, 404, 409

#### `PUT /api/assessments/:assessmentId`

- **Auth**: `authenticate`
- **Response 200**:
  ```json
  { "data": { "id": "uuid", "type": "lesson_quiz", "questions": [...] } }
  ```
- **Status Codes**: 400, 401, 403, 404

#### `GET /api/assessments/:assessmentId/attempts`

- **Auth**: `authenticate`
- **Response 200**:
  ```json
  { "data": [ { "id": "uuid", "passed": true, "score": 0.9, "createdAt": "ISO8601" } ] }
  ```
- **Status Codes**: 401, 404

#### `POST /api/assessments/:assessmentId/attempts`

- **Auth**: `authenticate`
- **Response 201**:
  ```json
  { "data": { "id": "uuid", "passed": true, "score": 0.9, "answers": [...], "createdAt": "ISO8601" } }
  ```
- **Status Codes**: 400, 401, 404

---

### Completions

#### `POST /api/lessons/:lessonId/complete`

- **Auth**: `authenticate`
- **Response 201**:
  ```json
  { "data": { "id": "uuid", "lessonId": "uuid", "userId": "uuid", "createdAt": "ISO8601" } }
  ```
- **Status Codes**: 401, 404, 409

#### `DELETE /api/lessons/:lessonId/complete`

- **Response**: `204 No Content` — **no body, no envelope**

#### `POST /api/units/:unitId/complete`

- **Auth**: `authenticate`
- **Response 201**:
  ```json
  { "data": { "id": "uuid", "unitId": "uuid", "userId": "uuid", "createdAt": "ISO8601" } }
  ```
- **Status Codes**: 401, 404, 409

#### `DELETE /api/units/:unitId/complete`

- **Response**: `204 No Content` — **no body, no envelope**

---

### Resource Completions

#### `GET /api/lessons/:lessonId/resource-completions`

- **Auth**: `authenticate`
- **Response 200**:
  ```json
  { "data": [ { "id": "uuid", "resourceId": "uuid", "userId": "uuid", "createdAt": "ISO8601" } ] }
  ```
- **Status Codes**: 401, 404

#### `POST /api/lessons/:lessonId/resource-completions`

- **Auth**: `authenticate`
- **Response 201**:
  ```json
  { "data": { "id": "uuid", "resourceId": "uuid", "userId": "uuid", "createdAt": "ISO8601" } }
  ```
- **Status Codes**: 400, 401, 404, 409

---

### Progress

#### `GET /api/courses/:courseId/progress`

- **Auth**: `authenticate`
- **Response 200**:
  ```json
  { "data": { "courseId": "uuid", "percent": 0, "completedLessons": 0, "totalLessons": 0, "examPassed": false } }
  ```
- **Status Codes**: 401, 404

#### `GET /api/courses/:courseId/units/:unitId/progress`

- **Auth**: `authenticate`
- **Response 200**:
  ```json
  { "data": { "unitId": "uuid", "completedLessons": 0, "totalLessons": 0, "quizPassed": false } }
  ```
- **Status Codes**: 401, 404

---

## Common Status Codes

| Code | Meaning |
|---|---|
| 200 | Success — body is `{ "data": <payload> }` |
| 201 | Created — body is `{ "data": <created-resource> }` |
| 204 | No Content — no body (DELETE operations only) |
| 400 | Bad Request — body is `{ "error": { "code": "VALIDATION_ERROR", "message": "..." } }` |
| 401 | Unauthenticated — body is `{ "error": { "code": "UNAUTHORIZED", "message": "..." } }` |
| 403 | Forbidden — body is `{ "error": { "code": "FORBIDDEN", "message": "..." } }` |
| 404 | Not Found — body is `{ "error": { "code": "NOT_FOUND", "message": "..." } }` |
| 409 | Conflict — body is `{ "error": { "code": "CONFLICT", "message": "..." } }` |
| 500 | Internal Error — body is `{ "error": { "code": "INTERNAL_ERROR", "message": "..." } }` |

---

## Notes

- The envelope is applied by a middleware override of `res.json` and requires no changes to individual route handlers.
- The `data` key is the only envelope field introduced by this spec. `meta`, `pagination`, and other envelope fields are reserved for future specs.
- Any future endpoint that returns a JSON body will automatically receive the envelope by virtue of the middleware — no per-route action needed.
- This contract is immutable to coder agents. Any required change after approval is a stop-and-escalate event back to `/design`.
