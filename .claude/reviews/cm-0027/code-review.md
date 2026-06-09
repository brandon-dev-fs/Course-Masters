---
id: cm-0027
title: Refactor Lesson Detail Page Layout and Navigation
stage: review
status: approved
approver: agent
---

# Code Review: Refactor Lesson Detail Page Layout and Navigation

## Summary

Reviewed the diff between `develop` and `HEAD` scoped to `client/`. Eight files changed: five source components and three test files. This is a pure frontend layout refactor — no backend changes, no API changes. The diff replaces the horizontal `AssignmentStepper` with a horizontal activity bar (per updated wireframes), adds a collapsible desktop sidebar with an icon-strip fallback, replaces the mobile dropdown with a left-drawer overlay, converts the mobile tool strip to a fixed bottom tab bar, removes the `practice` tab from mobile, and adds `getStepLabel()` as an exported pure function. All blocking issues from the previous rejected review have been correctly applied: unused `ClipboardCheck` import removed, `aria-live` scoped to a `sr-only` span, `<h1 className="sr-only">` added to the desktop breadcrumb area, and the settings gear restored to both desktop and mobile.

---

## Scope Coverage

- **Frontend files reviewed**: `client/src/features/lessons/AssignmentStepper.tsx`, `client/src/features/lessons/LessonDetailPage.tsx`, `client/src/features/lessons/UnitLessonSidebar.tsx`, `client/src/features/student-notes/StudentMaterialsModal.tsx`, `client/src/features/student-notes/StudentToolsBar.tsx`
- **Test files reviewed**: `client/src/__tests__/features/lessons/AssignmentStepper.test.tsx`, `client/src/__tests__/features/lessons/UnitLessonSidebar.test.tsx`, `client/src/__tests__/features/student-notes/StudentToolsBar.test.tsx`
- **Backend files reviewed**: none (no backend changes)
- **Config/other files reviewed**: none
- **Rules loaded**: `.claude/rules/rules.md`, `.claude/rules/review.md`, `.claude/rules/frontend.md`, `.claude/rules/design.md`, `CLAUDE.md`, `client/CLAUDE.md`

---

## Issues

### [LOW] `UnitLessonSidebarProps` interface declares three props that are never used in the component body

- **Location**: `client/src/features/lessons/UnitLessonSidebar.tsx:13-15`
- **Description**: `courseTitle: string`, `unitTitle: string`, and `units?: Unit[]` remain in the interface but are not destructured from the props parameter and are not referenced anywhere in the component body. The `Unit` type from `../../api/types.js` is imported solely to type the unused `units` prop. These declarations are dead — the course/unit header and `UnitDropdown` that consumed them have been removed. Dead interface members mislead future contributors into passing data that goes nowhere.
- **Suggested Fix**: Remove `courseTitle`, `unitTitle`, and `units` from `UnitLessonSidebarProps`. Remove the `Unit` import if it has no other usages. Callers in `LessonDetailPage` currently pass these props; those prop sites can be cleaned up in the same pass.

---

### [LOW] Collapsed desktop sidebar nav retains `aria-label="Unit lessons"` even though it renders only a single expand button

- **Location**: `client/src/features/lessons/UnitLessonSidebar.tsx:184-229`
- **Description**: When `collapsed === true`, the `<nav aria-label="Unit lessons">` shrinks to a `w-9` strip that contains only the expand toggle button. The `nav` landmark and its label remain unchanged, so screen readers announce a "Unit lessons" navigation region whose sole interactive element is an expand control — the label is misleading. Because the element still contains interactive content when collapsed, setting `aria-hidden="true"` on the nav would be wrong (it would hide the focusable button). The fix is instead to update the landmark's description to match its actual contents.
- **Suggested Fix**: Apply a conditional `aria-label`: `aria-label={collapsed ? 'Lesson sidebar (collapsed)' : 'Unit lessons'}`. Alternatively, when `collapsed`, move the expand button outside the `<nav>` into a plain `<div>` and omit the nav landmark entirely for the collapsed strip, re-introducing it only when expanded.

---

### [LOW] `getStepLabel` test suite is missing coverage for the `'reading'` assignment type

- **Location**: `client/src/__tests__/features/lessons/AssignmentStepper.test.tsx:73-132`
- **Description**: The plan (section 9.2) specifies `assignmentType === 'reading'` returns `'Link'`, and the implementation handles it correctly (line 69 of `AssignmentStepper.tsx`). However the exhaustive `getStepLabel` describe block in the test file covers `note`, `video`, `vocab`, and `practice_problem` assignment types but omits `'reading'`. The plan explicitly calls for data-driven exhaustive coverage of every `(kind, type)` combination in the wireframe table.
- **Suggested Fix**: Add: `it('returns Link for reading assignment', () => { expect(getStepLabel({ key: 'k', title: 't', kind: 'assignment', completionId: null, assignmentType: 'reading' })).toBe('Link'); });`

---

### [INFO] `Lock` icon used for Unit Test navigation item regardless of lock state

- **Location**: `client/src/features/lessons/UnitLessonSidebar.tsx:161`
- **Description**: The unit test sidebar button unconditionally renders a `Lock` icon. The `Lock` icon is also used in `AssignmentStepper` specifically to signal a locked quiz step. A student who has completed all lessons sees a lock icon on a fully accessible navigation item, which creates a semantic inconsistency — the affordance communicates "inaccessible" for something that is accessible.
- **Suggested Fix**: Use a semantically neutral icon such as `ClipboardList` or `BookCheck` from `lucide-react` for the unit test navigation item. Reserve `Lock` for items that are genuinely inaccessible to the current user.

---

### [INFO] `StudentMaterialsModal` tab label change is untested

- **Location**: `client/src/features/student-notes/StudentMaterialsModal.tsx:88`
- **Description**: `TOOL_META` now has both `label` (short) and `longLabel` (full). `StudentMaterialsModal` correctly switched from `label` to `longLabel` for its tab buttons. No test asserts the modal renders the long-form labels. The change is a trivial property rename and carries no regression risk, but coverage of this modal's tab bar is zero.
- **Suggested Fix**: Add a smoke test asserting that when `availableTools` has multiple entries, the long-form labels (`'My Notes'`, `'Flash Cards'`) appear in the modal tab bar.

---

### [INFO] `mobileAvailableTools` uses a redundant type guard predicate

- **Location**: `client/src/features/lessons/LessonDetailPage.tsx:213`
- **Description**: `availableTools.filter((t): t is StudentToolType => t !== 'practice')` uses an explicit type predicate, but `availableTools` is already `StudentToolType[]`. Filtering a union member out of a `StudentToolType[]` still yields `StudentToolType[]` — TypeScript infers this correctly without the cast. The predicate is harmless but adds unnecessary visual noise.
- **Suggested Fix**: Simplify to `availableTools.filter(t => t !== 'practice')`.

---

## Verdict

**Status**: APPROVED

Zero issues at medium or above. Three low advisory findings and two info advisories. Approved by agent.

## Next Steps

Next: `/test cm-0027`

Override: `/approve .claude/reviews/cm-0027/code-review.md` or edit frontmatter to `status: rejected`
