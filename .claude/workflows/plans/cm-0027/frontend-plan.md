---
id: cm-0027
title: Refactor Lesson Detail Page Layout and Navigation
stage: design
status: approved
approver: human
approved_at: 2026-05-29T00:00:00Z
---

# Frontend Plan: Refactor Lesson Detail Page Layout and Navigation

## 1. Overview

This plan covers a frontend-only layout refactor of `LessonDetailPage`. No API endpoints change. The goal is to replace the horizontal `AssignmentStepper` with a vertical step sidebar on desktop and a compact progress bar on mobile, add a collapse/expand toggle to `UnitLessonSidebar` with localStorage persistence, replace the mobile dropdown with a left-drawer overlay, and remove the "Saved" (practice) tab from the mobile bottom tab bar.

All data fetching hooks (`useLesson`, `useResources`, `useTools`, `useAssignments`) remain unchanged. The refactor affects only how already-fetched data is visually arranged.

**Spec acceptance criteria addressed:**
- FR-01 through FR-14 (vertical step sidebar, compact mobile progress bar, dynamic step labels, collapsible sidebar, mobile drawer, filtered mobile tool bar, preserved teacher controls, step completion indicators, "Add assignment" in step sidebar)
- NFR-01 through NFR-05 (CSS transitions, WCAG AA keyboard access, overflow scrolling for 20+ steps, namespaced localStorage key, design tokens)

---

## 2. Folder Structure

Files to modify (no new files are required — all changes are co-located in existing files):

```
client/src/
├── features/
│   ├── lessons/
│   │   ├── LessonDetailPage.tsx       # modify — layout restructure, breadcrumb bar, sidebar collapse state, footer action bar
│   │   ├── AssignmentStepper.tsx      # modify — vertical desktop layout, compact mobile progress bar, getStepLabel(), getStepIcon() retained
│   │   └── UnitLessonSidebar.tsx      # modify — collapsed/onToggle props, localStorage on mount, CSS transition, mobile drawer overlay
│   └── student-notes/
│       └── StudentToolsBar.tsx        # modify — mobile bottom tab bar excludes 'practice', layout restructured to fixed bottom
```

No new files. No new API modules. No new shared components.

---

## 3. Component Tree

### LessonDetailPage (page component)

**File:** `client/src/features/lessons/LessonDetailPage.tsx`
**Type:** Page
**Props:** none (reads from `useParams`)

**Responsibilities:**
- Orchestrates all data fetching hooks (unchanged)
- Manages `sidebarCollapsed` state (reads initial value from `localStorage.getItem('cm-sidebar-collapsed')`)
- Renders four-panel desktop layout: `UnitLessonSidebar` | `AssignmentStepper` (vertical) | main content | `StudentToolsBar`
- Renders breadcrumb bar (sticky top) with sidebar toggle, breadcrumb links, step counter, and settings gear
- Renders footer action bar (sticky bottom) with "Mark complete" checkbox and Prev/Next navigation
- On mobile: renders mobile header, passes `mode="mobile"` to `StudentToolsBar` (bottom tab bar) with `practice` filtered out of `availableTools`

**New state:**
```ts
const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
  return localStorage.getItem('cm-sidebar-collapsed') === 'true';
});
```

**Toggle handler:**
```ts
function handleToggleSidebar() {
  setSidebarCollapsed(prev => {
    const next = !prev;
    localStorage.setItem('cm-sidebar-collapsed', String(next));
    return next;
  });
}
```

**Props changes to children:**
- `UnitLessonSidebar` gains `collapsed` and `onToggle` props (toggle button now lives in breadcrumb bar, not inside sidebar)
- `AssignmentStepper` receives same props as today; visual layout changes are internal to that component
- `StudentToolsBar` mobile instance receives `availableTools` filtered to exclude `'practice'`

---

### AssignmentStepper (UI component — significantly modified)

**File:** `client/src/features/lessons/AssignmentStepper.tsx`
**Type:** UI component
**Props interface (unchanged from current):**
```ts
interface AssignmentStepperProps {
  items: StepperItem[];
  activeStepKey: string;
  completedIds: Set<string>;
  completedAssignmentIds: Set<string>;
  quizUnlocked: boolean;
  quizPassed: boolean;
  onStepClick: (key: string) => void;
  onAdd?: () => void;
}
```

**Responsibilities:**
- Desktop (`lg:` and above): renders a fixed-width vertical step list (`w-14`, 56px) with circles, connector lines, dynamic single-word labels, and an "Add" button for teachers
- Mobile (below `lg:`): renders a compact horizontal progress bar (segment pills + step counter + current step icon); replaces the current horizontal icon scroll row
- Exports `getStepLabel(item: StepperItem): string` as a named export (pure function, no side effects)
- Retains `getStepIcon()` as an internal helper (unchanged logic)

**New export:**
```ts
export function getStepLabel(item: StepperItem): string
```

---

### UnitLessonSidebar (UI component — modified)

**File:** `client/src/features/lessons/UnitLessonSidebar.tsx`
**Type:** UI component

**Props interface (extended):**
```ts
interface UnitLessonSidebarProps {
  lessons: Lesson[];
  currentLessonId: string;
  courseId: string;
  unitId: string;
  courseTitle: string;
  unitTitle: string;
  units?: Unit[];
  canEdit?: boolean;
  onAddLesson?: (data: { title: string; description: string; order: number }) => Promise<void>;
  onUnitTestClick?: () => void;
  unitTestActive?: boolean;
  onLessonClick?: () => void;
  // New props:
  collapsed?: boolean;       // desktop collapsed state (controlled by LessonDetailPage)
  onToggle?: () => void;     // not used inside sidebar; toggle lives in breadcrumb bar
}
```

**Responsibilities:**
- Desktop: renders vertical sidebar nav with width `w-44` when expanded, `w-0 overflow-hidden` when collapsed; CSS `transition-[width] duration-200 ease-in-out` for smooth animation; `aria-hidden={collapsed}` when fully collapsed
- Mobile: replaces the existing `lg:hidden` dropdown with a left-drawer overlay (slide-in from left, backdrop tap to close, Escape key closes, focus trap inside drawer, `role="dialog" aria-modal="true"`)
- Existing lesson list, unit test item, unit dropdown, course link, and "Add Lesson" button are unchanged in content; only the mobile container changes from dropdown to drawer

**Note:** The toggle button itself lives in the breadcrumb bar inside `LessonDetailPage`, not inside this component. The sidebar receives `collapsed` as a prop and applies it to its width class.

---

### StudentToolsBar (UI component — modified)

**File:** `client/src/features/student-notes/StudentToolsBar.tsx`
**Type:** UI component

**Props interface (unchanged):**
```ts
interface StudentToolsBarProps {
  availableTools: StudentToolType[];
  activeTool: StudentToolType | null;
  onOpenTool: (tool: StudentToolType) => void;
  isQuizActive: boolean;
  mode?: 'mobile' | 'desktop' | 'both';
}
```

**Responsibilities:**
- Desktop (`mode="desktop"`): vertical strip on the right — unchanged from today
- Mobile (`mode="mobile"`): fixed bottom tab bar (`fixed bottom-0 left-0 right-0 z-40`) replacing the current horizontal scroll row; renders only the tools in `availableTools` (the `practice` exclusion is applied by the caller in `LessonDetailPage` before passing the prop)
- Each tab: icon + label below, `min-h-[44px]`, active state uses `text-green-primary`, inactive uses `text-text-secondary`
- `role="tab"` on each button, `aria-selected={activeTool === tool}`, container is `<nav aria-label="Student tools">`

**The mobile rendering changes from a horizontal strip above content to a `fixed bottom-0` tab bar.** The existing `lg:hidden` class on the mobile section is retained. The `mode="mobile"` instance in `LessonDetailPage` moves from above the stepper to be rendered outside the main scroll area.

---

## 4. Client Routes

No new or modified routes. The existing route `/courses/:courseId/units/:unitId/lessons/:lessonId` → `LessonDetailPage` is unchanged. Auth requirement (all roles, `RequireAuth` wrapper) is unchanged.

---

## 5. Hooks and Data Fetching

No new hooks. No changes to existing hooks. All data fetching in `LessonDetailPage` via `useLesson`, `useResources`, `useTools`, and `useAssignments` is unchanged.

**localStorage integration (not a hook, inline in component):**
- Read: `localStorage.getItem('cm-sidebar-collapsed') === 'true'` — used as the `useState` initializer in `LessonDetailPage`
- Write: `localStorage.setItem('cm-sidebar-collapsed', String(next))` — called inside `handleToggleSidebar`
- Key: `'cm-sidebar-collapsed'` (namespaced per NFR-04)

---

## 6. API Integration

No API calls are added or modified by this refactor. This section confirms no new endpoints are introduced.

All existing API calls (lesson fetch, resource completions, assignment completions, unit progress) continue through the same hooks and API modules as today.

---

## 7. State Management

### New state in LessonDetailPage

| State | Type | Owner | Purpose |
|---|---|---|---|
| `sidebarCollapsed` | `boolean` | `LessonDetailPage` | Controls desktop sidebar width; persisted to `localStorage` |
| `mobileDrawerOpen` | `boolean` | `UnitLessonSidebar` | Controls mobile drawer overlay visibility |

### Derived state (unchanged)

`stepperItems`, `activeItem`, `activeIdx`, `isComplete`, `quizUnlocked`, `quizPassed`, `allLessonsComplete`, `onMoveUp`, `onMoveDown`, `onToggleCompletion` — all remain as they are today, computed from existing state and hook data.

### State that moves

The mobile dropdown open/closed state (`mobileOpen`) inside `UnitLessonSidebar` is replaced by `mobileDrawerOpen`. The state stays local to `UnitLessonSidebar`.

### Mobile tool filtering (derived, not stored)

`availableTools` filtered for mobile is computed inline at the call site in `LessonDetailPage`:
```ts
const mobileAvailableTools = availableTools.filter(t => t !== 'practice');
```
This is not stored in state; it is derived each render.

---

## 8. Authentication and Authorization

No changes to auth requirements. The route requires authentication (enforced by `RequireAuth` in `App.tsx`). Teacher-only controls (settings gear, add assignment, reorder, edit/delete) remain gated by `canEdit` from `useCanEdit()`. The `canEdit` value is passed to child components exactly as today.

The breadcrumb bar's settings gear (`[⚙]`) is shown only when `canEdit === true`.

---

## 9. Pseudocode for Complex Logic

### 9.1 LessonDetailPage — New Layout Shell

```
render():
  // Sticky breadcrumb bar (full width, top-0 z-20)
  <div sticky top breadcrumb>
    <button aria-label="Toggle lesson sidebar" aria-expanded={!sidebarCollapsed} onClick={handleToggleSidebar}>
      {sidebarCollapsed ? <PanelLeft /> : <ChevronLeft />}
    </button>
    <nav aria-label="Breadcrumb">
      <ol>
        <li><Link to={/courses/:courseId}>{courseTitle}</Link></li>
        <li aria-hidden>›</li>
        <li>{unitTitle}</li>
        <li aria-hidden>›</li>
        <li aria-current="page">{lesson.title}</li>
      </ol>
    </nav>
    <span class="ml-auto text-xs text-text-secondary">
      Step {activeIdx + 1} of {stepperItems.length}
    </span>
    {canEdit && <button aria-label="Lesson settings" onClick={settingsDisclosure.open}><Settings /></button>}
  </div>

  // Four-panel body (flex row, fills remaining viewport height)
  <div flex row min-h-[calc(100vh-breadcrumb-height-footer-height)]>

    // Panel 1: UnitLessonSidebar (desktop only via lg: classes)
    <UnitLessonSidebar
      ...existingProps
      collapsed={sidebarCollapsed}
    />

    // Panel 2: AssignmentStepper — now vertical on desktop
    {!unitTestActive && (
      <AssignmentStepper ...existingProps />
    )}

    // Panel 3: Main content area
    <main id="lesson-content" aria-live="polite" class="flex-1 min-w-0 overflow-y-auto px-4 py-6">
      {unitTestActive ? <AssessmentSection ... /> : <AssignmentSection ... />}
    </main>

    // Panel 4: StudentToolsBar (desktop, right edge)
    <StudentToolsBar mode="desktop" ...existingProps />
  </div>

  // Mobile header (lg:hidden, sticky top-0)
  <div lg:hidden sticky top-0 mobile-header>
    <button aria-label="Open lesson navigation" onClick={() => setMobileDrawerOpen(true)}><Menu /></button>
    <span truncate>{lesson.order}. {lesson.title}</span>
    {canEdit && <button aria-label="Lesson settings"><Settings /></button>}
  </div>

  // Mobile StudentToolsBar (bottom tab bar, fixed)
  <StudentToolsBar
    mode="mobile"
    availableTools={mobileAvailableTools}   // practice filtered out
    ...otherProps
  />

  // Sticky footer action bar
  {!unitTestActive && (
    <footer sticky bottom-0 border-t>
      <label>
        <input type="checkbox" checked={isComplete} onChange={onToggleCompletion} />
        Mark complete
      </label>
      <div flex gap-2>
        {activeIdx > 0 && <Button onClick={onPrev}>← Prev</Button>}
        <Button variant="primary" onClick={onNext}>
          {activeIdx === stepperItems.length - 1 ? 'Finish Lesson' : 'Next →'}
        </Button>
      </div>
    </footer>
  )}

  // Modals (unchanged from today)
  <StudentMaterialsModal ... />
  <LessonSettingsModal ... />
  ...
```

### 9.2 AssignmentStepper — Vertical Desktop Layout

```
getStepLabel(item: StepperItem): string:
  switch item.kind:
    'lessonPlan'  → 'Plan'
    'quiz'        → 'Quiz'
    'resource':
      switch item.resourceType:
        'video'   → 'Video'
        'lecture' → 'Lecture'
        default   → 'Read'
    'tool':
      switch item.toolType:
        'flash_card'       → 'Cards'
        'practice_problem' → 'Practice'
        'vocab'            → 'Vocab'
        default            → 'Read'
    'assignment':
      switch item.assignmentType:
        'note'             → 'Read'
        'video'            → 'Video'
        'reading'          → 'Link'
        'vocab'            → 'Vocab'
        'practice_problem' → 'Practice'
        default            → 'Read'
    default → 'Step'

render() desktop branch (lg: and above):
  <nav aria-label="Lesson steps" class="hidden lg:flex flex-col w-14 shrink-0 border-r border-border-subtle bg-surface overflow-y-auto py-3">
    {items.map((item, idx) =>:
      compute: isComplete, isActive, isLocked, Icon, label = getStepLabel(item)
      connectorColor = (items[idx-1] is complete) ? 'bg-green-primary' : 'bg-border-subtle'

      render connector (if idx > 0): <div aria-hidden class="w-px h-4 bg-{connectorColor} mx-auto" />

      render step:
        <button
          class={circle styles per state table}
          aria-current={isActive ? 'step' : undefined}
          aria-label="{label}: {item.title}"
          disabled={isLocked}
          aria-disabled={isLocked ? 'true' : undefined}
          title={isLocked ? 'Complete all required items to unlock the quiz' : item.title}
          onClick={() => !isLocked && onStepClick(item.key)}
        >
          {isLocked ? <Lock w-3.5 h-3.5 /> : isComplete ? <CheckCircle2 w-4 h-4 /> : <Icon w-4 h-4 />}
        </button>
        <span aria-hidden class="text-[10px] text-center">{label}</span>
    )}

    {onAdd && (
      render connector
      <button dashed-border circle onClick={onAdd} aria-label="Add assignment">
        <Plus />
      </button>
      <span aria-hidden>Add</span>
    )}
  </nav>

render() mobile branch (below lg:):
  <div class="lg:hidden flex items-center gap-2 px-4 py-2 border-b border-border-subtle bg-surface">
    <span class="text-xs text-text-secondary font-medium shrink-0">
      {activeIndex + 1}/{items.length}
    </span>
    <div class="flex gap-0.5 flex-1 min-w-0">
      {items.map((item, idx) =>:
        segmentColor = (completed or active) ? 'bg-green-primary' : 'bg-border-subtle'
        <div class="h-1.5 rounded-full flex-1 {segmentColor}" aria-hidden />
      )}
    </div>
    {activeItem && <Icon class="w-4 h-4 text-text-secondary shrink-0" />}
    {onAdd && <button onClick={onAdd} aria-label="Add assignment"><Plus /></button>}
  </div>
```

### 9.3 UnitLessonSidebar — Collapse and Mobile Drawer

```
Desktop collapse:
  <nav
    id="unit-lesson-sidebar"
    aria-label="Unit lessons"
    aria-hidden={collapsed}
    class="hidden lg:flex flex-col shrink-0 border-r border-border-subtle bg-surface overflow-y-auto
           transition-[width] duration-200 ease-in-out
           {collapsed ? 'w-0 overflow-hidden' : 'w-44'}"
  >
    {/* same content as today */}
  </nav>

Mobile drawer:
  Remove existing lg:hidden dropdown entirely.

  Add mobileDrawerOpen state (local, boolean, default false).
  LessonDetailPage passes an onMobileOpen callback OR UnitLessonSidebar manages it internally with a
  hamburger trigger from the mobile header (passed as prop or via an onMobileOpen prop from LessonDetailPage).

  Preferred approach: LessonDetailPage owns mobileDrawerOpen state, passes it and a setter to
  UnitLessonSidebar so the mobile header button in LessonDetailPage can open the drawer.

  UnitLessonSidebar receives: mobileOpen: boolean, onMobileClose: () => void

  <div class="lg:hidden">
    // Backdrop
    {mobileOpen && (
      <div
        class="fixed inset-0 z-40 bg-black/40"
        onClick={onMobileClose}
        aria-label="Close navigation"
        role="button"
      />
    )}
    // Drawer
    <nav
      role="dialog"
      aria-modal="true"
      aria-label="Lesson navigation"
      class="fixed left-0 top-0 bottom-0 z-50 w-64 bg-surface shadow-warm-lg overflow-y-auto
             transition-transform duration-200 ease-in-out
             {mobileOpen ? 'translate-x-0' : '-translate-x-full'}"
    >
      <div class="flex items-center justify-between p-4 border-b border-border-subtle">
        <span class="text-sm font-semibold text-text-primary">{courseTitle}</span>
        <button onClick={onMobileClose} aria-label="Close navigation"><X /></button>
      </div>
      {/* same lesson list, unit test, add lesson as desktop */}
    </nav>
  </div>

Focus trap (when drawer opens):
  useEffect:
    if mobileOpen:
      move focus to first focusable element inside drawer
      add keydown listener: if Escape → onMobileClose()
    return cleanup: remove keydown listener
```

### 9.4 StudentToolsBar — Mobile Bottom Tab Bar

```
Mobile branch (mode === 'mobile'):
  if isQuizActive or availableTools.length === 0: return null

  <nav
    aria-label="Student tools"
    class="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border-subtle
           flex lg:hidden"
  >
    {availableTools.map(tool =>:
      const { label, Icon } = TOOL_META[tool]
      const isActive = activeTool === tool
      <button
        key={tool}
        role="tab"
        aria-selected={isActive}
        aria-label={label}
        onClick={() => onOpenTool(tool)}
        class="flex flex-col items-center gap-0.5 flex-1 py-2 min-h-[44px]
               {isActive ? 'text-green-primary' : 'text-text-secondary'}"
      >
        <Icon class="w-5 h-5" />
        <span class="text-[10px]">{label}</span>
      </button>
    )}
  </nav>
```

---

## 10. Styling Notes

### Design Tokens Used

All from existing `src/index.css` — no new tokens required.

| Element | Token(s) |
|---|---|
| Active step circle fill | `bg-green-primary` |
| Active step label | `text-green-primary font-medium` |
| Completed step circle | `bg-green-primary` |
| Future step circle | `border border-border bg-background text-text-secondary` |
| Locked step | add `opacity-50 cursor-not-allowed` |
| Step connector (default) | `bg-border-subtle` |
| Step connector (above completed) | `bg-green-primary` |
| Step label (inactive) | `text-text-secondary text-[10px]` |
| Active lesson in sidebar | `bg-green-surface text-green-surface-text font-medium` |
| Breadcrumb text | `text-text-secondary text-xs` |
| Breadcrumb current | `text-text-primary` |
| Panel backgrounds | `bg-surface` (sidebars), `bg-background` (main content) |
| Sidebar border | `border-r border-border-subtle` |
| Footer bar | `bg-surface border-t border-border-subtle px-4 py-3` |
| Bottom tab active | `text-green-primary` |
| Bottom tab inactive | `text-text-secondary` |
| Next/Finish button | `bg-green-button text-green-button-text` via `Button variant="primary"` |
| Mobile drawer shadow | `shadow-warm-lg` |

### Layout Notes

- The outer wrapper in `LessonDetailPage` retains the existing `relative -mx-4 -mb-8` negative margin escape and `100vw` width technique.
- Desktop four-panel row: `flex flex-row`. Panels are `shrink-0` for fixed widths; main content is `flex-1 min-w-0`.
- Step sidebar: `w-14 shrink-0` — fixed, does not grow or shrink.
- The mobile bottom tab bar uses `fixed bottom-0` — the main content area needs `pb-[calc(44px+...)]` bottom padding to avoid content hidden behind the tab bar. Use `pb-24` or equivalent.
- `transition-[width]` on `UnitLessonSidebar` requires Tailwind to know about this utility. In Tailwind v4 via CSS, ensure `transition-[width]` is recognized or use `transition-all` as a fallback. Prefer `transition-all duration-200 ease-in-out` to stay within known utility classes.
- The content surface card (the `#F9FAFB` reference in the wireframe) maps to `bg-surface` in the current token set. Use `bg-surface` rather than a raw hex value to respect dark mode via CSS custom properties.

### Focus Ring Pattern

All interactive elements that do not already have a focus ring: add `focus-visible:ring-2 focus-visible:ring-green-primary focus-visible:ring-offset-2 focus-visible:outline-none`. Apply via a shared class string constant within the component file where many buttons share the same pattern.

---

## 11. Edge Cases and Error Handling

### Loading and Error States

- Loading and error states from `useLesson` are already handled at the top of `LessonDetailPage` (`if (loading) return <LoadingSpinner />; if (error) return <ErrorMessage message={error} />;`). No changes needed.
- The new breadcrumb bar, footer, and sidebar are only rendered after data loads — no skeleton states required for these new elements.

### Empty States

| Scenario | Behavior |
|---|---|
| Lesson has no resources, tools, or assignments (only the Plan step) | `AssignmentStepper` renders a single Plan step with no connector lines and no "Add" button (if `canEdit` is false) |
| `availableTools` is empty after `practice` filter | `StudentToolsBar` mobile returns `null` (existing guard: `availableTools.length === 0`) |
| `mobileAvailableTools` is empty (all tools are `practice`) | Same null return; mobile tab bar not shown |
| No lessons in unit | `UnitLessonSidebar` renders empty lesson list section — existing behavior, no change |
| `unitTestActive === true` | Footer action bar is hidden; `AssignmentStepper` (step sidebar) is hidden; only `AssessmentSection` is shown in main content |

### Sidebar Collapse Edge Cases

- If `localStorage` is unavailable (e.g., private browsing with strict settings), the `useState` initializer will throw. Wrap the read in a try/catch:
  ```ts
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cm-sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });
  ```
- Similarly, `localStorage.setItem` in `handleToggleSidebar` should be wrapped in try/catch and fail silently.
- When `sidebarCollapsed` is `true`, `aria-hidden="true"` is applied to the sidebar nav so screen readers skip it. Focus must not land on elements inside a collapsed (visually hidden) sidebar — the `w-0 overflow-hidden` CSS ensures elements are not focusable when width is 0 via `visibility: hidden` or `tabIndex={-1}` on the nav element when collapsed.

  Preferred: set `tabIndex={-1}` on the `<nav>` when `collapsed === true` and `aria-hidden={collapsed}`. Individual links and buttons inside will still be unreachable since the nav itself has `tabIndex={-1}` and `aria-hidden`.

### Mobile Drawer Focus Trap

- When the drawer opens, `focus()` is called on the first focusable element inside the drawer (the close X button or first lesson link).
- When the drawer closes, focus returns to the hamburger menu button that opened it. Maintain a ref to that button (`hamburgerRef`) and call `hamburgerRef.current?.focus()` in `onMobileClose`.
- `Escape` key closes the drawer via a `keydown` event listener attached in a `useEffect` that cleans up on unmount and when `mobileOpen` becomes false.

### Step Sidebar Overflow

- The step sidebar container (`w-14 shrink-0`) uses `overflow-y-auto` to handle 20+ steps (NFR-03). Add `tabIndex={0}` on the sidebar nav so keyboard users can scroll it.
- The vertical list of steps with connectors will naturally scroll; no maximum height is set because the sidebar fills the remaining viewport height via `flex` column layout.

### "Next" Button on Last Step

- When `activeIdx === stepperItems.length - 1`, the Next button label changes to "Finish Lesson".
- Clicking "Finish Lesson" on the last step calls `onToggleCompletion` if not already complete, then navigates to the next lesson in the unit (via `Link` or `useNavigate`). This matches the existing `AssignmentSection` `onNext` callback behavior. The footer button calls the same `onNext` already wired in `AssignmentSection`.

  Implementation note: The footer's Next/Prev buttons duplicate the `onPrev`/`onNext` callbacks that are already passed to `AssignmentSection`. In the new layout, the footer owns these navigation controls and `AssignmentSection` no longer needs to render its own Prev/Next buttons — this is a simplification, but only if `AssignmentSection` currently renders its own navigation. Verify at implementation time whether `AssignmentSection` renders Prev/Next internally; if it does, coordinate to avoid duplicate navigation controls.

### Mobile Progress Bar with 0 Steps

- If `items` is empty (no assignments in the lesson), the mobile progress bar renders `0/0` and an empty segment row. Add a guard: if `items.length === 0`, return `null` from the mobile branch.

### `practice` Exclusion — Desktop vs Mobile

- `practice` is excluded **only from the mobile tab bar**. The desktop `StudentToolsBar` (right vertical strip) continues to show `practice` if it is in `availableTools`. The filtering happens at the call site in `LessonDetailPage`:
  ```ts
  const mobileAvailableTools = availableTools.filter(t => t !== 'practice');
  ```
  The desktop call passes the unfiltered `availableTools`.

### Transition Conflicts

- `transition-[width]` (or `transition-all`) on `UnitLessonSidebar` can conflict with content re-layout. Ensure the `min-w-0` on sibling flex panels prevents overflow during the transition. The `overflow-hidden` on the collapsed sidebar prevents content from being visible during the animation.

---

## Task List

### T-01: Add `getStepLabel()` to AssignmentStepper and refactor desktop to vertical layout

**Files to modify:** `client/src/features/lessons/AssignmentStepper.tsx`

**Description:**
1. Add the exported pure function `getStepLabel(item: StepperItem): string` implementing the label mapping table from the wireframe (Plan, Read, Video, Lecture, Cards, Practice, Vocab, Quiz, Link).
2. Replace the `hidden lg:flex items-start` horizontal desktop layout with a `hidden lg:flex flex-col` vertical layout inside a `<nav aria-label="Lesson steps">` element.
3. Desktop step rendering: each step is a vertically stacked group of `[connector] [circle button] [label]`. Circle is `w-8 h-8 rounded-full`. Label is `text-[10px]` centered below the circle. Connector is `w-px h-4 mx-auto` between steps (absent before the first step).
4. Apply step state classes per the wireframe state table: active (`bg-green-primary text-white`), completed (`bg-green-primary text-white` with `CheckCircle2`), future (`border border-border bg-background text-text-secondary`), locked (`opacity-50 cursor-not-allowed`).
5. Connector color: `bg-green-primary` when the step above (index `idx - 1`) is completed; otherwise `bg-border-subtle`.
6. "Add" button (teacher only): dashed border circle at the bottom of the list, `Plus` icon, `aria-label="Add assignment"`, label "Add" below.
7. Add `aria-label="{label}: {item.title}"` to each step button. Add `title` with the locked message for locked quiz. Add `aria-current="step"` when active.
8. Add `focus-visible:ring-2 focus-visible:ring-green-primary focus-visible:ring-offset-2 focus-visible:outline-none` to each step button.
9. The component no longer has `sticky top-0 z-10` — it is a panel, not a sticky bar. Remove that outer wrapper.

**Acceptance criteria:**
- Desktop renders a `w-14` vertical list of step circles with single-word labels and connector lines.
- `getStepLabel()` is exported and returns the correct label for every `StepperItem` kind/type combination in the wireframe table.
- Active, completed, future, and locked states all render with the correct visual classes.
- Each step button has `aria-label`, `aria-current`, and a visible focus ring.
- The "Add" button appears only when `onAdd` is defined.
- The existing mobile layout continues to function (no changes yet; addressed in T-02).

---

### T-02: Replace AssignmentStepper mobile layout with compact progress bar

**Files to modify:** `client/src/features/lessons/AssignmentStepper.tsx`

**Description:**
1. Replace the `lg:hidden` horizontal icon scroll row with a compact progress bar row.
2. Layout: `px-4 py-2 border-b border-border-subtle bg-surface flex items-center gap-2`.
3. Left: step counter `{activeIndex + 1}/{items.length}` — `text-xs text-text-secondary font-medium shrink-0`.
4. Center: segment pills row — `flex gap-0.5 flex-1 min-w-0`. Each pill: `h-1.5 rounded-full flex-1`. Color: completed or active → `bg-green-primary`; future → `bg-border-subtle`. The pills are `aria-hidden`.
5. Right: current step icon from `getStepIcon(activeItem)` — `w-4 h-4 text-text-secondary shrink-0`. Aria-hidden; the screen-reader announcement comes from `aria-live` on the main content area.
6. Retain the "Add" button for teachers (`onAdd`): render after the right icon as a small circle with `Plus`, `aria-label="Add assignment"`.
7. Guard: if `items.length === 0`, return `null` from the mobile branch.

**Acceptance criteria:**
- Mobile renders a single-row progress bar with segment pills, step counter, and current step icon.
- Segment colors reflect completion state (green for done/active, muted for future).
- Teacher "Add" button is present when `onAdd` is defined.
- Previous horizontal icon row is removed.

---

### T-03: Add sidebar collapse/expand to UnitLessonSidebar (desktop)

**Files to modify:** `client/src/features/lessons/UnitLessonSidebar.tsx`

**Description:**
1. Add `collapsed?: boolean` to `UnitLessonSidebarProps`.
2. On the desktop `<nav>`: change the fixed `lg:w-56` to a dynamic width:
   - `collapsed` → `w-0 overflow-hidden`
   - expanded → `w-44`
3. Add CSS transition: `transition-all duration-200 ease-in-out` on the nav element.
4. Add `aria-hidden={collapsed}` on the `<nav>` when collapsed.
5. Add `id="unit-lesson-sidebar"` to the `<nav>` so the breadcrumb toggle button can reference it via `aria-controls`.
6. When `collapsed`, ensure content is unreachable by keyboard: set `tabIndex={-1}` on the nav (links/buttons inside will be unreachable because `overflow-hidden` + `w-0` removes them from layout, but `aria-hidden` covers screen readers).
7. The toggle button itself is NOT in this component — it lives in the breadcrumb bar in `LessonDetailPage` (see T-05). This task only handles the visual collapse response.

**Acceptance criteria:**
- Sidebar animates smoothly to `w-0` when `collapsed === true` and back to `w-44` when false.
- `aria-hidden` and `id` attributes are correct.
- No content is keyboard-reachable when collapsed.
- No toggle button is rendered inside this component (toggle is in breadcrumb bar).

---

### T-04: Replace UnitLessonSidebar mobile dropdown with left-drawer overlay

**Files to modify:** `client/src/features/lessons/UnitLessonSidebar.tsx`

**Description:**
1. Add `mobileOpen?: boolean` and `onMobileClose?: () => void` to `UnitLessonSidebarProps`.
2. Remove the existing `lg:hidden` dropdown (the `<div>` with `mobileOpen` state and `<button>` that toggles it). The `mobileOpen` local state is removed.
3. Replace with a drawer overlay:
   - Backdrop: `fixed inset-0 z-40 bg-black/40` rendered when `mobileOpen === true`, `onClick={onMobileClose}`, `role="button"`, `aria-label="Close navigation"`.
   - Drawer: `fixed left-0 top-0 bottom-0 z-50 w-64 bg-surface shadow-warm-lg overflow-y-auto`, `role="dialog"`, `aria-modal="true"`, `aria-label="Lesson navigation"`. Transition: `transition-transform duration-200 ease-in-out`, `translate-x-0` when open, `-translate-x-full` when closed.
4. Drawer header: course title text + `X` close button (`aria-label="Close navigation"`, `onClick={onMobileClose}`).
5. Drawer body: same lesson list, unit test item, and "Add Lesson" button as the desktop sidebar (identical content).
6. On lesson link click: call `onMobileClose?.()` then `onLessonClick?.()`.
7. On unit test click: call `onMobileClose?.()` then `onUnitTestClick?.()`.
8. Focus trap: add a `useEffect` that, when `mobileOpen` becomes `true`, moves focus to the close `X` button and registers an `Escape` keydown handler that calls `onMobileClose`. Cleanup on `mobileOpen` becoming false or unmount.
9. Import `X` from `lucide-react`.

**Acceptance criteria:**
- Mobile drawer slides in from the left with a backdrop.
- Backdrop tap closes the drawer.
- Escape key closes the drawer.
- Focus moves to close button when drawer opens.
- Lesson links and unit test close the drawer before navigating/activating.
- `role="dialog"`, `aria-modal="true"`, and `aria-label` are present on the drawer.
- The old dropdown is fully removed.

---

### T-05: Restructure LessonDetailPage layout — breadcrumb bar, four-panel body, footer action bar

**Files to modify:** `client/src/features/lessons/LessonDetailPage.tsx`

**Description:**

This is the largest task. It restructures the page-level layout.

1. Add `sidebarCollapsed` state (initialized from `localStorage` with try/catch fallback to `false`).
2. Add `mobileDrawerOpen` state (`useState(false)`).
3. Add `handleToggleSidebar()`: toggles `sidebarCollapsed`, writes to `localStorage` with try/catch.
4. Add `hamburgerRef = useRef<HTMLButtonElement>(null)` for focus return after mobile drawer closes.
5. Add `handleMobileClose()`: calls `setMobileDrawerOpen(false)`, then `hamburgerRef.current?.focus()`.
6. Compute `mobileAvailableTools = availableTools.filter(t => t !== 'practice')`.

**Breadcrumb bar (replaces current `<header>`):**
```
sticky top-0 z-20 bg-surface border-b border-border-subtle px-4 py-2 flex items-center gap-3
```
- Toggle button (`lg:` only visible): `aria-label="Toggle lesson sidebar"`, `aria-expanded={!sidebarCollapsed}`, `aria-controls="unit-lesson-sidebar"`, icon `PanelLeft` from lucide-react, `onClick={handleToggleSidebar}`.
- Breadcrumb `<nav aria-label="Breadcrumb">` with `<ol>` containing course link, unit name (text), lesson title (`aria-current="page"`), separators.
- Step counter `ml-auto lg:block hidden`: `Step {activeIdx + 1} of {stepperItems.length}` — `text-xs text-text-secondary`.
- Settings gear: only when `canEdit`, same as before.

**Mobile header (`lg:hidden`, rendered above main panel row):**
```
lg:hidden sticky top-0 z-20 bg-surface border-b border-border-subtle px-4 py-2 flex items-center gap-3
```
- Hamburger button (ref={hamburgerRef}): `aria-label="Open lesson navigation"`, `onClick={() => setMobileDrawerOpen(true)}`, `Menu` icon.
- Lesson title: `text-base font-bold text-text-primary truncate flex-1`.
- Settings gear: only when `canEdit`.

**Four-panel body:**
```
flex flex-row flex-1 min-h-0
```
- `UnitLessonSidebar`: add `collapsed={sidebarCollapsed}` prop, `mobileOpen={mobileDrawerOpen}`, `onMobileClose={handleMobileClose}`.
- `AssignmentStepper`: rendered in the step sidebar position. Remove the `sticky top-0` concern (now a panel).
- `<main id="lesson-content" aria-live="polite" class="flex-1 min-w-0 overflow-y-auto px-4 py-6 pb-24 lg:pb-6">`: the extra bottom padding on mobile clears the fixed bottom tab bar.
- `StudentToolsBar mode="desktop"`: right panel, unchanged.

**Mobile StudentToolsBar (bottom tab bar):**
Render `<StudentToolsBar mode="mobile" availableTools={mobileAvailableTools} ...otherProps />` outside the panel row div, as a sibling, at the bottom of the outer wrapper. It uses `fixed bottom-0` internally so its render position in the tree does not matter.

**Footer action bar:**
```
sticky bottom-0 z-10 bg-surface border-t border-border-subtle px-4 py-3 flex items-center justify-between
hidden when unitTestActive
```
- Left: `<label class="flex items-center gap-2 text-sm text-text-primary">` + `<input type="checkbox" checked={isComplete} onChange={onToggleCompletion} id="mark-complete">` + "Mark complete". When loading: `disabled` + `aria-busy="true"`.
- Right: `<div class="flex gap-2">` with Prev and Next buttons using `Button` component. Last step: "Finish Lesson" label.
- Remove `onPrev`/`onNext` from the `AssignmentSection` props if that component currently renders its own navigation — verify at implementation time and coordinate. If `AssignmentSection` has its own navigation, pass `undefined` for those callbacks or suppress the footer and let `AssignmentSection` handle it. Do not duplicate navigation controls.

**Remove:** The old `<header>` block with lesson title and settings gear (replaced by breadcrumb bar).
**Remove:** The `StudentToolsBar mode="mobile"` placed above the stepper (replaced by fixed bottom tab bar).
**Remove:** `AssignmentStepper` from within the `<div class="flex flex-col flex-1">` column (it moves to the panel row as a sibling of the main content).

**Acceptance criteria:**
- Desktop shows four panels: sidebar (collapsible) | step sidebar | main content | right tool strip.
- Breadcrumb bar is sticky at the top with correct links, step counter, and sidebar toggle.
- Mobile shows mobile header + main content + fixed bottom tab bar.
- `sidebarCollapsed` is read from localStorage on mount and written on toggle.
- Mobile drawer opens/closes via hamburger and `onMobileClose`.
- Footer action bar is sticky at the bottom with checkbox and Prev/Next buttons.
- Footer is hidden when `unitTestActive === true`.
- `practice` is not in the mobile tab bar.
- No duplicate navigation controls.

---

### T-06: Update StudentToolsBar mobile rendering to fixed bottom tab bar

**Files to modify:** `client/src/features/student-notes/StudentToolsBar.tsx`

**Description:**
1. Change the mobile branch (`mode === 'mobile'` or `mode === 'both'`) from a `lg:hidden` horizontal scroll strip to a `fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border-subtle flex lg:hidden` tab bar.
2. Each tab: `<button role="tab" aria-selected={isActive} aria-label={label} class="flex flex-col items-center gap-0.5 flex-1 py-2 min-h-[44px] {active ? 'text-green-primary' : 'text-text-secondary'}">`.
3. Each tab renders `<Icon class="w-5 h-5" />` and `<span class="text-[10px]">{label}</span>`.
4. Wrap the mobile tab bar in `<nav aria-label="Student tools">`.
5. The guard `if (isQuizActive || availableTools.length === 0) return null` continues to apply to the whole component, affecting both desktop strip and mobile tab bar.
6. The desktop `<aside>` rendering is unchanged.

**Note on label mapping:** The existing `TOOL_META` labels are `'My Notes'`, `'Flash Cards'`, `'Vocabulary'`. The wireframe tab labels are `'Notes'`, `'Cards'`, `'Vocab'`. Update `TOOL_META` label strings to match the shorter tab labels, or override them in the mobile branch only. Preferred: update `TOOL_META` to use short labels (`'Notes'`, `'Cards'`, `'Practice'`, `'Vocab'`) since the full labels are only used as `aria-label` on the desktop strip, where the `title` attribute can provide the long form. Use `aria-label` with the long form on desktop buttons for accessibility.

**Acceptance criteria:**
- Mobile tab bar is `fixed bottom-0`, full width, with three tabs (Notes, Cards, Vocab) when `availableTools` contains those types.
- Each tab has `role="tab"`, `aria-selected`, `aria-label`, visible icon, and visible label text.
- Touch target is at least `44px` tall.
- Active tab uses `text-green-primary`; inactive uses `text-text-secondary`.
- Desktop vertical strip is visually unchanged.
- The previous horizontal scroll strip for mobile is removed.

---

### T-07: Wire up all changes in LessonDetailPage and verify integration

**Files to modify:** `client/src/features/lessons/LessonDetailPage.tsx`

**Description:**
Integration and cleanup pass after T-01 through T-06.

1. Confirm `sidebarCollapsed` is passed to `UnitLessonSidebar` as `collapsed`.
2. Confirm `mobileDrawerOpen` and `handleMobileClose` are passed to `UnitLessonSidebar` as `mobileOpen` and `onMobileClose`.
3. Confirm `mobileAvailableTools` (with `practice` filtered) is passed to `StudentToolsBar mode="mobile"`.
4. Confirm `AssignmentStepper` is rendered in the panel row (between sidebar and main content), not inside the `flex-col` content column.
5. Confirm the footer action bar is hidden when `unitTestActive === true`.
6. Confirm `AssignmentSection` is not rendering duplicate Prev/Next navigation controls (inspect and suppress if needed by passing `onPrev={undefined}` and `onNext={undefined}` now that the footer owns navigation).
7. Confirm `aria-live="polite"` is on the `<main>` element.
8. Confirm `hamburgerRef` is attached to the mobile hamburger button and focus returns correctly after drawer close.
9. Confirm the `contentAreaFallback` `ErrorBoundary` wraps only the main content area, not the breadcrumb or footer.

**Acceptance criteria:**
- Full page renders without console errors on desktop and mobile viewpoints.
- Sidebar collapse toggle works and persists across navigation (navigate away and back — state reads from localStorage on remount).
- Mobile drawer opens on hamburger click, closes on backdrop/Escape/X, focus returns to hamburger.
- Step sidebar selects steps; main content updates.
- Footer Prev/Next navigate between steps; "Finish Lesson" appears on the last step.
- Mobile tab bar shows Notes, Cards, Vocab only (no Practice).
- Teacher controls (gear, add assignment) are present and functional.

---

## Testing Notes

### Unit Tests

**`AssignmentStepper.tsx`** — test `getStepLabel()` exhaustively:
```
// Test file: client/src/__tests__/components/AssignmentStepper.test.tsx
// For each (kind, resourceType, toolType, assignmentType) combination in the wireframe table,
// assert getStepLabel returns the expected single-word string.
// Use a data-driven approach (array of [input, expected] pairs).
```

**`UnitLessonSidebar.tsx`** — test mobile drawer:
- Renders drawer when `mobileOpen === true`.
- Does not render drawer (or renders off-screen) when `mobileOpen === false`.
- Calls `onMobileClose` when backdrop is clicked.
- Calls `onMobileClose` when the X button is clicked.
- Calls `onMobileClose` when Escape is pressed.

**`UnitLessonSidebar.tsx`** — test desktop collapse:
- Applies `w-0 overflow-hidden` classes when `collapsed === true`.
- Applies `w-44` when `collapsed === false`.
- `aria-hidden` attribute is correct per collapsed state.

**`StudentToolsBar.tsx`** — test mobile tab bar:
- Renders `role="tab"` buttons for each tool in `availableTools`.
- Renders `null` when `isQuizActive === true`.
- Renders `null` when `availableTools` is empty.
- Active tab has `aria-selected="true"`.

### Integration / Smoke Tests

Manual smoke test checklist (no automated E2E tests are in scope for this task):

- [ ] Desktop: navigate to a lesson with resources, tools, and a quiz. Verify four-panel layout renders.
- [ ] Desktop: click each step in the vertical step sidebar. Verify active step highlights and content area updates.
- [ ] Desktop: toggle sidebar collapsed. Verify smooth animation, step sidebar expands to fill space, state persists after page reload.
- [ ] Desktop: teacher — click "Add assignment" (+ button at bottom of step sidebar). Verify modal opens.
- [ ] Desktop: teacher — gear icon visible; opens lesson settings.
- [ ] Mobile: verify compact progress bar renders with segment pills and step counter.
- [ ] Mobile: tap hamburger. Verify drawer slides in. Tap backdrop. Verify drawer closes.
- [ ] Mobile: tap a lesson in the drawer. Verify navigation and drawer closes.
- [ ] Mobile: verify bottom tab bar shows Notes, Cards, Vocab only (no Practice tab).
- [ ] Mobile: verify tab bar is not shown when the quiz step is active.
- [ ] Keyboard: tab through all interactive elements on the desktop layout. Verify focus ring on step circles, sidebar toggle button, footer checkbox, and navigation buttons.
- [ ] Screen reader (NVDA/VoiceOver): step changes are announced via `aria-live="polite"` on `<main>`.
