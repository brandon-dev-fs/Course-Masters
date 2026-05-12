---
id: cm-0012
title: Extract Duplicated Frontend Logic into Shared Hooks and Utilities
stage: review
status: approved
approver: agent
approved_at: 2026-05-12T00:00:00Z
# Pass 3 note: re-verified after persistReorder fix — no new security issues. Auto-approval maintained.
---

# Security Review — cm-0012

**Spec**: cm-0012 | **Branch**: `refactor/code_cleanup` | **Base**: `develop`

## Summary

Pure frontend refactoring — five new shared hooks (`useCanEdit`, `useYouTubeTitle`, `useOrderedList`, `useDisclosure`, `useFetch`) and one utility export (`youtubeUrlRegex`) — with no backend changes, no new API routes, no schema changes, and no new npm dependencies. The security posture is sound across all categories. Role checks default safely to `false` when unauthenticated, the YouTube URL is properly `encodeURIComponent`-encoded before use in a query parameter, error messages are normalized without leaking internal server detail, and no secrets appear in any new or modified file.

## Issues

### [LOW] `useCanEdit` returns `false` during auth-loading window — no guard on `isLoading`
- **Severity**: low
- **Location**: `client/src/hooks/useCanEdit.ts:6-9`
- **Category**: authorization
- **Hand back to**: frontend
- **Description**: During the initial session-restore `useEffect` (`isLoading: true` in `AuthContext`), `user` is `null`, so `useCanEdit` returns `false`. This is the safe default — no edit UI is shown prematurely. All current consumers use `canEdit` exclusively for conditional rendering, so there is no functional exploit path. However, none of the consumers guard on `isLoading` before acting on `canEdit`. If any future consumer were to gate a data-submission action on `canEdit`, a race during session restore could briefly deny an edit-privileged user access.
- **Suggested Fix**: Add a JSDoc note to the hook documenting that `false` is returned while the session is loading, and that callers must not use the value to gate API calls without also checking `isLoading` from `useAuth()`.

### [INFO] `useFetch` centralizes propagation of server error messages to UI — verify server responses are safe
- **Severity**: info
- **Location**: `client/src/hooks/useFetch.ts:32`, `client/src/api/client.ts:33`
- **Category**: sensitive-data-exposure
- **Description**: `useFetch` normalizes errors as `err instanceof Error ? err.message : 'Failed to load'`. For `ApiClientError` instances, `err.message` is set directly from the server's `body.error.message` field. This is pre-existing behavior, but `useFetch` now centralizes and amplifies this propagation across six fetch sites. If the server ever leaks internal paths, stack traces, or DB error details in error messages, they surface to users.
- **Suggested Fix**: Confirm in a backend review that all Express error-handler responses emit only opaque, user-safe message strings. No frontend change needed.

### [INFO] `useYouTubeTitle` silently suppresses all errors, including 401s that trigger global logout
- **Severity**: info
- **Location**: `client/src/hooks/useYouTubeTitle.ts:32-34`
- **Category**: other
- **Description**: The empty catch block is intentional. However, a 401 response from `/youtube/title` will still dispatch the global `auth:unauthorized` event via `apiClient`, causing an unexpected logout — a surprising side effect for a best-effort helper meant to fail silently.
- **Suggested Fix**: Consider whether `/youtube/title` 401s should be intercepted before reaching the global logout handler. No security action required; advisory only.

## Checklist

| Category | Result |
|---|---|
| Input Validation | Pass — YouTube URL validated against `youtubeUrlRegex` before API call; URL is `encodeURIComponent`-encoded |
| Injection | Pass — no query construction, no shell calls, no template rendering in new code |
| Authentication | Pass — `useCanEdit` reads from authenticated `AuthContext`; no new routes or middleware |
| Authorization | Pass — `useCanEdit` returns `false` for unauthenticated and `student` role; no role checks weakened |
| Sensitive Data Exposure | Pass — no secrets in source; no new logging of sensitive fields |
| Rate Limiting | N/A — no new endpoints |
| Dependency Vulnerabilities | Pass — no new npm dependencies |
| Data Layer | N/A — no schema changes, no migrations |
| API Security | Pass — no new endpoints; YouTube call uses `encodeURIComponent` correctly |
