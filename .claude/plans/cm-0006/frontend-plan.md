---
id: cm-0006
title: Standardize API Response Envelope
stage: design
status: approved
approver: human
approved_at: 2026-05-06T00:00:00Z
---

# Frontend Plan — Standardize API Response Envelope

## 1. Overview

The backend is introducing a `{ "data": <payload> }` envelope on every successful JSON response from non-auth API routes. The frontend must unwrap this envelope transparently so that all consuming components continue to receive the same payload shapes they receive today, with zero component-level changes required.

The entire change is confined to one file: `client/src/api/client.ts`. The `request<T>` function inside `apiClient` is the single choke point through which every non-auth API call passes. Adding envelope unwrapping there satisfies all acceptance criteria from the spec:

- FR-05: Components receive the same payload shapes as before.
- FR-03: 204 No Content responses (no body) are already handled and must remain untouched.
- Auth routes go through `better-auth`'s own client (`src/api/auth.ts`) and never touch `apiClient`, so they are naturally excluded.

No new routes, components, hooks, pages, or state management concerns are introduced.

---

## 2. Folder Structure

No new files or directories are created. Only one existing file is modified:

```
client/
  src/
    api/
      client.ts        <-- MODIFIED: unwrap envelope in request()
```

All other API modules (`courses.ts`, `units.ts`, `lessons.ts`, `lesson-resources.ts`, `lesson-tools.ts`, `student-notes.ts`, `assessments.ts`, `progress.ts`, `resource-completions.ts`, `assignments.ts`) are untouched — they already call `apiClient` with typed generics that name the unwrapped payload type.

---

## 3. Component Tree

No new components. No modified components. This plan produces zero changes to the component layer.

---

## 4. Client Routes

No new or modified routes.

---

## 5. Hooks and Data Fetching

No new hooks. The existing hooks (`useResourceList`, `useFormSubmit`, `useAssessment`) call the per-resource API modules, which in turn call `apiClient`. After the unwrapper is in place, these hooks transparently receive the unwrapped payloads they already expect.

---

## 6. API Integration

The unwrapping maps every enveloped endpoint from the api-contract to the payload type each API module already declares:

| API Module Call | Method + Path | Envelope Response Shape | Unwrapped to |
|---|---|---|---|
| `coursesApi.getAll` | GET /api/courses | `{ data: Course[] }` | `Course[]` |
| `coursesApi.getOne` | GET /api/courses/:id | `{ data: Course }` | `Course` |
| `coursesApi.create` | POST /api/courses | `{ data: Course }` | `Course` |
| `coursesApi.update` | PUT /api/courses/:id | `{ data: Course }` | `Course` |
| `coursesApi.delete` | DELETE /api/courses/:id | 204 no body | `void` |
| `unitsApi.*` | GET/POST/PUT /api/courses/:id/units/* | `{ data: Unit \| Unit[] }` | `Unit \| Unit[]` |
| `unitsApi.delete` | DELETE /api/courses/:id/units/:id | 204 no body | `void` |
| `lessonsApi.*` | GET/POST/PUT /api/units/:id/lessons/* | `{ data: Lesson \| Lesson[] }` | `Lesson \| Lesson[]` |
| `lessonsApi.delete` | DELETE /api/units/:id/lessons/:id | 204 no body | `void` |
| `lessonResourcesApi.getAll` | GET /api/lessons/:id/resources | `{ data: LessonResource[] }` | `LessonResource[]` |
| `lessonResourcesApi.create` | POST /api/lessons/:id/resources | `{ data: LessonResource }` | `LessonResource` |
| `lessonResourcesApi.update` | PUT /api/resources/:id | `{ data: LessonResource }` | `LessonResource` |
| `lessonResourcesApi.delete` | DELETE /api/resources/:id | 204 no body | `void` |
| `lessonToolsApi.*` | GET/POST/PUT /api/lessons/:id/tools, /api/tools/:id | `{ data: LessonTool \| LessonTool[] }` | `LessonTool \| LessonTool[]` |
| `lessonToolsApi.delete` | DELETE /api/tools/:id | 204 no body | `void` |
| `studentNotesApi.get` | GET /api/lessons/:id/student-notes | `{ data: StudentNote }` | `StudentNote` |
| `studentNotesApi.create` | POST /api/lessons/:id/student-notes | `{ data: StudentNote }` | `StudentNote` |
| `studentNotesApi.delete` | DELETE /api/student-notes/:id | 204 no body | `void` |
| `assessmentsApi.*` (get/create) | GET/POST /api/lessons\|units\|courses/:id/assessment | `{ data: Assessment }` | `Assessment` |
| `assessmentsApi.update` | PUT /api/assessments/:id | `{ data: Assessment }` | `Assessment` |
| `assessmentsApi.getAttempts` | GET /api/assessments/:id/attempts | `{ data: AttemptSummary[] }` | `AttemptSummary[]` |
| `assessmentsApi.submitAttempt` | POST /api/assessments/:id/attempts | `{ data: AttemptResult }` | `AttemptResult` |
| `progressApi.getCourse` | GET /api/courses/:id/progress | `{ data: CourseProgress }` | `CourseProgress` |
| `progressApi.getUnit` | GET /api/courses/:id/units/:id/progress | `{ data: UnitProgress }` | `UnitProgress` |
| `resourceCompletionsApi.*` | GET/POST /api/lessons/:id/resource-completions | `{ data: CompletionsResponse \| item }` | unwrapped payload |
| `assignmentsApi.*` | various | `{ data: Assignment \| Assignment[] }` | `Assignment \| Assignment[]` |

Every call above corresponds exactly to an endpoint in the approved api-contract. No endpoints are invented.

---

## 7. State Management

No state management changes. All state lives in components via `useState`/`useEffect` per the existing pattern in `client/CLAUDE.md`. The unwrapper is a pure synchronous transformation inside an async function — it produces no side effects beyond returning the correct value.

---

## 8. Authentication and Authorization

Auth calls (`login`, `register`, `signOut`, admin user management) all go through `authClient` from `src/api/auth.ts`, which is a `better-auth` React client configured with `baseURL: 'http://localhost:5002'` and `basePath: '/api/auth'`. This client manages its own fetch calls entirely separately from `apiClient`. The envelope unwrapper in `client.ts` is never invoked for auth routes.

The existing 401 handling (`window.dispatchEvent(new CustomEvent('auth:unauthorized'))`) in `client.ts` is unchanged.

`RequireAuth` and `RequireRole` guard components are unchanged.

---

## 9. Pseudocode for Complex Logic

### Envelope unwrapper in `request<T>`

The current `request<T>` function in `client/src/api/client.ts` already has the correct structure. The only change is in the success path, after the 204 short-circuit:

```
async function request<T>(url, options):
  res = await fetch(BASE_URL + url, { credentials: 'include', ...options })

  if not res.ok:
    if res.status == 401:
      dispatch 'auth:unauthorized' event
    body = await res.json() catch { error: { code: 'UNKNOWN', message: 'Request failed' } }
    throw ApiClientError(body.error.code, body.error.message, body.error.details)

  if res.status == 204:
    return undefined as T          // no body — unchanged from current implementation

  envelope = await res.json()      // was: return res.json() as Promise<T>
  return envelope.data as T        // unwrap the { data: ... } wrapper
```

Key invariants:
- The 204 branch returns before `res.json()` is ever called, so no body-parse attempt occurs on empty responses.
- Error responses (4xx/5xx) are handled in the `!res.ok` branch before the unwrapper runs, so error shapes are never passed to `envelope.data`.
- `T` in the call site continues to name the unwrapped payload type (e.g., `Course[]`), not the envelope type — callers need no changes.
- Auth routes never reach `request<T>`, so there is no risk of attempting to unwrap a better-auth response.

### Type for the envelope (internal to client.ts)

Define a private interface used only inside `client.ts` to make the unwrap operation type-safe:

```
interface ApiEnvelope<T> {
  data: T
}
```

`res.json()` is cast to `ApiEnvelope<T>`, then `.data` is returned as `T`. This avoids `any` at the unwrap site.

---

## 10. Styling Notes

No styling changes. This plan produces no UI changes.

---

## 11. Edge Cases and Error Handling

### 204 No Content (DELETE responses)
The existing `if (res.status === 204) return undefined as T` guard runs before `res.json()` is called. This is correct and must not be changed. All DELETE endpoints in the api-contract return 204 with no body.

### Error responses (4xx, 5xx)
Error responses are caught by the `if (!res.ok)` branch before the unwrapper runs. The error body shape `{ error: { code, message, details } }` is unchanged per the api-contract and spec (FR-07). The `ApiClientError` throw path is unchanged.

### Unexpected response shape (missing `data` key)
If a response is 200 but does not contain a `data` key (e.g., a proxy error page returned as JSON), `envelope.data` will be `undefined`. This is the same failure mode as the current implementation returning an unexpected shape — both result in downstream components receiving unexpected data. No special guard is required beyond what already exists; the spec explicitly states error responses are a separate concern.

### Auth routes
`authClient` (better-auth) manages its own HTTP layer. It never calls `apiClient`. The unwrapper will never see an `/api/auth/*` response.

### `/api/health` endpoint
The health endpoint is not called from any frontend code (it is used by infrastructure only). The unwrapper does not need to treat it specially — if it were ever called via `apiClient.get('/health')`, it would unwrap `{ data: { status: 'ok' } }` to `{ status: 'ok' }` correctly.

### Audit for direct `fetch()` calls bypassing `apiClient`
Per `client/CLAUDE.md`: "All calls go through `src/api/client.ts` (`apiClient`) — never call `fetch` directly in components." Verification step: before implementation, run a grep across `client/src/` for raw `fetch(` calls outside `client.ts` to confirm no bypasses exist. `src/utils/youtube.ts` contains no fetch calls (it is a pure URL utility). `src/api/auth.ts` uses `better-auth`'s own client, not `fetch` directly — this is the intended exclusion.

Expected audit result: zero direct `fetch` calls outside `client.ts` in non-auth code.

### Atomic deployment requirement (NFR-02)
The spec requires client and server changes to be coordinated. The implementation branch must land both the backend envelope middleware and this client unwrapper in the same deployment. The coder agent must not merge frontend and backend independently.
