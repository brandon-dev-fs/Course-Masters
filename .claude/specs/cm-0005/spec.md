---
id: cm-0005
title: Refactor Backend Service Layer for Clean Separation and Centralized Error Handling
stage: spec
status: approved
approver: human
approved_at: 2026-05-06T00:00:00Z
---

# Refactor Backend Service Layer for Clean Separation and Centralized Error Handling

## Problem Statement

The backend service layer has accumulated three structural issues that increase maintenance cost and defect risk. First, `progress.service.ts` mixes large Prisma queries with computation logic (percentage calculations, status derivations) in monolithic methods, making each concern harder to test and modify independently. Second, parent-existence validation (fetch-then-throw-if-null) is duplicated identically across 11 service files with approximately 90 occurrences, violating DRY and creating inconsistency risk when the pattern needs to change. Third, the global error handler maps only two Prisma error codes (P2025 and P2002), leaving constraint violations, invalid enum values, and other known Prisma errors to propagate as unhandled 500 responses.

## Scope

### In Scope

- Extract a shared `assertExists` utility for parent-entity validation, replacing duplicated find-and-throw patterns across all service files
- Refactor `progress.service.ts` to separate data-fetching from computation logic
- Expand the global error handler to map additional Prisma error codes to structured API error responses
- Preserve all existing API response shapes and status codes (no external behavior changes)

### Out of Scope

- New API endpoints, modified request/response contracts, or route changes
- Database schema or migration changes
- Frontend changes
- Changes to authentication or authorization middleware
- Refactoring services beyond the three concerns listed above (general service cleanup)
- Performance optimization of Prisma queries (query structure stays the same)

## Requirements

### Functional Requirements

- FR-01: A shared `assertExists` utility must accept a Prisma model delegate and an entity ID, returning the found record or throwing a `NotFoundError` with a descriptive message including the entity type
- FR-02: Every service method that currently performs a find-then-throw-if-null pattern for parent validation must be refactored to use the shared `assertExists` utility instead of inline lookup-and-throw code
- FR-03: The `assertExists` utility must support all entity types currently validated across services: Course, Unit, Lesson, Assessment, LessonResource, LessonTool, and StudentNote
- FR-04: `progress.service.ts` must be refactored so that data-fetching (Prisma queries) and computation logic (percentage calculations, status derivations, completion checks) reside in separate, independently callable functions
- FR-05: After refactoring, `getCourseProgress` and `getUnitProgress` must return response shapes identical to their current output (no field additions, removals, or type changes)
- FR-06: The global error handler must map Prisma error code P2003 (foreign key constraint violation) to a 409 status with a structured error response
- FR-07: The global error handler must map Prisma `PrismaClientValidationError` (invalid enum values, type mismatches in queries) to a 400 status with error code `VALIDATION_ERROR`
- FR-08: The global error handler must map Prisma error code P2014 (required relation violation) to a 409 status with a structured error response
- FR-09: All mapped Prisma errors must follow the existing error response shape: `{ error: { code: string, message: string } }`
- FR-10: No Prisma-internal details (error meta, stack traces, model names from Prisma internals) may be exposed in client-facing error responses

### Non-Functional Requirements

- NFR-01: The refactored `assertExists` utility must not introduce additional database round-trips compared to the current inline pattern (one query per existence check)
- NFR-02: All refactored code must maintain full TypeScript type safety with no use of `any`
- NFR-03: The progress computation functions must be pure (no side effects, no database access) to enable unit testing with mock data

## Systems-Level Architecture

### Components Involved

**Existing components modified:**
- `server/src/services/progress.service.ts` -- split into data access and computation
- `server/src/middleware/errorHandler.ts` -- expand Prisma error code mapping
- All 11 service files under `server/src/services/` -- replace inline existence checks with shared utility
- `server/src/errors/index.ts` -- potentially add new error subclass for conflict errors

**New components:**
- A shared utility for entity existence validation (location within `server/src/` to be determined during design)

### Data Model Changes

None. This is a pure code refactoring with no schema or migration changes.

### API Changes

None. All existing endpoints retain their current request/response contracts and status codes. The only observable change is that certain previously-unhandled Prisma errors will now return structured 4xx responses instead of generic 500 errors.

### Data Flow

**Parent validation (before and after):**
Currently, each service method independently queries for a parent entity by ID, checks if the result is null, and throws `NotFoundError`. After refactoring, each service method calls the shared `assertExists` utility, which performs the same single query and throws the same `NotFoundError` on miss. The data flow is identical; only the code location changes.

**Progress computation (after refactoring):**
1. `getCourseProgress` calls a data-fetching function that executes the existing Prisma query and returns the raw course-with-relations object.
2. The raw data is passed to a pure computation function that derives lesson completion counts, unit completion status, exam status, percentages, and per-unit breakdowns.
3. The computation function returns the final response shape, which the service method returns to the controller.

**Prisma error handling (after refactoring):**
1. A Prisma operation throws a `PrismaClientKnownRequestError` or `PrismaClientValidationError`.
2. The error propagates to the global error handler via Express's error middleware chain.
3. The error handler checks the error type and code against the expanded mapping table.
4. A structured JSON error response is returned with the appropriate HTTP status code.

### Integration Points

- **Error classes** (`server/src/errors/`): The `assertExists` utility depends on `NotFoundError`. New Prisma error mappings may use existing `AppError` subclasses or a new `ConflictError` subclass.
- **Prisma client** (`server/src/lib/prisma.ts`): The `assertExists` utility uses the singleton Prisma client for queries.
- **Global error handler** (`server/src/middleware/errorHandler.ts`): Central integration point for all Prisma error mapping changes.
- **All service files**: Every service file that currently has inline parent-existence checks is touched by this refactoring.
- **Controllers and routes**: Not modified. Controllers continue to call service methods with the same signatures and receive the same return types.

## Required Design Artifacts

- [x] Backend plan (`backend-plan.md`)
- [ ] API contract (`api-contract.md`)
- [ ] Frontend plan (`frontend-plan.md`)
- [ ] UI wireframe (`wireframe.md`)
