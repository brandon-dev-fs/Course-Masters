---
id: cm-0032
title: Profile Page Modernization
stage: spec
status: approved
---

# Profile Page Modernization

## Problem Statement

The current profile page uses a plain heading, a pencil-icon inline edit pattern for the display name, a single-column layout that wastes horizontal space on desktop, and includes a redundant "Courses" section that duplicates the home page dashboard. The page also lacks a theme preference control, forcing users to rely on the nav bar toggle. These issues make the profile page feel unpolished and functionally incomplete compared to the rest of the application.

## Goals

- Present a visually distinct profile header with an initials-based avatar, user name, email, and role badge
- Improve desktop layout density by placing Account and Change Password cards side by side in a two-column grid
- Standardize form input styling across light and dark modes with clear visual distinction between editable and read-only fields
- Replace the pencil-icon inline edit pattern with a standard form field and explicit save button
- Establish a clear button hierarchy: primary green for account save, secondary outline for password update
- Add a Preferences section with a segmented theme toggle supporting Light, Dark, and System modes
- Extend ThemeContext to support a "system" preference that follows the OS color scheme
- Remove the redundant Courses section from the profile page

## Non-Goals

- Profile photo/image upload (avatar is generated from initials only)
- Email change functionality (email remains read-only)
- Role change from the profile page (role remains read-only)
- Account deletion from the profile page
- Notification preferences or other settings beyond theme

## User Stories

- As a student, I want to see my avatar, name, email, and role at a glance so that I can confirm I am logged into the correct account.
- As a user, I want to edit my display name in a standard form field and click "Save changes" so that the interaction is predictable and familiar.
- As a user, I want to change my password using a clearly secondary action so that I do not confuse it with the primary account save action.
- As a user, I want to choose between Light, Dark, and System theme modes from my profile so that my preference persists across devices and sessions.
- As a user, I want my theme preference saved to my account so that logging in on a new device restores my choice automatically.
- As a user on a mobile device, I want the profile page to stack cards vertically so that the layout remains usable on narrow screens.

## Functional Requirements

- FR-01: The profile page displays an initials-based avatar circle derived from the first letter(s) of the user's display name. The avatar uses a green-tinted background (rgba(4,120,87,0.15)), a green border, and green text.
- FR-02: The profile header displays the user's full name, email address, and a role badge inline next to the avatar. The header is separated from the form sections below by a visible bottom border.
- FR-03: The Account and Change Password cards render in a two-column grid (grid-cols-1 md:grid-cols-2) — side by side on screens at the md breakpoint and above, stacked vertically on smaller screens.
- FR-04: All form inputs use a consistent style: rgba(255,255,255,0.04) background with rgba(255,255,255,0.1) border in dark mode; #F9FAFB background with #E5E7EB border in light mode. Labels are rendered as small (12px), muted secondary text above each field.
- FR-05: Read-only fields (email, role) are visually distinguished with a dimmer border and muted text color, making it clear they cannot be edited.
- FR-06: The display name field in the Account card is a standard text input (not an inline edit with pencil icon). The Account card has an explicit "Save changes" button using the green primary button style (#047857 background, white text).
- FR-07: The "Update password" button in the Change Password card uses a secondary/outline button style (transparent background, subtle border) to establish visual hierarchy below the primary save action.
- FR-08: A full-width Preferences card appears below the two-column grid. It contains a segmented control with three options: Light (with Sun icon), Dark (with Moon icon), and System (with Monitor icon).
- FR-09: The segmented theme control reflects the current theme preference and updates the theme immediately when a different option is selected. The selected segment is visually highlighted.
- FR-10: Selecting "System" causes the application theme to follow the operating system's color scheme preference (prefers-color-scheme media query). Changes to the OS preference are detected and applied in real time while "System" is selected.
- FR-11: The theme preference (light, dark, or system) is persisted to the database on the User record. On page load the client fetches the stored preference from the server and applies it. localStorage is used as a fallback for unauthenticated state and as an optimistic cache to avoid a flash of incorrect theme on load.
- FR-11a: A new `themePreference` field (type: string, nullable) is added to the `User` model in the Prisma schema. Null is treated as "system" at the application level.
- FR-11b: A `PATCH /api/users/me/preferences` endpoint accepts `{ themePreference: "light" | "dark" | "system" }` and updates the authenticated user's record. Returns the updated preference value.
- FR-11c: A new `GET /api/users/me` endpoint returns the authenticated user's profile including `themePreference`, so the client can hydrate the correct initial theme on load. (No equivalent endpoint currently exists — this is a new route.)
- FR-11d: Theme preference is saved to the server immediately (no separate save button) when the segmented control changes, matching the UX expectation that preference toggles are instant.
- FR-12: The ThemeContext is extended to expose the current preference value (light, dark, or system) and a setter function, replacing the current binary toggleTheme function. The existing useTheme() hook continues to expose the resolved theme (light or dark) for consumers that need the actual applied theme.
- FR-13: The Courses section that currently appears at the bottom of the profile page is removed entirely, along with its associated state, data fetching logic, and API imports.
- FR-14: The profile page remains fully functional on mobile (below md breakpoint) with all cards stacked vertically and all interactive elements meeting the 44x44px minimum touch target size.
- FR-15: All interactive elements on the profile page are keyboard-accessible. The segmented theme control can be navigated and activated via keyboard.
- FR-16: Success feedback for name save and password change continues to be shown (e.g., inline success message or banner) and auto-dismisses after a short delay.

## Technical Notes

- The initials avatar is a purely presentational component that extracts the first character (or first characters of first and last name) from the user's display name. No image upload or external avatar service is involved.
- The ThemeContext type should change from a binary "dark" | "light" theme value to a three-way preference of "light" | "dark" | "system", while still exposing the resolved effective theme for components that need to know the current actual mode. The system preference should be detected using the window.matchMedia("(prefers-color-scheme: dark)") API with an event listener for real-time changes.
- Theme preference is stored in the `themePreference` column on the `User` table (nullable string). The server is the source of truth; localStorage acts as an optimistic cache to avoid a flash of incorrect theme before the session loads. On auth load, `ThemeContext` should read the user's stored preference from the API response and sync it to localStorage and React state. When not authenticated, localStorage alone governs the preference.
- localStorage stores the preference value ("light", "dark", or "system") rather than the resolved theme. On load, if the stored value is "system", the effective theme is determined from the OS media query.
- The existing toggleTheme function should be replaced with a setThemePreference function that accepts the three-way preference value. Any existing consumers of toggleTheme (such as the nav bar theme toggle) will need to be updated.
- Form input styling should use CSS custom properties or Tailwind utility classes that respond to the existing light/dark theming mechanism. Avoid using the dark: Tailwind prefix.
- The segmented control for theme selection can be built as a self-contained component within the profile feature directory. It should use Sun, Moon, and Monitor icons from lucide-react.
- Removal of the Courses section eliminates the coursesApi import and all courses-related state from ProfilePage, reducing the component's data fetching footprint.
- The role badge styling already exists in the current ProfilePage (the roleBadge record) and should be preserved or refined to match the new header layout.

## Required Design Artifacts

- [x] Backend plan (`backend-plan.md`)
- [x] API contract (`api-contract.md`)
- [x] Frontend plan (`frontend-plan.md`)
- [x] UI wireframe (`wireframe.md`)

## Open Questions

None. All requirements are fully specified.
