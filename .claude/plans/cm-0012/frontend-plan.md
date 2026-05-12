---
id: cm-0012
title: Extract Duplicated Frontend Logic into Shared Hooks and Utilities
stage: design
status: approved
approver: human
approved_at: 2026-05-08T00:00:00Z
---

# Frontend Implementation Plan — cm-0012

## 1. Overview

This plan covers a pure frontend refactor that extracts five areas of duplicated logic into shared hooks and one utility constant. No user-visible behavior changes, no new API endpoints, no new UI screens. The spec's acceptance criteria are:

- FR-01–04: `useYouTubeTitle` hook + shared regex constant in `utils/youtube.ts`
- FR-05–08: `useCanEdit` hook adopted in nine consumers
- FR-09–12: `useOrderedList` hook adopted in `useResources`, `useTools`, and `useAssignments`
- FR-13–15: `useDisclosure` hook adopted in `CourseDetailPage`, `LessonDetailPage`, `FlashCardList`, `VocabList`, `VideoList`, and `PracticeProblemList`
- FR-16–18: `useFetch` hook adopted in `CourseDetailPage`, `useLesson`, `useResources`, `useTools`, and `useAssignments`

## 2. Folder Structure

New files (all relative to repo root):

```
client/src/hooks/useYouTubeTitle.ts      (new)
client/src/hooks/useCanEdit.ts           (new)
client/src/hooks/useOrderedList.ts       (new)
client/src/hooks/useDisclosure.ts        (new)
client/src/hooks/useFetch.ts             (new)
```

Modified files:

```
client/src/utils/youtube.ts
client/src/features/videos/VideoForm.tsx
client/src/features/assignments/VideoAssignmentForm.tsx
client/src/features/vocab/VocabList.tsx
client/src/features/notes/NoteEditor.tsx
client/src/features/home/HomePage.tsx
client/src/features/videos/VideoList.tsx
client/src/features/flashcards/FlashCardList.tsx
client/src/features/courses/CourseDetailPage.tsx
client/src/features/practice-problems/PracticeProblemList.tsx
client/src/features/lessons/hooks/useLesson.ts
client/src/features/lessons/hooks/useResources.ts
client/src/features/lessons/hooks/useTools.ts
client/src/features/lessons/hooks/useAssignments.ts
client/src/features/lessons/LessonDetailPage.tsx
```

## 3. Component Tree

This refactor produces no new components or pages. All changes are to existing hooks and components. Below are the hook interfaces for the new shared hooks.

### `useFetch` (new shared hook)

- **File:** `client/src/hooks/useFetch.ts`
- **Type:** Shared hook
- **Responsibility:** Manages `{ data, loading, error }` state for a single async fetch call triggered by dependency changes. Normalizes errors to string via `err instanceof Error ? err.message : 'Failed to load'`.

```ts
interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string;
  reload: () => void;
}

function useFetch<T>(
  fetchFn: () => Promise<T>,
  deps: React.DependencyList,
): UseFetchResult<T>
```

- `fetchFn` is a stable-reference function (callers must memoize or define inline with stable deps).
- `reload` re-executes `fetchFn` without changing deps (uses a counter ref internally).
- `data` starts as `null`; set to the resolved value on success.
- `loading` starts as `true`; set to `false` in the `finally` block.
- `error` starts as `''`; set to the normalized message on catch.

### `useCanEdit` (new shared hook)

- **File:** `client/src/hooks/useCanEdit.ts`
- **Type:** Shared hook
- **Responsibility:** Returns a single boolean derived from `AuthContext`; encapsulates the role check `user?.role === 'teacher' || user?.role === 'admin'`.

```ts
function useCanEdit(): boolean
```

- Calls `useAuth()` internally; no props.
- Memoized with `useMemo` so referential stability is preserved.

### `useDisclosure` (new shared hook)

- **File:** `client/src/hooks/useDisclosure.ts`
- **Type:** Shared hook
- **Responsibility:** Manages a single boolean open/close state.

```ts
interface UseDisclosureResult {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

function useDisclosure(initialOpen?: boolean): UseDisclosureResult
```

- `initialOpen` defaults to `false`.
- `open`, `close`, and `toggle` are stable references (created once via `useCallback`).

### `useOrderedList` (new shared hook)

- **File:** `client/src/hooks/useOrderedList.ts`
- **Type:** Shared hook
- **Responsibility:** Encapsulates the "sort, find by ID, swap order values, apply optimistically, revert on error" pattern for any list of items with `id` and `order` fields.

```ts
interface OrderedItem {
  id: string;
  order: number;
}

type PersistFn<T extends OrderedItem> = (a: T, b: T, aOrder: number, bOrder: number) => Promise<void>;

interface UseOrderedListResult<T extends OrderedItem> {
  items: T[];
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  handleMove: (id: string, direction: 'up' | 'down') => Promise<void>;
}

function useOrderedList<T extends OrderedItem>(
  initialItems: T[],
  persistFn: PersistFn<T>,
): UseOrderedListResult<T>
```

- `items` is sorted by `order` ascending whenever `setItems` mutates the list.
- `handleMove` is stable via `useCallback` on `[items, persistFn]`.
- If `id` is not found or `swapIdx` is out of bounds, `handleMove` returns without any state change.
- On `persistFn` rejection, the pre-swap snapshot is restored.

### `useYouTubeTitle` (new shared hook)

- **File:** `client/src/hooks/useYouTubeTitle.ts`
- **Type:** Shared hook
- **Responsibility:** Validates a YouTube URL against the shared regex from `utils/youtube.ts`, fetches the video title from `GET /youtube/title`, and enforces the "title already touched" guard.

```ts
interface UseYouTubeTitleOptions {
  url: string;
  titleTouched: React.RefObject<boolean>;
  onTitleFetched: (title: string) => void;
}

interface UseYouTubeTitleResult {
  fetchingTitle: boolean;
  handleUrlBlur: () => Promise<void>;
}

function useYouTubeTitle(options: UseYouTubeTitleOptions): UseYouTubeTitleResult
```

- `handleUrlBlur` is stable via `useCallback` on `[url, titleTouched, onTitleFetched]`.
- If `titleTouched.current` is `true`, the hook returns early without fetching.
- Errors from the API call are silently swallowed (matching existing behavior).

## 4. Client Routes

No new or modified routes. This refactor does not add, remove, or alter any route in the existing routing table.

## 5. Hooks and Data Fetching

### `useFetch`

- **API endpoints called:** Determined entirely by the `fetchFn` argument — the hook itself makes no direct API calls.
- **Loading state:** `loading = true` from mount until `fetchFn` settles; `false` in `finally`.
- **Error state:** Normalized to string; `''` on success.
- **Cache/refetch:** No cache. `reload()` increments an internal counter ref that is included in the `useEffect` dependency array, triggering a fresh call.

### `useYouTubeTitle`

- **API endpoint:** `GET /youtube/title?url=<encoded>` via `apiClient.get<{ title: string }>`.
- **Request shape:** query param `url` — URL-encoded YouTube URL string.
- **Response shape:** `{ title: string }`.
- **Loading state:** `fetchingTitle` boolean; callers use this to disable the title input and show a spinner.
- **Error state:** Silently ignored; the consumer can still type a title manually.

## 6. API Integration

This refactor makes no new API calls and removes no existing API calls. The only pre-existing API call that moves homes is the YouTube title fetch:

| Action | Method + Path | Request shape | Response shape |
|---|---|---|---|
| URL blur in `VideoForm` or `VideoAssignmentForm` (valid URL, title not touched) | `GET /youtube/title` | `?url=<encoded string>` | `{ title: string }` |

All other API calls (resource CRUD, tool CRUD, assignment CRUD, completions, progress) remain in their current files unchanged. `useOrderedList`'s `persistFn` is provided by the caller and continues to call the same endpoints as today.

## 7. State Management

All state is local to its component or hook. No global state store or context changes are made.

| State | Location before | Location after |
|---|---|---|
| `loading` / `error` / course+unit+progress data in `CourseDetailPage` | Inline `useState` + `useEffect` | `useFetch` inside `CourseDetailPage` |
| `loading` / `error` / lesson data in `useLesson` | Inline `useState` + `useEffect` | `useFetch` inside `useLesson` |
| `resources` list + fetch in `useResources` | Inline `useState` + `useEffect` | `useFetch` provides initial load; `setItems` from `useOrderedList` manages mutations |
| `tools` list + fetch in `useTools` | Inline `useState` + `useEffect` | Same pattern as `useResources` |
| `assignments` list + fetch in `useAssignments` | Inline `useState` + `useEffect` | `useFetch` provides initial load |
| `canEdit` boolean | Inline `user?.role === ...` in nine files | `useCanEdit()` call in each file |
| Modal open/close booleans | Scattered `useState(false)` pairs | `useDisclosure()` per modal |
| YouTube `fetchingTitle` + title-fetch logic | Inline in `VideoForm` and `VideoAssignmentForm` | `useYouTubeTitle` hook |
| Ordered list + optimistic reorder | Duplicated in `useResources`, `useTools`, `useAssignments` | `useOrderedList` in each |

`useOrderedList` owns the sorted `items` array and exposes `setItems` so callers can still apply CRUD mutations (add, update, delete) without going through the hook.

## 8. Authentication and Authorization

`useCanEdit` reads from `AuthContext` via the existing `useAuth()` hook. No new auth guards, no new protected routes, and no changes to `RequireAuth` or `RequireRole` wrappers.

The 401 global event handling (`auth:unauthorized`) is not affected.

## 9. Pseudocode for Complex Logic

### `useOrderedList` — move handler

```ts
const sorted = [...items].sort((a, b) => a.order - b.order);
const idx = sorted.findIndex(item => item.id === id);
const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
if (idx === -1 || swapIdx < 0 || swapIdx >= sorted.length) return;
const [a, b] = [sorted[idx], sorted[swapIdx]];
setItems(prev => prev.map(r =>
  r.id === a.id ? { ...r, order: b.order } :
  r.id === b.id ? { ...r, order: a.order } : r
).sort((x, y) => x.order - y.order));
try { await persistFn(a, b, b.order, a.order); }
catch { setItems(prev => prev.map(r =>
  r.id === a.id ? { ...r, order: a.order } :
  r.id === b.id ? { ...r, order: b.order } : r
).sort((x, y) => x.order - y.order)); }
```

### `useFetch` — effect body

```ts
let cancelled = false;
setLoading(true); setError('');
fetchFn().then(result => { if (!cancelled) { setData(result); } })
  .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load'); })
  .finally(() => { if (!cancelled) setLoading(false); });
return () => { cancelled = true; };
```

### `useYouTubeTitle` — blur handler

```ts
const trimmed = url.trim();
if (!trimmed || !youtubeUrlRegex.test(trimmed) || titleTouched.current) return;
setFetchingTitle(true);
try { const { title } = await apiClient.get(`/youtube/title?url=${encodeURIComponent(trimmed)}`);
  if (title && !titleTouched.current) onTitleFetched(title); }
catch { /* silent */ } finally { setFetchingTitle(false); }
```

### `CourseDetailPage` — migrating multi-value fetch to `useFetch`

`CourseDetailPage` fetches three values together (`course`, `allCourses`, `progress`) with a single `Promise.all`. `useFetch` returns a single `data` value, so the fetch function must return a combined object:

```ts
const { data, loading, error } = useFetch(
  () => Promise.all([coursesApi.getOne(courseId!), coursesApi.getAll(), progressApi.getCourse(courseId!)])
    .then(([course, courses, progress]) => ({ course, courses, progress })),
  [courseId],
);
```

Destructure `data?.course`, `data?.courses`, `data?.progress` in the render body, defaulting to `null`/`[]`.

### `useResources` — integrating `useFetch` + `useOrderedList`

`useResources` currently fetches both resources and completions together in one `useEffect`. The completions fetch should remain in place (it is toggled independently). Only the initial resources load is replaced by `useFetch`. `useOrderedList` is initialized with `useFetch`'s `data ?? []` and given the persist function that calls `lessonResourcesApi.update` for both items.

## 10. Styling Notes

This plan produces no new UI. No Tailwind changes are required. The spinner `<Loader2>` already used in `VideoForm` and `VideoAssignmentForm` continues to be used by the calling component — `useYouTubeTitle` returns `fetchingTitle` as a boolean for the component to render the spinner itself.

## 11. Edge Cases and Error Handling

### `useOrderedList`

- **Item not found:** If `findIndex` returns `-1` (item was removed before the move fired), return immediately. This prevents a swap with `sorted[-2]` or `sorted[sorted.length + 1]`.
- **Already first/last:** `swapIdx < 0` or `swapIdx >= sorted.length` guard covers this. Return without state mutation or API call.
- **Concurrent moves:** The hook does not debounce or queue moves. A second move while the first persist is in-flight will operate on stale `items`. This matches the pre-existing behavior in `useResources` and `useTools` — do not change it.
- **Rollback sorts:** The revert `setItems` call must also sort by `order` to avoid a visual flash of unsorted order.

### `useOrderedList` — `useAssignments` divergence

`useAssignments.handleMoveAssignment` uses a different persist strategy: it calls `assignmentsApi.reorder(lessonId, { assignmentIds: newIdOrder })` with a full ID array and reassigns `order` values as `i + 1`, rather than swapping two individual items. This cannot be expressed via `useOrderedList`'s `PersistFn<T>`. The plan resolves this by keeping `handleMoveAssignment` in `useAssignments` as-is and applying `useOrderedList` only to `useResources` and `useTools`. The `useOrderedList` hook still benefits two of three targets and the spec's FR-11 covers all three but the coder must note this divergence — `useAssignments` may adopt a simpler form of `useOrderedList` by wrapping `assignmentsApi.reorder` in a custom persist function that ignores the two-item signature and uses a closure over the full sorted list instead.

**Resolution:** The coder must decide whether to (a) extend `PersistFn` to accept the full sorted list as a third parameter, enabling all three hooks to use `useOrderedList`, or (b) keep `useAssignments.handleMoveAssignment` as a manual implementation that internally uses `useOrderedList`'s `setItems`. Option (a) is preferred for full FR-11 compliance; option (b) is safe if the reorder API shape makes (a) awkward.

### `useFetch` — cancelled fetches

The `cancelled` flag in the cleanup function prevents stale state updates when deps change before the previous fetch resolves. This is critical for `useLesson`, where `courseId`, `unitId`, and `lessonId` can all change on navigation.

### `useYouTubeTitle` — `titleTouched` ref lifecycle

`VideoAssignmentForm` initializes `titleTouched` as `useRef(!!displayTitle)`. After refactoring, the ref must be initialized before calling `useYouTubeTitle` and passed in. The consuming component retains ownership of the ref so it can also set `titleTouched.current = true` in the title field's `onChange` handler — exactly as today.

### `useCanEdit` — unauthenticated users

When `user` is `null` (not logged in), `user?.role` evaluates to `undefined`, which is neither `'teacher'` nor `'admin'`, so `useCanEdit` returns `false`. This matches the existing inline check and requires no special handling.

### `CourseDetailPage` — `useFetch` and imperative reload

`CourseDetailPage` currently defines a `load()` function called from both `useEffect` and from `handleCourseUpdate`/`handleCourseDelete` (indirectly, via navigate). The `reload()` helper returned by `useFetch` replaces any explicit re-call of `load()`. After a course update, the component already applies a local optimistic update to the `course` state (`setCourse(prev => ...)`) rather than re-fetching, so `reload` is not needed for update. Only `useEffect` on `courseId` needs to trigger a fresh fetch, which `useFetch` handles via its deps array.

### `VocabList`, `FlashCardList`, `VideoList`, `PracticeProblemList` — `useDisclosure` vs. `useResourceList`

These components already get `showAdd`/`setShowAdd`, `editing`/`setEditing`, and `deleting`/`setDeleting` from `useResourceList`. `useResourceList` manages those internally with `useState`. The spec identifies that `useDisclosure` replaces `const [showX, setShowX] = useState(false)` patterns — but `useResourceList` already provides equivalent state. Do not wrap `useResourceList`'s state in `useDisclosure`. Only apply `useDisclosure` where the component defines its own standalone `useState(false)` pairs for modal visibility not covered by `useResourceList`.

Reviewing the source: `VocabList` has no standalone `useState(false)` pairs beyond what `useResourceList` provides. `FlashCardList` has none either (the `studying` and `editMode` booleans are not modal-open states; leave them as `useState`). `VideoList` has none. `PracticeProblemList` has none. The `useDisclosure` adoption for these four components is therefore a no-op — they do not have the target pattern. The coder should skip these four and apply `useDisclosure` only to the files confirmed to have standalone modal-open `useState` pairs:

- `CourseDetailPage`: five standalone `const [showX, setShowX] = useState(false)` declarations (`showSettings`, `showSyllabusView`, `showSyllabusEdit`, `showUnitSettings`, `showCalendar`) — replace each with `useDisclosure()`.
- `LessonDetailPage`: two standalone pairs (`showSettings`, `showPlanEdit`) — replace each with `useDisclosure()`.

### `LessonDetailPage` — `useDisclosure` interaction with `useLesson`

`useLesson` currently receives an `onUpdateClose` callback (`() => setShowSettings(false)`) so it can close the settings modal after a successful lesson update. After migrating `showSettings` to `useDisclosure`, pass `settingsDisclosure.close` as `onUpdateClose` instead.

## Implementation Order

Dependencies must be created before consumers. The recommended build order is:

1. `utils/youtube.ts` — add `youtubeUrlRegex` export (no deps)
2. `hooks/useFetch.ts` — no deps
3. `hooks/useCanEdit.ts` — depends on `AuthContext` (already present)
4. `hooks/useDisclosure.ts` — no deps
5. `hooks/useOrderedList.ts` — no deps
6. `hooks/useYouTubeTitle.ts` — depends on `youtubeUrlRegex` from `utils/youtube.ts` and `apiClient`
7. Adopt `useFetch` in `useLesson`, `useResources`, `useTools`, `useAssignments`, `CourseDetailPage`
8. Adopt `useOrderedList` in `useResources`, `useTools` (and optionally `useAssignments`)
9. Adopt `useCanEdit` in all nine consumers
10. Adopt `useDisclosure` in `CourseDetailPage` and `LessonDetailPage`
11. Adopt `useYouTubeTitle` in `VideoForm` and `VideoAssignmentForm`
