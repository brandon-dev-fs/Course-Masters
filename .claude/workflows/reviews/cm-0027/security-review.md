---
id: cm-0027
title: Security Review — Refactor Lesson Detail Page Layout and Navigation
stage: review
status: approved
hand_back_to: null
approver: agent
---

# Security Review: Refactor Lesson Detail Page Layout and Navigation

## Summary

This review covers a pure frontend UI refactor across five source files on the `refactor/lessons-page` branch. The changes restructure the lesson page layout (collapsible desktop sidebar, mobile drawer overlay, redesigned activity stepper, and bottom tab bar) with no backend modifications. No new API endpoints, dependencies, data flows, or authentication paths were introduced. The overall security posture is strong: all user-sourced content is rendered through React's default HTML escaping, localStorage usage is limited to a non-sensitive UI preference, and navigation links are constrained to internal React Router paths.

## Scope

- Branch: `refactor/lessons-page`
- Base: `develop`
- Files changed: 5 source files, 3 test files
- Diff command: `git diff develop..HEAD -- client/`
- Spec: cm-0027

## Issues

No security issues were identified at any severity level.

## Checklist Coverage

| Category | Result | Notes |
|---|---|---|
| XSS — dangerouslySetInnerHTML | pass | No `dangerouslySetInnerHTML` usage in any changed file. `lesson.title`, `courseTitle`, `lesson.description`, `item.title`, and all other user-sourced strings are rendered as React text children, which are HTML-escaped by the React DOM. `aria-live="polite"` was added to `<main>` in `LessonDetailPage.tsx` but its children remain React text nodes, not raw HTML. |
| Open redirect — Link/navigate | pass | All `<Link to={...}>` paths in `LessonDetailPage.tsx` and `UnitLessonSidebar.tsx` are constructed from `courseId`, `unitId`, and `lesson.id` — UUID strings from `useParams`. They route exclusively to internal application paths (`/courses/...`). No `window.location.href`, `window.open`, or external URL construction is present. |
| Auth gates removed or bypassed | pass | The `canEdit` flag and all auth-related logic flows from the existing `useLessonData` hook, which was not modified. No `useAuth` checks, route guards, or middleware calls were removed or reordered in this diff. |
| Sensitive data exposed in UI | pass | No tokens, session identifiers, passwords, or non-lesson PII appear in rendered output. `completedLessonIds` contains only lesson UUID strings derived from the existing progress API response, which is already displayed to enrolled users. |
| localStorage misuse | pass | `LessonDetailPage.tsx` adds `readSidebarCollapsed` and `writeSidebarCollapsed` helpers that store only the string `"true"` or `"false"` under the key `cm-sidebar-collapsed`. The value is a non-sensitive UI preference. Both helpers are wrapped in try/catch to handle storage unavailability. No session tokens, user IDs, or credentials are persisted. |
| Event listener leaks / prototype pollution | pass | `UnitLessonSidebar.tsx` attaches a `keydown` listener on `document` only when `mobileOpen === true` and removes it via the `useEffect` cleanup return. No prototype modification or persistent leak is present. |
| Input validation — new user input paths | pass | No new unvalidated user input enters any data layer. The only new user-originated value entering state is the sidebar collapse toggle (boolean) and the mobile drawer open/close (boolean). |
| Injection — SQL/NoSQL/command/template | n/a | No queries, shell execution, or template rendering in scope. |
| Rate limiting — new endpoints | n/a | No new API endpoints introduced. |
| Dependency vulnerabilities — new packages | pass | No new dependencies added to either `client/package.json` or `server/package.json`. |
| Data layer — migrations, unparameterized queries | n/a | No backend or schema changes in scope. |
| API security — CORS, content-type, resource leakage | n/a | No new API surface. |

## Verdict

APPROVED — Zero issues found at any severity. The refactor introduces no new attack surface across XSS, open redirect, auth bypass, localStorage misuse, or sensitive data exposure categories.
