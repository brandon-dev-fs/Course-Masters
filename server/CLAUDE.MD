# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Guidelines
- Follow RESTful API conventions for all endpoints
- Use Prisma for all database interactions — no raw SQL unless absolutely necessary
- Keep business logic in the backend
- Write the API to be stateless

## Error Handling Conventions

Consistent error handling across the backend and frontend. The goal is predictable error shapes so the client can always parse and display errors reliably.

All API errors should return a consistent JSON shape:
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Course not found",
    "details": {}
  }
}
```

- `code` — A machine-readable string constant (e.g., `NOT_FOUND`, `VALIDATION_ERROR`, `INTERNAL_ERROR`)
- `message` — A human-readable description
- `details` — Optional object for field-level validation errors (e.g., `{ "title": "Title is required" }`)

Use a centralized error-handling middleware in Express. Route handlers should throw or pass typed errors; the middleware catches them and formats the response.

```
server/src/
  middleware/
    errorHandler.ts    // Central Express error middleware
  errors/
    AppError.ts        // Base error class with code, message, statusCode
    NotFoundError.ts   // 404
    ValidationError.ts // 400 with field details
```

- **Prisma errors** — Catch Prisma-specific errors (e.g., `P2025` for record not found, `P2002` for unique constraint) in the error middleware and map them to the standard error shape. Do not leak Prisma internals to the client.
- **Validation** — Validate request bodies at the route level before they reach the service layer. Use a validation library like Zod to define schemas for request payloads and parse them in middleware or at the top of each handler.
- **Unhandled errors** — The error middleware should catch anything unexpected, log the full error server-side, and return a generic `INTERNAL_ERROR` to the client.

## Testing Strategy

Testing should be pragmatic — focus coverage on the areas most likely to break and provide the most value.

### Jest + Supertest
- **API integration tests** are the priority. Test each route against a real test database (use a separate Postgres container or test schema). Verify status codes, response shapes, and side effects (e.g., cascade deletes).
- **Prisma service/helper unit tests** for any business logic that lives outside route handlers (e.g., progress calculation).
- Use `beforeAll` / `afterAll` hooks to seed and tear down test data. Prisma makes this straightforward.
- Aim for full coverage of CRUD operations and assessment attempt scoring.