---
id: cm-0020
title: Frontend Unit Testing Infrastructure
stage: design
status: approved
approver: human
approved_at: 2026-05-14T00:00:00Z
---

# Frontend Plan — cm-0020: Add Unit Testing Infrastructure

## 1. Overview

This plan establishes a unit testing infrastructure for the `client/` workspace. No schema changes, no API changes, and no UI changes are required. The spec acceptance criteria this plan satisfies are:

- **FR-02**: A working test runner for TypeScript + React hooks and components.
- **FR-03**: A standard mocking mechanism that can isolate `apiClient`, `authClient`, React Router, and browser APIs.
- **FR-05**: A workspace-specific `npm test` command runnable from within `client/`.
- **FR-06 / FR-07**: Coverage reports (line, branch, function, statement) with a 70% minimum threshold enforced via non-zero exit.
- **FR-09**: At least one example test demonstrating the canonical hook-testing pattern with mocked dependencies.
- **FR-10**: A consistent naming convention and directory structure documented in `client/CLAUDE.md`.
- **FR-11**: No interference with existing `npm run dev`, `npm run build`, or Vite configuration.

The backend plan (already written) adds `"test": "npm run test -w server -w client"` to the root `package.json`, satisfying FR-04 for the aggregate command. This plan does not duplicate that root-level change but depends on it.

---

## 2. Folder Structure

New files to create. All paths are relative to the repo root.

```
client/
  vitest.config.ts                              # Vitest configuration (separate from vite.config.ts)
  vitest.setup.ts                               # Global test setup: jsdom polyfills, @testing-library/jest-dom matchers
  src/
    __tests__/
      setup/
        renderWithProviders.tsx                 # Test utility: wraps components in AuthProvider + MemoryRouter
      mocks/
        apiClient.ts                            # vi.fn() stubs for every apiClient method
        authClient.ts                           # vi.fn() stubs for authClient (getSession, signIn, signUp, signOut)
        authContext.ts                          # Factory for AuthContextValue test doubles
      hooks/
        useFetch.test.ts                        # Example hook test (FR-09) — useFetch with mocked apiClient
        useCanEdit.test.ts                      # Example hook test — useCanEdit with mocked AuthContext
```

No existing source files are modified except `client/package.json` (new devDependencies and scripts) and `client/CLAUDE.md` (new testing conventions section). The production `vite.config.ts` and `tsconfig.json` are not touched.

---

## 3. Component Tree

This spec introduces no new UI components and modifies no existing ones. The "components" produced are test utilities:

### `renderWithProviders` — Test Utility (not a rendered page/layout)

**File**: `client/src/__tests__/setup/renderWithProviders.tsx`

**Purpose**: Wraps any component or hook under test in the full provider tree that components in this codebase rely on (`AuthProvider`, `MemoryRouter`). Prevents test failures caused by missing context.

**Props interface**:
```ts
interface RenderOptions {
  user?: AuthUser | null;        // pre-populated AuthContext user; default null
  isLoading?: boolean;           // pre-populated AuthContext isLoading; default false
  initialRoute?: string;         // MemoryRouter initialEntries[0]; default '/'
}

function renderWithProviders(
  ui: React.ReactElement,
  options?: RenderOptions,
): ReturnType<typeof render>   // re-exports @testing-library/react render result
```

**Responsibilities**: Single responsibility — provide the standard provider wrapper for every test that renders React components or renders hooks that consume context.

---

## 4. Client Routes

No new or modified client routes. This plan introduces no routing changes.

---

## 5. Hooks and Data Fetching

No new application hooks. The existing hooks `useFetch` and `useCanEdit` are the subjects of the example tests, not new implementations.

### Hook under test: `useFetch<T>` (`src/hooks/useFetch.ts`)

`useFetch` accepts a `fetchFn: () => Promise<T>` and a deps array. It manages `data`, `loading`, `error`, and `reload`. Internally it calls whatever function it receives — it does not call `apiClient` directly. Tests must therefore:
1. Pass a `vi.fn()` as `fetchFn` that returns a controlled `Promise`.
2. Assert on the resulting state transitions.

No real network calls occur. The `apiClient` mock is not required for `useFetch` tests — the hook is generic and the mock is injected via the `fetchFn` argument.

### Hook under test: `useCanEdit` (`src/hooks/useCanEdit.ts`)

`useCanEdit` reads `user.role` from `AuthContext` via `useAuth()`. Tests must provide a controlled `AuthContextValue` through the `renderWithProviders` utility (or a direct context mock) and assert on the returned boolean.

---

## 6. API Integration

This spec introduces no API calls. There are no endpoints in the api-contract because the spec explicitly states "API Changes: None."

The `apiClient` mock (`src/__tests__/mocks/apiClient.ts`) exists solely to prevent accidental real network calls if production code under test imports `apiClient`. It stubs all methods with `vi.fn()` returning `Promise.resolve(undefined)` by default, overridable per-test.

Similarly, the `authClient` mock (`src/__tests__/mocks/authClient.ts`) prevents accidental calls to `http://localhost:5002` from `AuthProvider`'s `getSession()` during component tests.

---

## 7. State Management

No application state changes. Within the test infrastructure:

- **Per-test state** is managed entirely by Vitest's test lifecycle (`beforeEach`/`afterEach`) and `vi.clearAllMocks()` (auto-enabled via `clearMocks: true` in `vitest.config.ts`).
- **AuthContext state in tests** is controlled by passing the `user` and `isLoading` overrides to `renderWithProviders`. The `AuthProvider` is not replaced — it is rendered normally but its `authClient.getSession()` dependency is mocked so it resolves immediately to the desired user.
- **No shared mutable test state** — each test file that needs a particular auth state passes it via the render helper; no global singletons hold state between tests.

---

## 8. Authentication and Authorization

No application auth routes or guards are added. Test-layer auth concerns:

- `AuthContext` is consumed by `useCanEdit` and any component that calls `useAuth()`. Tests that exercise such code must have `AuthProvider` in the tree with a predictable session state.
- `authClient.getSession` is mocked globally in `vitest.setup.ts` to resolve immediately with `{ data: null }` (no session). Individual tests override this mock when a logged-in user is needed.
- The `auth:unauthorized` CustomEvent dispatch from `apiClient` is a browser DOM API — `jsdom` supports `window.dispatchEvent`, so no special polyfill is required.
- `RequireAuth` and `RequireRole` are not under test in this spec and do not need to be imported by the example tests.

---

## 9. Pseudocode for Complex Logic

### 9.1 `vitest.config.ts` — separation from `vite.config.ts`

```
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export defineConfig({
  plugins: [react()],           // needed for JSX transform in test files
  test: {
    globals: true,              // describe/it/expect/vi available without import
    environment: 'jsdom',       // simulates browser DOM for React hooks
    setupFiles: ['./vitest.setup.ts'],
    clearMocks: true,           // reset all vi.fn() call history between tests
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',         // entry point — no unit-testable logic
        'src/**/*.test.{ts,tsx}',
        'src/__tests__/**',
      ],
      thresholds: {
        lines: 70,
        branches: 70,
        functions: 70,
        statements: 70,
        perFile: false,         // aggregate threshold, not per-file (matches spec intent)
      },
    },
  },
})
```

Note: `@tailwindcss/vite` is intentionally omitted from the Vitest config. Tailwind is a build-time CSS plugin and does not need to run during unit tests. Omitting it prevents the plugin from emitting warnings about missing CSS processing context and keeps test startup fast (NFR-01).

### 9.2 `vitest.setup.ts` — global test environment setup

```
import '@testing-library/jest-dom'
// Extends expect with .toBeInTheDocument(), .toHaveTextContent(), etc.

// Suppress console.error for expected React prop-type warnings in tests
// (optional, document the choice inline if added)
```

### 9.3 `src/__tests__/mocks/apiClient.ts` — apiClient stub

```
import { vi } from 'vitest'

// Replace every method of apiClient with a vi.fn() that resolves to undefined.
// Tests override individual methods: apiClientMock.get.mockResolvedValue({...})
export const apiClientMock = {
  get:    vi.fn().mockResolvedValue(undefined),
  post:   vi.fn().mockResolvedValue(undefined),
  put:    vi.fn().mockResolvedValue(undefined),
  patch:  vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
}

// Usage in a test file (top-level, before any describe):
// vi.mock('../../api/client.js', () => ({ apiClient: apiClientMock }))
```

### 9.4 `src/__tests__/mocks/authClient.ts` — authClient stub

```
import { vi } from 'vitest'

// Minimal stub — only the methods AuthContext and authClient consumers call.
export const authClientMock = {
  getSession: vi.fn().mockResolvedValue({ data: null, error: null }),
  signIn: {
    email: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  },
  signUp: {
    email: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  },
  signOut: vi.fn().mockResolvedValue({ data: null, error: null }),
}

// Usage in a test file:
// vi.mock('../../api/auth.js', () => ({ authClient: authClientMock }))
```

### 9.5 `src/__tests__/mocks/authContext.ts` — AuthContextValue factory

```
import type { AuthUser } from '../../api/types.js'
import type { AuthContextValue } from '../../context/AuthContext.js'

// Returns a fully-typed AuthContextValue with sensible defaults.
// Tests override individual fields: makeAuthContext({ user: teacherUser })
export function makeAuthContext(overrides?: Partial<AuthContextValue>): AuthContextValue {
  return {
    user: null,
    isLoading: false,
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    ...overrides,
  }
}

// Convenience user factories:
export function makeStudentUser(overrides?: Partial<AuthUser>): AuthUser {
  return { id: 'user-1', name: 'Student', email: 's@test.com', role: 'student', emailVerified: true, ...overrides }
}

export function makeTeacherUser(overrides?: Partial<AuthUser>): AuthUser {
  return { id: 'user-2', name: 'Teacher', email: 't@test.com', role: 'teacher', emailVerified: true, ...overrides }
}

export function makeAdminUser(overrides?: Partial<AuthUser>): AuthUser {
  return { id: 'user-3', name: 'Admin', email: 'a@test.com', role: 'admin', emailVerified: true, ...overrides }
}
```

### 9.6 `src/__tests__/setup/renderWithProviders.tsx`

```
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthContext.js'
import type { AuthUser } from '../../api/types.js'

interface RenderOptions {
  user?: AuthUser | null
  isLoading?: boolean
  initialRoute?: string
}

// The authClient mock must be in place (vi.mock) before this module is imported
// in any test file. When authClientMock.getSession resolves to { data: null },
// AuthProvider sets user=null and isLoading=false, matching the default.
// When a test overrides getSession to return a user, AuthProvider sets user accordingly.
export function renderWithProviders(ui: React.ReactElement, options: RenderOptions = {}) {
  const { initialRoute = '/' } = options
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </MemoryRouter>
  )
}
```

Important: `renderWithProviders` renders the real `AuthProvider`. The `user` / `isLoading` options in the interface are not directly injected — they are achieved by controlling what `authClientMock.getSession` resolves to before the component mounts. This tests the real provider behavior rather than bypassing it. Document this distinction in the testing conventions section of `client/CLAUDE.md`.

If a test requires a synchronous, predetermined auth state without waiting for `getSession` to resolve, it may render a lightweight `AuthContext.Provider` directly with a `makeAuthContext()` value instead of using `renderWithProviders`. Both patterns are valid and should be documented.

### 9.7 `useFetch.test.ts` — example hook test

```
import { renderHook, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import useFetch from '../../hooks/useFetch.js'

describe('useFetch', () => {

  describe('successful fetch', () => {
    it('sets loading=true initially, then loading=false with data on resolution', async () => {
      const fetchFn = vi.fn().mockResolvedValue({ id: '1', title: 'Test' })
      const { result } = renderHook(() => useFetch(fetchFn, []))

      expect(result.current.loading).toBe(true)
      expect(result.current.data).toBeNull()

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.data).toEqual({ id: '1', title: 'Test' })
      expect(result.current.error).toBe('')
    })
  })

  describe('failed fetch', () => {
    it('sets error string via classifyError when fetchFn rejects with ApiClientError', async () => {
      const { ApiClientError } = await import('../../api/client.js')
      const fetchFn = vi.fn().mockRejectedValue(
        new ApiClientError('SERVER_ERROR', 'Something broke', undefined, 'server')
      )
      const { result } = renderHook(() => useFetch(fetchFn, []))

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.error).toBe('A server error occurred. Please try again later.')
      expect(result.current.data).toBeNull()
    })

    it('sets generic error string when fetchFn rejects with a plain Error', async () => {
      const fetchFn = vi.fn().mockRejectedValue(new Error('unexpected'))
      const { result } = renderHook(() => useFetch(fetchFn, []))

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.error).toBe('Failed to load')
    })
  })

  describe('reload', () => {
    it('calling reload() re-invokes fetchFn a second time', async () => {
      const fetchFn = vi.fn().mockResolvedValue([])
      const { result } = renderHook(() => useFetch(fetchFn, []))

      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(fetchFn).toHaveBeenCalledTimes(1)

      result.current.reload()
      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(fetchFn).toHaveBeenCalledTimes(2)
    })
  })

  describe('dependency change', () => {
    it('re-fetches when a dep value changes', async () => {
      const fetchFn = vi.fn().mockResolvedValue([])
      let dep = 'a'
      const { result, rerender } = renderHook(() => useFetch(fetchFn, [dep]))

      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(fetchFn).toHaveBeenCalledTimes(1)

      dep = 'b'
      rerender()
      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(fetchFn).toHaveBeenCalledTimes(2)
    })
  })

})
```

`useFetch` does not import `apiClient` — it accepts any async function. No module mock is needed for this test file.

### 9.8 `useCanEdit.test.ts` — example hook test

```
import { renderHook } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import useCanEdit from '../../hooks/useCanEdit.js'
import { AuthContext } from '../../context/AuthContext.js'
import { makeAuthContext, makeStudentUser, makeTeacherUser, makeAdminUser } from '../mocks/authContext.js'

// Helper: renders useCanEdit inside a controlled AuthContext.Provider
function renderUseCanEdit(contextValue: ReturnType<typeof makeAuthContext>) {
  return renderHook(() => useCanEdit(), {
    wrapper: ({ children }) => (
      <AuthContext.Provider value={contextValue}>
        {children}
      </AuthContext.Provider>
    ),
  })
}

describe('useCanEdit', () => {

  it('returns false when user is null (unauthenticated)', () => {
    const { result } = renderUseCanEdit(makeAuthContext({ user: null }))
    expect(result.current).toBe(false)
  })

  it('returns false when user role is student', () => {
    const { result } = renderUseCanEdit(makeAuthContext({ user: makeStudentUser() }))
    expect(result.current).toBe(false)
  })

  it('returns true when user role is teacher', () => {
    const { result } = renderUseCanEdit(makeAuthContext({ user: makeTeacherUser() }))
    expect(result.current).toBe(true)
  })

  it('returns true when user role is admin', () => {
    const { result } = renderUseCanEdit(makeAuthContext({ user: makeAdminUser() }))
    expect(result.current).toBe(true)
  })

  it('updates when user role changes', () => {
    let contextValue = makeAuthContext({ user: makeStudentUser() })
    const { result, rerender } = renderHook(() => useCanEdit(), {
      wrapper: ({ children }) => (
        <AuthContext.Provider value={contextValue}>
          {children}
        </AuthContext.Provider>
      ),
    })
    expect(result.current).toBe(false)

    contextValue = makeAuthContext({ user: makeTeacherUser() })
    rerender()
    expect(result.current).toBe(true)
  })

})
```

Note: `AuthContext` must be exported as a named export from `AuthContext.tsx` (currently only `useAuth` and `AuthProvider` are exported). The coder agent must add `export { AuthContext }` to `AuthContext.tsx`. This is a non-breaking, additive change to a single source file.

---

## 10. Styling Notes

No UI components are produced. No Tailwind classes are used. Not applicable.

---

## 11. Edge Cases and Error Handling

### 11.1 `jsdom` vs real browser APIs

`jsdom` does not implement `window.matchMedia` or other layout APIs. If future tests exercise components that call `useMediaQuery` (which uses `window.matchMedia`), a polyfill must be added to `vitest.setup.ts`. Document the polyfill pattern in the testing conventions.

The `auth:unauthorized` CustomEvent is dispatched via `window.dispatchEvent` in `apiClient`. `jsdom` supports this — no polyfill required.

### 11.2 `AuthContext` named export requirement

`useCanEdit.test.ts` renders a direct `<AuthContext.Provider>` to inject a controlled context value. This requires `AuthContext` to be a named export from `AuthContext.tsx`. Currently it is only used internally via `useContext(AuthContext)`. The coder agent must add `export { AuthContext }` (or `export const AuthContext = ...` depending on the declaration form). This change is additive and does not affect any existing import.

### 11.3 `better-auth` module mocking

`better-auth` uses internal dynamic imports and a complex plugin system. The `authClient` mock completely replaces the module (`vi.mock('../../api/auth.js', ...)`), so `better-auth`'s internals are never loaded during tests. This prevents the `baseURL` pointing at `localhost:5002` from causing test failures on machines without a running server.

### 11.4 CSS and asset imports

`jsdom` cannot process `@tailwindcss/vite` CSS transforms or asset imports (SVGs, images). The Vitest config omits `@tailwindcss/vite` from its plugin list. If source files import CSS files directly, Vitest must be configured to handle them. The existing codebase does not appear to import CSS files from component files (Tailwind is applied via class names, not imports), so this should not be an issue. If it arises, add `css: { modules: { ... } }` to `vitest.config.ts`.

### 11.5 Coverage threshold at startup

The 70% coverage threshold (FR-07) will fail immediately if very few source lines are covered by the two example tests. The `perFile: false` setting means the threshold is evaluated on the aggregate across all included files, not per file. Since the example tests cover `useFetch.ts` and `useCanEdit.ts` but the rest of the codebase is uncovered, aggregate coverage will be well below 70%.

**Resolution**: The coverage threshold must be run via `npm run test:coverage`, not `npm test`. The base `npm test` command runs `vitest run` without `--coverage`, so no threshold is enforced during normal development. Only `test:coverage` (or a future CI job) enforces the threshold. The spec requirement (FR-07) is satisfied by the existence of the configured threshold — it does not require the threshold to pass on an empty test suite. Document this in `client/CLAUDE.md`.

### 11.6 `useFetch` cancellation behavior

`useFetch` sets a `cancelled` flag in the `useEffect` cleanup function. Tests using `renderHook` from `@testing-library/react` unmount the hook after each test. This cleanup runs synchronously, setting `cancelled = true` before any pending promise callbacks fire. The `waitFor` utility in the test pseudocode handles this correctly by waiting for state updates to settle before asserting. No special teardown is needed.

### 11.7 Tiptap and KaTeX in the test environment

`RichTextEditor` and `EditorContent` from `@tiptap/react` depend on browser APIs (`document`, `Selection`, etc.) that `jsdom` partially supports. If future tests render components that include `RichTextEditor`, those tests may require a more complete DOM simulation or a component-level mock of `RichTextEditor`. The example tests in this plan do not exercise any Tiptap components, so this is deferred.

---

## 12. npm Scripts

### `client/package.json` additions

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

- `test` — single-run, no coverage. Suitable for fast feedback and the root aggregate command.
- `test:watch` — interactive watch mode for local development.
- `test:coverage` — single-run with V8 coverage report and threshold enforcement.

### Root `package.json` addition

The backend plan already specifies:
```json
"test": "npm run test -w server -w client"
```

The coder agent implementing this frontend plan must coordinate with (or verify) this root script addition. If the backend plan has already been implemented, the script may already exist. If not, the frontend coder agent adds it. The script runs server tests first, then client tests; both must pass for a zero exit code (FR-04).

---

## 13. New devDependencies (`client/package.json`)

| Package | Version | Purpose |
|---|---|---|
| `vitest` | `^3.x` | Test runner, assertion library, mocking API (`vi.fn`, `vi.mock`) |
| `@vitest/coverage-v8` | `^3.x` | V8-based coverage reporter — no Babel instrumentation |
| `@testing-library/react` | `^16.x` | `render`, `renderHook`, `waitFor`, `screen` for React testing |
| `@testing-library/jest-dom` | `^6.x` | Custom matchers: `.toBeInTheDocument()`, `.toHaveTextContent()`, etc. |
| `@testing-library/user-event` | `^14.x` | Simulates real user interactions (click, type) for future component tests |
| `jsdom` | `^26.x` | DOM environment for Vitest (Vitest pulls the version it requires automatically when `environment: 'jsdom'` is set — install explicitly to get types) |

Justification against NFR-03 (minimize packages):
- `vitest` + `@vitest/coverage-v8` mirror the server workspace — one framework family across the monorepo.
- `@testing-library/react` is the de facto standard for React hooks/component testing; no equivalent is built into Vitest.
- `@testing-library/jest-dom` extends `expect` — widely used, zero runtime cost.
- `@testing-library/user-event` is included now even though the example tests do not use it, because any future component test will need it and installing it alongside the rest avoids a future dependency change.
- `jsdom` is required by Vitest's `environment: 'jsdom'` setting.

No production dependencies are added.

Install command (from repo root):
```
npm install --save-dev vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom -w client
```

---

## 14. File Naming and Directory Convention

Document in `client/CLAUDE.md` testing section:

- Test files: `*.test.ts` (hooks, utilities) or `*.test.tsx` (components).
- Location: `client/src/__tests__/<layer>/<name>.test.{ts,tsx}` where `<layer>` is `hooks`, `components`, `context`, `api`, or `utils`.
- Mock utilities: `client/src/__tests__/mocks/<name>.ts`.
- Render helpers: `client/src/__tests__/setup/<name>.tsx`.
- One test file per source module.
- Test file names mirror the source file name: `useFetch.ts` → `useFetch.test.ts`.
- Feature-specific tests (for hooks in `features/<domain>/hooks/`) follow the same convention but may be co-located under `features/<domain>/hooks/__tests__/` if the team prefers. Document the chosen convention once established.

---

## 15. Implementation Steps for Coder Agent

These steps are ordered; each depends on the previous completing without error.

1. Install devDependencies from repo root:
   ```
   npm install --save-dev vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom -w client
   ```

2. Create `client/vitest.config.ts` with:
   - `plugins: [react()]` (from `@vitejs/plugin-react`) for JSX transform.
   - `test.globals: true`, `test.environment: 'jsdom'`, `test.clearMocks: true`.
   - `test.setupFiles: ['./vitest.setup.ts']`.
   - `test.include: ['src/**/*.test.{ts,tsx}']`.
   - Coverage: provider `v8`, reporters `['text', 'lcov']`, include `src/**/*.{ts,tsx}`, exclude `src/main.tsx` and `src/__tests__/**`, thresholds `{ lines: 70, branches: 70, functions: 70, statements: 70, perFile: false }`.

3. Create `client/vitest.setup.ts` with `import '@testing-library/jest-dom'`.

4. Add `export { AuthContext }` to `client/src/context/AuthContext.tsx` so tests can use `<AuthContext.Provider>` directly. Verify this is the only change needed (the context is already created as a `const`; simply export it).

5. Create `client/src/__tests__/mocks/apiClient.ts` with the `apiClientMock` stub object as specified in section 9.3.

6. Create `client/src/__tests__/mocks/authClient.ts` with the `authClientMock` stub as specified in section 9.4.

7. Create `client/src/__tests__/mocks/authContext.ts` with `makeAuthContext`, `makeStudentUser`, `makeTeacherUser`, `makeAdminUser` factories as specified in section 9.5.

8. Create `client/src/__tests__/setup/renderWithProviders.tsx` as specified in section 9.6.

9. Create `client/src/__tests__/hooks/useFetch.test.ts` with all test cases from section 9.7 fully implemented with real assertions (no skipped stubs).

10. Create `client/src/__tests__/hooks/useCanEdit.test.ts` with all test cases from section 9.8 fully implemented with real assertions.

11. Add scripts to `client/package.json`:
    ```json
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
    ```

12. Add `"test": "npm run test -w server -w client"` to root `package.json` if not already present (the backend coder may have done this).

13. Run `npm test -w client` from repo root and verify all tests pass.

14. Run `npm run test:coverage -w client` from repo root. Expect the coverage threshold to fail because only two small hooks are covered — this is expected behavior documented in section 11.5. Verify the threshold is being checked (non-zero exit) but do not increase coverage to meet it; that is out of scope per the spec.

15. Append a testing conventions section to `client/CLAUDE.md` documenting: test runner (Vitest + jsdom), file naming and directory conventions (section 14), how to run tests (`npm test -w client`, `npm run test:watch -w client`, `npm run test:coverage -w client`), the `renderWithProviders` pattern, the direct `AuthContext.Provider` pattern for hook tests, the `apiClientMock` and `authClientMock` module mock pattern (`vi.mock('../../api/client.js', ...)`), and the coverage threshold caveat.

16. Verify the production `vite.config.ts` and `tsconfig.json` are unchanged.
