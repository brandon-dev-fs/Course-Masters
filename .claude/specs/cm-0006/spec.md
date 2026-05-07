---
id: cm-0006
title: Standardize API Response Envelope
stage: spec
status: approved
approver: human
approved_at: 2026-05-06T00:00:00Z
---

# Standardize API Response Envelope

## Problem Statement

The API currently returns raw payloads with inconsistent shapes across endpoints. Some return bare arrays, others return objects, and there is no uniform wrapper. This inconsistency forces the client to handle each endpoint's response shape individually and makes it harder to extend responses with metadata (such as pagination) in the future. Wrapping all successful responses in a consistent `{ data }` envelope establishes a predictable contract for every consumer.

## Scope

### In Scope

- Wrapping all successful JSON responses from every non-auth API route (including `/health`) in a `{ data: <payload> }` envelope
- Preserving 204 No Content as body-less for delete operations
- Updating the server-side response layer so controllers/route handlers produce the envelope consistently
- Updating the client-side API consumption layer to unwrap the `data` field from every response
- Ensuring existing error response shapes remain functional alongside the new envelope (error responses are a separate concern and not restructured here)

### Out of Scope

- `/auth/*` routes (controlled by better-auth; not modified)
- Pagination, `meta` field, or any additional envelope fields (reserved for a future spec)
- Error response envelope standardization (separate effort)
- Changes to request body shapes or query parameter handling
- UI/component changes beyond the API consumption layer

## Requirements

### Functional Requirements

- FR-01: Every successful JSON response from a non-auth API route must be wrapped in `{ "data": <payload> }`, where `<payload>` is the value currently returned as the top-level response body.
- FR-02: The `/health` endpoint must return its response inside the `{ "data": ... }` envelope.
- FR-03: DELETE operations that currently return 204 No Content must continue to return 204 with no body.
- FR-04: The server must apply the envelope consistently without requiring each route handler to manually wrap its response.
- FR-05: The client API layer must unwrap the `data` field from every envelope response so that consuming components receive the same payload shape they do today.
- FR-06: All existing API tests (if any) must continue to pass after accounting for the new envelope structure.
- FR-07: Error responses (4xx, 5xx) must not be altered by this change; they must continue to use their current shape.

### Non-Functional Requirements

- NFR-01: The envelope wrapping must not introduce measurable latency (no additional serialization passes or middleware that buffers full response bodies).
- NFR-02: The change must be deployed atomically -- client and server changes must be coordinated so that the client never reads a raw (unwrapped) response as if it were enveloped, or vice versa.

## Systems-Level Architecture

### Components Involved

**Server (existing):**
- Express route handlers across all routers (courses, units, lessons, resources, tools, student-notes, assessments, completions, progress, youtube, health)
- Centralized response utility or middleware (to be introduced or extended)
- Error handling middleware (unchanged, but must not conflict with envelope logic)

**Client (existing):**
- API client module or fetch/axios wrapper that all pages and hooks use to call the backend
- Any direct `fetch` or HTTP calls that bypass the central API client (must be audited)

### Data Model Changes

None. This change is purely at the HTTP response layer.

### API Changes

Every existing endpoint that returns a JSON body will have its response shape changed from:

- Current: `<payload>` (direct value)
- New: `{ "data": <payload> }`

No new endpoints are introduced. No request shapes change. No status codes change (except that responses which were 200 with a body remain 200 with an enveloped body; 204 responses remain 204 with no body).

### Data Flow

1. A client component calls the API client layer with a request to any non-auth endpoint.
2. The Express route handler processes the request and calls `res.json(payload)` (or equivalent).
3. A centralized envelope mechanism intercepts or wraps the outgoing JSON, producing `{ "data": payload }`.
4. For 204 responses, the envelope mechanism is bypassed -- no body is sent.
5. The client API layer receives the response, detects the envelope, extracts `response.data`, and returns the unwrapped payload to the calling component.
6. Components continue to work with the same data shapes as before, unaware of the envelope.

### Integration Points

- **Express middleware/response utilities**: The envelope must be applied after route handlers produce their response but before the response is sent to the client. This may involve overriding `res.json` or adding a response transformation middleware.
- **Error handling middleware**: Must remain unaffected. Error responses should pass through without being double-wrapped.
- **Client API module**: The central HTTP client (likely a fetch wrapper or axios instance) must be updated to unwrap `data` from all successful responses.
- **better-auth routes**: Explicitly excluded. The envelope mechanism must not intercept `/auth/*` routes.

## Required Design Artifacts

- [x] Backend plan (`backend-plan.md`)
- [x] API contract (`api-contract.md`)
- [x] Frontend plan (`frontend-plan.md`)
- [ ] UI wireframe (`wireframe.md`)
