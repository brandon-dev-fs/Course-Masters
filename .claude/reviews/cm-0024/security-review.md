---
id: cm-0024
title: Security Review — Landing Page & Mobile Nav Updates
stage: review
status: approved
hand_back_to: null
approver: agent
---

# Security Review: Landing Page & Mobile Nav Updates

## Summary

This review covers a pure frontend UI polish change introducing a mobile navigation drawer (`MobileDrawer.tsx`), a hero-overlay scroll detection behavior in `Layout.tsx`, a CSS animation, and design-token substitutions across several components. A follow-up commit (`823b541`) applied three targeted fixes to low-severity code-review findings — a Tailwind class swap in `ResourceCompletionCheckbox.tsx`, a DOM measurement method swap in `Layout.tsx`, and a ref guard plus touch-target size increase in `MobileDrawer.tsx`. All three changes are verified below. No backend files, API endpoints, database schemas, or authentication logic were modified at any point in this branch. The overall security posture remains sound.

## Scope

- Branch: `refactor/landing-page-updates`
- Base: `develop`
- Files changed: 11 (10 source, 1 test)
- Spec: cm-0024

## Changes Verified in Re-run (commit 823b541)

The three files flagged for re-review introduce no new security vectors:

| File | Change | Security Relevance |
|---|---|---|
| `client/src/components/ResourceCompletionCheckbox.tsx` | `hover:bg-green-surface` → `hover:brightness-95` | Static Tailwind class swap. No user input, no DOM query, no API call. |
| `client/src/components/Layout.tsx` | `getBoundingClientRect().height` → `offsetHeight` (same `heroEl` reference) | DOM property read on a pre-selected static element. Not derived from user input. No new injection surface. |
| `client/src/components/MobileDrawer.tsx` | `wasOpenRef = useRef(false)` guard added; close button `w-9 h-9` → `w-11 h-11` | Ref guards a focus-return side effect. Size change is a CSS utility class. Neither touches input handling, auth state, or API calls. |

## Issues

No issues at `medium` severity or above were found.

### [INFO] Admin link gated on client-side `user.role` — expected pattern, confirmed safe — authorization

- **Severity**: info
- **Location**: `client/src/components/MobileDrawer.tsx:138–148`
- **Category**: authorization
- **Hand back to**: null
- **Description**: The Admin navigation link (`/admin/users`) is conditionally rendered only when `user.role === 'admin'`. This role value originates from `AuthContext`, which populates it via `authClient.getSession()` — a server-validated session cookie call made by better-auth on page load. A client-side actor cannot inject a spoofed role: the `setUser` call in `AuthContext` is gated on the server response, and the server enforces role on every `/admin/*` request via `authorize()` middleware. Hiding the link is UX hardening only; the server-side gate is the authoritative control. This matches the established project convention (`useCanEdit`, `RequireRole`) and is not a vulnerability.
- **Suggested Fix**: No action required. Continue to ensure the `/admin/users` route remains wrapped in `<RequireRole roles={['admin']}>` on the client and `authorize('admin')` on the server — both already in place.

### [INFO] Focus-trap query uses static selectors only — no XSS vector — api-security

- **Severity**: info
- **Location**: `client/src/components/MobileDrawer.tsx:58–75`
- **Category**: api-security
- **Hand back to**: null
- **Description**: The focus-trap implementation calls `drawerRef.current.querySelectorAll(focusableSelectors)` where `focusableSelectors` is a hardcoded string constant assembled from string literals within the component. No user-controlled data is interpolated into the selector string. The `wasOpenRef` guard added in the re-run commit does not touch this code path. There is no CSS injection or DOM-clobbering vector here.
- **Suggested Fix**: No action required.

### [INFO] Scroll handler reads static DOM property — no injection vector — input-validation

- **Severity**: info
- **Location**: `client/src/components/Layout.tsx:43–54`
- **Category**: input-validation
- **Hand back to**: null
- **Description**: `document.querySelector('[aria-label="Hero"]')` selects an element by a static attribute value hardcoded in `HeroSection.tsx`. The result is used to read `offsetHeight` and `offsetTop` — both read-only layout properties on a pre-selected static element. The method change from `getBoundingClientRect().height` to `offsetHeight` does not alter the input surface: neither property is derived from user input, URL parameters, or external data. No injection risk exists.
- **Suggested Fix**: No action required.

### [INFO] CSS animation is static — no dynamic style injection — other

- **Severity**: info
- **Location**: `client/src/index.css:208–216`
- **Category**: other
- **Hand back to**: null
- **Description**: The `@keyframes slide-in-right` animation and `.animate-slide-in-right` class are fully static CSS declarations. No user input reaches any style attribute or dynamically constructed stylesheet. The `headerClass` computed value in `Layout.tsx` selects between two hardcoded string literals; neither is derived from external input.
- **Suggested Fix**: No action required.

### [INFO] Sign Out handler — no sensitive data leak — sensitive-data-exposure

- **Severity**: info
- **Location**: `client/src/components/MobileDrawer.tsx:77–81`
- **Category**: sensitive-data-exposure
- **Hand back to**: null
- **Description**: `handleSignOut` calls `onClose()`, then `logout()` (which calls `authClient.signOut()` and clears `user` state via `finally`), then navigates to `/`. No session tokens, credentials, or PII are logged or emitted to any observable output before or after the sign-out sequence. The `logout()` implementation in `AuthContext` uses a `finally` block to guarantee state cleanup even on network failure.
- **Suggested Fix**: No action required.

### [INFO] No new dependencies introduced — dependency

- **Severity**: info
- **Location**: `client/package.json` (unchanged), `package.json` (unchanged)
- **Category**: dependency
- **Hand back to**: null
- **Description**: Neither root nor client `package.json` changed in this diff. The `Menu`, `X`, `Sun`, `Moon`, `UserCircle`, `ShieldCheck`, `LogOut` icons consumed in `MobileDrawer.tsx` are all from `lucide-react`, which was already a project dependency. NFR-05 is satisfied.
- **Suggested Fix**: No action required.

## Checklist Coverage

| Category | Result |
|---|---|
| Input Validation | pass — no user input enters business logic; DOM queries use static strings; `offsetHeight` is a read-only layout property |
| Injection (SQL/NoSQL/command/template) | n/a — pure frontend change; no server queries |
| Authentication | pass — `user` state sourced from server-validated session via `authClient.getSession()` |
| Authorization | pass — Admin link gated on session-derived `user.role`; server enforces independently |
| Sensitive Data Exposure | pass — no secrets, tokens, PII logged or returned; sign-out clears state cleanly |
| Rate Limiting & Abuse Prevention | n/a — no new API calls or server routes introduced |
| Dependency Vulnerabilities | pass — no new packages added |
| Data Layer | n/a — no schema, migration, or query changes |
| API Security (CORS, content-type) | n/a — no new endpoints or CORS configuration changes |

## Verdict

APPROVED — Zero issues at medium severity or above. The three changes introduced in the follow-up commit (`ResourceCompletionCheckbox` class swap, `Layout` DOM measurement method swap, `MobileDrawer` ref guard and touch-target fix) introduce no new security vectors. All security-relevant patterns remain correct.
