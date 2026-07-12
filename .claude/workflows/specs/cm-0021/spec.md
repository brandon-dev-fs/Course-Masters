---
id: cm-0021
title: Expand Unit Test Coverage
stage: spec
status: approved
approver: human
approved_at: 2026-05-15T00:00:00Z
depends_on: [cm-0020]
---

# Expand Unit Test Coverage

## Problem Statement

The testing infrastructure established in cm-0020 introduced the tooling and framework for unit testing across both the client and server workspaces, but only a minimal seed of tests was written to validate the setup. The codebase now has ~60+ server source files and ~90+ client source files with just 3 test files total. Critical business logic — assessment grading, completion rules, ownership enforcement, progress calculation, and API validation — runs in production with no automated verification. This spec closes that gap by systematically auditing every testable unit and implementing tests that bring coverage to a defensible, documented threshold.

## Scope

### In Scope

- Audit of all existing source files in `server/src/` and `client/src/` to identify testable units and document what is currently covered vs. uncovered
- Implementation of unit tests across both workspaces independently and in parallel, targeting the highest-value units first: services, middleware, utilities, custom hooks, and pure functions
- Coverage threshold justification: each workspace must document its coverage target (at or above 70%) with specific reasoning based on testability, risk, and practicality
- Explicit exclusion decisions documented with rationale (e.g., entry points, generated code, pure-passthrough re-exports) so coverage thresholds are meaningful, not inflated by ignoring difficult files
- Updates to `server/CLAUDE.md` and `client/CLAUDE.md` capturing which files are excluded from coverage and why

### Out of Scope

- Changes to the test frameworks, runners, or configuration established in cm-0020
- End-to-end or integration tests
- CI/CD integration
- Adding new application features or modifying existing behavior
- Visual regression or snapshot testing of UI components beyond what is needed to test logic

## Requirements

### Functional Requirements

- FR-01: Every service file in `server/src/services/` must have a corresponding test file covering all exported functions, with Prisma client mocked via the shared mock established in cm-0020.
- FR-02: Every middleware file in `server/src/middleware/` must have a corresponding test file verifying all control flow branches (e.g., authorized vs. unauthorized, valid vs. invalid input).
- FR-03: Every utility function in `server/src/utils/` and every custom error class in `server/src/errors/` must be covered by tests.
- FR-04: Every custom hook in `client/src/hooks/` and every feature-level hook in `client/src/features/*/hooks/` must have a corresponding test file.
- FR-05: Shared utility functions in `client/src/utils/` and pure API helper functions in `client/src/api/` must be tested to the extent they contain logic beyond simple fetch wrappers.
- FR-06: Each workspace must produce a documented coverage justification explaining the chosen threshold (minimum 70%, but higher where achievable) and listing all excluded files with specific reasoning.
- FR-07: All new tests must follow the naming and directory conventions already established in `server/CLAUDE.md` and `client/CLAUDE.md`.
- FR-08: No existing tests from cm-0020 may be deleted or weakened. New tests must extend, not replace, the existing suite.
- FR-09: The server test suite must pass with no database connections — all Prisma calls must route through the existing shared mock.
- FR-10: The client test suite must pass without a running dev server or live API — all network calls must be mocked.

### Non-Functional Requirements

- NFR-01: The total test suite (both workspaces) must complete in under 60 seconds to keep the feedback loop usable.
- NFR-02: Tests must be deterministic — no random seeds, no time-dependent behavior without mocking, no reliance on test execution order.
- NFR-03: Coverage exclusion decisions must follow established best practices: exclude generated/configuration code, thin passthrough re-exports, and files with no exercisable logic — never exclude files because they are hard to test.
- NFR-04: Each new test file must remain independently runnable (no shared mutable state between test files).

## Systems-Level Architecture

### Components Involved

**Server files expected to gain tests:**
- `server/src/services/` — all service files (assessment, assignment, completion, course, lesson, lesson-resource, lesson-tool, progress, resource-completion, student-note, unit, user)
- `server/src/middleware/` — authenticate, authorize, authorize-resource, envelope, errorHandler, validate
- `server/src/utils/` — asyncHandler, assertExists, softDelete
- `server/src/errors/` — AppError, NotFoundError, ValidationError, ConflictError

**Client files expected to gain tests:**
- `client/src/hooks/` — useCalculator, useDisclosure, useMediaQuery, useOrderedList, useYouTubeTitle (useCanEdit already covered)
- `client/src/features/lessons/hooks/` — useLesson, useTools, useAssignments
- `client/src/utils/` — youtube
- `client/src/api/` — client (apiClient wrapper logic), and any API modules containing non-trivial transformation logic

**Files likely excluded (design phase to confirm each with explicit rationale):**
- Entry point files (`server/src/index.ts`, `client/src/main.tsx`) — no exercisable units
- Route definition files (`server/src/routes/*.ts`) — thin Express router wiring; behavior verified through middleware and controller tests
- Schema definition files (`server/src/schemas/*.ts`) — declarative Zod schemas; logic lives inside Zod itself, not application code
- Re-export index files (`server/src/errors/index.ts`) — zero logic
- Configuration and infrastructure files (`server/src/config.ts`, `server/src/swagger.ts`, `server/src/lib/*.ts`) — thin wrappers around third-party library initialization

### Data Model Changes

None. This spec introduces no changes to the database schema.

### API Changes

None. This spec introduces no new or modified API endpoints.

### Data Flow

Not applicable. Unit tests execute in isolation with mocked dependencies and produce no runtime data flow through the application.

### Integration Points

- **Prisma mock** (`server/src/__tests__/mocks/prisma.ts`): All new server service tests must import and use this shared mock. No test may create a real Prisma client instance.
- **Vitest** (server) and **Vitest** (client via Vite plugin): All tests run under the same runners configured in cm-0020. No new runner configuration is required.
- **Coverage reporters**: Both workspaces already emit coverage; this spec's threshold targets must be achievable within the existing reporter setup without configuration changes.

## Required Design Artifacts

- [x] Backend plan (`backend-plan.md`)
- [ ] API contract (`api-contract.md`)
- [x] Frontend plan (`frontend-plan.md`)
- [ ] UI wireframe (`wireframe.md`)
