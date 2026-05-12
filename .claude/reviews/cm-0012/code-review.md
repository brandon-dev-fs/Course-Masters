---
id: cm-0012
title: Extract Duplicated Frontend Logic into Shared Hooks and Utilities
stage: review
status: approved
approver: agent
approved_at: 2026-05-12T00:00:00Z
---

# Code Review — cm-0012 (Pass 3)

**Spec**: cm-0012 | **Branch**: `refactor/code_cleanup` | **Base**: `develop`

## Verdict: APPROVED

No issues at medium or above.

---

## Pass 3 Fix Verified

### `useAssignments.persistReorder` — stale-ref timing defect (previously HIGH) ✓

The fix is correct. `persistReorder` now maps over `assignmentsRef.current` (the pre-swap committed state, which is correct at call time) and applies the swap inline using the `aNewOrder`/`bNewOrder` arguments that `useOrderedList` already passes to `PersistFn`. All four parameters are used — no unused `_` prefixes. The comment explaining the React batching timing constraint is accurate and helpful.

---

## Remaining Issues

### [LOW] Mixed indentation in `CourseDetailPage.tsx`
- **Severity**: low
- **Location**: `client/src/features/courses/CourseDetailPage.tsx:17–19`
- **Description**: Import lines added in this PR use 2-space indentation; the component body uses tabs.
- **Suggested Fix**: Run Prettier on this file.

### [INFO] `useFetch` uses boolean cancellation flag rather than `AbortController`
- **Severity**: info
- **Location**: `client/src/hooks/useFetch.ts:25–36`
- **Description**: In-flight requests are not aborted on unmount. Advisory only, matches the plan.
- **Suggested Fix**: Consider upgrading to `AbortController` in a future iteration.

---

## Full Review Summary

All 5 new hooks match their spec and plan interfaces:
- `useCanEdit` — correct `useMemo`, returns `false` for unauthenticated users
- `useDisclosure` — correctly scoped to `CourseDetailPage` (5) and `LessonDetailPage` (2)
- `useFetch` — correct cancellation via boolean flag; `eslint-disable` on deps is justified
- `useOrderedList` — rollback correctly reverts both order values and re-sorts
- `useYouTubeTitle` — `titleTouched.current` double-guard preserved in both consumers

All spec FRs satisfied including FR-11 (`useAssignments` now uses `useOrderedList`).
No new runtime dependencies (NFR-01). No type system escape hatches. No debug logging.
