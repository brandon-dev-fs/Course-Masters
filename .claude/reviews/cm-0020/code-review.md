---
id: cm-0020
title: Code Review — Add Unit Testing Infrastructure
stage: review
status: approved
approver: agent
approved_at: 2026-05-15T00:00:00Z
---

# Code Review — cm-0020: Add Unit Testing Infrastructure

**Status: APPROVED** — Zero issues at medium or above.

## Previously Blocking Issues — All Fixed

- **[HIGH] Vitest version split** — Both workspaces now pin `vitest` and `@vitest/coverage-v8` at `^4.1.6`. Fixed.
- **[MEDIUM] Missing Unit Testing sections in CLAUDE.md** — Both `server/CLAUDE.md` and `client/CLAUDE.md` now include comprehensive `## Unit Testing` sections covering runner, commands, directory conventions, mock patterns, and coverage threshold behavior. Fixed.
- **[MEDIUM] Fixture helpers typed as `Record<string, unknown>`** — `makeQuestion` returns `AssessmentQuestion`. `makeAssessment` returns `Prisma.AssessmentGetPayload<{ include: { questions: true } }>` via the `AssessmentWithQuestions` alias. Fixed.
- **[LOW] `.mock.ts` infix convention undocumented** — Now documented in `client/CLAUDE.md` file structure table. Fixed.

---

## Remaining Issues

### [LOW] `createAuthContextValue` is a misleading factory name

- **Location**: `client/src/__tests__/mocks/authClient.mock.ts`
- **Description**: The factory that creates stubs for the `authClient` HTTP client is named `createAuthContextValue` — the same semantic name expected for a factory producing an `AuthContextValue` (which is `makeAuthContext` in `authContext.mock.ts`). The exported singleton `authClientMock` is correctly named; only the internal factory is misleading.
- **Suggested Fix**: Rename to `createAuthClientMock()` to align with `createApiClientMock()`.

### [LOW] Redundant `afterEach(() => vi.clearAllMocks())` in `client/vitest.setup.ts`

- **Location**: `client/vitest.setup.ts:33`
- **Description**: `clearMocks: true` in `vitest.config.ts` already performs this automatically after every test. The explicit `afterEach` is idempotent but creates confusion about which mechanism owns mock cleanup.
- **Suggested Fix**: Remove the `afterEach` line.

---

## Key Findings Supporting Approval

- `server/vitest.config.ts` — All plan requirements met. `json-summary` reporter addition is additive and documented.
- `server/src/__tests__/mocks/prisma.ts` — Proxy-based factory with `$transaction` support is correct. No `any`.
- `assessment.service.test.ts` — Exceeds the plan's 8 required test cases (11 cases total). `vi.mock` correctly hoisted. Prisma fixtures properly typed with Prisma-inferred types.
- `client/vitest.config.ts` — Matches frontend plan spec. Production `vite.config.ts` untouched (NFR-04 satisfied).
- `client/vitest.setup.ts` — `jest-dom`, `matchMedia`, and `ResizeObserver` stubs correct and documented.
- `renderWithProviders.tsx` — `user`/`isLoading` options documented in JSDoc explaining they are not directly injected — deliberate design per plan, now documented in `client/CLAUDE.md`.
- `useFetch.test.ts` — Exceeds plan cases; `act()` used correctly around `reload()`; all three `ApiClientError` classes tested.
- `useCanEdit.test.tsx` — Direct `AuthContext.Provider` pattern; three additional transition tests beyond plan minimum.
- `client/src/context/AuthContext.tsx` — Only `export { AuthContext }` added, exactly as required by the plan.
- Root `package.json` — `"test": "npm run test -w server -w client"` present (FR-04 satisfied).
- No `.claude/` artifacts modified by coders. No secrets or sensitive data exposed.
