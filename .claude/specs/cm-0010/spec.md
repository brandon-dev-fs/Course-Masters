---
id: cm-0010
title: Fix Assignment Reorder Race Condition and Add Pagination
stage: spec
status: approved
approver: human
approved_at: 2026-05-07T00:00:00Z
---

# Fix Assignment Reorder Race Condition and Add Pagination

## Problem Statement

The assignment reorder operation has a time-of-check-to-time-of-use (TOCTOU) race condition: it validates that the provided assignment IDs match the lesson's current assignments outside the database transaction, then performs the reorder inside the transaction. Under concurrent requests, the validation can pass against stale data. Separately, two list endpoints return unbounded result sets with no pagination: the admin user list (via better-auth's admin plugin) and the assessment attempts endpoint. As the user base and attempt history grow, these endpoints will degrade in performance and usability.

## Scope

### In Scope

- Moving the assignment reorder validation (existence check and ID-set comparison) inside the Prisma transaction so the read and write are atomic
- Adding offset-based pagination to the admin user list endpoint
- Adding offset-based pagination to the assessment attempts endpoint, scoped to the requesting user's own attempts
- Investigating whether the assessment attempts endpoint should return a paginated array of attempt summaries or just a count, and documenting the decision during design

### Out of Scope

- Sorting parameters for paginated endpoints (separate concern)
- Default and maximum page size values (deferred to design stage)
- Pagination on other list endpoints (naturally bounded by content hierarchy)
- Reorder operations for resources or tools (the exact scope of the reorder function should be confirmed during design; current implementation targets assignments within a lesson)
- Cursor-based pagination

## Requirements

### Functional Requirements

- FR-01: The assignment reorder operation must perform its validation (verifying the provided IDs match the lesson's current assignment set) and order updates within a single database transaction so that no concurrent request can modify the assignment set between validation and update.
- FR-02: The admin user list endpoint must accept optional offset-based pagination parameters (page number and page size) and return a paginated response including the result set and total count.
- FR-03: The admin user list endpoint must continue to function without pagination parameters, returning a default page of results rather than requiring explicit pagination.
- FR-04: The assessment attempts endpoint must accept optional offset-based pagination parameters and return a paginated response including the result set and total count.
- FR-05: The assessment attempts endpoint must return only the requesting user's own attempts, regardless of pagination parameters.
- FR-06: The assessment attempts endpoint pagination response must include attempt summary fields (id, score, passed, createdAt) consistent with the current response shape.

### Non-Functional Requirements

- NFR-01: The reorder transaction must use a serializable or row-level locking strategy sufficient to prevent lost updates under concurrent reorder requests for the same lesson.
- NFR-02: Paginated endpoints must perform efficiently with large datasets by leveraging database-level LIMIT/OFFSET rather than fetching all records and slicing in application code.

## Systems-Level Architecture

### Components Involved

- `server/src/services/assignment.service.ts` -- the `reorder` method, which currently splits validation and update across a non-transactional read and a transactional write
- `server/src/services/assessment.service.ts` -- the `getAttempts` method, which currently returns all attempts for a user with no pagination
- `server/src/routes/assessment.routes.ts` -- the `GET /:assessmentId/attempts` route definition
- `server/src/controllers/assessment.controller.ts` -- the `getAttempts` handler
- `server/src/schemas/assessment.schema.ts` -- Zod schemas for attempt-related requests (new pagination query schema needed)
- `server/src/lib/auth.ts` -- better-auth admin plugin configuration (admin user list is served by better-auth, not a custom endpoint)
- `client/src/features/auth/AdminUsersPage.tsx` -- currently calls `authClient.admin.listUsers` with a hardcoded `limit: 100`

### Data Model Changes

No new models, fields, or relationships are required. The reorder fix is a service-layer change only. Pagination uses existing data with query-time LIMIT/OFFSET.

### API Changes

- `GET /api/assessments/:assessmentId/attempts` -- modified to accept optional pagination query parameters and return a paginated response wrapper instead of a raw array
- Admin user list -- served by better-auth's admin plugin at `/api/auth/admin/list-users`; the client already passes `limit` and the plugin supports `offset`; the client needs to be updated to pass pagination parameters and handle paginated responses

### Data Flow

1. **Reorder (fix)**: Client sends a PUT request with an ordered array of assignment IDs. The service opens a Prisma interactive transaction. Inside the transaction, it reads the lesson's current assignments with a row-level lock, validates the provided IDs match, then performs the order updates. The transaction commits atomically. If a concurrent request attempts to reorder the same lesson's assignments, the database's locking mechanism causes it to wait or fail, preventing the race condition.

2. **Assessment attempts pagination**: Client sends a GET request with optional page and page size query parameters. The route validates the query parameters via Zod. The controller passes pagination parameters to the service. The service queries for the total count of the user's attempts and the requested page of results in parallel, then returns both. The controller wraps them in a paginated response envelope.

3. **Admin user list pagination**: Client sends a request through better-auth's admin client with limit and offset parameters. The admin plugin handles pagination internally. The client renders pagination controls based on the total count in the response.

### Integration Points

- **better-auth admin plugin**: The admin user list is not a custom endpoint; it is served by better-auth's admin plugin. Pagination support depends on the plugin's query parameter support (it already accepts `limit` and `offset`). The backend change is limited to ensuring the client passes these parameters correctly.
- **Authentication middleware**: The assessment attempts endpoint already requires authentication. The user-scoping requirement (FR-05) must use `req.user.id` from the authenticate middleware, which is already injected.
- **Prisma transactions**: The reorder fix requires converting from a batched transaction (`prisma.$transaction([...])`) to an interactive transaction (`prisma.$transaction(async (tx) => { ... })`) so that the validation read and order writes share the same transactional context.
- **Zod validation middleware**: New pagination query parameter schemas will use the existing `validate` middleware pattern.

## Required Design Artifacts

- [x] Backend plan (`backend-plan.md`)
- [ ] API contract (`api-contract.md`)
- [ ] Frontend plan (`frontend-plan.md`)
- [ ] UI wireframe (`wireframe.md`)
