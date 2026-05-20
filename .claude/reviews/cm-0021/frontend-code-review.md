---
id: cm-0021
title: Expand unit test coverage — frontend
stage: review
status: approved
approver: agent
approved_at: 2026-05-15T15:15:00Z
revised_at: 2026-05-15T15:35:00Z
---

## Summary

11 new test files under `client/src/__tests__/`. No production source changes. Zero issues at medium or above — approved.

All conventions from `client/CLAUDE.md` are correctly followed: `vi.hoisted()` used where needed, `.js` import extensions throughout, `act`/`waitFor` patterns correct, mock isolation clean, fixtures properly typed.

Low findings from first pass resolved in commit `5968837`.

## Files Reviewed

| File | Layer |
|---|---|
| `api/client.test.ts` | api |
| `context/AuthContext.test.tsx` | context |
| `hooks/useCalculator.test.ts` | hooks |
| `hooks/useDisclosure.test.ts` | hooks |
| `hooks/useLesson.test.tsx` | hooks |
| `hooks/useMediaQuery.test.ts` | hooks |
| `hooks/useOrderedList.test.ts` | hooks |
| `hooks/useTools.test.ts` | hooks |
| `hooks/useYouTubeTitle.test.ts` | hooks |
| `hooks/useAssignments.test.ts` | hooks |
| `utils/youtube.test.ts` | utils |

## Issues

| # | Severity | Location | Description | Status |
|---|---|---|---|---|
| 1 | ~~low~~ | `mocks/authClient.mock.ts:13` | Factory named `createAuthContextValue()` — naming inconsistency with `createApiClientMock()` | **Resolved** — renamed to `createAuthClientMock()` |
| 2 | ~~low~~ | `setup/renderWithProviders.tsx:21-24` | `user` and `isLoading` in `RenderOptions` declared but never read — silent misconfiguration trap | **Resolved** — both fields and the `AuthUser` import removed |
| 3 | info | `hooks/useTools.test.ts:55` | Unused `result` destructure — lint warning | Open — advisory |
| 4 | info | `hooks/useAssignments.test.ts:68` | `setActiveStepKey: vi.fn()` in `defaultParams` safe but config-dependent | Open — advisory |
| 5 | info | `hooks/useLesson.test.tsx:75-85` | Partial fixture factory pattern | Open — advisory, no action required |
