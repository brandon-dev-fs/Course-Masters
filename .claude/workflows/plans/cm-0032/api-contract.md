---
id: cm-0032
title: Profile Page Modernization — API Contract
stage: design
status: approved
---

# API Contract: Profile Page Modernization

## GET /api/users/me

Returns the authenticated user's profile including theme preference.

### Auth

- `authenticate()` — valid session cookie required
- No role restriction — all authenticated users

### Request

No path params, query params, or request body.

### Response

**200 OK**

```json
{
  "data": {
    "id": "uuid-string",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "student",
    "themePreference": "dark",
    "createdAt": "2026-01-15T10:30:00.000Z"
  }
}
```

`themePreference` is `"light"`, `"dark"`, `"system"`, or `null`. The client treats `null` as `"system"`.

**Error responses:**

| Status | Code | When |
|---|---|---|
| 401 | `UNAUTHENTICATED` | No valid session cookie |
| 404 | `NOT_FOUND` | User record not found (defensive — should not occur for authenticated users) |

---

## PATCH /api/users/me/preferences

Updates the authenticated user's theme preference.

### Auth

- `authenticate()` — valid session cookie required
- No role restriction — all authenticated users

### Request

**Body** (JSON):

```json
{
  "themePreference": "light" | "dark" | "system"
}
```

**Zod schema shape:**

```ts
z.object({
  themePreference: z.enum(["light", "dark", "system"])
})
```

All fields are required. No optional fields.

### Response

**200 OK**

```json
{
  "data": {
    "themePreference": "light"
  }
}
```

Returns the updated preference value.

**Error responses:**

| Status | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | `themePreference` missing or not one of the allowed values |
| 401 | `UNAUTHENTICATED` | No valid session cookie |

**400 error detail shape:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "themePreference": ["Invalid enum value. Expected 'light' | 'dark' | 'system'"]
    }
  }
}
```
