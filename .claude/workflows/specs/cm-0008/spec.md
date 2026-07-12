---
id: cm-0008
title: Add Query Parameter Validation for Resource and Tool List Endpoints
stage: spec
status: approved
approver: human
approved_at: 2026-05-07T00:00:00Z
---

# Add Query Parameter Validation for Resource and Tool List Endpoints

## Problem Statement

The GET endpoints for listing lesson resources and lesson tools accept an optional `type` query parameter to filter results by enum value. Currently, both controllers cast `req.query['type']` directly to the Prisma enum type (`ResourceType` or `ToolType`) without any runtime validation. This means invalid enum values (e.g., `?type=invalid`) pass silently through to the service layer, where they either produce empty results or cause an unhandled Prisma error — neither of which gives the caller a clear indication that their request was malformed.

## Scope

### In Scope

- Adding Zod-based query parameter validation to the GET handler for `GET /lessons/:lessonId/resources`
- Adding Zod-based query parameter validation to the GET handler for `GET /lessons/:lessonId/tools`
- Returning a 400 error with a clear, structured error message when an invalid `type` value is provided
- Ensuring that omitting the `type` parameter entirely continues to work (returns all items unfiltered)

### Out of Scope

- Changes to the existing `validate` middleware (which validates `req.body` only) — this spec does not require modifying its signature or behavior
- Validation of query parameters on any other endpoints beyond the two listed above
- Any changes to the API response shape for successful requests
- Frontend changes — the client already sends valid enum values; this is a defensive backend hardening measure
- Changes to the service layer or Prisma queries

## Requirements

### Functional Requirements

- FR-01: When a request to `GET /lessons/:lessonId/resources` includes a `type` query parameter whose value is not one of `note`, `video`, or `lecture`, the server must respond with HTTP 400 and a structured error body indicating the invalid value and the accepted values.
- FR-02: When a request to `GET /lessons/:lessonId/tools` includes a `type` query parameter whose value is not one of `flash_card`, `practice_problem`, or `vocab`, the server must respond with HTTP 400 and a structured error body indicating the invalid value and the accepted values.
- FR-03: When a request to either endpoint omits the `type` query parameter entirely, the endpoint must continue to return all items for the lesson (current behavior preserved).
- FR-04: When a request to either endpoint includes a valid `type` query parameter, the endpoint must continue to return only items matching that type (current behavior preserved).
- FR-05: The 400 error response must follow the project's standard error envelope format: `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": { ... } } }`.

### Non-Functional Requirements

- NFR-01: The validation must use Zod schemas consistent with the project's existing validation patterns (Zod 3, schemas in `src/schemas/`).
- NFR-02: The validation must occur at the route or middleware layer, before the controller logic executes, so that invalid input never reaches the service layer.

## Systems-Level Architecture

### Components Involved

**Existing components (modified):**
- `server/src/routes/lesson-resource.routes.ts` — the GET `/` handler will gain query validation middleware
- `server/src/routes/lesson-tool.routes.ts` — the GET `/` handler will gain query validation middleware
- `server/src/controllers/lesson-resource.controller.ts` — the `getAll` method will consume validated query data instead of raw casting
- `server/src/controllers/lesson-tool.controller.ts` — the `getAll` method will consume validated query data instead of raw casting

**Existing components (potentially modified or extended):**
- `server/src/schemas/lesson-resource.schema.ts` — may gain a query parameter schema for the resource type filter
- `server/src/schemas/lesson-tool.schema.ts` — may gain a query parameter schema for the tool type filter
- `server/src/middleware/validate.ts` — may need a companion function or extension to validate `req.query` in addition to `req.body`

**Existing components (referenced, not modified):**
- `server/src/errors/` — `ValidationError` class already exists and produces the correct error envelope
- `server/src/middleware/errorHandler.ts` — already handles `ValidationError` and formats the 400 response

### Data Model Changes

None. This change is purely at the request validation layer. No new models, fields, or relationships are needed.

### API Changes

No changes to endpoint paths, methods, or successful response shapes. The only behavioral change is that the two GET endpoints listed above will now return HTTP 400 with a structured error body when given an invalid `type` query parameter, instead of silently passing the invalid value through.

### Data Flow

1. Client sends `GET /lessons/:lessonId/resources?type=<value>` (or the tools equivalent).
2. Query validation middleware parses `req.query.type` against a Zod enum schema.
3. If the value is present and invalid, the middleware short-circuits with a `ValidationError`, which the global error handler formats as a 400 response.
4. If the value is absent or valid, the request proceeds to the controller, which reads the validated (and correctly typed) value from the query.
5. The controller calls the service layer with the validated type filter. The service and database layers are unchanged.

### Integration Points

- **Existing error handling pipeline**: The validation leverages the existing `ValidationError` class and global `errorHandler` middleware, so 400 responses are automatically formatted in the project's standard error envelope.
- **Existing Zod validation pattern**: The project already uses Zod schemas with a `validate` middleware for request body validation. This change extends the same pattern to query parameters.
- **Prisma enums**: The Zod schemas will mirror the `ResourceType` and `ToolType` Prisma enums (`note | video | lecture` and `flash_card | practice_problem | vocab` respectively) to keep the validation layer in sync with the data model.

## Required Design Artifacts

- [x] Backend plan (`backend-plan.md`)
- [ ] API contract (`api-contract.md`)
- [ ] Frontend plan (`frontend-plan.md`)
- [ ] UI wireframe (`wireframe.md`)
