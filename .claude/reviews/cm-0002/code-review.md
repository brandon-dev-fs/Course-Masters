---
id: cm-0002
title: Redesign Lesson Detail Page Layout
stage: review
status: approved
approver: agent
approved_at: 2026-04-27T00:00:00Z
---

# Code Review — cm-0002: Redesign Lesson Detail Page Layout (Pass 3)

**Diff base:** `develop..HEAD`

---

## Summary

All prior blocking issues are resolved. The three UI regressions (tool strip position, stepper icons, single-item view) are correctly fixed. The `StudentToolsBar` `mode` prop cleanly separates mobile/desktop rendering. The LOW issues from pass 2 (`lessonId!`, `nextOrder`, null body) are all fixed. Three low-severity issues remain — two new, one carryover. None block merge.

---

## Issues

### LOW

#### 1. Redundant `onVisible` in `useEffect` deps

**Location:** `client/src/features/lessons/AssignmentSection.tsx` — line 130

```ts
}, [item.key, stableOnVisible, onVisible]);
```

**Description:** `stableOnVisible` is created by `useCallback([onVisible])`, so it already re-creates whenever `onVisible` changes. Including `onVisible` directly in the effect deps is redundant — both change in the same render and the effect runs once, but the intent is obscured. In current usage `onVisible` is never passed (single-item view), so the effect body exits immediately and there is no functional impact.

**Suggested fix:**
```ts
}, [item.key, stableOnVisible]);
```

---

#### 2. Deleting the active item leaves `activeStepKey` stale

**Location:** `client/src/features/lessons/LessonDetailPage.tsx` — delete handlers inside `renderContent`

**Description:** When the currently-displayed resource or tool is deleted, `setResources`/`setTools` is called but `activeStepKey` is not updated. `renderActiveAssignment` silently falls back to `assignmentItems[0]` via `?? assignmentItems[0]`, so the stepper shows no highlighted step until the user clicks another one.

**Suggested fix:** After each delete, check whether the removed ID matches the active step and reset:
```ts
onDelete={canEdit ? async () => {
  await lessonResourcesApi.delete(resource.id);
  setResources(prev => prev.filter(r => r.id !== resource.id));
  if (activeStepKey === `resource:${resource.id}`) setActiveStepKey('lessonPlan');
} : undefined}
```

---

#### 3. `UnitDropdown` silently swallows navigation errors (carryover)

**Location:** `client/src/features/lessons/UnitDropdown.tsx` — `handleSelect`

**Description:** The `try/finally` exits the loading state on failure with no user feedback. If `lessonsApi.getAll` fails, the dropdown closes and nothing happens.

**Suggested fix:** Add an `error` state and render a brief inline message, or display a toast.

---

## Approved Sections

- **`StudentToolsBar` `mode` prop** — `mode="mobile"` inside center column suppresses the desktop `aside`, eliminating the flex-stretch bug. `mode="desktop"` outside renders only the right strip. Clean separation. ✓
- **Stepper icons** — `getStepIcon()` correctly maps all 8 item types to distinct lucide icons. Desktop shows icon node + truncated label below; mobile shows icon dot + active title. ✓
- **Single-item view** — `renderActiveAssignment()` renders only the active `AssignmentItem`. `onStepClick` is `setActiveStepKey` (no scroll). `onNext` calls `setActiveStepKey(next.key)`. `onVisible` omitted (IntersectionObserver no longer runs). ✓
- **`nextOrder` helper** — Correctly uses `Math.max(...arr.map(r => r.order)) + 1` instead of `length + 1`. ✓
- **`handleToggleRequired` guard** — `if (!lessonId || !item.id) return;` replaces `lessonId!`. ✓
- **New note body** — `{ body: { type: 'doc', content: [{ type: 'paragraph' }] } }` replaces `{ body: null }`. ✓
- **Navigate to new item** — After creating any resource or tool, `setActiveStepKey` navigates directly to the new item. ✓
- **`StepperItem` fields** — `resourceType` and `toolType` correctly propagated from `buildAssignmentItems` through `stepperItems` mapping. ✓
- **`AssignmentSection.onVisible` optional** — Made optional, effect guarded by `if (!onVisible) return`. No observer attaches in single-item mode. ✓
- **`StudentNotePanel` reset** — Separate `useEffect` resets state on `lessonId` change; second effect fetches and returns cleanup that cancels the debounce. Race condition resolved. ✓
