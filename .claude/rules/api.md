# API Rules

Loaded by: `backend-architect` (contract authoring), `frontend-developer` (contract consumption), `code-reviewer`, `security-reviewer`.

## Style

- REST over HTTP/JSON.
- Resource-oriented URLs. Nouns, not verbs (`/users`, not `/getUsers`).
- Use HTTP methods semantically: `GET` (read), `POST` (create), `PUT` (full replace), `PATCH` (partial update), `DELETE` (remove).

## Versioning

- All API routes are prefixed with `/v1/`. Example: `/v1/users/:id`.
- A breaking change requires a new version prefix (`/v2/`). Within a version, changes must be backward-compatible (additive).
- Backward-compatible changes: adding a new endpoint, adding an optional request field, adding a response field.
- Breaking changes: removing or renaming a field, changing a field's type, changing a status code, changing validation rules to be stricter.

## Response shape

### Success (2xx)

Raw resource. No envelope.

```json
GET /v1/users/abc123 →
{
  "id": "abc123",
  "email": "user@example.com",
  "createdAt": "2026-04-15T10:30:00Z"
}
```

Collections return an array directly:

```json
GET /v1/users →
[
  { "id": "abc123", ... },
  { "id": "def456", ... }
]
```

For paginated collections, use the envelope `{ items: [...], nextCursor: "..." }`.

### Error (non-2xx)

Always the standard envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": { "email": "Required" }
  }
}
```

- `code` is from the `ERROR_CODES` enum in `server/src/errors/codes.ts`.
- `message` is human-readable but not localized; the client may override for display.
- `details` is optional; shape depends on the code (e.g., field-error map for `VALIDATION_ERROR`).

See `backend.md` for the throw-and-serialize pattern that produces this shape.

## Status codes

- `200 OK` — successful read or update
- `201 Created` — successful resource creation, include the new resource in the body and a `Location` header
- `204 No Content` — successful delete or update with no body to return
- `400 Bad Request` — `VALIDATION_ERROR`
- `401 Unauthorized` — caller is not authenticated
- `403 Forbidden` — caller is authenticated but lacks permission
- `404 Not Found` — `NOT_FOUND`
- `409 Conflict` — uniqueness or state conflict
- `500 Internal Server Error` — unhandled error; never expose stack traces in the response

## Authentication

- Auth is handled by Better Auth.
- Routes that require authentication are wrapped with the auth middleware.
- Auth failures should result in `UnauthorizedError` or `ForbiddenError` (see `backend.md` desired-state note).

## Request validation

- Every request body, query param, and route param is validated with a Zod schema at the controller boundary (see `backend.md`).
- Reject unknown fields. Use Zod's `.strict()` on object schemas.

## Pagination

- Use cursor-based pagination, not offset-based.
- Query params: `limit` (default 20, max 100) and `cursor` (opaque string).
- Response: `{ items: [...], nextCursor: "..." }`. `nextCursor` is omitted or null when no more pages.

## Filtering and sorting

- Filtering: query params named after the field (`?status=active`).
- Sorting: `?sort=field` (ascending) or `?sort=-field` (descending). Multiple: `?sort=-createdAt,name`.

## Idempotency

- `GET`, `PUT`, `DELETE` are idempotent by definition.
- For `POST` operations that create resources, support an optional `Idempotency-Key` header where duplicate requests would cause harm (e.g., payments).

## CORS, rate limiting, headers

- CORS: configured at the app level, not per route.
- Rate limits: applied via middleware. Document any per-route overrides in the route file.
- Never echo arbitrary client headers back in responses.

## Documentation

- Each route's purpose, params, and response shape is documented in JSDoc above the route handler.
- The `api-contract` doc produced in the design stage is the source of truth during implementation. Routes must match the contract; deviations require escalation back to `/design`.
