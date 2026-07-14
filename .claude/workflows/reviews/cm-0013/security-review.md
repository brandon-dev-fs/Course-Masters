---
id: cm-0013
title: Error handling — discriminated unions, error boundary, classifyError
stage: review
status: approved
approver: agent
approved_at: 2026-05-12T00:00:00Z
---

# Security Review — cm-0013

## Scope

Files reviewed from the `refactor/code_cleanup` branch diff:

- `client/src/api/client.ts`
- `client/src/components/ErrorBoundary.tsx`
- `client/src/features/lessons/LessonDetailPage.tsx`
- `client/src/hooks/useFetch.ts`
- `client/src/hooks/useFormSubmit.ts`
- `client/src/features/lessons/hooks/useResources.ts`
- `client/src/features/lessons/hooks/useAssignments.ts`
- `client/src/api/types.ts`

## Findings

No issues at severity `medium` or above. Zero blocking issues.

---

### INFO-01 — `ApiClientError.details` stored on the error object is never rendered to users

**Severity:** info
**Location:** `client/src/api/client.ts`, `ApiClientError` constructor
**Description:**
The `details` field (type `Record<string, unknown>`) is forwarded from server error bodies and held on the thrown `ApiClientError` instance. Nothing in the diff renders `details` in the UI — `classifyError` ignores it entirely and returns one of three hardcoded strings, `useFetch` and `useFormSubmit` both call `classifyError`, and `ErrorBoundary` never touches the error's properties. However, `details` could in theory carry validation field names or internal identifiers that a future caller might inadvertently expose if they bypass `classifyError` and access the error object directly.
**Suggested fix:** No change required now. Document in a comment on the `details` field that it is for programmatic use only and must not be interpolated into user-facing strings.

---

### INFO-02 — `console.warn` in `useResources` logs `err.message` from server errors

**Severity:** info
**Location:** `client/src/features/lessons/hooks/useResources.ts`, line 55
**Description:**
The non-fatal resource-completions catch block logs `err instanceof Error ? err.message : err`. For an `ApiClientError`, `err.message` is the raw message forwarded from the server body (e.g. `"Unauthorized"`, `"Resource not found"`). This goes to the browser console only — it is not rendered in the UI and is not transmitted anywhere. No user data is included. Acceptable as-is for a development/debugging aid.
**Suggested fix:** No change required. Advisory only.

---

### INFO-03 — `contentAreaFallback` uses `window.location.href` as the reload link href

**Severity:** info
**Location:** `client/src/features/lessons/LessonDetailPage.tsx`, `contentAreaFallback`, line 39
**Description:**
`href={window.location.href}` reflects the current URL back into an anchor tag at render time. Because this is a React SPA with server-side rendering absent, `window.location.href` always originates from the browser's own address bar and is never populated from untrusted external sources. There is no open-redirect or reflected-XSS risk here.
**Suggested fix:** No change required. Advisory only.

---

### INFO-04 — Root `ErrorBoundary` wraps `ThemeProvider`/`AuthProvider`; fallback UI is unauthenticated

**Severity:** info
**Location:** `client/src/App.tsx`
**Description:**
The top-level `ErrorBoundary` sits outside `AuthProvider`, so if it catches a render error its default fallback ("Something went wrong" + "Try again" button) is shown without any auth context. The fallback contains no user data and no sensitive information, so there is no information disclosure risk. The "Try again" button calls `this.reset()`, which only clears the boundary state — it does not bypass `RequireAuth` or `RequireRole` guards because those guards are re-evaluated on each render of the recovered tree.
**Suggested fix:** No change required. Advisory only.

---

---

### INFO-05 — `instanceof Error` fallback branch unreachable for current API callers

**Severity:** info
**Location:** `client/src/features/assessments/AssessmentTaker.tsx:45`, `AssessmentForm.tsx:100/131`, `NoteEditor.tsx:64`
**Description:**
The three-tier catch pattern (`ApiClientError → Error → fallback`) was added in revision 2. For all current callers, the `instanceof Error` branch is dead code — `apiClient` only throws `ApiClientError`, never a plain `Error`. Safe today. Future callers that throw plain `Error` instances with server-derived messages should be aware the raw `err.message` will surface to users.
**Suggested fix:** No change required now. Advisory for future callers.

---

## Summary

The changes introduce generic, hardcoded user-facing error strings via `classifyError`, replace silent swallows with typed error handling, and add `ErrorBoundary` components whose fallback UIs contain no internal details, stack traces, or sensitive data. No new credentials, secrets, or sensitive logging were introduced. The `ApiClientError.details` field is the only potential future concern, and it is not exposed to the UI today.

**Result: approved — zero issues at medium or above.**
