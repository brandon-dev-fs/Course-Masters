---
id: cm-0026
title: Redesign Course Detail Page with Vertical Roadmap Layout
stage: design
status: approved
approver: human
approved_at: 2026-05-27T00:00:00Z
---

# Frontend Plan: Redesign Course Detail Page with Vertical Roadmap Layout

## 1. Overview

This plan replaces the current `CourseHero` + horizontal `UnitCardStrip` layout on `/courses/:courseId` with a two-column desktop layout: a compact `CourseHeader` on top, a vertical `UnitRoadmap` timeline as the main column, and a `CourseProgressSidebar` on the right. On mobile, the sidebar is hidden and a `MobileProgressBar` strip is shown above the roadmap.

Acceptance criteria covered:
- FR-01 through FR-27 (all from spec)
- NFR-01 through NFR-06 (performance, contrast, keyboard accessibility, responsive, token-only styling, semantic HTML)

All data comes from the three existing parallel fetches already in `CourseDetailPage`. No new API calls are introduced.

---

## 2. Folder Structure

New files to create (all relative to repo root):

```
client/src/features/courses/CourseHeader.tsx
client/src/features/courses/UnitRoadmap.tsx
client/src/features/courses/RoadmapUnitCard.tsx
client/src/features/courses/CourseProgressSidebar.tsx
client/src/features/courses/MobileProgressBar.tsx
```

Files to modify:

```
client/src/features/courses/CourseDetailPage.tsx   — restructure layout
client/src/features/progress/ProgressBar.tsx        — add ARIA progressbar attributes
```

Files to retire (remove imports; files may be deleted or left as dead code pending cleanup):

```
client/src/features/courses/CourseHero.tsx          — replaced by CourseHeader
client/src/features/units/UnitCardStrip.tsx         — replaced by UnitRoadmap
client/src/features/units/UnitCard.tsx              — replaced by RoadmapUnitCard
```

No new directories are required. All new components live in `client/src/features/courses/`, consistent with the existing feature structure.

---

## 3. Component Tree

### CourseDetailPage (modified — page)

**File:** `client/src/features/courses/CourseDetailPage.tsx`

**Responsibilities:** Orchestrates the three parallel fetches, manages all `useDisclosure` instances, manages `course`/`courses`/`progress` state, exposes handler functions (update, delete, add/update/delete unit), and composes the two-column layout. No business logic for unit state determination lives here.

**Layout structure (post-refactor):**

```
<div>                                    ← page root
  <CourseHeader />
  <div class="flex gap-6 mt-6 items-start">
    <main class="flex-1 min-w-0">
      <MobileProgressBar />              ← block md:hidden
      <UnitRoadmap />
    </main>
    <aside class="w-[260px] shrink-0 hidden md:block sticky top-[72px]">
      <CourseProgressSidebar />
    </aside>
  </div>
  {/* All five modals — unchanged */}
</div>
```

**Props:** none (page component, reads `useParams`)

### Tasks

- [x] **Task 1**: Refactor `CourseDetailPage.tsx` layout structure — replace `CourseHero` import with `CourseHeader`, replace `UnitCardStrip` import with `UnitRoadmap`, add `MobileProgressBar` and `CourseProgressSidebar` imports. Replace current JSX body with the two-column `container mx-auto px-4 md:px-6 py-6` layout (see Section 9 pseudocode). Wire all disclosure handlers and `onAddUnit` callback into new component props. The five modal blocks remain unchanged.
- [x] **Task 2**: Remove the `<h2>Units</h2>` section header and the inline "View Syllabus / + Add Syllabus / + Add Unit" button row from `CourseDetailPage` (these relocate to `CourseProgressSidebar`).

---

### CourseHeader (new — UI component)

**File:** `client/src/features/courses/CourseHeader.tsx`

**Props interface:**

```typescript
interface CourseHeaderProps {
  course: Course;
  courses: Course[];
  canEdit: boolean;
  onOpenSettings: () => void;
  onOpenCalendar: () => void;
}
```

**Responsibilities:** Renders the compact header row — category-matched icon (40px), `CourseDropdown` for title, `course.description` (line-clamp-2), teacher name meta row (unit count, lesson count), and calendar/gear icon buttons top-right. Does not render a CTA button (FR-03).

**Notes:**
- Icon is derived from `getCourseCategory(course.title)` via `getCourseCategory` and `CATEGORY_ICON` imported from `CourseFilters.tsx` (same pattern as `CourseCard`).
- Icon tint: `text-green-primary` on `bg-green-surface` background (40px, `rounded-lg p-2`).
- Lesson count is `course.units?.reduce((sum, u) => sum + (u.lessons?.length ?? 0), 0) ?? 0`.
- Estimated time is omitted (no time data in the API response) or replaced with lesson count only.
- `CourseDropdown` receives `courses`, `currentCourseId={course.id}`, `courseTitle={course.title}`.

**Styling root:** `bg-surface border border-border-subtle rounded-xl p-4 shadow-warm-sm relative`

### Tasks

- [x] **Task 3**: Create `CourseHeader.tsx`. Import `getCourseCategory`, `CATEGORY_ICON` from `CourseFilters.js`. Render 40px icon box, `CourseDropdown`, description with `line-clamp-2`, meta row with `User` icon + teacher name + unit/lesson counts (separated by `·`). Render `Calendar` button (`aria-label="Open course calendar"`) and gear button (`aria-label="Course settings"`, visible only when `canEdit`). Use token classes only: `bg-green-surface`, `text-green-primary`, `text-text-primary`, `text-text-secondary`, etc.

---

### UnitRoadmap (new — UI component)

**File:** `client/src/features/courses/UnitRoadmap.tsx`

**Props interface:**

```typescript
interface UnitRoadmapProps {
  courseId: string;
  units: Unit[];
  progress: CourseProgress | null;
  canEdit: boolean;
  onEditUnit: (unit: Unit) => void;
}
```

**Responsibilities:** Sorts units by `order` asc, determines each unit's state (`'completed' | 'in-progress' | 'locked'`) via the state-determination algorithm (see Section 9), renders the `<ol aria-label="Course units">` with `RoadmapUnitCard` per unit, renders the vertical connecting line, and renders the `FinalExamItem` at the bottom. Shows `<EmptyState>` when `units.length === 0`.

**Notes:**
- The vertical connecting line is a decorative `<div aria-hidden="true">` with `border-l-2 border-border-subtle`, positioned `absolute left-[11px] top-3 bottom-0` inside each `<li>` (except the last).
- `allUnitsComplete` is `progress?.completedUnits === progress?.totalUnits && (progress?.totalUnits ?? 0) > 0`.

### Tasks

- [x] **Task 4**: Create `UnitRoadmap.tsx`. Implement `computeUnitStates(units, progress)` pure helper function (see Section 9) that returns `Array<{ unit: Unit; state: UnitState }>`. Render `<ol aria-label="Course units" className="relative flex flex-col gap-0">`. For each entry, render a `<li className="relative flex gap-4">` containing a dot column and `<div className="flex-1 pb-6">` containing `RoadmapUnitCard`. Render the decorative vertical line `<div aria-hidden="true">` per item. Render `FinalExamItem` below the `<ol>`. Handle empty state with `<EmptyState icon={<Layers>} title="No units yet" .../>`.

---

### RoadmapUnitCard (new — UI component)

**File:** `client/src/features/courses/RoadmapUnitCard.tsx`

**Props interface:**

```typescript
type UnitState = 'completed' | 'in-progress' | 'locked';

interface RoadmapUnitCardProps {
  courseId: string;
  unit: Unit;
  unitProgress: CourseProgress['units'][number] | undefined;
  state: UnitState;
  canEdit: boolean;
  onEditUnit: () => void;
}
```

**Responsibilities:** Renders a single unit card with visual state-appropriate styling (green/blue/dimmed), lesson list (links for completed/in-progress, `<span>` for locked), tool counts row (flash card count + practice problem count), unit test status row, "Up next" badge on the first incomplete lesson, and "Continue lesson" CTA button for the in-progress state.

**Notes:**
- Locked wrapper: `<li>` gets `aria-disabled="true"`; `pointer-events-none opacity-60` is applied to the card wrapper `<div>`, not the `<li>` itself, so that `aria-disabled` is discoverable on the semantic element.
- Flash card and practice problem counts: `unit.lessons?.reduce()` over each lesson's tools (see Section 10 for derivation logic).
- "Continue lesson" button links to the first lesson in `unitProgress.lessons` where `quizPassed === false` (or all lessons if none have progress). The URL is `/courses/:courseId/units/:unitId/lessons/:lessonId`.
- "Up next" badge: orange surface tokens — `bg-orange-surface text-orange-surface-text`.
- Unit title `<h3>` for locked units appends `<span className="sr-only">(locked)</span>`.
- Lesson list: `<ul>` with `<li>` per lesson. Completed/in-progress lessons render `<Link>` with hover: `hover:text-green-primary`. Locked lessons render `<span className="text-sm text-text-secondary">`.
- Tool counts row uses `CreditCard` and `FileText` lucide icons (or `BookOpen` for flash cards) — confirm icon choice matches existing usage.
- "Unit test passed" row: `<ClipboardCheck>` icon from lucide-react (same as current `UnitCard`).
- Locked unit test row: text "Complete all lessons to unlock the unit test" (FR-18), `text-xs text-text-secondary italic`.
- canEdit: renders an edit icon button (`<Pencil w-3.5 h-3.5>`) in the card header row.

**Styling by state:**
- Completed: `bg-surface border border-border-subtle rounded-xl p-4 shadow-warm-sm`
- In-progress: `bg-surface border-2 border-blue-accent rounded-xl p-4 shadow-warm-md`
- Locked: `bg-surface border border-border-subtle rounded-xl p-4` (opacity handled by parent wrapper)

### Tasks

- [x] **Task 5**: Create `RoadmapUnitCard.tsx`. Implement the three card visual states using a `state` prop discriminator. Render `<h3>` unit title with state badge inline. Render lesson `<ul>` — use `<Link>` for `completed`/`in-progress` states, `<span>` for `locked`. Add "Up next" badge (`bg-orange-surface text-orange-surface-text`) on the first lesson where `quizPassed === false` in the in-progress card. Render tool counts row (flash card count + practice problem count derived from `unit.lessons`). Render unit test row with correct text per state.
- [x] **Task 6**: Add "Continue lesson" `<Button variant="primary" size="sm">` to the in-progress card only. Compute `continueLessonUrl` from the first lesson in `unitProgress.lessons` where `quizPassed === false` (or fallback to first lesson). Wire as a `<Link>` wrapping the `Button` (or use `useNavigate`). Apply `w-full` on mobile via responsive class.
- [x] **Task 7**: Add `canEdit` edit icon button to card header (pencil icon, calls `onEditUnit()`). Use `aria-label="Edit unit"`. Style: `p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors`.

---

### CourseProgressSidebar (new — UI component)

**File:** `client/src/features/courses/CourseProgressSidebar.tsx`

**Props interface:**

```typescript
interface CourseProgressSidebarProps {
  progress: CourseProgress | null;
  course: Course;
  canEdit: boolean;
  onOpenSyllabus: () => void;
  onOpenCalendar: () => void;
  onReviewFlashCards: () => void;
  onAddUnit: () => void;
}
```

**Responsibilities:** Renders the `<aside aria-label="Course progress">` containing two stacked cards: (1) Course Progress card with percentage, progress bar, and breakdown stats; (2) Quick Actions card with flash cards, syllabus, and calendar links. Also renders the "+ Add Unit" button below the cards (teacher/admin only, FR-25). Renders the "View Syllabus / + Add Syllabus" button as part of Quick Actions.

**Notes:**
- Progress card: large percentage number (`text-3xl font-bold text-text-primary`), `<ProgressBar>` with `aria-*` props, then a `<dl>` with `<dt>`/`<dd>` pairs for lessons completed, unit tests completed.
- Flash card count in sidebar is derived from `progress` data or omitted if unavailable — show `completedLessons`/`totalLessons` and unit test count from `CourseProgress` fields.
- Quick Actions card: `<nav aria-label="Quick actions"><ul>` with `<li>` per action. "Review flash cards" = `<button>` calling `onReviewFlashCards`. "View syllabus" = `<button>` calling `onOpenSyllabus`. "Calendar" = `<button>` calling `onOpenCalendar`.
- Each action row: `flex items-center gap-2 text-sm text-text-primary hover:text-blue-accent transition-colors w-full` + right-arrow `ChevronRight` icon.
- `<ProgressBar>` must receive `role`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` props once ProgressBar is updated (Task 8).
- "+ Add Unit" button: `<Button size="sm" variant="secondary">` below the cards, `w-full`, visible only when `canEdit`.

### Tasks

- [x] **Task 9**: Create `CourseProgressSidebar.tsx`. Render `<aside aria-label="Course progress" className="flex flex-col gap-4">`. Progress card: large `{progress?.percentComplete ?? 0}%` text, `<ProgressBar>` with ARIA props, `<dl>` stats for lessons and unit tests. Quick Actions card: `<nav aria-label="Quick actions">` with three `<button>` action rows. Below cards, render `+ Add Unit` button when `canEdit`. Use `shadow-warm-sm`, `bg-surface`, `border-border-subtle`, `rounded-xl`.

---

### MobileProgressBar (new — UI component)

**File:** `client/src/features/courses/MobileProgressBar.tsx`

**Props interface:**

```typescript
interface MobileProgressBarProps {
  progress: CourseProgress | null;
  onOpenSyllabus: () => void;
  onReviewFlashCards: () => void;
}
```

**Responsibilities:** Renders a compact progress strip for mobile viewports (`block md:hidden`). Shows the completion percentage, a slim `<ProgressBar>`, and two pill buttons: "Flash cards" and "Syllabus".

**Notes:**
- Root: `role="region" aria-label="Course progress summary" className="flex flex-col gap-2 p-3 bg-surface border border-border-subtle rounded-xl md:hidden mb-4"`
- Percentage: `text-sm font-bold text-text-primary w-10 shrink-0`
- Progress row: `flex items-center gap-3` — percentage + `<ProgressBar className="flex-1">`
- Action row: `flex items-center gap-2` — pill buttons min-height 44px (WCAG touch target)
- Pill button class: `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-surface-raised text-text-primary border border-border-subtle hover:border-blue-accent hover:text-blue-accent transition-colors min-h-[44px]`

### Tasks

- [x] **Task 10**: Create `MobileProgressBar.tsx`. Render the `role="region"` wrapper. Progress row with percentage and `<ProgressBar>` using ARIA props. Two pill `<button>` elements for flash cards (icon + "Flash cards" label) and syllabus (icon + "Syllabus" label). Ensure minimum 44px touch targets.

---

### ProgressBar (modified — shared component)

**File:** `client/src/features/progress/ProgressBar.tsx`

**Responsibilities (addition):** Accept and forward `role`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label` props on the outer `<div>` so callers in `CourseProgressSidebar` and `MobileProgressBar` can satisfy NFR-06 without wrapping.

### Tasks

- [x] **Task 8**: Extend `ProgressBar` props interface to accept optional `role?: string`, `aria-valuenow?: number`, `aria-valuemin?: number`, `aria-valuemax?: number`, `aria-label?: string`. Forward these to the outer `<div>`. This is backward-compatible — existing callers without these props are unaffected.

---

## 4. Client Routes

No new routes. The existing route `/courses/:courseId` → `CourseDetailPage` is unchanged. The `RequireAuth` wrapper on this route remains in place (no auth changes needed).

### Tasks

No tasks for this section.

---

## 5. Hooks and Data Fetching

No new hooks. The page continues to use the existing `useFetch<CoursePageData>` call in `CourseDetailPage` that runs three parallel fetches:

1. `coursesApi.getOne(courseId!)` → `GET /courses/:courseId`
2. `coursesApi.getAll()` → `GET /courses`
3. `progressApi.getCourse(courseId!)` → `GET /courses/:courseId/progress`

These are already deduped into a single `Promise.all` and stored in `course`, `courses`, `progress` state. No change to fetch timing or strategy.

The "Review flash cards" quick action computes the navigation target imperatively from `course.units` at click time — no additional hook needed (see Section 9 pseudocode).

### Tasks

No tasks for this section.

---

## 6. API Integration

This feature makes no new API calls. All data is derived from the existing three endpoints.

**Flash card / practice problem counts derivation:** `unit.lessons` is already present on the `Unit` type (optional `lessons?: Lesson[]`). However, `Lesson` in `src/api/types.ts` does not currently include a `tools` array — the `GET /courses/:courseId` response shape must be verified during implementation.

**Decision:** If `GET /courses/:courseId` does not return tool data at the lesson level, flash card and practice problem counts will show `0` or be omitted from the card (with a `// TODO: tool counts require lesson-level tool data` comment). This is explicitly noted in the spec as a data derivation concern, not an API change (spec lines 131-133). The plan does not introduce a new API call. The implementation may simplify the counts display to show only lesson counts if tool data is unavailable.

**Existing endpoint mapping (unchanged):**

| UI Action | Method + Path | Request | Response |
|---|---|---|---|
| Page load | GET `/courses/:courseId` | — | `{ data: Course }` (with units+lessons) |
| Page load | GET `/courses` | — | `{ data: Course[] }` |
| Page load | GET `/courses/:courseId/progress` | — | `{ data: CourseProgress }` |
| Update course | PUT `/courses/:courseId` | `{ title, description?, syllabus? }` | `{ data: Course }` |
| Delete course | DELETE `/courses/:courseId` | — | 204 |
| Add unit | POST `/courses/:courseId/units` | `{ title, order }` | `{ data: Unit }` |
| Update unit | PUT `/courses/:courseId/units/:unitId` | `{ title, order }` | `{ data: Unit }` |
| Delete unit | DELETE `/courses/:courseId/units/:unitId` | — | 204 |

### Tasks

- [x] **Task 11**: Verify that `coursesApi.getOne()` response includes `units[].lessons[]` by inspecting `client/src/api/courses.ts`. If tool counts are not available, update `RoadmapUnitCard` to omit the counts row or show `0` with a code comment.

---

## 7. State Management

All state lives in `CourseDetailPage` (page-level `useState`), consistent with the existing pattern.

**State kept in `CourseDetailPage`:**
- `course: Course | null` — synced from `useFetch` result
- `courses: Course[]` — synced from `useFetch` result
- `progress: CourseProgress | null` — synced from `useFetch` result
- Five `useDisclosure` instances: `settingsDisclosure`, `syllabusViewDisclosure`, `syllabusEditDisclosure`, `unitSettingsDisclosure`, `calendarDisclosure`
- `editingUnit: Unit | null` — needed so `UnitSettingsModal` knows which unit to edit (new local state added)

**State added to `CourseDetailPage`:**
- `editingUnit: Unit | null` — set when user clicks the edit icon on a `RoadmapUnitCard`; cleared on modal close.

**Derived state (never stored, always computed inline):**
- Unit states (`'completed' | 'in-progress' | 'locked'`) — computed in `UnitRoadmap` via `computeUnitStates()` pure function
- Flash card and practice problem counts — computed in `RoadmapUnitCard` via inline reduce over `unit.lessons`
- `allUnitsComplete` — computed in `UnitRoadmap` from `progress`
- Lesson count total — computed inline in `CourseHeader`
- "Continue lesson" URL — computed inline in `RoadmapUnitCard`

**Props threading:** `onEditUnit` is threaded from `CourseDetailPage` → `UnitRoadmap` → `RoadmapUnitCard` (2 levels — within the allowed maximum per the no-prop-drilling-past-2-levels rule).

### Tasks

- [x] **Task 12**: Add `editingUnit: Unit | null` state and `handleEditUnit(unit: Unit)` handler to `CourseDetailPage`. Update `UnitSettingsModal` invocation to use `editingUnit` as the target when `unitSettingsDisclosure.isOpen && editingUnit !== null` (edit mode) versus `unitSettingsDisclosure.isOpen && editingUnit === null` (add mode / `initialAdding`).

---

## 8. Authentication and Authorization

No changes to auth setup.

- The route `/courses/:courseId` is wrapped in `RequireAuth` in `App.tsx` — unchanged.
- `useCanEdit()` hook is already called in `CourseDetailPage` and the `canEdit` boolean is passed down to `CourseHeader` (gear icon), `UnitRoadmap` → `RoadmapUnitCard` (edit icon), and `CourseProgressSidebar` ("+ Add Unit" button).
- The `useAuth()` pattern and `isLoading` guard in `CourseDetailPage` are unchanged.
- `ExamCard` internal edit controls (teacher create/edit exam) remain inside `ExamCard` — the `FinalExamItem` inside `UnitRoadmap` handles only the locked/unlocked student view; teacher exam editing is delegated to `ExamCard` which is reused as-is.

### Tasks

No new tasks. Auth wiring is handled in Task 1 (CourseDetailPage refactor).

---

## 9. Pseudocode for Complex Logic

### Unit State Determination (`computeUnitStates`)

```typescript
type UnitState = 'completed' | 'in-progress' | 'locked';
interface UnitWithState { unit: Unit; state: UnitState; }

function computeUnitStates(
  units: Unit[],
  progress: CourseProgress | null,
): UnitWithState[] {
  const sorted = [...units].sort((a, b) => a.order - b.order);
  let foundInProgress = false;

  return sorted.map((unit) => {
    const unitProg = progress?.units.find((u) => u.unitId === unit.id);
    const isComplete = unitProg?.isComplete ?? false;

    if (isComplete) {
      return { unit, state: 'completed' };
    }

    if (!foundInProgress) {
      foundInProgress = true;
      return { unit, state: 'in-progress' };
    }

    return { unit, state: 'locked' };
  });
}
```

### Continue Lesson URL Computation

```typescript
function getContinueLessonUrl(
  courseId: string,
  unit: Unit,
  unitProgress: CourseProgress['units'][number] | undefined,
): string {
  const sortedLessons = [...(unit.lessons ?? [])].sort((a, b) => a.order - b.order);

  if (!unitProgress || sortedLessons.length === 0) {
    // No progress yet — go to first lesson
    const first = sortedLessons[0];
    return first
      ? `/courses/${courseId}/units/${unit.id}/lessons/${first.id}`
      : `/courses/${courseId}`;
  }

  // Find first lesson where quizPassed is false (or not attempted)
  for (const lesson of sortedLessons) {
    const lessonProg = unitProgress.lessons.find((l) => l.lessonId === lesson.id);
    if (!lessonProg?.quizPassed) {
      return `/courses/${courseId}/units/${unit.id}/lessons/${lesson.id}`;
    }
  }

  // All lessons passed — go to last lesson (unit complete edge case)
  const last = sortedLessons[sortedLessons.length - 1];
  return `/courses/${courseId}/units/${unit.id}/lessons/${last.id}`;
}
```

### "Review Flash Cards" Navigation Target

```typescript
function getFlashCardUrl(
  courseId: string,
  units: Unit[],
): string | null {
  const sorted = [...units].sort((a, b) => a.order - b.order);
  for (const unit of sorted) {
    const sortedLessons = [...(unit.lessons ?? [])].sort((a, b) => a.order - b.order);
    for (const lesson of sortedLessons) {
      // Flash card presence requires tool data; if unavailable, navigate to first lesson
      return `/courses/${courseId}/units/${unit.id}/lessons/${lesson.id}`;
    }
  }
  return null;
}
```

Note: If tool-level data is unavailable on `Lesson`, this function simply navigates to the first lesson (FR-21 spec note: "navigates to the first available lesson with flash cards" — acceptable fallback).

### CourseDetailPage Two-Column Layout (JSX pseudocode)

```tsx
return (
  <div className="bg-background min-h-screen">
    <div className="container mx-auto px-4 md:px-6 py-6">
      <CourseHeader
        course={course}
        courses={courses}
        canEdit={canEdit}
        onOpenSettings={settingsDisclosure.open}
        onOpenCalendar={calendarDisclosure.open}
      />

      <div className="flex gap-6 mt-6 items-start">
        <main className="flex-1 min-w-0">
          <MobileProgressBar
            progress={progress}
            onOpenSyllabus={/* syllabus handler */}
            onReviewFlashCards={/* flash card nav handler */}
          />
          <UnitRoadmap
            courseId={courseId!}
            units={course.units ?? []}
            progress={progress}
            canEdit={canEdit}
            onEditUnit={handleEditUnit}
          />
        </main>
        <aside className="w-[260px] shrink-0 hidden md:block sticky top-[72px]">
          <CourseProgressSidebar
            progress={progress}
            course={course}
            canEdit={canEdit}
            onOpenSyllabus={/* syllabus handler */}
            onOpenCalendar={calendarDisclosure.open}
            onReviewFlashCards={/* flash card nav handler */}
            onAddUnit={unitSettingsDisclosure.open}
          />
        </aside>
      </div>
    </div>

    {/* Modals unchanged */}
    {settingsDisclosure.isOpen && <CourseSettingsModal ... />}
    {syllabusViewDisclosure.isOpen && <SyllabusViewModal ... />}
    {syllabusEditDisclosure.isOpen && <SyllabusEditModal ... />}
    {unitSettingsDisclosure.isOpen && (
      <UnitSettingsModal
        course={course}
        onClose={() => { unitSettingsDisclosure.close(); setEditingUnit(null); }}
        onAddUnit={handleAddUnit}
        onUpdateUnit={handleUpdateUnit}
        onDeleteUnit={handleDeleteUnit}
        initialAdding={editingUnit === null}
        unit={editingUnit ?? undefined}
      />
    )}
    {calendarDisclosure.isOpen && <CalendarModal ... />}
  </div>
);
```

Note: Syllabus handler must check `course.syllabus` to decide whether to open `syllabusViewDisclosure` or `syllabusEditDisclosure`, same logic as the current page.

### Flash card and practice problem count derivation

```typescript
// Inside RoadmapUnitCard — derived from unit.lessons
const flashCardCount = useMemo(() => {
  if (!unit.lessons) return 0;
  // Requires tool data on Lesson — if tools are not included in response, returns 0
  return unit.lessons.reduce((sum, lesson) => {
    // tools is not on Lesson type currently — will be 0 until API includes it
    return sum;
  }, 0);
}, [unit.lessons]);

// If tool data is unavailable, render lesson count as proxy:
const lessonCount = unit.lessons?.length ?? unit._count?.lessons ?? 0;
```

---

## 10. Styling Notes

### Token Usage Reference

| Element | Classes |
|---|---|
| Completed dot | `w-6 h-6 rounded-full bg-green-primary flex items-center justify-center` |
| In-progress dot | `w-6 h-6 rounded-full bg-blue-accent` |
| Locked dot | `w-6 h-6 rounded-full bg-surface border-2 border-border-subtle flex items-center justify-center` |
| Completed card | `bg-surface border border-border-subtle rounded-xl p-4 shadow-warm-sm` |
| In-progress card | `bg-surface border-2 border-blue-accent rounded-xl p-4 shadow-warm-md` |
| Locked card wrapper | `opacity-60 pointer-events-none` |
| Locked card | `bg-surface border border-border-subtle rounded-xl p-4` |
| "Complete" badge | `text-xs font-medium px-2 py-0.5 rounded-full bg-green-surface text-green-surface-text` |
| "In progress" badge | `text-xs font-medium px-2 py-0.5 rounded-full bg-blue-surface text-blue-surface-text` |
| "Up next" badge | `text-xs font-medium px-1.5 py-0.5 rounded bg-orange-surface text-orange-surface-text ml-2` |
| Lesson link | `flex items-center gap-2 text-sm text-text-primary hover:text-green-primary transition-colors` |
| Lesson span (locked) | `text-sm text-text-secondary` |
| Lesson checkmark icon | `w-4 h-4 text-green-primary aria-hidden` |
| Tool counts row | `flex items-center gap-4 text-xs text-text-secondary mt-2` |
| "Unit test passed" | `text-xs text-green-surface-text font-medium` |
| "Unit test locked" | `text-xs text-text-secondary italic` |
| Timeline line | `absolute left-[11px] top-6 bottom-0 border-l-2 border-border-subtle aria-hidden` |
| CTA button | `<Button variant="primary" size="sm">` (maps to `bg-green-button text-green-button-text`) |
| Sidebar aside | `flex flex-col gap-4` |
| Progress card | `bg-surface border border-border-subtle rounded-xl p-4 shadow-warm-sm` |
| Quick actions card | `bg-surface border border-border-subtle rounded-xl p-4 shadow-warm-sm` |
| Action row | `flex items-center gap-2 text-sm text-text-primary hover:text-blue-accent transition-colors w-full py-1.5` |
| Mobile pill button | `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-surface-raised text-text-primary border border-border-subtle hover:border-blue-accent hover:text-blue-accent transition-colors min-h-[44px]` |

**Important:** Never use `dark:` Tailwind prefix. Never use raw hex colors. All theming is via CSS custom properties.

---

## 11. Edge Cases and Error Handling

### Loading state

`useFetch` loading is handled in `CourseDetailPage` before rendering. `if (loading) return <LoadingSpinner />` — unchanged. The entire two-column layout only renders after all three parallel fetches resolve.

### Error state

`if (error) return <ErrorMessage message={error} />` — unchanged. Displayed full-width.

### Empty units

`UnitRoadmap` renders `<EmptyState icon={<Layers>} title="No units yet" description={canEdit ? 'Add a unit to get started.' : 'No units have been added yet.'} />` when `units.length === 0`. The two-column layout still renders with the sidebar visible alongside the empty state (per wireframe).

### No progress data

`progress` may be `null` before the fetch completes (though loading guard prevents this). Components receive `progress: CourseProgress | null` and must guard: `progress?.percentComplete ?? 0`, `progress?.completedLessons ?? 0`, etc.

### All units complete / exam unlocked

`allUnitsComplete = progress?.completedUnits === progress?.totalUnits && (progress?.totalUnits ?? 0) > 0`. When true, the Final Exam item renders at full opacity with a link to the exam. This is rendered inside `UnitRoadmap` as the final item below the `<ol>`.

### Single unit course (no "in-progress" after completion)

If all units are `completed`, `computeUnitStates` returns all `'completed'` and there is no `'in-progress'` unit. In this case, the "Continue lesson" CTA does not appear. The Final Exam item becomes the primary CTA.

### Unit with no lessons

`RoadmapUnitCard` renders "No lessons yet" (`<p className="text-xs text-text-secondary italic">`) when `unit.lessons?.length === 0`. The tool counts row is omitted.

### Tool count unavailability

If `Lesson` does not include a `tools` array in the API response, flash card and practice problem counts render as `0` or are omitted entirely. A `// TODO` comment is left in `RoadmapUnitCard`. This is a known limitation documented in the spec.

### `editingUnit` state on unit deletion

When `handleDeleteUnit` is called, set `editingUnit` to `null` before closing the modal to avoid stale reference.

### `UnitSettingsModal` unit edit vs. add disambiguation

- `editingUnit === null && unitSettingsDisclosure.isOpen` → add mode (`initialAdding={true}`)
- `editingUnit !== null && unitSettingsDisclosure.isOpen` → edit mode (pass `unit={editingUnit}`)
The modal must be verified to accept an optional `unit` prop for edit mode — inspect `UnitSettingsModal` props during Task 12.

### Keyboard accessibility for locked cards

`pointer-events-none` on the locked card prevents mouse interaction but does not block keyboard focus on any `<a>` or `<button>` rendered inside. Locked unit cards must not render any `<Link>` or `<button>` elements — all interactive elements are replaced with `<span>` and `<div>` elements. `aria-disabled="true"` is set on the `<li>` element.

### Focus ring consistency

All interactive elements (lesson links, icon buttons, pill buttons, CTA button) must show `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-accent` on keyboard focus. The existing `Button` component handles its own focus ring. Custom `<button>` elements in `CourseHeader`, `CourseProgressSidebar`, and `MobileProgressBar` must add explicit `focus-visible` classes.

### `CourseDropdown` token mismatch

`CourseDropdown` currently uses `text-foreground`, `text-primary`, `bg-surface`, `border-border` tokens (older aliases). These resolve to the named tokens via the alias table in `design.md` and do not need to be changed.

---

## Implementation Order

The tasks above should be executed in this sequence to respect dependencies:

1. **Task 8** — Extend `ProgressBar` (no dependencies; needed by Tasks 9 and 10)
2. **Task 3** — Create `CourseHeader` (no dependencies on new components)
3. **Task 4** — Create `UnitRoadmap` skeleton (depends on `RoadmapUnitCard` interface)
4. **Task 5** — Create `RoadmapUnitCard` base (lesson list, state styling, locked accessibility)
5. **Task 6** — Add "Continue lesson" CTA to `RoadmapUnitCard` (depends on Task 5)
6. **Task 7** — Add edit button to `RoadmapUnitCard` (depends on Task 5)
7. **Task 9** — Create `CourseProgressSidebar` (depends on Task 8)
8. **Task 10** — Create `MobileProgressBar` (depends on Task 8)
9. **Task 11** — Verify tool count data availability (inform Tasks 5/6 if needed)
10. **Task 12** — Add `editingUnit` state to `CourseDetailPage`
11. **Task 1** — Refactor `CourseDetailPage` layout (depends on all new components)
12. **Task 2** — Remove old header/button section from `CourseDetailPage` (depends on Task 1)
