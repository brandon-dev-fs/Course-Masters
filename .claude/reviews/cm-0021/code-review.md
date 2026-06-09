---
id: cm-0021
title: Expand unit test coverage — backend
stage: review
status: approved
approver: agent
approved_at: 2026-05-15T15:20:00Z
revised_at: 2026-05-15T15:35:00Z
---

## Summary

24 new test files under `server/src/__tests__/` (errors, middleware, services, utils, mocks). No production source changes. Zero issues at medium or above — approved.

All spec requirements satisfied: `.js` imports throughout, `vi.clearAllMocks()` in every `beforeEach`, proper Prisma proxy mock, `asyncHandler` timing correctly handled via `flushMiddleware`.

Low findings from first pass resolved in commit `5968837`.

## Notable Positives

- **`$transaction` mock** — caching `$transaction` on the proxy and passing `proxy`-as-`tx` is correct. All model stubs configured on `prismaMock` are visible inside transaction callbacks. `vi.clearAllMocks()` in each `beforeEach` preserves test isolation.
- **`flushMiddleware` helper** — three chained `await Promise.resolve()` is the correct fix for the two-level microtask depth introduced by `asyncHandler` + `resolveCourseOwner`. Deterministic.
- **Fixture typing** — all service test fixtures now use `Prisma.*GetPayload<{include:...}>` types as required.

## Issues

| # | Severity | Location | Description | Status |
|---|---|---|---|---|
| 1 | ~~low~~ | `services/progress.service.test.ts:66` | `Math.random()` in fixture ID | **Resolved** — fixed to `'attempt-1'` |
| 2 | ~~low~~ | `services/assignment.service.test.ts:29-36` | `ASSIGNMENT_WITH_RELATIONS` typed implicitly | **Resolved** — `AssignmentWithRelations` type added |
| 3 | ~~low~~ | `services/course.service.test.ts:30-34` | `mockCourseWithUnits` typed implicitly | **Resolved** — `CourseWithUnits` type added |
| 4 | info | `server/CLAUDE.md` unit testing section | `errors/` directory not listed in structure table | Open — documentation gap, no action required to ship |
| 5 | info | `utils/asyncHandler.test.ts` | `setImmediate` without `vi.useFakeTimers` note | Open — advisory only |
