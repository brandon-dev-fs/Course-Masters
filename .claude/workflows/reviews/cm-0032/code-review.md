---
id: cm-0032
title: Profile Page Modernization — Code Review
stage: review
status: approved
---

# Code Review — cm-0032


## Backend Pass — Round 1

### Findings

- **[medium]** `server/src/services/user.service.ts` — `updatePreferences` uses `prisma.user.update({ where: { id: userId } })` with no `deletedAt: null` guard. Inconsistent with `getMe` and the rest of the codebase. Fix: check existence with `findFirst({ where: { id, deletedAt: null } })` before the update, throw `NotFoundError` if null.
- **[info]** `server/src/routes/user.routes.ts` — New routes not documented in `swagger.ts` (advisory, does not block).
- **[info]** `server/src/schemas/user.schema.ts` — Naming could be `updateUserPreferencesSchema` for consistency (advisory).

### Verdict: REJECTED (1 medium issue)

## Files Reviewed
- server/prisma/schema.prisma
- server/prisma/migrations/20260622000000_add_theme_preference_to_user/migration.sql
- server/src/schemas/user.schema.ts
- server/src/services/user.service.ts
- server/src/controllers/user.controller.ts
- server/src/routes/user.routes.ts
- server/src/__tests__/routes/routes.test.ts

## Backend Pass — Round 2 (after fix)

### Fix applied
- `server/src/services/user.service.ts` — `updatePreferences` now checks `findFirst({ where: { id, deletedAt: null } })` before the update, consistent with `getMe` and `remove`.

### Findings
None.

### Verdict: APPROVED

## Frontend Pass — Round 1

### Findings
- **[low]** `client/src/api/types.ts:20` — `UpdatePreferencesResponse.themePreference` typed as `string` instead of `ThemePreference`. Fixed.
- **[low]** `client/src/components/Layout.tsx:84` — `aria-label="Toggle theme"` inconsistent with MobileDrawer's `"Cycle theme"`. Fixed.
- **[low]** `client/src/context/AuthContext.tsx` — Fire-and-forget `getMe()` chain should use `async` handler. Advisory.
- **[low]** `client/src/features/auth/ProfilePage.tsx:869` — Intentional fire-and-forget should use `void` prefix. Advisory.
- **[low]** `client/src/features/auth/ProfilePage.tsx:783` — Read-only fields use bare `<input>` instead of shared `Input` component. Advisory.
- **[info]** `client/src/components/Layout.tsx` — No test coverage for updated aria-label on nav theme toggle. Advisory.
- **[info]** `client/src/context/ThemeContext.tsx` — `initPreference()` called twice on init (safe, minor). Advisory.

### Fixes applied
- `UpdatePreferencesResponse.themePreference` narrowed to `ThemePreference`
- Layout `aria-label` changed from `"Toggle theme"` to `"Cycle theme"`

### Verdict: APPROVED (zero medium+)

## Frontend Security Pass — Round 1

### Findings (all info — no security issues in cm-0032 changes)
- `AuthContext.tsx` — `theme:server-sync` event carries only enum value, no sensitive data
- `ThemeContext.tsx` — localStorage stores only `'light'`/`'dark'`/`'system'`; no PII/tokens
- `ProfilePage.tsx` — passwords via `authClient` only; user content rendered as React text nodes (no XSS)
- `users.ts` — standard `apiClient` usage; no hardcoded credentials

### Verdict: APPROVED

## Files Reviewed
- client/src/api/types.ts
- client/src/api/users.ts
- client/src/context/ThemeContext.tsx
- client/src/context/AuthContext.tsx
- client/src/features/auth/ProfileAvatar.tsx
- client/src/features/auth/ThemeSegmentedControl.tsx
- client/src/features/auth/ProfilePage.tsx
- client/src/components/Layout.tsx
- client/src/components/MobileDrawer.tsx
- client/src/__tests__/context/ThemeContext.test.tsx
- client/src/__tests__/components/MobileDrawer.test.tsx
- client/src/__tests__/features/auth/ProfilePage.test.tsx
