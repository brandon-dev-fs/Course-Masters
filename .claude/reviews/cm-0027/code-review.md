---
id: cm-0027
title: Refactor Lesson Detail Page Layout and Navigation
stage: review
status: rejected
approver: agent
---

# Code Review: Refactor Lesson Detail Page Layout and Navigation

## Summary

Reviewed 5 source files and 3 test files on branch `refactor/lessons-page` against the approved cm-0027 spec (status: approved). This is a frontend-only refactor with no backend or API changes. All diffs were captured via `git diff develop`. The frontend rules, design token rules, and accessibility requirements from `frontend.md` and `CLAUDE.md` were applied. No backend or API contract rules were applicable.

The implementation correctly delivers the core layout restructure: vertical step sidebar on desktop, compact progress bar on mobile, UnitLessonSidebar collapse with localStorage persistence, removal of the "Saved" tab, and left-drawer mobile navigation. Test coverage was updated to match the new behavior. However, several accessibility issues — three of which are blocking — were found.

## Scope Coverage

- **Frontend files reviewed**: `client/src/features/lessons/AssignmentStepper.tsx`, `client/src/features/lessons/LessonDetailPage.tsx`, `client/src/features/lessons/UnitLessonSidebar.tsx`, `client/src/features/student-notes/StudentToolsBar.tsx`, `client/src/features/student-notes/StudentMaterialsModal.tsx`
- **Test files reviewed**: `client/src/__tests__/features/lessons/AssignmentStepper.test.tsx`, `client/src/__tests__/features/lessons/UnitLessonSidebar.test.tsx`, `client/src/__tests__/features/student-notes/StudentToolsBar.test.tsx`
- **Backend files reviewed**: none (frontend-only spec)
- **Config/other files reviewed**: none
- **Rules loaded**: `.claude/rules/frontend.md`, `CLAUDE.md` (root and `client/CLAUDE.md`)

---

## Issues

### [HIGH] Mobile drawer does not trap focus
- **Location**: `client/src/features/lessons/UnitLessonSidebar.tsx:56–77`
- **Description**: The `useEffect` moves focus to the close button on open and handles the Escape key, but focus is not trapped inside the drawer while it is open. A keyboard user can Tab past the close button and the lesson list and reach content behind the backdrop (the main article, stepper buttons, etc.), which are obscured visually but remain focusable. `frontend.md` states "Modals must trap focus, return focus on close, and be dismissible with Escape." The spec NFR-02 also requires WCAG 2.1 AA keyboard accessibility for all interactive elements in the new layout. Focus return on close is handled correctly (via `hamburgerRef`).
- **Suggested Fix**: Add a focus-trap loop to the keydown handler. On Tab, check whether focus would leave the drawer (`drawerRef.current.contains(document.activeElement)`) and if so wrap around to the first or last focusable element inside the drawer. Alternatively, use the existing `Modal` shared component which already implements a compliant focus trap — if the drawer's content (lesson list + unit test link + add lesson) can be rendered inside `Modal`, that would be the lowest-risk approach. If a custom trap is needed, add `inert` to the page body content behind the backdrop as an alternative mechanism (`document.querySelector('#lesson-content')?.setAttribute('inert', '')`), removing it on close.

### [HIGH] `role="tab"` used without a `role="tablist"` parent
- **Location**: `client/src/features/student-notes/StudentToolsBar.tsx:63`
- **Description**: Each tool button inside the mobile `<nav>` has `role="tab"` and `aria-selected`, but the parent element is a `<nav>` with no `role="tablist"`. The ARIA specification requires that every `tab` element have a `tablist` ancestor. Without it, screen readers cannot announce these as a tab group and the AT tree is malformed. This is a semantic ARIA violation that degrades the mobile experience for AT users.
- **Suggested Fix**: Either (a) remove `role="tab"` and `aria-selected` from the buttons and rely on `aria-label` + `aria-pressed` (toggle button pattern) or `aria-current="page"` to convey selection state — which is more appropriate for a navigation bar — or (b) change the `<nav>` to `<div role="tablist" aria-label="Student tools">` and keep `role="tab"`. Option (a) is preferred because the component opens a modal panel rather than switching tab panels inline, making the tab pattern semantically misleading.

### [HIGH] `<div role="button">` used for the mobile drawer backdrop
- **Location**: `client/src/features/lessons/UnitLessonSidebar.tsx:156–161`
- **Description**: The backdrop overlay is a `<div>` with `onClick={onMobileClose}` and `role="button"`. `frontend.md` explicitly states "never use `<div onClick>` or `<span onClick>` for interactive elements" and requires interactive elements to be keyboard-accessible. A `<div role="button">` without `tabIndex` and a `keydown` handler for Enter/Space does not receive keyboard events in all browser/AT combinations, and the implicit ARIA button role does not guarantee keyboard operability without `tabIndex`.
- **Suggested Fix**: Replace with a `<button>` element: `<button type="button" className="fixed inset-0 z-40 bg-black/40 cursor-default" onClick={onMobileClose} aria-label="Close navigation" />`. Styling a `<button>` as a full-screen overlay requires resetting button defaults (`appearance-none border-none p-0 w-full h-full`), but it is semantically correct and keyboard-accessible without additional attributes.

### [MEDIUM] `tabIndex={0}` placed on the `<nav>` landmark in `AssignmentStepper`
- **Location**: `client/src/features/lessons/AssignmentStepper.tsx:97`
- **Description**: The desktop vertical step `<nav>` has `tabIndex={0}`, which inserts a non-interactive container into the keyboard tab order before its child buttons. A `<nav>` is a landmark element; adding `tabIndex` to it means a keyboard user must Tab through the `<nav>` container itself (which has no action) before reaching the first step button. This is an accessibility anti-pattern per WCAG 2.1 Success Criterion 2.4.3 (Focus Order) and the requirement that only interactive elements are focusable.
- **Suggested Fix**: Remove `tabIndex={0}` from the `<nav>` element. The child `<button>` elements are already focusable and will receive focus in document order without the explicit `tabIndex` on the container.

### [MEDIUM] `aria-hidden` on collapsed sidebar does not prevent keyboard focus on hidden children
- **Location**: `client/src/features/lessons/UnitLessonSidebar.tsx:111–115`
- **Description**: When `collapsed` is `true`, the desktop `<nav>` has `aria-hidden={true}` and is visually hidden via `w-0 overflow-hidden`. However, `aria-hidden` only removes the element from the accessibility tree — it does not prevent interactive elements (links and buttons inside the sidebar) from receiving keyboard focus. A keyboard-only user navigating with Tab will still focus the hidden course title link, unit dropdown, and lesson links despite them being visually invisible. This is a WCAG 2.1 AA violation (SC 2.1.1).
- **Suggested Fix**: Add the `inert` attribute when collapsed. In React this requires a ref or the `inert` prop (supported as a string attribute in React 19): `<nav ... inert={collapsed ? '' : undefined}>`. This causes the browser to skip all focusable descendants when the sidebar is collapsed. The `inert` attribute also implies `aria-hidden` for AT purposes, so the separate `aria-hidden` prop can be removed.

### [MEDIUM] `text-white` raw color value used instead of design token
- **Location**: `client/src/features/lessons/AssignmentStepper.tsx:111`
- **Description**: The active/complete step circle uses `bg-primary text-white`. `frontend.md` and NFR-05 prohibit raw color values; the project's design token system provides `text-primary-foreground` (alias for `--green-primary-foreground`) for text on `bg-primary` backgrounds. The `design.md` token table confirms `--green-primary-foreground` maps to `#FFFFFF` in both light and dark themes, so the visual result is identical — but using the raw Tailwind color `text-white` bypasses the token system and would break if the foreground token were ever changed.
- **Suggested Fix**: Replace `text-white` with `text-primary-foreground` on line 111: `circleClass += 'bg-primary text-primary-foreground cursor-pointer hover:opacity-90';`

### [MEDIUM] `<nav role="dialog">` — conflicting landmark and dialog roles
- **Location**: `client/src/features/lessons/UnitLessonSidebar.tsx:164–170`
- **Description**: The mobile drawer is rendered as `<nav role="dialog" aria-modal="true" aria-label="Lesson navigation">`. Adding `role="dialog"` to a `<nav>` element creates a conflict: `role="dialog"` overrides the implicit `navigation` landmark role, so screen readers announce the element as a dialog rather than a navigation region. However, the inner content (course title, lesson links) uses `<Link>` elements that are semantically navigation. The correct pattern is to use a `<div role="dialog">` as the dialog container and place the `<nav>` landmark inside it for the navigation content.
- **Suggested Fix**: Change the outer element to `<div role="dialog" aria-modal="true" aria-label="Lesson navigation" ...>` and wrap the lesson list links in a `<nav aria-label="Lessons in this unit">` inside it. This separates the dialog semantics from the navigation landmark semantics.

### [LOW] `min-w-[176px]` arbitrary pixel value inside collapsed sidebar
- **Location**: `client/src/features/lessons/UnitLessonSidebar.tsx:117`
- **Description**: The inner content div uses `min-w-[176px]` (a Tailwind arbitrary value) to prevent the content from collapsing when the parent `<nav>` shrinks to `w-0`. While there is no design token for this width value, it is a layout constraint rather than a color/typography token, making this a minor convention issue. The value `176px` matches `w-44` (11rem = 176px), which is the expanded sidebar width — this relationship is implicit and fragile if the sidebar width is ever changed.
- **Suggested Fix**: Extract the sidebar width to a CSS custom property or a shared constant so the inner `min-w` always matches the outer expanded width. Alternatively, comment the relationship: `{/* min-w matches parent w-44 = 176px to prevent content reflow during collapse */}`.

### [LOW] Mobile progress bar uses array index as React key
- **Location**: `client/src/features/lessons/AssignmentStepper.tsx:183`
- **Description**: The mobile progress bar segment `<div>` uses `key={idx}` (the array index) instead of `key={item.key}`. React's reconciler will produce incorrect results if items are reordered, added, or removed while the mobile view is rendered, as it matches elements by position rather than identity. This is a low-risk issue in practice since steps are not reordered in the mobile view, but it is contrary to React best practices.
- **Suggested Fix**: Replace `key={idx}` with `key={item.key}` on line 183, consistent with the desktop sidebar which correctly uses `key={item.key}`.

### [INFO] Desktop breadcrumb `<li>` separator uses visible Unicode character without screen-reader suppression
- **Location**: `client/src/features/lessons/LessonDetailPage.tsx:236, 238`
- **Description**: The breadcrumb separators use `<li aria-hidden className="shrink-0">›</li>`. The `aria-hidden` attribute is correctly applied, which is good practice. This is an informational note confirming the implementation is correct.
- **Suggested Fix**: No action needed. Pattern is correct.

---

## Verdict

**Status**: REJECTED

Blocking issues found at **high** and **medium** severity. There are 3 high-severity issues (missing focus trap in mobile drawer, `role="tab"` without `tablist`, `div role="button"` backdrop), 3 medium-severity issues (`tabIndex` on nav container, `aria-hidden` not blocking keyboard focus on collapsed sidebar, `text-white` token violation), and 1 medium-severity ARIA role conflict (`nav role="dialog"`). All 7 issues at medium or above must be resolved before re-running `/review`.

The implementation correctly delivers the layout refactor described in the spec (vertical stepper, localStorage persistence, drawer navigation, mobile tab bar filtering) and the test suite was appropriately updated. The blocking issues are all in the accessibility layer and are fixable without structural changes to the layout architecture.

## Next Steps

Fix the 7 blocking issues listed above (3 high, 4 medium), then re-run: `/review cm-0027`

Override: `/approve .claude/reviews/cm-0027/code-review.md` or edit frontmatter to `status: rejected`
