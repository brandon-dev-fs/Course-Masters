---
id: cm-0016
title: Database Schema Data Integrity Fixes
stage: design
status: approved
approver: human
approved_at: 2026-05-13T00:00:00Z
---

## Scope

This contract documents the updated `resource-completions` endpoints. All other
endpoints in the system are unaffected by this spec.

The actual live mount path (from `server/src/routes/index.ts`) is
`/lessons/:lessonId/completions`, not `/lessons/:lessonId/resource-completions`
as documented in the top-level CLAUDE.md. This contract uses the live path.

---

## Authentication

All endpoints below require:
- `authenticate()` middleware (applied globally in `routes/index.ts`)
- No role restriction — all authenticated roles (`student`, `teacher`, `admin`) may call these endpoints
- `requireSelf` guard on POST: the authenticated user may only toggle their own completions

---

## Endpoints

---

### GET /api/lessons/:lessonId/completions

Returns all resource and tool completions for the authenticated user within the
given lesson, along with the full list of required items and their completion
status.

#### Auth

`authenticate()` (inherited from global router)

#### Path Parameters

| Param | Type | Required | Description |
|---|---|---|---|
| `lessonId` | UUID string | Yes | ID of the lesson |

#### Query Parameters

None

#### Request Body

None

#### Response — 200 OK

```json
{
  "completions": [
    {
      "type": "resource",
      "targetId": "uuid",
      "completedAt": "2026-05-13T10:00:00.000Z"
    },
    {
      "type": "tool",
      "targetId": "uuid",
      "completedAt": "2026-05-13T10:05:00.000Z"
    }
  ],
  "requiredItems": [
    {
      "type": "resource",
      "targetId": "uuid",
      "isRequired": true,
      "completed": true
    },
    {
      "type": "resource",
      "targetId": "uuid",
      "isRequired": false,
      "completed": false
    },
    {
      "type": "tool",
      "targetId": "uuid",
      "isRequired": true,
      "completed": false
    }
  ]
}
```

#### Response Fields

**`completions[]`** — entries for items the user has completed

| Field | Type | Description |
|---|---|---|
| `type` | `"resource" \| "tool"` | Whether the completed item is a `LessonResource` or `LessonTool` |
| `targetId` | UUID string | ID of the completed `LessonResource` or `LessonTool` |
| `completedAt` | ISO 8601 datetime | When the completion was recorded |

**`requiredItems[]`** — all resources and tools in the lesson with their completion state

| Field | Type | Description |
|---|---|---|
| `type` | `"resource" \| "tool"` | Item category |
| `targetId` | UUID string | ID of the `LessonResource` or `LessonTool` |
| `isRequired` | boolean | Whether the item is required for lesson completion |
| `completed` | boolean | Whether this user has a completion record for this item |

#### Status Codes

| Code | Condition |
|---|---|
| 200 | Success — returns completions and required items (empty arrays if none) |
| 401 | Not authenticated |
| 500 | Unexpected server error |

#### Error Response Shape

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required",
    "details": {}
  }
}
```

#### Notes

- An unauthenticated request returns 401 before the handler runs.
- A valid `lessonId` that does not exist in the database returns `{ completions: [], requiredItems: [] }` (no 404 is raised — the lesson lookup is implicit through the resource/tool queries).

---

### POST /api/lessons/:lessonId/completions

Toggles a completion record for a single `LessonResource` or `LessonTool`.
If the completion record already exists it is deleted (un-complete); if it does
not exist it is created (complete). Returns the updated completion state for the
entire lesson (same shape as GET).

#### Auth

`authenticate()` (inherited) + `requireSelf` guard on `req.body.userId` (defence-in-depth; the controller stamps `req.user.id` by construction)

#### Path Parameters

| Param | Type | Required | Description |
|---|---|---|---|
| `lessonId` | UUID string | Yes | ID of the lesson containing the target item |

#### Query Parameters

None

#### Request Body

```json
{
  "type": "resource",
  "targetId": "uuid"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `"resource" \| "tool"` | Yes | Whether `targetId` refers to a `LessonResource` or a `LessonTool` |
| `targetId` | UUID string | Yes | ID of the `LessonResource` or `LessonTool` to toggle |

#### Zod Schema

```typescript
z.object({
  type: z.enum(['resource', 'tool']),
  targetId: z.string().uuid(),
})
```

#### Response — 200 OK

Same shape as `GET /api/lessons/:lessonId/completions` — returns the full
updated completion state after the toggle.

```json
{
  "completions": [...],
  "requiredItems": [...]
}
```

#### Status Codes

| Code | Condition |
|---|---|
| 200 | Toggle successful — returns updated state |
| 400 | Validation error — `type` missing or not `resource`/`tool`, or `targetId` not a valid UUID |
| 401 | Not authenticated |
| 403 | `requireSelf` violation — body `userId` (if present) does not match authenticated user |
| 404 | `targetId` does not exist in the appropriate table, or does not belong to `lessonId` |
| 500 | Unexpected server error |

#### Error Codes

| HTTP | `error.code` | Trigger |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Zod schema failed — missing or invalid `type` or `targetId` |
| 401 | `UNAUTHORIZED` | No valid session |
| 403 | `FORBIDDEN` | `requireSelf` guard failed |
| 404 | `NOT_FOUND` | `targetId` not found in `lesson_resource` or `lesson_tool`, or item belongs to a different lesson |
| 500 | `INTERNAL_SERVER_ERROR` | Unhandled exception |

#### Error Response Shape

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found",
    "details": {}
  }
}
```

#### Notes

- The server ignores any `userId` in the request body. Completions are always
  stamped with `req.user.id`.
- Toggling is idempotent in intent — calling POST twice returns the completion to
  its original state.
- The response always reflects the full post-toggle state of the lesson, not just
  the affected item. This matches the existing pattern and allows the client to
  synchronize its local state in a single round trip.

---

## Breaking Change Notice

The previous request body shape was:

```json
{ "resourceType": "note|video|lecture|flash_card|...", "resourceId": "uuid" }
```

The new shape is:

```json
{ "type": "resource|tool", "targetId": "uuid" }
```

Any client code calling `POST /api/lessons/:lessonId/completions` must be
updated to send the new shape. The server will return `400 VALIDATION_ERROR`
for requests using the old shape.
