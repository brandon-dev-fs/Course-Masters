---
id: cm-0020
title: Add Unit Testing Infrastructure
stage: design
status: approved
approver: human
approved_at: 2026-05-14T00:00:00Z
---

# Backend Plan — cm-0020: Add Unit Testing Infrastructure

## Overview

This plan establishes a unit testing infrastructure for the `server/` workspace. No schema changes and no API changes are required. The deliverables are: framework installation and configuration, Prisma mock setup, and one canonical example test that exercises grading logic in `assessment.service.ts` with all external dependencies mocked.

The server uses Node.js ESM (`"type": "module"`, `moduleResolution: NodeNext`), TypeScript 5, and `tsx` for execution. The test runner must handle TypeScript + ESM natively without a separate compile step and without altering the production tsconfig.

---

## Schema Changes

None. This spec introduces no changes to the Prisma schema or database models.

---

## API Changes

None. This spec introduces no new or modified endpoints.

---

## Layer Structure

### Files Produced

```
server/
  vitest.config.ts                          # Vitest configuration
  src/
    __tests__/
      services/
        assessment.service.test.ts          # Example service test (FR-08)
      mocks/
        prisma.ts                           # Shared Prisma mock factory
```

No changes to existing source files outside of `server/package.json` and `server/CLAUDE.md`.

---

## Framework Selection

**Vitest** is selected as the test runner for the server workspace.

Justification against NFR-02 and NFR-03:

- Vitest natively understands TypeScript (via Vite's esbuild transform) without a separate `ts-jest` or `babel` transform pipeline, satisfying NFR-04 (no changes to the production tsconfig).
- Vitest ships with a built-in `vi.mock()` / `vi.fn()` API that covers all mocking needs — no separate `jest-mock` or `sinon` packages needed.
- Vitest supports ESM natively; it does not require `--experimental-vm-modules` flags that Jest requires for ESM, keeping configuration minimal.
- Vitest's cold-start time for an empty suite is well under the 10-second threshold of NFR-01.
- `@vitest/coverage-v8` provides line/branch/function/statement coverage via V8's native coverage instrumentation — no Babel instrumentation required.
- The existing client workspace uses Vite 6; using Vitest on both workspaces means a single framework family across the monorepo, reducing cognitive overhead.

**Additional packages required (server devDependencies):**

| Package | Version | Purpose |
|---|---|---|
| `vitest` | `^3.x` | Test runner + assertion library + mocking API |
| `@vitest/coverage-v8` | `^3.x` | V8-based coverage reporter |

No production dependencies are added.

---

## Vitest Configuration

**File**: `server/vitest.config.ts`

Key decisions:

- `globals: true` — enables `describe`, `it`, `expect`, `vi` without import in test files. This matches Jest conventions that contributors will be familiar with. If the team prefers explicit imports, `globals: false` is a one-line change; document the choice in `server/CLAUDE.md`.
- `environment: 'node'` — no DOM simulation; tests run in a plain Node.js context.
- `include: ['src/**/*.test.ts']` — co-located tests under `src/__tests__/` as well as any `*.test.ts` placed next to source files.
- `clearMocks: true` — mock state is reset between every test automatically; stubs do not bleed across tests.
- Coverage thresholds enforce 70% minimum per FR-07 and `config.yaml`.
- `src/index.ts` and `src/app.ts` excluded from coverage because they wire process lifecycle and the Express middleware stack — these are integration concerns, not unit-testable in isolation.

---

## Prisma Mock Strategy

Vitest's `vi.mock()` intercepts module imports at the boundary of each test file. The Prisma singleton lives at `src/lib/prisma.ts`. The mock replaces every `PrismaClient` method with a `vi.fn()` stub, allowing tests to control return values per-test with `mockResolvedValue` / `mockRejectedValue`.

**File**: `server/src/__tests__/mocks/prisma.ts`

The `prismaMock` object is a `Proxy`-based factory that:
- Returns `vi.fn()` stubs for every model method accessed
- Handles `$transaction` by executing the callback with a fresh mock proxy (so transactional code is testable)
- Is exported so individual tests can configure return values: `prismaMock.assessment.findFirst.mockResolvedValue({ ... })`

Each test file that exercises code importing from `src/lib/prisma.ts` calls:
```
vi.mock('../../lib/prisma.js', () => ({ default: prismaMock }))
```
at the top of the file.

---

## Example Test — `assessment.service.test.ts`

This test satisfies FR-08: at least one example server-side test demonstrating the pattern for testing a unit of server-side logic with mocked dependencies.

The target unit is `assessmentService.submitAttempt`. It contains the most complex, highest-value business logic in the service layer: grading across four question types, required-assignment checks, and pass/fail calculation.

**File**: `server/src/__tests__/services/assessment.service.test.ts`

Test cases to implement (every `it()` block must use real Vitest assertions — no skipped stubs):

- **multiple_choice grading**: scores 100% when all answers correct; scores 0% when all wrong
- **true_false grading**: accepts boolean `correctAnswer` match
- **fill_in_blank grading**: matches case-insensitively against `acceptedAnswers` array; does not count if answer not in array
- **matching grading**: requires deep JSON equality of pairs array
- **pass threshold**: passes at exactly 80% score; fails below 80%
- **required assignments gate**: throws `REQUIRED_ASSIGNMENTS_INCOMPLETE` when a required resource is not completed; allows submission when all required resources are completed
- **assessment not found**: throws `NotFoundError` when `findFirst` returns `null`
- **empty question set**: returns score 0 and `passed: false` when `questions: []`

---

## npm Scripts

### `server/package.json` additions

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

- `test` — single-run mode suitable for CI and the root aggregate command.
- `test:watch` — interactive mode for local development.
- `test:coverage` — generates coverage report and enforces thresholds.

### Root `package.json` addition

```json
"test": "npm run test -w server -w client"
```

This satisfies FR-04: running `npm test` from the project root executes tests in both workspaces and reports a combined pass/fail. npm workspaces `-w` flags run sequentially; if either fails, the root command exits non-zero.

---

## TypeScript Conventions for Tests

- Test files are TypeScript (`.test.ts`).
- Import paths in test files use `.js` extension on relative imports, consistent with the server ESM convention. Vitest resolves `.js` → `.ts` at test time under `moduleResolution: NodeNext`.
- `vi.fn()` return types are inferred from the Prisma model types — no `any` needed when the mock factory is properly typed.

---

## File Naming and Directory Convention

Document in `server/CLAUDE.md`:

- Test files: `*.test.ts`
- Location: `server/src/__tests__/<layer>/<name>.test.ts` where `<layer>` is `services`, `controllers`, `middleware`, or `utils`
- Mock utilities: `server/src/__tests__/mocks/<name>.ts`
- One test file per source module
- Test file names mirror the source file name: `assessment.service.ts` → `assessment.service.test.ts`

---

## Dependencies Summary

| Package | Workspace | Type | Justification |
|---|---|---|---|
| `vitest` | `server` | devDependency | Test runner; ESM + TypeScript native; zero-config for Node environment |
| `@vitest/coverage-v8` | `server` | devDependency | V8 coverage; no Babel instrumentation; pairs with Vitest |

No production dependencies added. No existing dependencies removed or upgraded.

---

## Implementation Steps for Coder Agent

1. Install packages: `npm install --save-dev vitest @vitest/coverage-v8 -w server` from repo root.
2. Create `server/vitest.config.ts` with `globals: true`, `environment: 'node'`, `clearMocks: true`, coverage provider `v8`, 70% thresholds on all four metrics, and appropriate `include`/`exclude` paths.
3. Create `server/src/__tests__/mocks/prisma.ts` with the Proxy-based Prisma mock factory and `prismaMock` export.
4. Create `server/src/__tests__/services/assessment.service.test.ts` with all test cases listed above fully implemented with real assertions.
5. Add `test`, `test:watch`, and `test:coverage` scripts to `server/package.json`.
6. Add `"test": "npm run test -w server -w client"` to root `package.json`.
7. Run `npm test -w server` and confirm all tests pass and coverage thresholds are met.
8. Append testing conventions section to `server/CLAUDE.md`: file path, naming convention, mock pattern, how to run tests.
9. Do not modify any production source file or tsconfig.
