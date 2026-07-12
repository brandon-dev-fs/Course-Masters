---
id: cm-0021
title: Expand Unit Test Coverage — Frontend Plan
stage: design
status: approved
approver: human
approved_at: 2026-05-15T00:00:00Z
---

# Frontend Plan — cm-0021: Expand Unit Test Coverage

## Overview

This plan expands the client-side unit test suite from 2 test files (useCanEdit, useFetch) to comprehensive coverage across all testable hooks, utilities, and core infrastructure. The existing testing infrastructure (Vitest + jsdom + React Testing Library, shared mocks) established in cm-0020 requires no changes. All new tests follow the conventions documented in `client/CLAUDE.md`.

---

## Coverage Target and Justification

**Target: 75%**

Justification: The client codebase is split between testable logic (hooks, utilities, context, api client) and UI-heavy component code (pages, feature components) that has no testable logic beyond rendering. The 75% target reflects:

- All 9 shared hooks are fully testable with the existing mock infrastructure
- All 3 feature-level hooks have testable async logic
- `api/client.ts` contains meaningful logic (`classifyError`, 401 dispatch, fetch wrapper behavior) worth testing
- `AuthContext` contains complex session-management logic (session restore, event listeners, 4 mutations)
- `utils/youtube.ts` contains pure string manipulation functions

The ceiling is below 90% because large portions of the codebase are UI-only components and page files — excluding these is correct, not a shortcut. Forcing 90%+ would require brittle, implementation-detail snapshot tests that provide no signal about behavioral correctness.

---

## File Exclusion Decisions

| Category | Decision | Rationale |
|---|---|---|
| `client/src/main.tsx` | EXCLUDED | App entry point — mounts React root to DOM. No exercisable units. |
| `client/src/api/types.ts` | EXCLUDED | TypeScript type declarations only. Not compiled to runtime logic. |
| `client/src/api/auth.ts` | EXCLUDED | `better-auth` client initialization. Third-party library configuration. |
| `client/src/api/*.ts` (except `client.ts`) | EXCLUDED | Thin fetch wrappers — each is 4–8 lines calling `apiClient.get/post/put/delete`. Zero application logic. Testing would only assert that we called `apiClient.get` with a particular URL string, providing no behavioral signal. |
| `client/src/context/ThemeContext.tsx` | EXCLUDED | Trivial toggle between two CSS class values on `document.documentElement`. No business logic; jsdom CSS class assertions are low-value. |
| `client/src/components/*.tsx` | EXCLUDED | Shared UI primitives (Button, Input, Modal, etc.). These are presentational wrappers with no business logic. Testing would duplicate React's own rendering behavior. |
| `client/src/features/**/*.tsx` (all page/component files) | EXCLUDED | Page and feature components contain UI composition and event wiring, not business logic. The business logic they delegate to is fully exercised through hook tests. Full component tree rendering requires mocking router, auth, and all API calls simultaneously — producing fragile tests with low behavioral signal. |
| `client/src/hooks/useFetch.ts` | COVERED | 11 tests in cm-0020. |
| `client/src/hooks/useCanEdit.ts` | COVERED | 8 tests in cm-0020. |

**Note on API modules**: The exclusion of thin API wrapper files (`courses.ts`, `lessons.ts`, etc.) is based on their content — each file contains only named exports that call `apiClient.get/post/put/delete` with a fixed URL. If any API module is found to contain transformation logic, URL-building functions, or response-shaping code during implementation, that logic must be tested.

---

## File Audit Table

| File | Status | Notes |
|---|---|---|
| `hooks/useFetch.ts` | COVERED | 11 tests |
| `hooks/useCanEdit.ts` | COVERED | 8 tests |
| `hooks/useCalculator.ts` | WILL TEST | Rich state machine — calculator operations |
| `hooks/useDisclosure.ts` | WILL TEST | Toggle open/close state |
| `hooks/useMediaQuery.ts` | WILL TEST | matchMedia subscription logic |
| `hooks/useOrderedList.ts` | WILL TEST | Optimistic swap + rollback — HIGH priority |
| `hooks/useYouTubeTitle.ts` | WILL TEST | URL guard + apiClient + state |
| `features/lessons/hooks/useLesson.ts` | WILL TEST | Parallel fetch + 3 mutation handlers |
| `features/lessons/hooks/useTools.ts` | WILL TEST | Fetch → sync + move delegation |
| `features/lessons/hooks/useAssignments.ts` | WILL TEST | CRUD + toggle rollback |
| `utils/youtube.ts` | WILL TEST | Pure string functions |
| `api/client.ts` | WILL TEST | classifyError, 401 dispatch, fetch behavior |
| `context/AuthContext.tsx` | WILL TEST | Session restore, event listener, mutations |
| `api/courses.ts` | EXCLUDED | Thin fetch wrapper |
| `api/lessons.ts` | EXCLUDED | Thin fetch wrapper |
| `api/units.ts` | EXCLUDED | Thin fetch wrapper |
| `api/assessments.ts` | EXCLUDED | Thin fetch wrapper |
| `api/student-notes.ts` | EXCLUDED | Thin fetch wrapper |
| `api/progress.ts` | EXCLUDED | Thin fetch wrapper |
| `api/resource-completions.ts` | EXCLUDED | Thin fetch wrapper |
| `api/lesson-resources.ts` | EXCLUDED | Thin fetch wrapper |
| `api/lesson-tools.ts` | EXCLUDED | Thin fetch wrapper |
| `api/assignments.ts` | EXCLUDED | Thin fetch wrapper |
| `api/auth.ts` | EXCLUDED | Third-party initialization |
| `api/types.ts` | EXCLUDED | Type declarations only |
| `context/ThemeContext.tsx` | EXCLUDED | Trivial CSS toggle |
| `main.tsx` | EXCLUDED | App entry point |
| `components/*.tsx` (all) | EXCLUDED | UI primitives, no logic |
| `features/**/*.tsx` (all) | EXCLUDED | UI composition, no logic |

---

## Shared Test Utilities Needed

The existing mocks cover most needs. One addition may be useful:

**`client/src/__tests__/mocks/window.mock.ts`** — for tests that need to control `window.location` or dispatch/listen for custom events (`auth:unauthorized`). Standard jsdom already supports `window.dispatchEvent` and `window.addEventListener`, so this may not require a mock file — document the pattern in Implementation Notes instead.

No other new shared utilities are needed.

---

## Implementation Steps (Priority Order)

### 1. `utils/youtube.ts` — `client/src/__tests__/utils/youtube.test.ts`
**Priority: LOW** — pure string functions, no async, no mocks

Tests:
- `extractVideoId`: returns correct ID from `youtube.com/watch?v=` URL
- `extractVideoId`: returns correct ID from `youtu.be/` short URL
- `extractVideoId`: returns `null` for non-YouTube URL
- `toEmbedUrl`: returns `youtube-nocookie.com/embed/<id>` format
- `toEmbedUrl`: returns `null` when `extractVideoId` returns null

---

### 2. `hooks/useDisclosure.ts` — `client/src/__tests__/hooks/useDisclosure.test.ts`
**Priority: LOW** — pure toggle state

Tests:
- Initial state: `isOpen` is `false` (or `true` if `defaultOpen` provided)
- `open()`: sets `isOpen` to `true`
- `close()`: sets `isOpen` to `false`
- `toggle()`: inverts current state
- Calling `open()` twice remains open (idempotent)

---

### 3. `hooks/useMediaQuery.ts` — `client/src/__tests__/hooks/useMediaQuery.test.ts`
**Priority: LOW** — matchMedia is already stubbed globally in vitest.setup.ts

Tests:
- Returns `true` when matchMedia reports a match for the given query
- Returns `false` when matchMedia does not match
- Updates value when matchMedia change event fires (simulate by calling the listener)
- Cleans up event listener on unmount

Setup: configure the global `window.matchMedia` stub to return `{ matches: true/false, addEventListener, removeEventListener }` as needed per test.

---

### 4. `api/client.ts` — `client/src/__tests__/api/client.test.ts`
**Priority: MEDIUM** — classifyError is already exercised indirectly by useFetch tests; the 401 dispatch and fetch behavior are not yet tested

Tests:
- `classifyError`: 'server' class → returns server error message string
- `classifyError`: 'client' class → returns validation error message string
- `classifyError`: 'network' class → returns network error message string
- `classifyError`: non-ApiClientError → returns generic 'Failed to load' string
- `ApiClientError` constructor: sets `code`, `message`, `details`, `errorClass` correctly
- `apiClient.get`: resolves with unwrapped `data` from `{ data: payload }` envelope
- `apiClient.post`: sends correct method, body, Content-Type header
- `apiClient.delete`: 204 response returns `undefined` (no body parse)
- `apiClient.*`: non-2xx response throws `ApiClientError` with correct code from response body
- `apiClient.*`: 401 response dispatches `auth:unauthorized` custom event on `window`

Mock setup: use `vi.stubGlobal('fetch', vi.fn())` to control fetch responses per test.

---

### 5. `hooks/useCalculator.ts` — `client/src/__tests__/hooks/useCalculator.test.ts`
**Priority: MEDIUM** — rich reducer/state machine

Tests:
- Initial state: display shows `'0'`, no error
- Digit input: appends digit to display
- Decimal: adds `.` once, ignores second `.`
- Operator input: stores operator, resets display for next operand
- `=`: computes result for all 4 operators (+, -, *, /)
- Division by zero: sets error state or displays appropriate value
- Clear (`C`): resets to initial state
- Backspace: removes last character, reverts to `'0'` on single digit
- Chained operations: `3 + 5 * 2` follows correct order of operations (or calculator precedence if left-to-right)

---

### 6. `hooks/useOrderedList.ts` — `client/src/__tests__/hooks/useOrderedList.test.ts`
**Priority: HIGH** — optimistic update + rollback is the most complex pure-hook logic

Tests:
- `move`: swaps two items' `order` values in state optimistically
- `move`: calls `persistFn` with correct arguments `(a, b, aNewOrder, bNewOrder)`
- `move`: rolls back to previous state when `persistFn` rejects
- `move`: does not mutate original items, creates new array
- `setItems`: replaces list with new items
- Items are returned in correct `order` sort after move

Mock: `persistFn` is a `vi.fn()` that can be configured to resolve or reject per test.

---

### 7. `hooks/useYouTubeTitle.ts` — `client/src/__tests__/hooks/useYouTubeTitle.test.ts`
**Priority: MEDIUM**

Tests:
- Returns `null` when URL is empty or falsy
- Fetches title via `apiClient.get` with correct query param when URL is provided
- Sets title in state on successful response
- Sets `null` on API error
- Does not re-fetch when same URL is provided (dependency comparison)
- Does re-fetch when URL changes

Mock: `vi.mock('../../api/client.js', () => ({ apiClient: apiClientMock }))`.

---

### 8. `context/AuthContext.tsx` — `client/src/__tests__/context/AuthContext.test.tsx`
**Priority: MEDIUM** — session restore flow and event handling

Tests:
- On mount: calls `authClient.getSession` and sets user in state
- On mount: `isLoading` is `true` until session resolves, then `false`
- `login()`: calls `authClient.signIn.email`, sets user in state
- `register()`: calls `authClient.signUp.email`, sets user in state
- `logout()`: calls `authClient.signOut`, clears user in state
- `refreshUser()`: re-fetches session and updates user
- `auth:unauthorized` event: clears user state when dispatched on window
- `useAuth()`: throws if used outside `AuthProvider`

Mock: `vi.mock('../../api/auth.js', () => ({ authClient: authClientMock }))`. Use `renderWithProviders` for the provider tree; use `authClientMock.getSession.mockResolvedValue(...)` to control session state.

---

### 9. `features/lessons/hooks/useTools.ts` — `client/src/__tests__/hooks/useTools.test.ts`
**Priority: MEDIUM**

Tests:
- Fetches tools on mount with correct lesson ID
- Filters tools by type when type param provided
- `create`: calls API, appends to list, assigns correct order
- `update`: calls API, updates item in list by ID
- `delete`: calls API, removes item from list
- `move`: delegates to `useOrderedList.move` (mock or spy)

Mock: `apiClientMock` for all API calls. `renderHook` with `AuthContext.Provider` for auth-dependent behavior if needed.

---

### 10. `features/lessons/hooks/useAssignments.ts` — `client/src/__tests__/hooks/useAssignments.test.ts`
**Priority: HIGH** — CRUD + toggle rollback

Tests:
- Fetches assignments on mount
- `create`: adds to list optimistically or after API response
- `update`: updates item in list
- `delete`: removes item from list
- Type-specific helper functions return correct values (memos)
- Toggle with rollback: reverts on API failure

---

### 11. `features/lessons/hooks/useLesson.ts` — `client/src/__tests__/hooks/useLesson.test.ts`
**Priority: HIGH** — parallel fetch + navigation + 3 mutations

Tests:
- Fetches lesson, unit, and course data in parallel on mount
- Each piece of data is set in state independently when resolved
- Error state set when any fetch fails
- `updateLesson`: calls API, updates lesson in state
- `deleteLesson`: calls API, navigates away on success
- `completeLesson`: calls completion API, updates completion state
- Loading state is true initially, false after all fetches complete

Mock: `apiClientMock` for all API calls. `useNavigate` mock via `vi.mock('react-router-dom', ...)` using the `reactRouter.mock.ts` pattern.

---

## Implementation Notes

### Mocking apiClient in hook tests
```ts
import { apiClientMock } from '../mocks/apiClient.mock.js';
vi.mock('../../api/client.js', () => ({ apiClient: apiClientMock }));

// Per test:
apiClientMock.get.mockResolvedValueOnce({ id: '1', title: 'Test' });
```

### Mocking React Router hooks
```ts
const navigateMock = vi.fn();
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => navigateMock,
  useParams: () => ({ lessonId: 'lesson-1', unitId: 'unit-1', courseId: 'course-1' }),
}));
```

### Testing hooks with auth dependency
For hooks that call `useAuth()`, use the direct `AuthContext.Provider` pattern (not `renderWithProviders`) to avoid async `getSession` wait:
```tsx
renderHook(() => useLesson(), {
  wrapper: ({ children }) => (
    <AuthContext.Provider value={makeAuthContext({ user: makeStudentUser() })}>
      {children}
    </AuthContext.Provider>
  ),
});
```

### Testing window custom events (AuthContext)
```ts
// Dispatch the event
window.dispatchEvent(new CustomEvent('auth:unauthorized'));
// Then assert state changed
await waitFor(() => expect(result.current.user).toBeNull());
```

### useOrderedList rollback testing
```ts
const persistFn = vi.fn().mockRejectedValueOnce(new Error('network error'));
const { result } = renderHook(() => useOrderedList(initialItems, persistFn));

const before = result.current.items;
act(() => { result.current.move(0, 1); });

await waitFor(() => expect(result.current.items).toEqual(before));
```

### Fetch mocking in api/client.ts tests
```ts
const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

fetchMock.mockResolvedValueOnce({
  ok: true,
  status: 200,
  json: async () => ({ data: { id: '1' } }),
});
```
