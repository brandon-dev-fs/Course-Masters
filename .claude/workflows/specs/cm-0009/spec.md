---
id: cm-0009
title: Add Structured Logging and Request Middleware
stage: spec
status: approved
approver: human
approved_at: 2026-05-07T00:00:00Z
---

# Add Structured Logging and Request Middleware

## Problem Statement

The server currently lacks structured logging and standardized request-level middleware. Without structured logs, diagnosing production issues requires manual correlation of scattered console output. Adding structured JSON logging with per-request IDs, HTTP request/response logging, and rate limiting improvements will make the system observable and easier to debug.

## Scope

### In Scope

- Integrate pino as the structured logging library with pino-http for automatic HTTP request/response logging
- Generate a unique request ID per incoming request and attach it to a response header
- Make log level configurable via a LOG_LEVEL environment variable
- Redact sensitive data from logs: exclude auth endpoint request bodies entirely; omit passwords and tokens from all other log output
- Replace any existing console.log/console.error usage in server code with pino logger calls
- Add centralized rate limiting middleware with configurable tiers (exact thresholds determined at design time)

### Out of Scope

- Client-side logging or browser error tracking
- Log aggregation, shipping, or external monitoring services (Datadog, Grafana, etc.)
- Log file rotation or persistence configuration (stdout only for now)
- Distributed tracing across multiple services
- Changes to the client application

## Requirements

### Functional Requirements

- FR-01: All server log output must be structured JSON, produced by pino
- FR-02: Every incoming HTTP request must be assigned a unique request ID (UUID or equivalent), returned to the client in a response header
- FR-03: The pino-http middleware must log each request and response automatically, including method, URL, status code, response time, and the request ID
- FR-04: Auth endpoint request bodies (any route under /auth/*) must be completely excluded from log output
- FR-05: Fields named password, token, secret, or authorization must be redacted from all log entries
- FR-06: The server must read a LOG_LEVEL environment variable at startup to set the pino log level (e.g., debug, info, warn, error); default to "info" if not set
- FR-07: All existing console.log and console.error statements in server source code must be replaced with the appropriate pino logger method
- FR-08: Rate limiting middleware must support multiple tiers with different request limits and time windows, applied per route group
- FR-09: Rate limit responses must use structured error format consistent with the existing API error response shape
- FR-10: The request ID must be available to all downstream route handlers and middleware so they can include it in manually written log entries

### Non-Functional Requirements

- NFR-01: The logging middleware must add no more than 5ms of latency per request under normal load
- NFR-02: Pino must be the only new runtime dependency added for logging; pino-http is the only new middleware dependency for HTTP logging
- NFR-03: Log output must be compatible with standard JSON log consumers (one JSON object per line to stdout)

## Systems-Level Architecture

### Components Involved

- **New**: Pino logger instance module — a centralized module that creates and exports the configured pino logger
- **New**: Request ID middleware — Express middleware that generates a unique ID per request, attaches it to the request object and a response header
- **New**: pino-http middleware — integrated into the Express middleware chain for automatic request/response logging
- **New**: Rate limiting middleware — centralized middleware with configurable tiers per route group
- **Modified**: Express app entry point — to register the new middleware in the correct order
- **Modified**: All existing server modules that use console.log or console.error — to use the pino logger instead
- **Modified**: Existing rate limiting on auth endpoints — to be consolidated into the new tiered rate limiting system

### Data Model Changes

None. This feature does not add or modify any Prisma models, fields, or relationships.

### API Changes

No new endpoints. The only observable API change is the addition of a request ID response header on all responses. Rate limiting responses will use the existing error response shape with appropriate HTTP status codes.

### Data Flow

1. A request arrives at the Express server.
2. The request ID middleware generates a unique identifier and attaches it to the request context and as a response header.
3. The pino-http middleware begins timing the request and logs the incoming request details (method, URL, request ID).
4. The rate limiting middleware checks whether the request exceeds the configured tier limit for the matched route group. If exceeded, it responds immediately with a structured rate limit error.
5. The request proceeds through authentication, authorization, validation, and route handling as normal. Any manual log calls within handlers use the pino logger with the request ID from context.
6. When the response is sent, pino-http logs the response details (status code, response time, request ID).

### Integration Points

- **Express middleware chain**: The new middleware must be registered early in the chain (request ID first, then pino-http, then rate limiting) before authentication and route handlers.
- **Existing rate limiting on auth endpoints**: The current rate limiting (20 reqs / 15 min on auth routes) must be migrated into the new tiered system rather than running as a separate mechanism.
- **Environment configuration**: LOG_LEVEL joins the existing environment variables. The .env.example file should be updated to document it.
- **Error handling middleware**: Rate limit errors must flow through the existing centralized error handler to maintain consistent response formatting.

## Required Design Artifacts

- [x] Backend plan (`backend-plan.md`)
- [ ] API contract (`api-contract.md`)
- [ ] Frontend plan (`frontend-plan.md`)
- [ ] UI wireframe (`wireframe.md`)
