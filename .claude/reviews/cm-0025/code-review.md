---
id: cm-0025
title: Landing Page Card & How It Works Updates
stage: review
status: approved
approver: agent
---

# Code Review — cm-0025: Landing Page Card & How It Works Updates (Re-review)

## Summary

Re-review of branch `refactor/landing-page-updates` against `develop`. This pass verifies the two medium-severity fixes committed in `cm-0025: fix CourseCardMenu click-outside double-toggle and missing Tab handler`, plus a full sweep of all five changed frontend files. All changes are frontend-only. Four cm-0025 commits are ahead of `develop`.

Both previously blocking medium issues are confirmed resolved. No new issues at medium or above were introduced.

---

## Scope Coverage

- **Backend files reviewed**: none
- **Frontend files reviewed**:
  - `client/src/features/courses/CourseFilters.tsx` (new)
  - `client/src/features/courses/CourseCardMenu.tsx` (modified — fix commit)
  - `client/src/features/courses/CourseCard.tsx` (modified)
  - `client/src/features/home/HowItWorksSection.tsx` (new)
  - `client/src/features/home/HomePage.tsx` (modified)
  - `client/src/__tests__/features/courses/CourseCard.test.tsx` (modified)
- **Config/other files reviewed**: none
- **Rules loaded**: `.claude/rules/frontend.md`, `.claude/rules/design.md`, `CLAUDE.md`, `client/CLAUDE.md`

---

## Fix Verification

### Fix 1: Tab key closes the menu (CourseCardMenu.tsx:31-32)

The `Tab` branch is present in `handleKeyDown`. It calls `setIsOpen(false)` without calling `preventDefault()` — correct behavior, as Tab focus naturally advances to the next DOM element. Previously open menu no longer persists after tabbing away. Issue resolved.

### Fix 2: Click-outside double-toggle (CourseCardMenu.tsx:18-21)

`triggerRef.current?.contains(event.target as Node)` is now included alongside `menuRef.current?.contains(event.target as Node)` in the early-return guard of `handleClickOutside`. The `mousedown` listener now ignores clicks on the trigger button, letting the trigger's `onClick` toggle handle open/close exclusively. Double-toggle race condition is eliminated. Issue resolved.

---

## Issues

### [LOW] `canEdit` defaults to `true` — three-dot menu is opt-out rather than opt-in

- **Location**: `client/src/features/courses/CourseCard.tsx:49`
- **Description**: `canEdit = true` as a default means any caller that omits the prop renders the teacher/admin three-dot menu. `HomePage` passes `canEdit` explicitly, so there is no current breakage. However `false` is the safer default for privilege-gating props — if `CourseCard` is reused in a future context where the caller forgets the prop, the menu would be visible to all users.
- **Suggested Fix**: Change `canEdit = true` to `canEdit = false`. No behavioral change at current call sites since `HomePage` passes the prop explicitly. No test changes needed — tests that omit `canEdit` pass `canEdit={false}` by default and already assert that the menu button is absent.

### [LOW] Missing test for `onDelete` callback through the menu

- **Location**: `client/src/__tests__/features/courses/CourseCard.test.tsx`
- **Description**: The test suite covers `onEdit` via a menu-click test but does not cover the parallel `onDelete` path. The menu's "Delete Course" button is untested.
- **Suggested Fix**: Add a test that opens the menu, clicks "Delete Course", and asserts `onDelete` was called once. Advisory — does not block.

### [INFO] `text-white` and `bg-white/20` in HowItWorksSection are not named design tokens

- **Location**: `client/src/features/home/HowItWorksSection.tsx:54,66,71,95`
- **Description**: `text-white` and `bg-white/20` are raw Tailwind utilities rather than named CSS custom property tokens. This is consistent with the established pattern in `HeroSection.tsx`, which uses identical raw-white classes on the same `bg-hero-deep` invariant dark surface. No `--text-on-hero` token is defined in `index.css`. The design token table in `design.md` does not include a white-on-hero-deep token, and the spec explicitly uses `bg-hero-deep` for this section. The pattern is accepted by existing precedent.
- **Suggested Fix**: In a future pass, consider adding a `--text-on-hero: #ffffff` token to `index.css` to formalize the pattern. No action required now.

### [INFO] Brief flash of HowItWorksSection before auth session resolves

- **Location**: `client/src/features/home/HomePage.tsx:98`
- **Description**: `!loggedIn` is `true` during async session resolution, so authenticated users may briefly see the guest section. The frontend plan (section 8, "isLoading Guard") explicitly documents this as acceptable behavior matching the existing `HeroSection`. No action required.
- **Suggested Fix**: None required. Advisory only.

### [INFO] No tests for `CourseFilters` or `HowItWorksSection`

- **Location**: `client/src/__tests__/features/courses/`, `client/src/__tests__/features/home/`
- **Description**: Neither new component has a test file. `HowItWorksSection` is entirely static content; `CourseFilters` is a fully controlled stateless component. Both are acceptable candidates for future test coverage but are not blocking per review rules for purely presentational components with no internal state.
- **Suggested Fix**: Advisory. Consider adding snapshot or interaction tests for `CourseFilters` pill selection in a future pass.

---

## Verdict

**Status**: APPROVED

Zero issues at medium or above. Both previously blocking medium issues are correctly resolved. Design tokens are used correctly throughout all changed files — no raw hex values, no Tailwind palette colors, no `dark:` prefix classes. Orange tokens are exclusively used as surface/surface-text pairings. All `.js` import extensions are present. ARIA attributes are complete across all new components (`role="menu"`, `role="menuitem"`, `aria-haspopup`, `aria-expanded`, `aria-pressed`, `aria-label`, `aria-hidden`, `aria-live`, `aria-labelledby`). Commit messages follow the `cm-0025: <imperative>` format. Approved by agent.

## Next Steps

Next: `/test cm-0025`

Override: `/approve .claude/reviews/cm-0025/code-review.md` or edit frontmatter to `status: rejected`
