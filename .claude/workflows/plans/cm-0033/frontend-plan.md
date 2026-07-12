---
id: cm-0033
title: Course Builder — Frontend Plan
stage: design
status: approved
---

# Course Builder — Frontend Plan

## 1. Overview

The Course Builder is a single-page outline editor at `/courses/:courseId/builder` that lets teachers and admins view and manage an entire course hierarchy (units, lessons, activities) without navigating between pages. The frontend implements:

- A collapsible tree view with three nesting levels: units > lessons > activities (AC: FR-05 through FR-12)
- Inline creation of units, lessons, and activities via add buttons (AC: FR-13 through FR-15)
- Drag-and-drop reordering on desktop, move up/down on mobile (AC: FR-16 through FR-18)
- Inline rename and delete via context menus (AC: FR-19 through FR-21)
- Role-based routing: teachers/admins go to builder, students go to course detail (AC: FR-02, FR-03)
- Right sidebar with course metadata and placeholder quick actions (AC: FR-23, FR-24)
- Top bar with breadcrumb, preview button, and mobile overflow (AC: FR-25)

---

## 2. Folder Structure

New files and directories to create:

```
client/src/
├── api/
│   └── builder.ts                          # NEW — builder API module
├── features/
│   └── builder/                            # NEW — entire directory
│       ├── CourseBuilderPage.tsx            # Page component
│       ├── BuilderTopBar.tsx                # Breadcrumb + preview + overflow
│       ├── OutlineTree.tsx                  # Tree container
│       ├── UnitRow.tsx                      # Unit-level row
│       ├── LessonRow.tsx                    # Lesson-level row
│       ├── ActivityRow.tsx                  # Activity-level row
│       ├── AssessmentRow.tsx                # Auto-created assessment row
│       ├── ActivityTypePill.tsx             # Colored badge for activity types
│       ├── BuilderSidebar.tsx               # Course metadata + quick actions
│       ├── InlineRenameInput.tsx            # Inline text input for renaming
│       ├── AddItemButton.tsx                # Dashed-border creation button
│       ├── ActivityTypeMenu.tsx             # Popover for activity type selection
│       ├── DropdownMenu.tsx                 # Positioned context menu
│       ├── ScreenReaderAnnouncer.tsx        # aria-live region for announcements
│       └── hooks/
│           ├── useBuilderOutline.ts         # Outline fetch + tree state + CRUD
│           ├── useContextMenu.ts            # Open/close + positioning for dropdowns
│           └── useDragReorder.ts            # @dnd-kit wrapper with optimistic reorder
```

Modified files:

```
client/src/
├── App.tsx                                 # Add /courses/:courseId/builder route
├── api/types.ts                            # Add builder outline types
├── features/courses/CourseCard.tsx          # Role-based navigation target
└── index.css                               # Add purple surface tokens
```

---

## 3. Component Tree

### CourseBuilderPage (page)

- **File:** `client/src/features/builder/CourseBuilderPage.tsx`
- **Props:** None (reads `courseId` from `useParams`)
- **Responsibilities:** Top-level page. Fetches outline via `useBuilderOutline`, manages expand/collapse sets, rename target, announcement text. Renders `BuilderTopBar`, course title section, `OutlineTree`, and `BuilderSidebar`.

### BuilderTopBar (UI)

- **File:** `client/src/features/builder/BuilderTopBar.tsx`
- **Props:**
  ```ts
  interface BuilderTopBarProps {
    courseTitle: string;
    courseId: string;
    sidebarContent: React.ReactNode; // rendered in mobile overflow
  }
  ```
- **Responsibilities:** Breadcrumb navigation, "Builder" badge, "Preview as student" button, mobile overflow menu (below `lg:`).

### OutlineTree (layout)

- **File:** `client/src/features/builder/OutlineTree.tsx`
- **Props:**
  ```ts
  interface OutlineTreeProps {
    units: BuilderUnit[];
    courseAssessment: BuilderAssessment | null;
    courseId: string;
    expandedUnits: Set<string>;
    expandedLessons: Set<string>;
    renamingId: string | null;
    onToggleUnit: (unitId: string) => void;
    onTogglelesson: (lessonId: string) => void;
    onRename: (id: string, type: 'unit' | 'lesson' | 'course', newTitle: string) => Promise<void>;
    onStartRename: (id: string) => void;
    onCancelRename: () => void;
    onDeleteUnit: (unitId: string) => void;
    onDeleteLesson: (unitId: string, lessonId: string) => void;
    onDeleteActivity: (lessonId: string, assignmentId: string) => void;
    onAddUnit: () => Promise<void>;
    onAddLesson: (unitId: string) => Promise<void>;
    onAddActivity: (lessonId: string, type: AssignmentType) => Promise<void>;
    onReorderUnits: (items: ReorderItem[]) => Promise<void>;
    onReorderLessons: (unitId: string, items: ReorderItem[]) => Promise<void>;
    onReorderActivities: (lessonId: string, assignmentIds: string[]) => Promise<void>;
    onMoveUnit: (unitId: string, direction: 'up' | 'down') => void;
    onMoveLesson: (unitId: string, lessonId: string, direction: 'up' | 'down') => void;
    onMoveActivity: (lessonId: string, assignmentId: string, direction: 'up' | 'down') => void;
    announce: (message: string) => void;
  }
  ```
- **Responsibilities:** Renders the `role="tree"` container, maps units to `UnitRow` components, renders course-level `AddItemButton` and course exam `AssessmentRow`. Wraps units in a `DndContext` + `SortableContext` for drag reordering.

### UnitRow (UI)

- **File:** `client/src/features/builder/UnitRow.tsx`
- **Props:**
  ```ts
  interface UnitRowProps {
    unit: BuilderUnit;
    courseId: string;
    isExpanded: boolean;
    expandedLessons: Set<string>;
    renamingId: string | null;
    isFirst: boolean;
    isLast: boolean;
    onToggle: () => void;
    onToggleLesson: (lessonId: string) => void;
    onRename: (id: string, type: 'unit' | 'lesson', newTitle: string) => Promise<void>;
    onStartRename: (id: string) => void;
    onCancelRename: () => void;
    onDelete: () => void;
    onDeleteLesson: (lessonId: string) => void;
    onDeleteActivity: (lessonId: string, assignmentId: string) => void;
    onAddLesson: () => Promise<void>;
    onAddActivity: (lessonId: string, type: AssignmentType) => Promise<void>;
    onReorderLessons: (items: ReorderItem[]) => Promise<void>;
    onReorderActivities: (lessonId: string, assignmentIds: string[]) => Promise<void>;
    onMoveUnit: (direction: 'up' | 'down') => void;
    onMoveLesson: (lessonId: string, direction: 'up' | 'down') => void;
    onMoveActivity: (lessonId: string, assignmentId: string, direction: 'up' | 'down') => void;
    announce: (message: string) => void;
  }
  ```
- **Responsibilities:** Single unit row with drag handle, expand/collapse chevron, unit name (or `InlineRenameInput`), lesson count badge, context menu. When expanded, renders nested `LessonRow` components, `AddItemButton` for lessons, and unit test `AssessmentRow`.

### LessonRow (UI)

- **File:** `client/src/features/builder/LessonRow.tsx`
- **Props:**
  ```ts
  interface LessonRowProps {
    lesson: BuilderLesson;
    unitId: string;
    courseId: string;
    isExpanded: boolean;
    renamingId: string | null;
    isFirst: boolean;
    isLast: boolean;
    onToggle: () => void;
    onRename: (id: string, type: 'lesson', newTitle: string) => Promise<void>;
    onStartRename: (id: string) => void;
    onCancelRename: () => void;
    onDelete: () => void;
    onDeleteActivity: (assignmentId: string) => void;
    onAddActivity: (type: AssignmentType) => Promise<void>;
    onReorderActivities: (assignmentIds: string[]) => Promise<void>;
    onMoveLesson: (direction: 'up' | 'down') => void;
    onMoveActivity: (assignmentId: string, direction: 'up' | 'down') => void;
    announce: (message: string) => void;
  }
  ```
- **Responsibilities:** Single lesson row with drag handle, expand/collapse chevron, lesson name, activity count badge, context menu. When expanded, renders `ActivityRow` components for each assignment, `AddItemButton` for activities, and lesson quiz `AssessmentRow`.

### ActivityRow (UI)

- **File:** `client/src/features/builder/ActivityRow.tsx`
- **Props:**
  ```ts
  interface ActivityRowProps {
    activity: BuilderActivity;
    lessonId: string;
    courseId: string;
    isFirst: boolean;
    isLast: boolean;
    onDelete: () => void;
    onMoveActivity: (direction: 'up' | 'down') => void;
  }
  ```
- **Responsibilities:** Single activity row with drag handle, `ActivityTypePill`, activity title, edit button (with "Coming soon" tooltip), context menu (delete only on desktop, delete + move on mobile).

### AssessmentRow (UI)

- **File:** `client/src/features/builder/AssessmentRow.tsx`
- **Props:**
  ```ts
  interface AssessmentRowProps {
    assessment: BuilderAssessment | null;
    label: string;          // "Lesson quiz" | "Unit test" | "Course exam"
    level: 1 | 2 | 3;      // ARIA tree level
    courseId: string;
    parentId: string;       // lessonId, unitId, or courseId
    indentClass: string;    // "ml-0" | "ml-4 md:ml-8" | "ml-8 md:ml-16"
  }
  ```
- **Responsibilities:** Dimmed row for auto-created assessments (lesson quiz, unit test, course exam). Shows "auto" badge, question count, always-visible edit button. No drag handle, no context menu, not deletable. Edit button navigates to assessment edit flow.

### ActivityTypePill (UI)

- **File:** `client/src/features/builder/ActivityTypePill.tsx`
- **Props:**
  ```ts
  interface ActivityTypePillProps {
    type: AssignmentType;
  }
  ```
- **Responsibilities:** Renders a colored badge based on activity type using the color mapping: Note = blue-surface, Video = orange-surface, Vocab = green-surface, Practice Problem = purple-surface, Reading/File = neutral.

### BuilderSidebar (UI)

- **File:** `client/src/features/builder/BuilderSidebar.tsx`
- **Props:**
  ```ts
  interface BuilderSidebarProps {
    course: BuilderCourseInfo;
    unitCount: number;
    lessonCount: number;
    activityCount: number;
    assessmentCounts: { unitTests: number; hasExam: boolean };
  }
  ```
- **Responsibilities:** Right sidebar on desktop (hidden below `lg:`). Shows course details (category, structure counts, assessment counts, enrolled students placeholder) and quick action placeholders with "Coming soon" tooltips.

### InlineRenameInput (UI)

- **File:** `client/src/features/builder/InlineRenameInput.tsx`
- **Props:**
  ```ts
  interface InlineRenameInputProps {
    initialValue: string;
    onSave: (newValue: string) => Promise<void>;
    onCancel: () => void;
    ariaLabel: string;
  }
  ```
- **Responsibilities:** Inline text input replacing a name in a row. Auto-focuses and selects all text on mount. Enter/blur saves, Escape cancels. Shows error state on save failure.

### AddItemButton (UI)

- **File:** `client/src/features/builder/AddItemButton.tsx`
- **Props:**
  ```ts
  interface AddItemButtonProps {
    label: string;           // "Add unit" | "Add lesson" | "Add activity"
    onClick: () => void;
    loading?: boolean;
    indentClass?: string;
    ariaLabel?: string;
    ariaHasPopup?: boolean;  // true for "Add activity" (opens menu)
  }
  ```
- **Responsibilities:** Dashed-border button for creating items. Shows loading state during creation.

### ActivityTypeMenu (UI)

- **File:** `client/src/features/builder/ActivityTypeMenu.tsx`
- **Props:**
  ```ts
  interface ActivityTypeMenuProps {
    onSelect: (type: AssignmentType) => Promise<void>;
    onClose: () => void;
  }
  ```
- **Responsibilities:** Positioned popover listing available activity types (Note, Video, Vocab, Practice, External Link). Each option has an icon with matching pill color. Closes on click-outside, Escape, or after selection. Shows loading on selected option during creation.

### DropdownMenu (UI)

- **File:** `client/src/features/builder/DropdownMenu.tsx`
- **Props:**
  ```ts
  interface DropdownMenuItem {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'destructive';
    disabled?: boolean;
    dividerBefore?: boolean;
  }
  interface DropdownMenuProps {
    items: DropdownMenuItem[];
    onClose: () => void;
    ariaLabel: string;
    align?: 'left' | 'right';
  }
  ```
- **Responsibilities:** Generic positioned dropdown for context menus. Renders `role="menu"` with `role="menuitem"` children. Closes on click-outside and Escape. Focus traps within menu.

### ScreenReaderAnnouncer (UI)

- **File:** `client/src/features/builder/ScreenReaderAnnouncer.tsx`
- **Props:**
  ```ts
  interface ScreenReaderAnnouncerProps {
    message: string;
  }
  ```
- **Responsibilities:** Visually hidden `aria-live="polite"` region that announces state changes (add, rename, delete, reorder) to screen readers.

---

## 4. Client Routes

### New Route

| Path | Component | Auth | Notes |
|---|---|---|---|
| `/courses/:courseId/builder` | `CourseBuilderPage` | `RequireAuth` + `RequireRole roles={['teacher', 'admin']}` | New route, registered inside the `<Layout>` route group |

### Modified Route Behavior

The `/` route is unchanged, but `CourseCard` within `CourseListPage` will change its `Link to` target based on `user.role`:
- `teacher` or `admin`: `/courses/:courseId/builder`
- `student`: `/courses/:courseId`

---

## 5. Hooks and Data Fetching

### useBuilderOutline

- **File:** `client/src/features/builder/hooks/useBuilderOutline.ts`
- **API endpoint:** `GET /api/courses/:courseId/builder/outline`
- **Returns:**
  ```ts
  interface UseBuilderOutlineResult {
    outline: BuilderOutline | null;
    loading: boolean;
    error: string;
    reload: () => void;
    setOutline: React.Dispatch<React.SetStateAction<BuilderOutline | null>>;
  }
  ```
- **Implementation:** Wraps `useFetch` to call `builderApi.getOutline(courseId)`. Exposes `setOutline` so that CRUD operations can optimistically update the tree without refetching.
- **Loading:** Shows `LoadingSpinner` centered in main area; sidebar shows skeleton placeholders.
- **Error:** Shows `ErrorMessage` with retry button calling `reload()`.

### useContextMenu

- **File:** `client/src/features/builder/hooks/useContextMenu.ts`
- **Returns:**
  ```ts
  interface UseContextMenuResult {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    triggerRef: React.RefObject<HTMLButtonElement>;
  }
  ```
- **Implementation:** Thin wrapper around `useDisclosure` plus a ref for the trigger button (for focus restoration on close). Adds click-outside and Escape handlers via `useEffect`.

### useDragReorder

- **File:** `client/src/features/builder/hooks/useDragReorder.ts`
- **Returns:**
  ```ts
  interface UseDragReorderResult<T extends { id: string; order: number }> {
    sensors: SensorDescriptor<SensorOptions>[];
    handleDragEnd: (event: DragEndEvent) => void;
  }
  ```
- **Implementation:** Configures `@dnd-kit` sensors (pointer sensor with 8px activation distance). The `handleDragEnd` callback computes new order values from the drop position, calls the provided `onReorder` callback with the new order mapping, and handles optimistic rollback via a snapshot pattern.

---

## 6. API Integration

### New API Module: `client/src/api/builder.ts`

```ts
// builder.ts — API functions for builder-specific endpoints
import { apiClient } from './client.js';
import type { BuilderOutline, ReorderItem } from './types.js';

export const builderApi = {
  getOutline: (courseId: string) =>
    apiClient.get<BuilderOutline>(`/courses/${courseId}/builder/outline`),

  reorderUnits: (courseId: string, items: ReorderItem[]) =>
    apiClient.put<void>(`/courses/${courseId}/units/reorder`, { items }),

  reorderLessons: (unitId: string, items: ReorderItem[]) =>
    apiClient.put<void>(`/units/${unitId}/lessons/reorder`, { items }),
};
```

### Existing API Modules Reused

Activity reordering uses `assignmentsApi.reorder(lessonId, { assignmentIds })` from `client/src/api/assignments.ts`.

Unit CRUD uses `unitsApi` from `client/src/api/units.ts`.

Lesson CRUD uses `lessonsApi` from `client/src/api/lessons.ts`.

Assignment CRUD uses `assignmentsApi` from `client/src/api/assignments.ts`.

Course update uses `coursesApi.update` from `client/src/api/courses.ts`.

### Action-to-Endpoint Mapping

| UI Action | Method + Path | Request Shape | Response Shape |
|---|---|---|---|
| Page load (fetch outline) | `GET /api/courses/:courseId/builder/outline` | None | `BuilderOutline` (200) |
| Reorder units | `PUT /api/courses/:courseId/units/reorder` | `{ items: ReorderItem[] }` | None (204) |
| Reorder lessons | `PUT /api/units/:unitId/lessons/reorder` | `{ items: ReorderItem[] }` | None (204) |
| Reorder activities | `PUT /api/lessons/:lessonId/assignments/reorder` | `{ assignmentIds: string[] }` | `Assignment[]` (200) |
| Add unit | `POST /api/courses/:courseId/units` | `{ title: string, order: number }` | `Unit` (201) |
| Add lesson | `POST /api/units/:unitId/lessons` | `{ title: string, description: string, order: number }` | `Lesson` (201) |
| Add activity | `POST /api/lessons/:lessonId/assignments` | `CreateAssignmentPayload` | `Assignment` (201) |
| Rename unit | `PUT /api/courses/:courseId/units/:unitId` | `{ title: string }` | `Unit` (200) |
| Rename lesson | `PUT /api/units/:unitId/lessons/:lessonId` | `{ title: string }` | `Lesson` (200) |
| Rename course title | `PUT /api/courses/:courseId` | `{ title: string }` | `Course` (200) |
| Delete unit | `DELETE /api/courses/:courseId/units/:unitId` | None | None (204) |
| Delete lesson | `DELETE /api/units/:unitId/lessons/:lessonId` | None | None (204) |
| Delete activity | `DELETE /api/assignments/:assignmentId` | None | None (204) |

---

## 7. State Management

All state is page-level (`useState` in `CourseBuilderPage`). No new contexts.

### Primary State

| State Variable | Type | Location | Purpose |
|---|---|---|---|
| `outline` | `BuilderOutline \| null` | `CourseBuilderPage` | Full outline tree from API |
| `loading` | `boolean` | `useBuilderOutline` (via `useFetch`) | Initial fetch loading |
| `error` | `string` | `useBuilderOutline` (via `useFetch`) | Fetch error message |
| `expandedUnits` | `Set<string>` | `CourseBuilderPage` | Which unit IDs are expanded |
| `expandedLessons` | `Set<string>` | `CourseBuilderPage` | Which lesson IDs are expanded |
| `renamingId` | `string \| null` | `CourseBuilderPage` | ID of item currently in rename mode |
| `announcement` | `string` | `CourseBuilderPage` | Text for screen reader announcer |

### Per-Component Local State

| State Variable | Type | Location | Purpose |
|---|---|---|---|
| `menuOpen` | `boolean` | `UnitRow`, `LessonRow`, `ActivityRow` via `useContextMenu` | Context menu visibility |
| `activityMenuOpen` | `boolean` | `LessonRow` via `useDisclosure` | ActivityTypeMenu visibility |
| `addingItem` | `boolean` | `AddItemButton` | Loading state during creation |
| `saving` | `boolean` | `InlineRenameInput` | Save-in-progress state |
| `inputError` | `string` | `InlineRenameInput` | Rename validation/API error |
| `creatingType` | `AssignmentType \| null` | `ActivityTypeMenu` | Which type is being created |
| `deletingItem` | `{ id, name, type } \| null` | `CourseBuilderPage` | Item pending delete confirmation |
| `mobileOverflowOpen` | `boolean` | `BuilderTopBar` via `useDisclosure` | Mobile sidebar dropdown |

### Derived State (computed inline, not stored)

- `unitCount`: `outline.units.length`
- `lessonCount`: `outline.units.reduce((sum, u) => sum + u.lessons.length, 0)`
- `activityCount`: sum of all `lesson.assignments.length` across all lessons
- `assessmentCounts`: count of non-null unit assessments + course exam presence

---

## 8. Authentication and Authorization

### Route Guard

The builder route uses `RequireAuth` + `RequireRole` with `roles={['teacher', 'admin']}`:

```tsx
<Route
  path="/courses/:courseId/builder"
  element={
    <RequireAuth>
      <RequireRole roles={['teacher', 'admin']}>
        <CourseBuilderPage />
      </RequireRole>
    </RequireAuth>
  }
/>
```

Students who navigate directly to `/courses/:courseId/builder` see the existing "Access Denied" UI from `RequireRole`.

### Role-Based Routing in CourseCard

`CourseCard` will use `useAuth()` to check `user.role` and set the `Link to` prop:
- `teacher` or `admin` role: link to `/courses/${course.id}/builder`
- `student` role (or unauthenticated): link to `/courses/${course.id}`

The `useAuth()` hook is already used across the app. The `isLoading` check in `CourseCard` is unnecessary because `CourseCard` only renders inside authenticated pages (home page checks auth first).

### API Authorization

All builder API calls require the session cookie (handled automatically by `apiClient` with `credentials: 'include'`). The server enforces `authorize('teacher', 'admin')` + `requireCourseOwnership()` on all builder endpoints. On 401, the global `auth:unauthorized` event fires and `AuthContext` clears the user.

---

## 9. Pseudocode for Complex Logic

### 9.1 Optimistic Drag Reorder (units)

```
function handleDragEndUnits(event):
  if no active or no over: return
  if active.id === over.id: return

  // Snapshot for rollback
  snapshot = clone(outline.units)

  // Compute new order
  oldIndex = units.findIndex(u => u.id === active.id)
  newIndex = units.findIndex(u => u.id === over.id)
  reordered = arrayMove(units, oldIndex, newIndex)
  reorderedWithOrder = reordered.map((u, i) => ({ ...u, order: i + 1 }))

  // Optimistic update
  setOutline(prev => ({ ...prev, units: reorderedWithOrder }))
  announce(`${activeUnit.title} moved to position ${newIndex + 1}`)

  // Persist
  try:
    await builderApi.reorderUnits(courseId, reorderedWithOrder.map(u => ({ id: u.id, order: u.order })))
  catch:
    // Rollback
    setOutline(prev => ({ ...prev, units: snapshot }))
    show error
```

### 9.2 Add Unit Flow

```
function handleAddUnit():
  nextOrder = outline.units.length + 1
  defaultTitle = `Unit ${nextOrder}`

  try:
    newUnit = await unitsApi.create(courseId, { title: defaultTitle, order: nextOrder })
    builderUnit = { id: newUnit.id, title: newUnit.title, order: newUnit.order, lessons: [], assessment: null }
    setOutline(prev => ({ ...prev, units: [...prev.units, builderUnit] }))
    expandedUnits.add(newUnit.id)
    setRenamingId(newUnit.id)
    announce("Unit created")
  catch:
    show error
```

### 9.3 Add Activity Flow

```
function handleAddActivity(lessonId, type):
  lesson = findLessonInOutline(lessonId)
  nextOrder = lesson.assignments.length + 1
  defaultTitle = getDefaultTitle(type)  // "Untitled Note", "Untitled Video", etc.

  payload = buildCreatePayload(type, defaultTitle, nextOrder)

  try:
    newAssignment = await assignmentsApi.create(lessonId, payload)
    builderActivity = { id: newAssignment.id, title: newAssignment.title, type: newAssignment.type, order: newAssignment.order }
    // Append to lesson's assignments in outline
    setOutline(prev => updateLessonAssignments(prev, lessonId, [...lesson.assignments, builderActivity]))
    announce(`${typeLabel(type)} created`)
  catch:
    show error
```

### 9.4 Default Content by Activity Type

```
function buildCreatePayload(type, title, order):
  switch type:
    case 'note':     return { type: 'note', title, content: { type: 'doc', content: [] } }
    case 'video':    return { type: 'video', title, url: '' }
    case 'reading':  return { type: 'reading', title, url: '', description: '' }
    case 'vocab':    return { type: 'vocab', title, entries: [] }
    case 'practice_problem': return { type: 'practice_problem', title, questions: [] }
```

### 9.5 Inline Rename Flow

```
function InlineRenameInput.handleSave(newValue):
  if newValue.trim() === '': show validation error, return
  if newValue === initialValue: onCancel(), return

  setSaving(true)
  try:
    await onSave(newValue.trim())
    // Parent updates outline state and clears renamingId
  catch err:
    setInputError(classifyError(err))
  finally:
    setSaving(false)
```

### 9.6 Delete with Confirmation

```
function handleDeleteUnit(unitId):
  unit = outline.units.find(u => u.id === unitId)
  setDeletingItem({ id: unitId, name: unit.title, type: 'unit' })

// In ConfirmDialog onConfirm:
function confirmDelete():
  try:
    if type === 'unit':
      await unitsApi.delete(courseId, deletingItem.id)
      setOutline(prev => ({ ...prev, units: prev.units.filter(u => u.id !== deletingItem.id) }))
    else if type === 'lesson':
      await lessonsApi.delete(parentUnitId, deletingItem.id)
      // Remove lesson from parent unit in outline
    else if type === 'activity':
      await assignmentsApi.delete(deletingItem.id)
      // Remove activity from parent lesson in outline
    announce(`${deletingItem.name} deleted`)
    setDeletingItem(null)
  catch:
    show error in dialog
```

### 9.7 Mobile Move Up/Down

```
function handleMoveUnit(unitId, direction):
  units = [...outline.units].sort((a, b) => a.order - b.order)
  idx = units.findIndex(u => u.id === unitId)
  swapIdx = direction === 'up' ? idx - 1 : idx + 1
  if swapIdx < 0 || swapIdx >= units.length: return

  // Swap orders
  [units[idx].order, units[swapIdx].order] = [units[swapIdx].order, units[idx].order]
  reordered = units.sort((a, b) => a.order - b.order)

  // Optimistic update
  snapshot = clone(outline.units)
  setOutline(prev => ({ ...prev, units: reordered }))
  announce(`${units[idx].title} moved ${direction}`)

  try:
    await builderApi.reorderUnits(courseId, reordered.map(u => ({ id: u.id, order: u.order })))
  catch:
    setOutline(prev => ({ ...prev, units: snapshot }))
    show error
```

---

## 10. Styling Notes

### Layout

- Page container: `max-w-7xl mx-auto px-4 lg:px-8 py-6`
- Body layout: `flex gap-8`
- Main column: `flex-1 min-w-0`
- Sidebar: `w-80 shrink-0 hidden lg:block`
- Sidebar stickiness: `sticky top-24`

### Tree Indentation (responsive)

| Level | Desktop | Mobile |
|---|---|---|
| Unit (level 0) | `ml-0` | `ml-0` |
| Lesson (level 1) | `md:ml-8` | `ml-4` |
| Activity (level 2) | `md:ml-16` | `ml-8` |

Use responsive classes: `ml-4 md:ml-8` for lessons, `ml-8 md:ml-16` for activities.

### Row Patterns

- Unit row: `flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-surface transition-colors group cursor-pointer`
- Lesson row: same pattern with responsive indent
- Activity row: `flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surface transition-colors group` with responsive indent
- Assessment row: same as activity row but with `opacity-60`
- Divider between units: `border-b border-border-subtle`

### Drag Handle

- Icon: `GripVertical` from lucide-react
- Classes: `text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab w-4 h-4`
- Mobile: `hidden md:flex`

### Activity Type Pill Color Map

| Type | Background | Text |
|---|---|---|
| `note` | `bg-blue-surface` | `text-blue-surface-text` |
| `video` | `bg-orange-surface` | `text-orange-surface-text` |
| `vocab` | `bg-green-surface` | `text-green-surface-text` |
| `practice_problem` | `bg-purple-surface` | `text-purple-surface-text` |
| `reading` / `file` | `bg-surface border border-border-subtle` | `text-muted-foreground` |

### Pill Base Classes

`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full`

### Add Item Button

`flex items-center gap-1.5 w-full px-3 py-2 text-sm text-muted-foreground border border-dashed border-border rounded-lg hover:border-green-primary hover:text-green-primary transition-colors cursor-pointer`

### Context Menu / Dropdown

- Container: `absolute right-0 mt-1 w-44 bg-surface-raised border border-border rounded-xl shadow-warm-md z-30 py-1`
- Item: `flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-surface rounded-lg mx-1 cursor-pointer`
- Destructive item: `text-destructive hover:bg-destructive/10`

### Sidebar Cards

- Card: `bg-surface rounded-xl border border-border-subtle p-5 shadow-warm-sm`
- Section heading: `text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4`

### Purple Token Addition to `index.css`

Add to `:root`:
```css
--purple-surface:       #F5F3FF;
--purple-surface-text:  #5B21B6;
```

Add to `.dark`:
```css
--purple-surface:       rgba(91, 33, 182, 0.15);
--purple-surface-text:  #C4B5FD;
```

Add to `@theme inline`:
```css
--color-purple-surface:      var(--purple-surface);
--color-purple-surface-text: var(--purple-surface-text);
```

---

## 11. Edge Cases and Error Handling

### Loading States

| Scenario | Treatment |
|---|---|
| Initial page load | `LoadingSpinner` centered in main content; sidebar shows pulse-animated skeleton placeholders |
| Adding unit/lesson | `AddItemButton` shows "Adding..." with inline spinner, button disabled |
| Adding activity | `ActivityTypeMenu` selected option shows inline spinner, menu stays open |
| Renaming | `InlineRenameInput` disabled during save with subtle opacity reduction |
| Deleting | `ConfirmDialog` confirm button shows spinner, both buttons disabled |
| Reorder API call | No visible loading (optimistic update already applied) |

### Empty States

| Scenario | Treatment |
|---|---|
| No units in course | `EmptyState` component: "No units yet. Add your first unit to start building your course." with `AddItemButton` below |
| No lessons in unit | Inline italic text: "No lessons in this unit." with `AddItemButton` below |
| No activities in lesson | Inline italic text: "No activities in this lesson." with `AddItemButton` below |

### Error States

| Scenario | Treatment |
|---|---|
| Outline fetch fails | `ErrorMessage` with error string + "Retry" button calling `reload()` |
| Reorder fails | Rollback to pre-drag order. Brief inline error notification |
| Add item fails | `AddItemButton` reverts loading state. Error shown via inline `ErrorMessage` below the button |
| Rename fails | `InlineRenameInput` shows `border-destructive` + error text via `aria-describedby`. Rename mode stays active |
| Delete fails | Error shown inside `ConfirmDialog`. Dialog stays open |
| 401 during any operation | Global `auth:unauthorized` event fires, `AuthContext` clears user, redirect to `/login` |
| 403 on outline fetch | `RequireRole` catches this before the page renders (user sees "Access Denied") |
| 404 on outline fetch | `ErrorMessage`: "Course not found" |

### Validation Edge Cases

- Empty rename value: client-side validation prevents save (shows inline error)
- Renaming to the same value: no API call, just exits rename mode
- Drag-and-drop to the same position: no API call
- Auto-created items (lesson quiz, unit test, course exam): not draggable, not deletable, no context menu
- Concurrent drag operations: `@dnd-kit` prevents multiple simultaneous drags by design
- Mobile reorder at boundaries: "Move up" disabled on first item, "Move down" disabled on last item (`opacity-50 cursor-not-allowed`)

### Responsive Edge Cases

- Sidebar below `lg:`: content accessible from top-bar three-dot overflow menu
- Drag handles below `md:`: hidden (`hidden md:flex`), reorder via context menu "Move up" / "Move down"
- Touch targets: all interactive elements use `min-h-[44px] min-w-[44px]` on mobile
- Long titles: truncated with `truncate` class (CSS `text-overflow: ellipsis`)

---

## 12. Dependency Addition

### @dnd-kit

The project has no existing drag-and-drop library. This plan requires adding `@dnd-kit`:

```
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Justification:** Drag-and-drop reordering is a core requirement (FR-16 through FR-18). `@dnd-kit` is the most widely used accessible React DnD library, supports sortable lists natively, has a small bundle size (~12KB gzipped for core + sortable), and provides the `SortableContext` / `useSortable` pattern that maps cleanly to nested lists. Rolling a custom solution with the HTML Drag and Drop API would exceed 20 lines significantly and produce worse accessibility.

### Usage Pattern

- `DndContext` wraps each sortable group (units list, lessons-per-unit list, activities-per-lesson list)
- `SortableContext` provides the sortable item list to `@dnd-kit`
- `useSortable` hook on each `UnitRow` / `LessonRow` / `ActivityRow` provides `attributes`, `listeners`, `setNodeRef`, `transform`, `transition`
- Drag handle: pass `listeners` to the `GripVertical` button only (not the entire row)
- `PointerSensor` with `activationConstraint: { distance: 8 }` to prevent accidental drags
- `restrictToVerticalAxis` modifier to constrain movement
- `closestCenter` collision detection strategy
- `arrayMove` utility from `@dnd-kit/sortable` for reordering arrays

---

## 13. Types (additions to `client/src/api/types.ts`)

```ts
// ─── Builder Outline ────────────────────────────────────────────────────────

export interface BuilderCourseInfo {
  id: string;
  title: string;
  description: string;
}

export interface BuilderAssessment {
  id: string;
  type: AssessmentType;
  questionCount: number;
}

export interface BuilderActivity {
  id: string;
  title: string;
  type: AssignmentType;
  order: number;
}

export interface BuilderLesson {
  id: string;
  title: string;
  order: number;
  assignments: BuilderActivity[];
  assessment: BuilderAssessment | null;
}

export interface BuilderUnit {
  id: string;
  title: string;
  order: number;
  lessons: BuilderLesson[];
  assessment: BuilderAssessment | null;
}

export interface BuilderOutline {
  course: BuilderCourseInfo;
  units: BuilderUnit[];
  courseAssessment: BuilderAssessment | null;
}

export interface ReorderItem {
  id: string;
  order: number;
}
```

---

## 14. Implementation Order

1. Add builder outline types to `client/src/api/types.ts`
2. Add purple surface tokens to `client/src/index.css` (`:root`, `.dark`, `@theme inline`)
3. Create `client/src/api/builder.ts` API module
4. Add route to `client/src/App.tsx`
5. Build `ActivityTypePill` (simplest leaf component, no dependencies)
6. Build `ScreenReaderAnnouncer` (simple leaf component)
7. Build `AssessmentRow` (leaf component, uses `Button` and `Tooltip`)
8. Build `ActivityRow` (leaf component, uses `ActivityTypePill`, `Tooltip`)
9. Build `InlineRenameInput` (uses shared `Input`)
10. Build `AddItemButton` (uses shared `LoadingSpinner`)
11. Build `DropdownMenu` (generic context menu with click-outside + Escape handling)
12. Build `ActivityTypeMenu` (uses `DropdownMenu` pattern)
13. Build `useContextMenu` hook
14. Build `LessonRow` (composes `ActivityRow`, `AssessmentRow`, `AddItemButton`, `ActivityTypeMenu`, `DropdownMenu`, `InlineRenameInput`)
15. Build `UnitRow` (composes `LessonRow`, `AssessmentRow`, `AddItemButton`, `DropdownMenu`, `InlineRenameInput`)
16. Build `useDragReorder` hook (wraps `@dnd-kit`)
17. Build `OutlineTree` (composes `UnitRow`, `AddItemButton`, `AssessmentRow`; wires `DndContext`)
18. Build `BuilderSidebar`
19. Build `BuilderTopBar`
20. Build `useBuilderOutline` hook
21. Build `CourseBuilderPage` (composes all; manages all page-level state)
22. Update `CourseCard` for role-based routing
23. Install `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
24. Wire up drag-and-drop in `OutlineTree`, `UnitRow`, `LessonRow`
25. End-to-end smoke test

---

## 15. Accessibility

### Tree ARIA Structure

- `OutlineTree` container: `<div role="tree" aria-label="Course outline">`
- `UnitRow`: `<div role="treeitem" aria-expanded="true|false" aria-level="1" aria-label="Unit: {name}">`
- Children of expanded unit: wrapped in `<div role="group">`
- `LessonRow`: `<div role="treeitem" aria-expanded="true|false" aria-level="2" aria-label="Lesson: {name}">`
- Children of expanded lesson: wrapped in `<div role="group">`
- `ActivityRow`: `<div role="treeitem" aria-level="3" aria-label="{type}: {name}">`
- `AssessmentRow`: `<div role="treeitem" aria-level={varies} aria-label="{label} - {questionCount} questions">`
- Course exam: `role="treeitem" aria-level="1"` at tree root

### Interactive Element ARIA

- Expand/collapse chevron: `<button aria-expanded aria-label="Expand {name}" aria-controls="{group-id}">`
- Context menu trigger: `<button aria-haspopup="menu" aria-expanded aria-label="Actions for {name}">`
- Context menu: `<div role="menu" aria-label="Actions">`
- Menu items: `<button role="menuitem">`
- Add activity button: `<button aria-haspopup="menu" aria-label="Add activity">`
- Edit button: `<button aria-label="Edit {name}">`
- Drag handle: `aria-hidden="true"` (not keyboard-accessible in this iteration)
- InlineRenameInput: `<input aria-label="Rename {item type}">` with `aria-describedby` linked to error

### Focus Management

- After adding an item: focus moves to `InlineRenameInput` on the new item
- After deleting an item: focus moves to previous sibling row, or parent row if no siblings
- After closing a dropdown: focus returns to trigger button
- After closing `ConfirmDialog`: focus returns to context menu trigger
- `ActivityTypeMenu` opens: focus moves to first menu item
- `ActivityTypeMenu` closes: focus returns to "Add activity" button

### Screen Reader Announcements

`ScreenReaderAnnouncer` renders a visually hidden `aria-live="polite"` region. Announcement messages:
- After add: "{Item type} created"
- After rename: "Renamed to {new name}"
- After delete: "{Item name} deleted"
- After reorder: "{Item name} moved to position {N}"

### Keyboard Navigation

| Key | Context | Behavior |
|---|---|---|
| `Tab` | Tree rows | Moves between interactive elements within rows |
| `Enter` / `Space` | Chevron | Toggle expand/collapse |
| `Enter` / `Space` | Menu trigger | Open context menu |
| `Enter` / `Space` | Add button | Trigger creation (or open activity type menu) |
| `Escape` | Open dropdown | Close dropdown |
| `Escape` | InlineRenameInput | Cancel rename |
| `ArrowUp` / `ArrowDown` | Open menu | Navigate menu items |

Full tree keyboard navigation (ArrowUp/Down between tree items) is deferred per NFR-03.
