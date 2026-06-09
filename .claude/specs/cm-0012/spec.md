---
id: cm-0012
title: Extract Duplicated Frontend Logic into Shared Hooks and Utilities
stage: spec
status: approved
approver: human
approved_at: 2026-05-08T00:00:00Z
---

# Extract Duplicated Frontend Logic into Shared Hooks and Utilities

## Problem Statement

The frontend codebase contains several areas of duplicated logic that increase maintenance burden and create consistency risks. YouTube URL validation and title-fetching logic is copy-pasted across two form components. Role-based edit permission checks are repeated as identical inline expressions in at least nine components. Array reordering with optimistic update and rollback is copy-pasted verbatim across three domain hooks. Modal open/close state is managed with repeated `useState` pairs across ten or more components. And a consistent `{ data, loading, error }` async fetch pattern is re-implemented in at least six places. Extracting these into shared hooks and utilities will reduce maintenance burden, ensure behavioral consistency, and make future changes single-point edits.

## Scope

### In Scope

- Extract YouTube URL regex and auto-title-fetch logic from `VideoForm` and `VideoAssignmentForm` into a shared `useYouTubeTitle` hook and centralize the URL regex in the existing `utils/youtube.ts` module
- Extract the `canEdit` role check (`user?.role === 'teacher' || user?.role === 'admin'`) into a shared `useCanEdit` hook and adopt it across all components that currently inline this expression
- Extract the "find by ID, swap orders, optimistic update, revert on error" reordering logic duplicated in `useResources`, `useTools`, and `useAssignments` into a shared `useOrderedList` utility or hook
- Extract the repeated `useDisclosure` (single boolean open/close) pattern into a shared hook to replace the 10+ scattered `const [showX, setShowX] = useState(false)` pairs
- Extract the repeated `{ data, loading, error }` async fetch pattern into a shared `useFetch` hook to replace manual re-implementations in `CourseDetailPage`, `useLesson`, `useResources`, `useTools`, and `useAssignments`

### Out of Scope

- LessonDetailPage state consolidation (already completed in cm-0011)
- `useResourceList` hook adoption (already adopted consistently)
- Any backend or API changes (this is a pure frontend refactor)
- Any new UI screens, layouts, or visual changes
- Changes to the role model itself or authorization middleware
- Changes to the existing `extractYouTubeId` or `getEmbedUrl` functions in `utils/youtube.ts`
- Form field state abstractions (`useFormFields`) — too little benefit for the forms' current complexity
- Confirmation dialog state — already largely handled by `useResourceList`

## Requirements

### Functional Requirements

**YouTube utilities**

- FR-01: A `useYouTubeTitle` hook shall encapsulate the YouTube URL validation regex, the title-fetch API call to `/youtube/title`, and the "title already touched" guard logic currently duplicated in `VideoForm` and `VideoAssignmentForm`
- FR-02: The YouTube URL regex currently defined independently in `VideoForm` and `VideoAssignmentForm` shall be moved to `utils/youtube.ts` as a single shared constant alongside the existing `extractYouTubeId` and `getEmbedUrl` exports
- FR-03: `VideoForm` and `VideoAssignmentForm` shall be refactored to use the shared `useYouTubeTitle` hook, removing their local YouTube regex definitions and title-fetch logic
- FR-04: After refactoring, `VideoForm` and `VideoAssignmentForm` shall behave identically to their current implementations: URL blur triggers a title fetch only when the URL is valid and the title has not been manually edited

**Role checks**

- FR-05: A shared `useCanEdit` hook shall return a boolean indicating whether the current user has the `teacher` or `admin` role
- FR-06: The `useCanEdit` hook shall derive its value from the existing `AuthContext` user object without introducing new context providers or state
- FR-07: All components currently containing the inline expression `user?.role === 'teacher' || user?.role === 'admin'` shall be updated to use the shared hook instead. Affected components include at minimum: `VocabList`, `NoteEditor`, `HomePage`, `VideoList`, `FlashCardList`, `CourseDetailPage`, `PracticeProblemList`, and `useLesson`
- FR-08: After refactoring, all role-check consumers shall produce identical conditional rendering behavior as before the change

**Ordered list reordering**

- FR-09: A shared `useOrderedList` hook or utility shall encapsulate the "sort by order, find by ID, swap order values, apply optimistically, revert on API error" logic currently copy-pasted in `useResources`, `useTools`, and `useAssignments`
- FR-10: The shared reordering abstraction shall support any list of items with `id` and `order` fields, and accept an async persist callback
- FR-11: `useResources`, `useTools`, and `useAssignments` shall be refactored to use the shared abstraction, removing their local reordering implementations
- FR-12: After refactoring, all three hooks shall produce identical reordering and rollback behavior as before

**Disclosure (modal open/close)**

- FR-13: A shared `useDisclosure` hook shall manage a single boolean open/close state and return `isOpen`, `open`, `close`, and `toggle` helpers
- FR-14: Components and pages that currently manage modal visibility with bare `const [showX, setShowX] = useState(false)` pairs shall be refactored to use `useDisclosure` where the pattern appears
- FR-15: After refactoring, all modal open/close behavior shall be identical to the current implementation

**Async fetch pattern**

- FR-16: A shared `useFetch` hook shall encapsulate the `{ data, loading, error }` state shape, the `useEffect`-driven fetch call, and the `err instanceof Error ? err.message : 'Failed to load'` error normalization currently repeated across multiple files
- FR-17: `CourseDetailPage`, `useLesson`, `useResources`, `useTools`, and `useAssignments` shall be refactored to use `useFetch` where their fetch patterns match the shared shape
- FR-18: After refactoring, all data loading and error display behavior shall be identical to the current implementation

### Non-Functional Requirements

- NFR-01: No new runtime dependencies shall be introduced
- NFR-02: The refactoring shall not change any user-visible behavior, API calls, or rendered output
- NFR-03: All new shared hooks and utilities shall follow the project's existing conventions: shared hooks in `src/hooks/`, utilities in `src/utils/`

## Systems-Level Architecture

### Components Involved

**New files:**

- `hooks/useYouTubeTitle.ts` — shared hook encapsulating YouTube URL validation and title auto-fetch
- `hooks/useCanEdit.ts` — shared hook returning whether the current user has edit permissions
- `hooks/useOrderedList.ts` — shared hook or utility for optimistic order-swap with rollback
- `hooks/useDisclosure.ts` — shared hook for single boolean open/close state
- `hooks/useFetch.ts` — shared hook for `{ data, loading, error }` async fetch pattern

**Existing files to extend:**

- `utils/youtube.ts` — add the shared YouTube URL validation regex as a named export

**Existing files to modify:**

- `features/videos/VideoForm.tsx` — adopt `useYouTubeTitle`
- `features/assignments/VideoAssignmentForm.tsx` — adopt `useYouTubeTitle`
- `features/vocab/VocabList.tsx` — adopt `useCanEdit`, `useDisclosure`
- `features/notes/NoteEditor.tsx` — adopt `useCanEdit`
- `features/home/HomePage.tsx` — adopt `useCanEdit`
- `features/videos/VideoList.tsx` — adopt `useCanEdit`, `useDisclosure`
- `features/flashcards/FlashCardList.tsx` — adopt `useCanEdit`, `useDisclosure`
- `features/courses/CourseDetailPage.tsx` — adopt `useCanEdit`, `useDisclosure`, `useFetch`
- `features/practice-problems/PracticeProblemList.tsx` — adopt `useCanEdit`, `useDisclosure`
- `features/lessons/hooks/useLesson.ts` — adopt `useCanEdit`, `useFetch`
- `features/lessons/hooks/useResources.ts` — adopt `useOrderedList`, `useFetch`
- `features/lessons/hooks/useTools.ts` — adopt `useOrderedList`, `useFetch`
- `features/lessons/hooks/useAssignments.ts` — adopt `useOrderedList`, `useFetch`
- `features/lessons/LessonDetailPage.tsx` — adopt `useDisclosure`

### Data Model Changes

None. This is a pure frontend refactoring with no database or schema impact.

### API Changes

None. No new or modified endpoints. The existing `GET /youtube/title` endpoint continues to be called with the same parameters.

### Data Flow

**YouTube title auto-fetch (after refactoring):** When a user blurs the URL input in either `VideoForm` or `VideoAssignmentForm`, the `useYouTubeTitle` hook validates the URL against the shared regex from `utils/youtube.ts`. If valid and the title has not been manually edited, the hook calls the `/youtube/title` API endpoint and returns the fetched title to the consuming component.

**Role-based edit checks (after refactoring):** Components that conditionally render edit/delete actions call `useCanEdit`, which reads the user object from `AuthContext` and returns a boolean.

**Ordered list reordering (after refactoring):** When a user triggers a move-up or move-down action, the consuming hook calls `useOrderedList`'s reorder handler. It applies the swap optimistically to local state, calls the persist callback, and reverts to the pre-swap snapshot if the API call fails.

**Disclosure state (after refactoring):** Components call `useDisclosure()` per modal and use the returned `isOpen`, `open`, and `close` helpers in place of inline `useState` pairs.

**Async fetch (after refactoring):** Hooks and pages that load data on mount call `useFetch` with a fetch function and dependencies. The hook manages loading, error normalization, and result state internally.

### Integration Points

- `AuthContext` — `useCanEdit` reads the user session from the existing auth context
- `apiClient` — `useYouTubeTitle` uses the existing API client to call `/youtube/title`; `useFetch` wraps existing API client calls
- `utils/youtube.ts` — extended with the URL regex constant; no existing exports are modified

## Required Design Artifacts

- [ ] Backend plan (`backend-plan.md`)
- [ ] API contract (`api-contract.md`)
- [x] Frontend plan (`frontend-plan.md`)
- [ ] UI wireframe (`wireframe.md`)
