---
id: cm-0010
title: Fix Assignment Reorder Race Condition and Add Pagination
stage: review
status: approved
---

# Code Review — cm-0010 (Pass 2)

**Status: APPROVED** — zero issues at medium or above.

## Previously Blocking Issues — Both Fixed

**[was CRITICAL] `client/src/api/assessments.ts` return type**: Fixed. `PaginatedAttempts` type defined in `types.ts`, imported in `assessments.ts`, used as the generic on `apiClient.get<PaginatedAttempts>`. The `useAssessment` hook interface updated and both `setAttempts` call sites correctly unwrap `res.data`.

**[was HIGH] `POST /:assessmentId/attempts` missing `authenticate()`**: Fixed. `authenticate()` added before `requireStudentRole()` on the POST attempts route (and also explicitly on the GET route).

---

## Remaining Issues (non-blocking)

### [LOW] Full-page spinner on every page change in AdminUsersPage

- **Location**: `client/src/features/auth/AdminUsersPage.tsx`
- **Description**: `fetchUsers` calls `setLoading(true)` on every invocation. The component renders `<LoadingSpinner fullPage />` whenever `loading` is true, so page-change clicks (Previous/Next) replace the entire table with a full-page spinner, discarding the user's visual context.
- **Suggested fix**: Separate `initialLoad` boolean — only show full-page spinner on initial load. For page changes, apply `opacity-50 pointer-events-none` to the table section while refetching.

### [INFO] `client/CLAUDE.md` documents stale `getAttempts` return type

- **Location**: `client/CLAUDE.md`
- **Description**: Still shows `getAttempts?: (id: string) => Promise<AttemptSummary[]>`. The actual interface is now `Promise<PaginatedAttempts>`. Advisory only.
- **Suggested fix**: Update the `useAssessment API interface` block in `client/CLAUDE.md`.

---

## Full Scope Findings

### Backend

| Change | Assessment |
|---|---|
| `assignmentService.reorder` — interactive tx with `FOR UPDATE` + Serializable | Correct. Validation inside transaction, parameterized raw query. |
| `errorHandler.ts` — P2034 → 409 TRANSACTION_CONFLICT | Correct. No internals exposed. |
| `attemptsQuerySchema` — `z.coerce.number()`, bounds, defaults | Correct. Default 20, max 100. |
| `assessmentService.getAttempts` — parallel count + paginated findMany | Correct. Returns `{ data, total, page, pageSize }`. User scoping preserved. |
| `assessmentController.getAttempts` — safeParse on req.query | Correct. ValidationError on bad params. |
| `GET /:assessmentId/attempts` — authenticate() added | Correct. |

### Frontend

| Change | Assessment |
|---|---|
| `assessments.ts` — PaginatedAttempts return type | Correct. |
| `useAssessment.ts` — interface + res.data unwrap at both call sites | Correct. |
| `AdminUsersPage.tsx` — PAGE_SIZE=20, offset, pagination controls | Correct logic; UX loading state issue (low, noted above). |
| `QuizSection`, `TestSection`, `UnitTestCard` — single-arg getAttempts | Correct. Defaults to page 1, size 20. |
