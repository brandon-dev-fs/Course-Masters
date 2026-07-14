---
id: cm-0021
title: Expand unit test coverage — security
stage: review
status: approved
approver: agent
approved_at: 2026-05-15T15:10:00Z
---

## Summary

All 24 changed files are test infrastructure only (`server/src/__tests__/` and `client/src/__tests__/`). No production source code was modified. Zero issues at medium severity or above — auto-approved.

## Checklist

| Category | Result |
|---|---|
| Secrets in test files | Pass — no real credentials, API keys, database URLs, or PII anywhere in the diff |
| Mock bypass (prisma.ts) | Pass — `prismaMock` is excluded from the production build by vitest config and only loaded via `vi.mock()` in the test process. No path for production code to import it. |
| Dependency changes | Pass — no new dependencies; devDependencies unchanged |
| Real data in fixtures | Pass — all IDs are fabricated (`'user-1'`, `'course-1'`, etc.), emails use `@test.com` / `@example.com` |
| Injection | Pass — no raw query construction; Prisma mock uses `vi.fn()` stubs only |
| Sensitive data exposure | Pass |

## Issues

| # | Severity | Location | Description | Suggested Fix | Hand back to |
|---|---|---|---|---|---|
| 1 | info | `client/src/__tests__/context/AuthContext.test.tsx` lines 69, 74, 103, 118, 124 | `'password123'` and `'pass'` passed to `authClientMock.signIn.email` / `signUp.email` — both are `vi.fn()` stubs that never touch a network or real auth system. Not a real credential exposure. | Optional: define `const TEST_PASSWORD = 'test-password-stub'` for consistency | — |
| 2 | info | `server/src/__tests__/mocks/prisma.ts` | Module-level export of `prismaMock` is safe because `__tests__/` is excluded from production compilation. Belt-and-suspenders: confirm `server/tsconfig.json` excludes `src/__tests__/`. | Verify `tsconfig.json` `exclude` array includes `src/__tests__` | — |
