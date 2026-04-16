---
id: <prefix>-<n>
title: <Feature name> — API contract
stage: design
status: pending
# optional: approver: human
# optional: approved_at: 2026-04-15T10:30:00Z
depends_on:
  - <prefix>-<n>-spec
---

# <Title> — API Contract

This contract is **immutable** to coder agents once approved. Required changes escalate back to `/design`.

## Summary

<One paragraph describing the API surface introduced or modified.>

## Endpoints

For each endpoint, copy the block below.

---

### `<METHOD> /v1/<path>`

**Purpose**: <one line>

**Auth**: <required | none>

**Path params**:

| Name | Type | Description |
|------|------|-------------|
| `<n>` | `string` | <description> |

**Query params**:

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `<n>` | `string` | yes/no | <default> | <description> |

**Request body** (Zod):

```ts
z.object({
  // ...
}).strict()
```

**Success response**: `<status code>`

```ts
// Raw resource (no envelope)
{
  // ...
}
```

For paginated collections:

```ts
{
  items: [...],
  nextCursor: "..." | null
}
```

**Error responses**:

| Status | Code | When |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | Request fails Zod parse |
| 401 | `UNAUTHORIZED` | Missing or invalid auth |
| 403 | `FORBIDDEN` | Authenticated but not permitted |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `<CODE>` | <conflict condition> |

All error responses use the standard envelope: `{ error: { code, message, details } }`.

**Example request**:

```
<METHOD> /v1/<path>
Content-Type: application/json

{
  // ...
}
```

**Example response**:

```
HTTP <status>
Content-Type: application/json

{
  // ...
}
```

---

<Repeat the endpoint block for each endpoint.>

## Error Code Reference

All codes referenced above must exist (or be added) in `server/src/errors/codes.ts`. New codes introduced by this contract:

- `<CODE>` — <description>

## Open Questions

<Contract decisions awaiting resolution. Remove section if none.>
