# API Rules

Load on-demand when encountering route or API client files.
Read `CLAUDE.md` for the project's API conventions.

## Style and Versioning

- REST over HTTP. All endpoints are prefixed `/api`.
- No URL versioning currently. If a breaking change is unavoidable, introduce `/api/v2/` for the affected resource only — do not retroactively version existing stable endpoints.
- Resource names are plural nouns in kebab-case: `/courses`, `/lesson-resources`, `/student-notes`.
- Use nested routes for parent-child relationships: `/courses/:courseId/units`. Use flat routes when the resource is accessed by its own ID: `/resources/:resourceId`.
- Route params are always UUIDs. Never accept numeric IDs or slugs.

## Response Shape

- All successful responses are wrapped by the `envelopeMiddleware`: `{ "data": <payload> }`.
- All error responses follow: `{ "error": { "code": "SNAKE_CASE_CODE", "message": "Human readable", "details": {} } }`.
- 204 responses send no body — use `res.status(204).send()`, never `res.json()`.
- Never return raw Prisma objects that leak internal fields. Select/include explicitly.
- List endpoints return arrays directly in `data` (no wrapper object around the array) unless paginated (see Pagination).

## Status Codes

| Code | When to use |
|------|-------------|
| 200  | Successful GET, PUT, PATCH |
| 201  | Successful POST that creates a resource |
| 204  | Successful DELETE (no body) |
| 400  | Validation error — malformed input, missing required fields |
| 401  | Unauthenticated — no valid session cookie |
| 403  | Forbidden — authenticated but lacks role/ownership |
| 404  | Resource not found (also used when ownership check fails to avoid leaking existence) |
| 409  | Conflict — duplicate unique constraint, foreign key violation |
| 429  | Rate limit exceeded |
| 500  | Unhandled server error — never return intentionally |

- Never use 200 for creation — always 201.
- Never use 404 to mean "empty list" — return 200 with an empty array.
- Prefer 404 over 403 for resources the user shouldn't know exist (ownership failures).

## Pagination

- Use offset-based pagination for list endpoints that may grow unbounded.
- Query params: `?page=1&limit=20`. Default `page=1`, default `limit=20`, max `limit=100`.
- Paginated response shape inside `data`:
  ```json
  {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 87,
      "totalPages": 5
    }
  }
  ```
- Existing list endpoints that return bounded data (e.g., units within a course) do not need pagination unless the count grows beyond a reasonable threshold.
- Always validate `page` and `limit` with Zod — reject non-integer or out-of-range values.

## Rate Limiting

- Auth routes (`/api/auth/*`): 20 requests per 15 minutes (`authLimiter`).
- All other API routes: 300 requests per 15 minutes (`apiLimiter`).
- Rate limiters are applied in `app.ts` before route handlers.
- New endpoints inherit `apiLimiter` by default. Only add stricter limits for abuse-prone endpoints (e.g., file uploads, password reset).

## Authentication

- Session-based via better-auth. Session cookie is set by the auth handler and validated by `authenticate()` middleware.
- `authenticate()` is applied once at the router root — individual routes do not re-apply it.
- After `authenticate()`, `req.user` and `req.session` are always present — use non-null assertion (`req.user!`) safely.
- Auth routes (`/api/auth/*`) are handled by better-auth before `express.json()` — never move them after body parsing.
- The client sends credentials via `credentials: 'include'` on every `apiClient` call. CORS is configured to allow the client origin with credentials.

## API Design Checklist (new endpoints)

When adding a new endpoint, verify:
1. Route is registered in the correct sub-router with `mergeParams: true` if needed.
2. Middleware chain follows order: `authorize()` → `requireCourseOwnership()` → `validate()` → controller.
3. Controller is thin — extracts params, calls service, sends response.
4. Service contains all business logic and Prisma queries.
5. Request body has a Zod schema in `src/schemas/`.
6. Response shape is documented in the OpenAPI spec (`swagger.ts`).
7. Error cases use typed error classes (`NotFoundError`, `ValidationError`, `ConflictError`).
