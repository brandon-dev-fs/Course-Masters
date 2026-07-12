---
id: cm-0032
title: Profile Page Modernization — Frontend Plan
stage: design
status: approved
---

# Profile Page Modernization — Frontend Plan

## Overview

This plan covers the frontend implementation of the Profile Page Modernization feature (cm-0032). The work modernizes the `/profile` route by:

- Replacing the single-column layout with a profile header + two-column card grid + full-width preferences card
- Removing the pencil-icon inline edit pattern in favor of a standard form field with an explicit "Save changes" button
- Extending `ThemeContext` from a binary light/dark toggle to a three-way preference (light/dark/system) with OS media query tracking
- Adding a segmented theme control to the Preferences card that persists to the server via `PATCH /api/users/me/preferences`
- Removing the Courses section entirely (state, fetches, imports)
- Introducing a `GET /api/users/me` call to hydrate the user's `themePreference` on auth load

Acceptance criteria are defined in FR-01 through FR-16 of the spec.

---

## Files to Create

| File | Purpose |
|---|---|
| `client/src/api/users.ts` | API module for `GET /api/users/me` and `PATCH /api/users/me/preferences` |
| `client/src/features/auth/ProfileAvatar.tsx` | Initials-based avatar circle component |
| `client/src/features/auth/ThemeSegmentedControl.tsx` | Three-segment radiogroup for theme preference selection |

---

## Files to Modify

### `client/src/api/types.ts`

Add:
- `UserProfile` interface: `{ id: string; name: string; email: string; role: UserRole; themePreference: ThemePreference | null; createdAt: string }`
- `ThemePreference` type alias: `'light' | 'dark' | 'system'`
- `UpdatePreferencesInput` interface: `{ themePreference: ThemePreference }`
- `UpdatePreferencesResponse` interface: `{ themePreference: string }`

### `client/src/context/ThemeContext.tsx`

Major changes:
- Add `themePreference` state (`'light' | 'dark' | 'system'`, initialized from localStorage)
- Add `setThemePreference(pref: ThemePreference)` function that replaces `toggleTheme`
- Keep `theme` as the resolved effective theme (`'light' | 'dark'`) for backward compatibility
- Keep `toggleTheme` as a backward-compatible wrapper that cycles light to dark to system
- Add `window.matchMedia('(prefers-color-scheme: dark)')` listener for real-time system preference tracking
- Add `hydratePreference(pref: ThemePreference | null)` method for AuthContext to call after session load
- Expose: `theme`, `themePreference`, `toggleTheme`, `setThemePreference`

### `client/src/context/AuthContext.tsx`

Minor change:
- After successful `getSession()`, call `usersApi.getMe()` to fetch the user's `themePreference`, then call `hydratePreference()` on ThemeContext to sync server preference into theme state and localStorage
- This requires either passing a callback into AuthProvider or having AuthContext import usersApi and dispatch an event/call a context method. The recommended approach: AuthContext calls `usersApi.getMe()` after session resolves, and dispatches a custom event `theme:hydrate` with the preference value. ThemeContext listens for this event.

### `client/src/features/auth/ProfilePage.tsx`

Major refactor:
- Remove all Courses section code: `coursesApi` import, `Course` type import, `courses`/`coursesLoading`/`coursesError` state, the `useEffect` fetch, and the entire Courses `<section>` JSX
- Remove `Pencil`, `Check`, `X` icon imports from lucide-react; remove `editingName` state and inline edit UI
- Remove `Link` import from react-router-dom (no longer needed)
- Add `ProfileAvatar` and `ThemeSegmentedControl` imports
- Add `useTheme` import for wiring the segmented control
- Restructure JSX to: page container (`max-w-4xl`) -> profile header -> two-column grid (Account + Change Password) -> full-width Preferences card
- Account card: standard `Input` for display name (always editable), read-only fields for email and role, "Save changes" primary button
- Change Password card: use `Button` with `variant="secondary"` for "Update password"
- Preferences card: `ThemeSegmentedControl` wired to `useTheme().themePreference` and `useTheme().setThemePreference`
- Update label styling from `text-sm font-semibold` to `text-xs text-muted-foreground uppercase tracking-wide` per wireframe
- Add `nameValue` state initialized from `user.name`, with standard controlled input

### `client/src/components/Layout.tsx`

Minor change:
- Update the theme toggle button to use `setThemePreference` instead of `toggleTheme`
- The nav bar toggle should cycle: if current preference is `'light'`, set to `'dark'`; if `'dark'`, set to `'system'`; if `'system'`, set to `'light'`
- Update the icon displayed: `Sun` for light, `Moon` for dark, `Monitor` for system
- Destructure `themePreference` and `setThemePreference` from `useTheme()` in addition to existing `theme`

### `client/src/components/MobileDrawer.tsx`

Same changes as Layout.tsx for the mobile theme toggle button.

---

## Component Specifications

### ProfileAvatar

**File:** `client/src/features/auth/ProfileAvatar.tsx`
**Type:** UI component (presentational)

**Props interface:**
```
interface ProfileAvatarProps {
  name: string
  size?: 'sm' | 'md'  // sm = w-10 h-10, md = w-16 h-16 (default: md)
}
```

**Behavior:**
- Extracts initials from `name`: if name contains a space, use first letter of first word + first letter of last word; otherwise use first letter only. All uppercase.
- Renders a `div` with `role` omitted (decorative) and `aria-hidden="true"`.
- Tokens: `bg-green-surface`, `border-2 border-green-primary`, `text-green-surface-text`, `text-xl font-bold`, `rounded-full`, `flex items-center justify-center`.
- Size `md`: `w-16 h-16`. Size `sm`: `w-10 h-10 text-sm`.

### ThemeSegmentedControl

**File:** `client/src/features/auth/ThemeSegmentedControl.tsx`
**Type:** UI component (controlled input)

**Props interface:**
```
interface ThemeSegmentedControlProps {
  value: 'light' | 'dark' | 'system'
  onChange: (value: 'light' | 'dark' | 'system') => void
}
```

**Behavior:**
- Container: `role="radiogroup"`, `aria-label="Theme preference"`.
- Three segments, each a `<button>` with `role="radio"` and `aria-checked` reflecting active state.
- Icons from lucide-react: `Sun` (Light), `Moon` (Dark), `Monitor` (System). Each segment shows icon + label text.
- Keyboard navigation: roving tabindex pattern. Only the active segment has `tabIndex={0}`; others have `tabIndex={-1}`. `ArrowLeft`/`ArrowRight` move focus and selection. `Space`/`Enter` also select.
- Tokens per wireframe section 4.4:
  - Outer: `inline-flex bg-surface-raised rounded-xl p-1 border border-border`
  - Active segment: `bg-green-surface text-green-surface-text shadow-warm-sm rounded-lg`
  - Inactive segment: `text-muted-foreground hover:text-foreground rounded-lg`
  - All segments: `px-4 py-2 text-sm font-medium flex items-center gap-2 cursor-pointer transition-all`
- Icon size: `w-4 h-4`.
- Minimum touch target: segments naturally meet 44px height with `py-2` + text + padding.

### ProfilePage (refactored)

**File:** `client/src/features/auth/ProfilePage.tsx`
**Type:** Page component

**Layout structure (top to bottom):**

1. **Page container:** `max-w-4xl mx-auto py-8 px-4 flex flex-col gap-8`

2. **Profile header:** `flex items-center gap-5 pb-6 border-b border-border-subtle` (desktop); `flex flex-col items-center text-center gap-3 pb-6 border-b border-border-subtle` (mobile via responsive classes: `flex-col items-center text-center md:flex-row md:items-center md:text-left`)
   - `ProfileAvatar` with `name={user.name}`
   - Name: `text-2xl font-bold text-text-primary`
   - Email: `text-sm text-text-secondary`
   - Role badge pill (reuse existing `roleBadge` record)

3. **Two-column grid:** `grid grid-cols-1 md:grid-cols-2 gap-6`
   - **Account card:** `<section>` with `aria-labelledby="account-heading"`, card styling per wireframe (`bg-surface rounded-2xl shadow-warm-sm border border-border p-6`)
     - Display Name: standard `Input` component, editable
     - Email: `Input` with `readOnly` and `aria-readonly="true"`, muted styling (`bg-muted border-border-subtle text-muted-foreground cursor-default`)
     - Role: same read-only styling as email, value is capitalized role string
     - "Save changes" button: `Button variant="primary"` with explicit `className="bg-green-button text-green-button-text"` override (or rely on `primary` variant which maps to `bg-primary`)
     - Success message: `<span role="status">` with "Saved!" text, auto-dismiss 3s
   - **Change Password card:** `<section>` with `aria-labelledby="password-heading"`, same card styling
     - Three password `Input` fields (current, new, confirm)
     - "Update password" button: `Button variant="secondary"`
     - Error: `<ErrorMessage>` with `role="alert"`
     - Success banner: `rounded-md bg-success/10 border border-success/20 px-4 py-3 text-success text-sm` with `role="status"`, auto-dismiss 3s

4. **Preferences card:** full-width `<section>` with `aria-labelledby="preferences-heading"`, same card styling
   - Label row: `flex items-center justify-between` (desktop); `flex flex-col gap-3` (mobile)
   - Left side: "Theme" as `text-sm font-medium text-text-primary`, subtitle "Choose your preferred color theme" as `text-xs text-text-secondary`
   - Right side: `ThemeSegmentedControl` with `value={themePreference}` and `onChange={setThemePreference}`
   - Theme save error: `text-xs text-destructive` below the control, auto-dismiss 3s

**Field label styling change:** All field labels change from `text-sm font-semibold text-foreground` to `text-xs text-muted-foreground uppercase tracking-wide` to match the wireframe. This is achieved by adding a `className` override on the `Input` label or by rendering labels manually outside the `Input` component (since `Input`'s built-in label uses `text-sm font-semibold`). Decision: render labels manually as `<label>` elements above each `Input` (pass no `label` prop to `Input`) to match the wireframe's `text-xs text-muted-foreground` styling without modifying the shared `Input` component.

---

## State and Data Flow

### ThemeContext Extension

Current state:
- `theme: 'dark' | 'light'` (stored in localStorage as `'theme'`)
- `toggleTheme()` flips between dark and light

New state:
- `themePreference: 'light' | 'dark' | 'system'` (stored in localStorage as `'themePreference'`)
- `theme: 'dark' | 'light'` (resolved/effective theme, derived from preference + OS query)
- `setThemePreference(pref)` replaces the primary mutation interface
- `toggleTheme()` kept for backward compat in nav bar, cycles light -> dark -> system -> light

**Resolution logic:**
- If `themePreference` is `'light'` or `'dark'`, `theme` equals `themePreference`
- If `themePreference` is `'system'`, `theme` is determined by `window.matchMedia('(prefers-color-scheme: dark)').matches`

**Initialization (no flash):**
1. `useState` initializer reads `localStorage.getItem('themePreference')`. If present, use it. If absent, check legacy `localStorage.getItem('theme')` for migration. Default to `'system'` if neither exists.
2. `useEffect` applies the resolved theme to `document.documentElement.classList`
3. A `matchMedia` listener updates `theme` in real time when OS preference changes (only matters when `themePreference === 'system'`)

**Server sync (after auth):**
1. `AuthContext` calls `usersApi.getMe()` after `getSession()` succeeds
2. The response includes `themePreference` (nullable)
3. `AuthContext` dispatches a `CustomEvent('theme:server-sync', { detail: { themePreference } })` event
4. `ThemeContext` listens for this event. On receipt, if the server value differs from localStorage, it updates both `themePreference` state and localStorage. Server is the source of truth for authenticated users.

**Preference save flow (from ProfilePage or nav toggle):**
1. `setThemePreference(pref)` is called
2. Immediately: update React state, update localStorage, apply resolved theme to DOM
3. Fire-and-forget: call `usersApi.updatePreferences({ themePreference: pref })`
4. On API error: revert React state and localStorage to previous value, surface error (only in ProfilePage; nav toggle silently reverts)

**localStorage migration:**
- On first load, if `'themePreference'` key does not exist but `'theme'` key does, migrate: read the old `'theme'` value (`'dark'` or `'light'`), write it to `'themePreference'`, remove `'theme'` key.
- If neither key exists, default to `'system'`.

### ProfilePage State

State variables after refactor:
- `nameValue: string` — controlled input for display name, initialized from `user.name`
- `nameError: string | null` — validation/API error for name save
- `nameSaving: boolean` — loading state for name save
- `nameSuccess: boolean` — success feedback, auto-dismiss after 3s
- `currentPassword: string` — current password field
- `newPassword: string` — new password field
- `confirmPassword: string` — confirm password field
- `passwordError: string | null` — validation/API error for password change
- `passwordSuccess: boolean` — success feedback, auto-dismiss after 3s
- `passwordSaving: boolean` — loading state for password change
- `themeError: string | null` — error from theme preference save failure (auto-dismiss 3s)

Removed state: `editingName`, `courses`, `coursesLoading`, `coursesError`.

### Data Flow Diagram

```
AuthContext (getSession)
  -> success -> usersApi.getMe()
    -> dispatch 'theme:server-sync' event with themePreference
      -> ThemeContext updates preference + localStorage

ProfilePage
  -> reads user from useAuth()
  -> reads themePreference + setThemePreference from useTheme()
  -> name save: authClient.updateUser() -> refreshUser()
  -> password change: authClient.changePassword()
  -> theme change: setThemePreference() (handled by ThemeContext internally)

Layout / MobileDrawer
  -> reads theme + themePreference from useTheme()
  -> nav toggle calls setThemePreference() cycling preferences
```

---

## API Integration

| UI Action | Method + Path | Request Shape | Response Shape |
|---|---|---|---|
| Hydrate user profile on auth load | `GET /api/users/me` | (none) | `{ data: { id, name, email, role, themePreference, createdAt } }` |
| Save theme preference | `PATCH /api/users/me/preferences` | `{ themePreference: "light" \| "dark" \| "system" }` | `{ data: { themePreference: string } }` |

Both endpoints are defined in the api-contract. The `apiClient` unwraps the `data` envelope automatically.

Name save and password change continue to use `authClient.updateUser()` and `authClient.changePassword()` respectively (better-auth routes, not apiClient).

---

## Implementation Order

1. **Add types** — Add `ThemePreference`, `UserProfile`, `UpdatePreferencesInput`, and `UpdatePreferencesResponse` to `client/src/api/types.ts`.

2. **Create API module** — Create `client/src/api/users.ts` with `getMe()` and `updatePreferences()` functions using `apiClient`.

3. **Extend ThemeContext** — Refactor `client/src/context/ThemeContext.tsx` to support three-way preference, media query listener, `setThemePreference`, localStorage migration, and the `theme:server-sync` event listener. Keep `toggleTheme` as a cycling wrapper for backward compat.

4. **Update AuthContext** — After `getSession()` succeeds, call `usersApi.getMe()` and dispatch `theme:server-sync` event with the user's `themePreference`.

5. **Create ProfileAvatar** — Build `client/src/features/auth/ProfileAvatar.tsx` with initials extraction logic and token-based styling.

6. **Create ThemeSegmentedControl** — Build `client/src/features/auth/ThemeSegmentedControl.tsx` with radiogroup semantics, roving tabindex, and icon rendering.

7. **Refactor ProfilePage** — Remove Courses section, remove inline edit pattern, restructure to header + two-column grid + preferences card, wire up all components.

8. **Update Layout and MobileDrawer** — Change theme toggle buttons to use `setThemePreference` with cycling logic and update the displayed icon based on `themePreference`.

9. **Manual verification** — Test all flows per the Testing Notes section below.

---

## Testing Notes

### Manual Verification Checklist

- [ ] Profile header shows avatar with correct initials (single name, two-word name, multi-word name)
- [ ] Avatar is `aria-hidden="true"` and does not interfere with screen reader flow
- [ ] Name, email, and role badge display correctly for all three roles (student, teacher, admin)
- [ ] Display name field is editable, "Save changes" saves via authClient, success message appears and auto-dismisses
- [ ] Empty name shows validation error, clears on field modification
- [ ] Email and Role fields are visually distinct as read-only (`readOnly` attribute, muted styling)
- [ ] Read-only fields remain focusable (not `disabled`)
- [ ] Password change validates: passwords must match, minimum 8 characters
- [ ] Password change success banner appears and auto-dismisses after 3s
- [ ] "Update password" button uses secondary styling (not green primary)
- [ ] Segmented theme control shows correct active segment on load
- [ ] Clicking a different segment changes theme immediately
- [ ] Theme preference persists to server (check Network tab for PATCH call)
- [ ] "System" mode follows OS preference in real time (toggle OS dark mode while System is selected)
- [ ] On page reload, theme does not flash (localStorage hydration works before React render)
- [ ] Log out, change OS theme, log back in — server preference takes precedence over localStorage
- [ ] Nav bar toggle cycles through light -> dark -> system -> light, icon updates accordingly
- [ ] Mobile drawer toggle behaves identically to nav bar toggle
- [ ] Courses section is completely gone (no API call to `/api/courses` on profile page load)
- [ ] Two-column grid collapses to single column below `md` breakpoint
- [ ] On mobile, header stacks vertically (avatar above name, centered)
- [ ] On mobile, preferences card stacks label above segmented control
- [ ] All buttons and segmented control segments meet 44x44px touch target on mobile
- [ ] Keyboard: Tab navigates through all interactive elements in correct order
- [ ] Keyboard: Arrow keys navigate within the segmented theme control (roving tabindex)
- [ ] Keyboard: Enter/Space selects a segment
- [ ] Screen reader: success messages are announced via `role="status"`
- [ ] Screen reader: password error banner is announced via `role="alert"`
- [ ] PATCH failure on theme save: error message appears below control, previous theme reverts

### Key Edge Cases

- **User with single-character name** (e.g., "A"): avatar shows "A"
- **User with no name** (empty string): should not occur (auth requires name), but defensive: show "?" or first letter of email
- **themePreference is null from server**: treat as "system" (spec FR-11a)
- **localStorage has legacy `theme` key but no `themePreference`**: migration logic converts it
- **API error on `GET /api/users/me`**: theme falls back to localStorage value; do not block page render
- **API error on `PATCH /api/users/me/preferences`**: revert preference state, show brief error in ProfilePage
- **User is not authenticated**: ThemeContext uses localStorage only (no server sync). This is the existing behavior and should continue to work.
- **Rapid theme toggles**: each `setThemePreference` call should cancel or supersede the previous PATCH (use a ref to track the latest preference and only revert if the failed value still matches current state)
