---
id: cm-0020
title: Add Unit Testing Infrastructure
stage: spec
status: approved
approver: human
approved_at: 2026-05-14T00:00:00Z
---

# Add Unit Testing Infrastructure

## Problem Statement

The Course Masters codebase currently has no unit testing infrastructure. As the application grows in complexity -- with assessment grading logic, completion rules, ownership checks, and data cascades -- there is no automated way to verify that individual units of code behave correctly. Establishing a testing foundation now prevents regressions, enables confident refactoring, and sets the stage for future CI integration.

## Scope

### In Scope

- Selection and installation of unit testing frameworks for both client and server workspaces
- Test runner configuration for each workspace (handling TypeScript, ESM, path resolution, and any required transforms)
- npm scripts at the workspace level (client and server each get their own test commands) and at the root level (a single command to run all workspace tests)
- Coverage reporting configuration with a minimum threshold aligned to the project config (70% per `config.yaml`)
- A small set of example/seed tests demonstrating the established patterns for each workspace (at least one per workspace)
- Mocking infrastructure setup so that all external dependencies (database client, third-party services, network requests, file system, etc.) can be properly isolated in tests
- Documentation of testing conventions added to the relevant scoped rules files (`server/CLAUDE.md` and `client/CLAUDE.md`)

### Out of Scope

- End-to-end (E2E) or integration testing frameworks
- CI/CD pipeline integration (deferred to a future spec)
- Achieving any specific coverage target across the existing codebase -- this spec establishes the infrastructure, not comprehensive test suites
- Prescribing specific testing framework choices (left to the design/implementation phases based on ecosystem fit)
- Component snapshot testing strategy
- Visual regression testing
- Performance/load testing

## Requirements

### Functional Requirements

- FR-01: The server workspace must have a working unit test runner that can discover and execute test files written in TypeScript with ESM module resolution.
- FR-02: The client workspace must have a working unit test runner that can discover and execute test files written in TypeScript, including tests for React components and hooks.
- FR-03: Both workspaces must support a standard mocking mechanism capable of isolating all external dependencies -- including but not limited to the Prisma client, HTTP requests, authentication modules, and any third-party service integrations.
- FR-04: Running `npm test` (or equivalent) from the project root must execute tests across both workspaces and report a combined pass/fail result.
- FR-05: Running a workspace-specific test command from within `client/` or `server/` must execute only that workspace's tests.
- FR-06: Both test runners must produce code coverage reports indicating line, branch, function, and statement coverage percentages.
- FR-07: The coverage configuration must enforce a minimum threshold of 70%, causing the test command to exit with a non-zero status code when coverage falls below this threshold.
- FR-08: At least one example test must exist in the server workspace demonstrating the pattern for testing a unit of server-side logic with mocked dependencies.
- FR-09: At least one example test must exist in the client workspace demonstrating the pattern for testing a React component or hook with mocked dependencies.
- FR-10: Test files must follow a consistent naming convention and directory structure documented in the relevant workspace CLAUDE.md file.
- FR-11: The test configuration must not interfere with existing development workflows (`npm run dev`, `npm run db:migrate`, etc.).

### Non-Functional Requirements

- NFR-01: Test suite startup time for an empty or near-empty test suite must be under 10 seconds per workspace to keep the feedback loop fast during development.
- NFR-02: Framework choices must be compatible with the existing stack: TypeScript 5, ESM modules, React 19, Express 5, Prisma 6, and Vite 6.
- NFR-03: New dev dependencies must be justified by necessity. Prefer frameworks that minimize the number of additional packages required.
- NFR-04: Test configuration files must not require changes to the production TypeScript or Vite configurations.

## Systems-Level Architecture

### Components Involved

**Existing components touched:**
- Root `package.json` -- new scripts for running tests across all workspaces
- `client/package.json` -- new dev dependencies and test scripts
- `server/package.json` -- new dev dependencies and test scripts
- `client/CLAUDE.md` -- documentation of frontend testing conventions
- `server/CLAUDE.md` -- documentation of backend testing conventions

**New components introduced:**
- Test configuration file(s) in `client/` for the chosen frontend test runner
- Test configuration file(s) in `server/` for the chosen backend test runner
- Mock setup/utility files in each workspace for shared mocking patterns
- Example test files in each workspace demonstrating canonical test patterns

### Data Model Changes

None. This spec introduces no changes to the database schema or Prisma models.

### API Changes

None. This spec introduces no new or modified API endpoints.

### Data Flow

Not applicable. Unit tests execute in isolation and do not involve runtime data flow through the application. Each test invokes a unit of code with controlled inputs and mocked dependencies, then asserts on the output or side effects.

### Integration Points

- **Prisma client**: Server-side tests must mock the Prisma client so that no real database connections are made during unit test execution.
- **better-auth**: Any server-side code that touches authentication (session validation, role checks) must be mockable in tests without requiring a running auth server.
- **Vite**: The client test runner must be compatible with Vite's module resolution and any Vite-specific transforms (CSS modules, asset imports, etc.) without requiring Vite to be running.
- **npm workspaces**: Test scripts must respect the monorepo workspace structure, allowing both targeted and aggregate test execution.
- **Existing npm scripts**: The new test scripts must coexist with all existing scripts in root and workspace `package.json` files without conflicts.

## Required Design Artifacts

- [x] Backend plan (`backend-plan.md`)
- [ ] API contract (`api-contract.md`)
- [x] Frontend plan (`frontend-plan.md`)
- [ ] UI wireframe (`wireframe.md`)
