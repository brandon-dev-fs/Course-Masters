---
id: cm-0002
title: Redesign Lesson Detail Page Layout
stage: design
status: approved
approver: human
approved_at: 2026-04-27T00:00:00Z
---

# Frontend Plan — cm-0002: Redesign Lesson Detail Page Layout

---

## 1. Overview

This plan implements the redesign of `LessonDetailPage` described in the approved spec. The existing horizontal tab bar (`LearningResourceNav`) and the separate `PracticeResourceSidebar` / `PracticeResourceMobileBar` are removed. The tab bar and practice sidebar are replaced with a **lesson-flow layout**: a sticky `AssignmentStepper` progress bar below the lesson header, and all assignments rendered as stacked `AssignmentSection` cards in a single scrollable page. Students work top-to-bottom or jump via the stepper. The left sidebar is simplified to unit dropdown + lesson list only — no assignment list.

The floating `StudentNotePanel` FAB is replaced by a `StudentToolsBar` (icon buttons per student tool) that opens a draggable `StudentMaterialsModal`, keeping tools accessible alongside any section of the lesson. A new `useLessonAssignments` hook encapsulates the enriched data-fetching and derived state that the new layout requires.

Acceptance criteria covered:
- FR-01 through FR-14 (unit dropdown, lesson list, ordered assignment list, completion indicators, quiz lock, required/optional toggle for teachers, lesson completion, student materials modal, quiz-hides-modal, content rendering by selection, teacher add/delete/reorder controls, responsive collapse).
- NFR-01 (no extra API calls beyond units fetch), NFR-02 (debounce auto-save), NFR-03 (no layout shift on lesson switch).

---

## 2. Folder Structure

New files to create:

```
client/src/features/lessons/
  UnitDropdown.tsx                  — unit selector dropdown component
  AssignmentStepper.tsx             — sticky horizontal progress bar, one node per assignment
  AssignmentSection.tsx             — wrapper card for each assignment in the lesson scroll

client/src/features/student-notes/
  StudentToolsBar.tsx               — vertical icon bar (desktop) / horizontal row (mobile), one button per available tool
  StudentMaterialsModal.tsx         — draggable floating modal (desktop) / bottom sheet (mobile) with tool switcher

client/src/api/
  types.ts                          — add LessonResourceWithRequired, LessonToolWithRequired,
                                      CompletionsResponse types (extend existing file)
  lesson-resources.ts               — extend UpdateResourceInput with isRequired
  lesson-tools.ts                   — extend UpdateToolInput with isRequired
  resource-completions.ts           — update get() return type to CompletionsResponse
```

Files to modify:

```
client/src/features/lessons/
  LessonDetailPage.tsx              — restructure layout, wire new components, add units fetch
  UnitLessonSidebar.tsx             — simplified to unit dropdown + lesson list navigation only
                                      via new props; remove course/unit breadcrumb header (moves into UnitDropdown)

client/src/features/student-notes/
  StudentNotePanel.tsx              — strip FAB/floating container; expose note state and handlers
                                      as a plain editor for use inside StudentMaterialsModal
```

Files to remove (after verifying no other imports):

```
client/src/features/lessons/LearningResourceNav.tsx
client/src/features/lessons/PracticeResourceSidebar.tsx
```

---

## 3. Component Tree

All components are TypeScript/React with Tailwind CSS 4 styling. No global state store — state lives in `LessonDetailPage` and is passed down as props.

---

### 3.1 LessonDetailPage (page component — modified)

**File:** `client/src/features/lessons/LessonDetailPage.tsx`

**Responsibilities:**
- Owns all page-level state: lesson, units, unitLessons, resources, tools, completions, activeStepKey, unitProgress.
- Runs the initial parallel data fetch (now includes `unitsApi.getAll(courseId)`).
- Computes derived state: `assignmentItems`, `completedIds`, `quizUnlocked`, `isQuizActive`.
- Passes handlers down: `onToggleCompletion`, `onToggleRequired`, `onAddAssignment`, `onDeleteAssignment`, `onMoveAssignment`.
- Renders: `UnitLessonSidebar` (left) | center column (`AssignmentStepper` sticky + lesson scroll of `AssignmentSection` cards) | `StudentToolsBar` (right edge). Renders `StudentMaterialsModal` portalled to `document.body` when `activeTool !== null && !isQuizActive`.
- `activeStepKey` is updated by an IntersectionObserver callback fired from each `AssignmentSection` as it enters the viewport — drives stepper highlight without imperative scroll tracking.

**Props:** none (reads from `useParams`)

**State:**
```typescript
lesson: Lesson | null
units: Unit[]
unitLessons: Lesson[]
resources: LessonResourceWithRequired[]
tools: LessonToolWithRequired[]
completionsResponse: CompletionsResponse | null
unitProgress: UnitProgress | null
activeStepKey: string        // e.g. 'lessonPlan' | 'note:uuid' | 'video:uuid' | 'vocab' | 'flashcards' | 'practice' | 'quiz' | 'unit-test'
activeTool: StudentToolType | null  // null = modal closed; set = modal open on this tool
loading: boolean
error: string
showSettings: boolean
showPlanEdit: boolean
newNoteIdRef: MutableRefObject<string | null>
```

---

### 3.2 UnitLessonSidebar (layout component — modified)

**File:** `client/src/features/lessons/UnitLessonSidebar.tsx`

**Responsibilities:**
- Renders left sidebar (desktop: `w-56 hidden lg:flex flex-col`; mobile: collapsible toggle bar).
- Hosts `UnitDropdown` at the top.
- Renders the sorted lesson list for the current unit (existing behavior preserved).
- No longer renders an assignment list — sidebar is navigation only.
- Exposes a collapse toggle (`ChevronLeft` / `ChevronRight`); collapsed state narrows to `w-14` icon-only.
- On mobile, wraps all three sections in a single expandable panel under a toggle bar.

**Props interface:**
```typescript
interface UnitLessonSidebarProps {
  // existing
  lessons: Lesson[];
  currentLessonId: string;
  courseId: string;
  unitId: string;
  canEdit?: boolean;
  onAddLesson?: (data: { title: string; description: string; order: number }) => Promise<void>;
  onUnitTestClick?: () => void;
  unitTestActive?: boolean;
  onLessonClick?: () => void;
  // new
  units: Unit[];
  currentUnitId: string;
  courseTitle: string;
  unitTitle: string;
}
```

The sidebar is now navigation-only. It no longer owns or renders any assignment state. `courseTitle` and `unitTitle` are consumed by `UnitDropdown`.

---

### 3.3 UnitDropdown (UI component — new)

**File:** `client/src/features/lessons/UnitDropdown.tsx`

**Responsibilities:**
- Renders an accessible dropdown listing all units in the course.
- Highlights the current unit.
- On selection of a different unit, navigates to `GET /api/units/:unitId/lessons` (client-side: fetches first lesson then navigates using `useNavigate`). Navigation is the sole side-effect.
- Handles loading state for units list.

**Props interface:**
```typescript
interface UnitDropdownProps {
  units: Unit[];
  currentUnitId: string;
  courseId: string;
  courseTitle: string;
  collapsed?: boolean;          // icon-only mode when sidebar is collapsed
}
```

**Type:** UI component (no data fetching; units passed as props from `LessonDetailPage`)

---

### 3.4 AssignmentStepper (UI component — new)

**File:** `client/src/features/lessons/AssignmentStepper.tsx`

**Responsibilities:**
- Renders a sticky horizontal progress bar with one node per assignment item.
- Receives `activeStepKey` (updated by `LessonDetailPage` via IntersectionObserver) and highlights the corresponding node.
- Clicking a node calls `onStepClick(key)` which smooth-scrolls to `#assignment-{key}`.
- Locked quiz node: `cursor-not-allowed`, no scroll on click.
- Horizontally scrollable on mobile; labels hidden on mobile (nodes only + "Step N of M" counter).

**Props interface:**
```typescript
interface AssignmentStepperProps {
  items: AssignmentItem[];
  activeStepKey: string;
  completedIds: Set<string>;
  quizUnlocked: boolean;
  onStepClick: (key: string) => void;
}
```

**Type:** UI component (no data fetching, no own state)

---

### 3.5 AssignmentSection (layout component — new)

**File:** `client/src/features/lessons/AssignmentSection.tsx`

**Responsibilities:**
- Renders one assignment as a card with: header (icon, title, REQ/OPT badge, teacher controls), content slot (children), footer (mark complete button + next button).
- Sets `id="assignment-{key}"` and `scroll-mt-24` on the root element for anchor targeting.
- Fires `onVisible(key)` via `IntersectionObserver` when the section enters the viewport (used by `LessonDetailPage` to update `activeStepKey`).
- Teacher controls (REQ/OPT toggle, reorder up/down, delete) always visible in header for `canEdit` users.
- Locked quiz variant: replaces content slot with a locked message listing incomplete required items.

**Props interface:**
```typescript
interface AssignmentSectionProps {
  item: AssignmentItem;
  isComplete: boolean;
  isLocked: boolean;
  canEdit: boolean;
  isFirst: boolean;
  isLast: boolean;
  incompleteRequired?: AssignmentItem[];   // only for locked quiz
  onVisible: (key: string) => void;
  onToggleCompletion: () => void;
  onToggleRequired: () => Promise<void>;
  onDelete: () => Promise<void>;
  onMoveUp: () => Promise<void>;
  onMoveDown: () => Promise<void>;
  onNext: () => void;          // smooth-scrolls to next section
  children: ReactNode;         // the content component (LessonPlanView, NoteEditor, etc.)
}
```

**Type:** layout component

---

### 3.6 StudentToolsBar (UI component — new)

**File:** `client/src/features/student-notes/StudentToolsBar.tsx`

**Responsibilities:**
- Renders one icon+label button per tool available in the current lesson: Notes (always present), Flashcards, Practice Problems, Vocab (only if the lesson has tools of that type).
- Desktop: vertical column (`w-10`) pinned to the right edge of the layout, `border-l border-border bg-surface`.
- Mobile: horizontal row below the lesson header, `border-b border-border`.
- Clicking a button calls `onOpenTool(toolType)` — if the modal is closed it opens; if open on a different tool it switches; if open on the same tool it closes (toggle).
- Active button (modal open on this tool) shows `bg-primary-subtle text-primary`.
- Hidden entirely when `isQuizActive`.

**Props interface:**
```typescript
type StudentToolType = 'notes' | 'flash_card' | 'practice_problem' | 'vocab';

interface StudentToolsBarProps {
  availableTools: StudentToolType[];   // derived from which tool types exist for the lesson
  activeTool: StudentToolType | null;  // null when modal is closed
  onOpenTool: (tool: StudentToolType) => void;
  isQuizActive: boolean;
}
```

**Type:** UI component

---

### 3.7 StudentMaterialsModal (layout component — new)

**File:** `client/src/features/student-notes/StudentMaterialsModal.tsx`

**Responsibilities:**
- Renders as a `position: fixed` floating panel (`role="dialog" aria-modal="true"`).
- Desktop: draggable via `onMouseDown` on the title bar; default position `bottom-6 right-6`; `w-80`; `shadow-warm-lg rounded-xl border border-border bg-surface`. Students can drag it anywhere on screen.
- Mobile: opens as a bottom sheet (`position: fixed bottom-0 left-0 right-0 rounded-t-xl max-h-[60vh]`); no drag behavior.
- Not rendered at all when quiz is active.
- Contains a **tool switcher row** (same icons as the bar) so students can switch tools from inside the modal.
- Renders the active tool's content: `StudentNotePanel` for `'notes'`, `FlashCardList` for `'flash_card'`, `PracticeProblemList` for `'practice_problem'`, `VocabList` for `'vocab'`.
- Owns `position: { x, y }` state for drag (desktop) and renders a backdrop overlay (mobile).
- Focus trap while open; `Escape` closes.

**Props interface:**
```typescript
interface StudentMaterialsModalProps {
  lessonId: string;
  isOpen: boolean;
  activeTool: StudentToolType;
  availableTools: StudentToolType[];
  onSwitchTool: (tool: StudentToolType) => void;
  onClose: () => void;
}
```

**Drag implementation (desktop only):**
- `onMouseDown` on drag handle sets `isDragging = true`, records `offsetX/Y` from pointer to panel top-left.
- `mousemove` listener on `window` updates `position` state while dragging.
- `mouseup` on `window` clears `isDragging`.
- Position clamped to viewport bounds.
- `user-select: none` applied to `<body>` during drag.

**Type:** layout component

---

### 3.8 StudentNotePanel (UI component — modified)

**File:** `client/src/features/student-notes/StudentNotePanel.tsx`

**Responsibilities (after modification):**
- Stripped of FAB/floating container and `isOpen` toggle state.
- Exposes note content, save status, and handlers as a plain editor section (textarea + save status text + clear button).
- Loads note lazily on mount (or when `lessonId` changes) using existing `studentNotesApi.get` / `studentNotesApi.upsert` / `studentNotesApi.delete` calls.
- Debounce auto-save behavior (1000ms) preserved exactly.

**Props interface (after modification):**
```typescript
interface StudentNotePanelProps {
  lessonId: string;
}
// disabled prop removed — caller (StudentMaterialsModal) handles visibility
```

**Type:** UI component

---

## 4. Client Routes

No new routes. The existing route is unchanged:

| Path | Component | Auth |
|---|---|---|
| `/courses/:courseId/units/:unitId/lessons/:lessonId` | `LessonDetailPage` | `RequireAuth` |

`LessonDetailPage` reads `courseId`, `unitId`, `lessonId` from `useParams` as before.

---

## 5. Hooks and Data Fetching

### 5.1 LessonDetailPage data fetch (useEffect — modified in place)

The existing `Promise.all` in `LessonDetailPage` gains two changes:
1. `unitsApi.getAll(courseId)` is added to the parallel array (new call for unit dropdown — NFR-01 permits this).
2. `lessonResourcesApi.getAll(lessonId)` (without type filter) and `lessonToolsApi.getAll(lessonId)` (without type filter) replace the previous individual type-filtered calls, so all resources and tools are fetched in one pass each and stored together. The `isRequired` field is now present on each item per the contract.
3. `resourceCompletionsApi.get(lessonId)` return type is updated — the response now has both `completions` and `requiredItems` arrays.

**API calls (all existing endpoints, one new):**

| Call | Endpoint | Contract reference |
|---|---|---|
| `lessonsApi.getOne(unitId, lessonId)` | `GET /api/units/:unitId/lessons/:lessonId` | Unchanged |
| `unitsApi.getOne(courseId, unitId)` | `GET /api/courses/:courseId/units/:unitId` | Unchanged |
| `coursesApi.getOne(courseId)` | `GET /api/courses/:courseId` | Unchanged |
| `lessonsApi.getAll(unitId)` | `GET /api/units/:unitId/lessons` | Unchanged |
| `unitsApi.getAll(courseId)` | `GET /api/courses/:courseId/units` | **New call** — unchanged contract |
| `lessonResourcesApi.getAll(lessonId)` | `GET /api/lessons/:lessonId/resources` | Modified — now returns `isRequired` |
| `lessonToolsApi.getAll(lessonId)` | `GET /api/lessons/:lessonId/tools` | Modified — now returns `isRequired` |
| `resourceCompletionsApi.get(lessonId)` | `GET /api/lessons/:lessonId/completions` | Modified — returns `{ completions, requiredItems }` |
| `progressApi.getUnit(courseId, unitId)` | `GET /api/courses/:courseId/units/:unitId/progress` | Unchanged |

**Loading / error handling:**
- `loading: true` until all parallel calls resolve. Shows `<LoadingSpinner />`.
- Any rejection sets `error` string. Shows `<ErrorMessage message={error} />`.
- `lesson === null` after success guard (`return null`) is preserved.

---

### 5.2 `resourceCompletionsApi.get` — updated return type

The current `get()` returns `{ completions: ResourceCompletionItem[] }`. Post-contract, the type is:

```typescript
// types.ts additions
export interface ResourceCompletionItem {
  resourceType: string;
  resourceId: string;
  isRequired: boolean;          // NEW
}

export interface CompletionRequiredItem {
  resourceType: 'resource' | 'tool';
  resourceId: string;
  isRequired: boolean;
}

export interface CompletionsResponse {
  completions: ResourceCompletionItem[];
  requiredItems: CompletionRequiredItem[];
}
```

`resource-completions.ts` `get()` signature updates to return `CompletionsResponse`.

---

### 5.3 `lessonResourcesApi.update` and `lessonToolsApi.update` — isRequired field

`UpdateResourceInput` in `lesson-resources.ts` gains `isRequired?: boolean`.
`UpdateToolInput` in `lesson-tools.ts` gains `isRequired?: boolean`.

---

## 6. API Integration

Every action below maps to an endpoint from the approved api-contract. No endpoints are invented.

### 6.1 Page load

```
Page mounts
  → GET /api/units/:unitId/lessons/:lessonId       (lesson data)
  → GET /api/courses/:courseId/units/:unitId       (unit title)
  → GET /api/courses/:courseId                     (course title)
  → GET /api/units/:unitId/lessons                 (lesson list for sidebar)
  → GET /api/courses/:courseId/units               (units list for dropdown)
  → GET /api/lessons/:lessonId/resources           (resources + isRequired)
  → GET /api/lessons/:lessonId/tools               (tools + isRequired)
  → GET /api/lessons/:lessonId/completions         (completions + requiredItems)
  → GET /api/courses/:courseId/units/:unitId/progress
All fire in parallel via Promise.all.
```

### 6.2 Toggle assignment completion (student)

```
Student clicks checkbox on AssignmentListItem
  → onToggleCompletion(resourceType, resourceId)
  → POST /api/lessons/:lessonId/completions
    Request: { resourceType: string, resourceId: string }
    Response: { completions: ResourceCompletionItem[] }
  → setCompletionsResponse(prev => ({ ...prev, completions: result.completions }))
  → completedIds recomputed → quizUnlocked recomputed
```

Note: `resourceCompletionsApi.toggle` response currently returns only `completions`, not `requiredItems`. The `requiredItems` set does not change on toggle (it is determined by resource/tool `isRequired` fields). So `completionsResponse.requiredItems` is preserved from the initial load and only `completions` is replaced.

### 6.3 Toggle required/optional (teacher/admin only)

```
Teacher clicks REQ/OPT badge → dropdown appears
Teacher selects new value
  → if item.kind === 'resource':
      PUT /api/resources/:resourceId
      Request: { isRequired: boolean }
      Response: LessonResourceWithRequired
      → setResources(prev => prev.map(r => r.id === item.id ? updated : r))
  → if item.kind === 'tool':
      PUT /api/tools/:toolId
      Request: { isRequired: boolean }
      Response: LessonToolWithRequired
      → setTools(prev => prev.map(t => t.id === item.id ? updated : t))
  → assignmentItems recomputed → quizUnlocked recomputed
On error: display <ErrorMessage>, revert optimistic update if any.
```

### 6.4 Delete assignment (teacher/admin only)

```
Teacher clicks delete (X) on AssignmentListItem
  → if item.kind === 'resource':
      DELETE /api/resources/:resourceId
      → setResources(prev => prev.filter(r => r.id !== item.id))
  → if item.kind === 'tool':
      DELETE /api/tools/:toolId
      → setTools(prev => prev.filter(t => t.id !== item.id))
  → if activeStepKey === item.key: setActiveAssignmentKey('lessonPlan')
```

### 6.5 Reorder assignment (teacher/admin only)

```
Teacher clicks up/down arrow on AssignmentListItem
  → swap orders of the item and its neighbor in the reorderable list
  → if both are resources: two PUT /api/resources/:id calls with swapped order values
  → if both are tools:    two PUT /api/tools/:id calls with swapped order values
  → mixed resource/tool reorder: not supported in the current contract
    (resources and tools have independent order sequences; reorder only within same kind)
  → update local state after both calls resolve
```

### 6.6 Add assignment (teacher/admin only)

```
Teacher clicks "+ Add Assignment" → selects type from dropdown
  → 'note' | 'lecture':
      POST /api/lessons/:lessonId/resources
      Request: { type, title: 'New Note'|'New Lecture', content: { body: emptyTiptapDoc }, order: nextOrder }
      Response: LessonResourceWithRequired
      → setResources(prev => [...prev, newResource])
      → setActiveAssignmentKey(`note:${newResource.id}`)
  → 'video':
      setActiveAssignmentKey('add-video')   (no API call yet; VideoForm in center handles creation)
  → 'vocab':
      setHasVocabSection(true)              (or tools approach — see Section 7)
      setActiveAssignmentKey('vocab')
  → 'flash_card':
      POST /api/lessons/:lessonId/tools
      Request: { type: 'flash_card', title: 'New Flashcards', content: {}, order: nextOrder }
      → setTools(prev => [...prev, newTool])
      → setActiveAssignmentKey(`tool:${newTool.id}`)
  → 'practice_problem':
      POST /api/lessons/:lessonId/tools
      Request: { type: 'practice_problem', title: 'New Practice', content: {}, order: nextOrder }
      → similar to flash_card above
```

### 6.7 Start quiz (lesson_quiz)

```
Student clicks Quiz in assignment list (when unlocked)
  → setActiveAssignmentKey('quiz')
  → QuizSection renders; StudentMaterialsModal hides (disabled=true)
  → QuizSection internally calls POST /api/assessments/:assessmentId/attempts
    New error case: 400 REQUIRED_ASSIGNMENTS_INCOMPLETE
    → QuizSection or LessonDetailPage must catch this and display:
      "Complete all required assignments to unlock the quiz."
```

### 6.8 Unit dropdown navigation

```
User selects a unit from UnitDropdown
  → if selected unit === current unit: close dropdown, no navigation
  → else: fetch GET /api/units/:unitId/lessons (lessons for selected unit)
    → navigate to /courses/:courseId/units/:selectedUnitId/lessons/:firstLesson.id
    (first lesson = lessons sorted by order, index 0)
```

This fetch is done inside `UnitDropdown` using `useNavigate` + a local `useState` for loading. It uses `lessonsApi.getAll(selectedUnitId)`.

---

## 7. State Management

All state lives in `LessonDetailPage` (local component state, `useState` + `useEffect`). No context or external store needed. This matches the project convention: "Each page fetches its own data via `useState` + `useEffect`."

### Shared/derived state

```typescript
// Derived in LessonDetailPage via useMemo

// Unified ordered list of all assignments for the current lesson
const assignmentItems = useMemo<AssignmentItem[]>(() => {
  // 1. Lesson Plan (always first, not reorderable, not optional)
  // 2. Resources (note, video, lecture) sorted by order
  // 3. Tools (flash_card, practice_problem, vocab) sorted by order
  //    Note: vocab tools merge with the 'hasVocabSection' approach — see Section 9
  // 4. Quiz (always last, locked until quizUnlocked)
  // Returns AssignmentItem[] — see type below
}, [resources, tools, lessonId]);

// Set of completion identifiers for quick lookup
const completedIds = useMemo<Set<string>>(() => {
  const ids = new Set<string>();
  for (const c of completionsResponse?.completions ?? []) {
    ids.add(`${c.resourceType}:${c.resourceId}`);
  }
  return ids;
}, [completionsResponse]);

// Quiz unlock: all items in requiredItems where isRequired===true are completed
const quizUnlocked = useMemo<boolean>(() => {
  const required = completionsResponse?.requiredItems?.filter(r => r.isRequired) ?? [];
  if (required.length === 0) return true;
  return required.every(r => completedIds.has(`${r.resourceType}:${r.resourceId}`));
}, [completionsResponse, completedIds]);

const isQuizActive = activeStepKey === 'quiz';
```

### AssignmentItem type

```typescript
// Defined in LessonDetailPage.tsx or a local types file

type AssignmentKind = 'lessonPlan' | 'resource' | 'tool' | 'quiz';
type AddAssignmentType = 'note' | 'lecture' | 'video' | 'vocab' | 'flash_card' | 'practice_problem';

interface AssignmentItem {
  key: string;                    // e.g. 'lessonPlan', 'resource:uuid', 'tool:uuid', 'quiz'
  kind: AssignmentKind;
  id: string;                     // UUID of resource/tool, or lessonId for lessonPlan/quiz
  title: string;
  resourceType?: ResourceType;    // set when kind === 'resource'
  toolType?: ToolType;            // set when kind === 'tool'
  isRequired: boolean;            // always true for lessonPlan and quiz
  order: number;
}
```

### Local state per component

| Component | Local state |
|---|---|
| `UnitLessonSidebar` | `mobileOpen: boolean`, `sidebarCollapsed: boolean`, `showAddLesson: boolean` |
| `UnitDropdown` | `dropdownOpen: boolean`, `navLoading: boolean` |
| `AssignmentSection` | `showRequiredDropdown: boolean` |
| `StudentToolsBar` | stateless (all props from `LessonDetailPage`) |
| `StudentMaterialsModal` | `position: { x, y }`, `isDragging: boolean`, `offsetX/Y: number` |
| `StudentNotePanel` | `note`, `content`, `saveStatus`, debounceRef (existing state, preserved) |

---

## 8. Authentication and Authorization

The route is wrapped in `RequireAuth` (existing — no change). Auth hook used: `useAuth()` from `AuthContext`.

```typescript
const { user } = useAuth();
const canEdit = user?.role === 'teacher' || user?.role === 'admin';
```

`canEdit` is computed in `LessonDetailPage` and passed down as a prop to all components that conditionally render teacher controls (add/delete/reorder, required/optional toggle). This is the existing pattern in the codebase.

401 responses from any API call will trigger the global `auth:unauthorized` event via `apiClient`, which dispatches logout. No additional handling needed.

Role-gated rendering:
- Assignment list teacher controls (add/delete/reorder/required toggle): rendered only when `canEdit === true`
- `PUT /api/resources/:id` and `PUT /api/tools/:id` with `isRequired` field: 403 is returned by server if called by a student — client prevents this by gating the UI, but `ErrorMessage` should handle any 403 that slips through.

---

## 9. Pseudocode for Complex Logic

### 9.1 buildAssignmentItems — unified assignment list construction

```
function buildAssignmentItems(
  lessonId: string,
  resources: LessonResourceWithRequired[],
  tools: LessonToolWithRequired[],
): AssignmentItem[] {
  items = []

  // 1. Lesson Plan — always first
  items.push({
    key: 'lessonPlan',
    kind: 'lessonPlan',
    id: lessonId,
    title: 'Lesson Plan',
    isRequired: true,
    order: -1,   // sorts before everything
  })

  // 2. Resources sorted by order
  for each resource in resources.sort(by order):
    items.push({
      key: `resource:${resource.id}`,
      kind: 'resource',
      id: resource.id,
      title: resource.title,
      resourceType: resource.type,
      isRequired: resource.isRequired,
      order: resource.order,
    })

  // 3. Tools sorted by order
  for each tool in tools.sort(by order):
    items.push({
      key: `tool:${tool.id}`,
      kind: 'tool',
      id: tool.id,
      title: tool.title,
      toolType: tool.type,
      isRequired: tool.isRequired,
      order: tool.order,
    })

  // 4. Quiz — always last
  items.push({
    key: 'quiz',
    kind: 'quiz',
    id: lessonId,
    title: 'Quiz',
    isRequired: true,
    order: Infinity,
  })

  return items
}
```

Note: The `vocab` tool type is included in the tools array (previously it was tracked via `hasVocabSection` boolean + `lessonToolsApi.getAll(lessonId, 'vocab')`). The new approach fetches all tools in one call and includes vocab tools as individual `AssignmentItem` entries with `kind: 'tool'` and `toolType: 'vocab'`. The `hasVocabSection` state variable is removed.

---

### 9.2 renderContent — content slot dispatch (per AssignmentSection)

Each `AssignmentSection` receives its content as `children` from `LessonDetailPage`. The dispatch is:

```
function renderContent(item: AssignmentItem): ReactNode {
  if item.kind === 'lessonPlan':
    return <LessonPlanView lesson={lesson} canEdit={canEdit} ... />

  if item.kind === 'quiz':
    return <QuizSection lessonId={lessonId} canEdit={canEdit}
             onAttemptError={handleQuizAttemptError} />
    // AssignmentSection handles locked state before rendering children

  if item.kind === 'resource':
    resource = resources.find(r.id === item.id)
    if resource.type === 'video':
      return <VideoCard video={resource} canEdit={canEdit} ... />
    if resource.type === 'note' | 'lecture':
      return <NoteEditor note={resource} canEdit={canEdit} ... />

  if item.kind === 'tool':
    tool = tools.find(t.id === item.id)
    if tool.type === 'vocab':
      return <VocabList lessonId={lessonId} />
    if tool.type === 'flash_card':
      return <FlashCardList lessonId={lessonId} />
    if tool.type === 'practice_problem':
      return <PracticeProblemList lessonId={lessonId} />

  return null
}
```

Note: `VideoForm` (add/edit video) previously opened in the center area via an `'add-video'`/`'edit-video:'` key. In the new layout it opens inline within the `AssignmentSection` — the section renders `VideoForm` instead of `VideoCard` when in edit mode. This is local state within the section (`isEditing: boolean`).

---

### 9.3 handleToggleRequired — optimistic update with rollback

```
async function handleToggleRequired(item: AssignmentItem) {
  newValue = !item.isRequired

  // Optimistic update
  if item.kind === 'resource':
    setResources(prev => prev.map(r =>
      r.id === item.id ? { ...r, isRequired: newValue } : r
    ))
  else if item.kind === 'tool':
    setTools(prev => prev.map(t =>
      t.id === item.id ? { ...t, isRequired: newValue } : t
    ))

  try:
    if item.kind === 'resource':
      updated = await lessonResourcesApi.update(item.id, { isRequired: newValue })
      setResources(prev => prev.map(r => r.id === item.id ? updated : r))
    else if item.kind === 'tool':
      updated = await lessonToolsApi.update(item.id, { isRequired: newValue })
      setTools(prev => prev.map(t => t.id === item.id ? updated : t))
  catch (err):
    // Rollback
    if item.kind === 'resource':
      setResources(prev => prev.map(r =>
        r.id === item.id ? { ...r, isRequired: item.isRequired } : r
      ))
    else:
      setTools(prev => prev.map(t =>
        t.id === item.id ? { ...t, isRequired: item.isRequired } : t
      ))
    display <ErrorMessage> (set local error state in AssignmentListItem or bubble up)
}
```

---

### 9.4 handleQuizAttemptError — REQUIRED_ASSIGNMENTS_INCOMPLETE guard

The server enforces the quiz lock as a second line of defense. If the client's `quizUnlocked` check fails but the student somehow starts the quiz:

```
function handleQuizAttemptError(error: ApiClientError) {
  if error.code === 'REQUIRED_ASSIGNMENTS_INCOMPLETE':
    // Navigate back to assignment list view, show message
    setActiveAssignmentKey('lessonPlan')
    setError('Complete all required assignments to unlock the quiz.')
  else:
    setError(error.message)
}
```

This handler is passed to `QuizSection` as `onAttemptError` (or `QuizSection` handles it internally if that's its existing pattern — the existing `assessmentsApi.submitAttempt` throws `ApiClientError` on non-2xx responses).

---

### 9.5 UnitDropdown navigation flow

```
async function handleUnitSelect(selectedUnit: Unit) {
  if selectedUnit.id === currentUnitId:
    setDropdownOpen(false)
    return

  setNavLoading(true)
  try:
    lessons = await lessonsApi.getAll(selectedUnit.id)
    sorted = lessons.sort((a, b) => a.order - b.order)
    if sorted.length === 0:
      // No lessons in unit — navigate to course page as fallback
      navigate(`/courses/${courseId}`)
    else:
      navigate(`/courses/${courseId}/units/${selectedUnit.id}/lessons/${sorted[0].id}`)
  catch:
    // Show error in dropdown, do not navigate
  finally:
    setNavLoading(false)
    setDropdownOpen(false)
}
```

---

### 9.6 Locked quiz click behavior

```
// In AssignmentListItem when kind === 'quiz' and isLocked === true
function handleLockedQuizClick() {
  setShowLockHint(prev => !prev)
  // showLockHint renders inline message below the item:
  // "Complete all required assignments to unlock the quiz."
}
// The button is NOT disabled (allows click for hint); it just does not call onSelect.
// aria-label="Quiz locked. Complete all required assignments first."
```

---

## 10. Styling Notes

All styling uses Tailwind CSS 4 with project semantic tokens. The `dark:` prefix is never used — CSS variables handle mode switching automatically.

### Layout wrapper

```
// In LessonDetailPage
<div className="relative -mx-4 -mb-8 flex flex-col lg:flex-row min-h-[calc(100vh-4.5rem)]"
     style={{ width: '100vw', left: '50%', marginLeft: '-50vw' }}>

  <UnitLessonSidebar ... />         {/* w-56 hidden lg:flex — nav only */}

  <div className="flex-1 flex flex-col min-w-0">
    {/* Lesson header — static */}
    <header className="px-4 py-3 border-b border-border shrink-0">...</header>

    {/* Assignment stepper — sticky */}
    <AssignmentStepper
      items={assignmentItems}
      activeStepKey={activeStepKey}
      completedIds={completedIds}
      quizUnlocked={quizUnlocked}
      onStepClick={key => document.getElementById(`assignment-${key}`)
                           ?.scrollIntoView({ behavior: 'smooth' })}
    />

    {/* Lesson scroll — all assignment sections stacked */}
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
      {assignmentItems.map((item, index) => (
        <AssignmentSection
          key={item.key}
          item={item}
          isComplete={completedIds.has(`${item.kind}:${item.id}`)}
          isLocked={item.kind === 'quiz' && !quizUnlocked}
          canEdit={canEdit}
          isFirst={index === 0}
          isLast={index === assignmentItems.length - 1}
          onVisible={key => setActiveStepKey(key)}
          onNext={() => scrollToSection(assignmentItems[index + 1]?.key)}
          {/* ...handlers */}
        >
          {renderContent(item)}   {/* LessonPlanView, NoteEditor, etc. */}
        </AssignmentSection>
      ))}
      {canEdit && <AddAssignmentButton onAdd={handleAddAssignment} />}
    </div>
  </div>

  <StudentToolsBar ... />           {/* w-10 hidden lg:flex; horizontal on mobile */}
</div>

{activeTool !== null && !isQuizActive && (
  <StudentMaterialsModal ... />
)}
```

### UnitLessonSidebar desktop

```
// Expanded:
"hidden lg:flex lg:flex-col w-56 shrink-0 border-r border-border bg-surface overflow-y-auto"
// Collapsed:
"hidden lg:flex lg:flex-col w-14 shrink-0 border-r border-border bg-surface overflow-y-auto"
```

Collapse toggle button: `"p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised"`

### UnitDropdown trigger

```
"flex items-center justify-between px-3 py-2 rounded-lg bg-surface-raised
 hover:bg-surface-raised/80 text-sm font-medium text-foreground w-full"
```

Dropdown panel: `"absolute z-50 bg-surface border border-border rounded-lg shadow-warm-md py-1 w-full"`

Current unit option: `"bg-primary-subtle text-primary font-medium"`

Other unit option: `"text-muted-foreground hover:text-foreground hover:bg-surface-raised"`

### AssignmentListItem

Default (not selected): `"flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"`

Selected: `"bg-primary-subtle text-primary font-medium"`

Locked quiz: `"text-muted-foreground/50 cursor-not-allowed"`

REQ badge: `"text-xs px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium"`

OPT badge: `"text-xs px-1.5 py-0.5 rounded bg-surface-raised text-muted-foreground font-medium"`

Reorder arrows: `"p-0.5 rounded text-muted-foreground hover:text-foreground"`

Delete button: `"p-0.5 rounded text-muted-foreground hover:text-destructive"`

### StudentToolsBar (desktop)

```
"hidden lg:flex lg:flex-col w-10 shrink-0 border-l border-border bg-surface items-center py-3 gap-2"
```

Tool button default: `"flex flex-col items-center gap-0.5 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised"`

Tool button active: `"bg-primary-subtle text-primary rounded-lg"`

### StudentToolsBar (mobile)

```
"flex lg:hidden flex-row gap-2 px-4 py-2 border-b border-border bg-surface"
```

### StudentMaterialsModal

Desktop floating panel:
```
"fixed z-50 w-80 rounded-xl border border-border bg-surface shadow-warm-lg"
// position via style={{ left: position.x, top: position.y }}
// default: style={{ bottom: 24, right: 56 }} (right-14 to clear the tools bar)
```

Drag handle:
```
"flex items-center justify-between px-3 py-2 bg-surface-raised rounded-t-xl cursor-grab select-none"
```

Tool switcher row (inside modal, below drag handle):
```
"flex items-center gap-1 px-3 py-2 border-b border-border"
```
Active: `"p-1.5 rounded-md bg-primary-subtle text-primary"`; inactive: `"p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-raised"`

Mobile bottom sheet:
```
"fixed inset-x-0 bottom-0 z-50 rounded-t-xl border-t border-border bg-surface max-h-[60vh] overflow-y-auto"
```

Backdrop (mobile only): `"fixed inset-0 z-40 bg-black/30"`

### AssignmentSection header

```
"flex items-center gap-2 px-4 py-3 border-b border-border"
```

Section footer: `"flex items-center justify-between px-4 py-3 border-t border-border"`

Scroll container spacing: `"flex-1 overflow-y-auto px-4 py-6 space-y-8"`

---

## 11. Edge Cases and Error Handling

### Loading states

| Scenario | Behavior |
|---|---|
| Initial page load | `<LoadingSpinner />` fills page until all parallel fetches resolve |
| UnitDropdown navigation | `navLoading: true` renders `<LoadingSpinner />` inside dropdown trigger, disables trigger button |
| Required/optional toggle saving | Optimistic update applied immediately; badge shows `text-muted-foreground` opacity during save; reverts on error |
| Assignment reorder saving | Optimistic list reorder applied; reverts on API error |

### Empty states

| Scenario | Behavior |
|---|---|
| Lesson has no resources or tools | Assignment list shows only "Lesson Plan" and "Quiz" items; quiz is locked until lesson plan is complete (or immediately if lessonPlan `isRequired` is false — but lessonPlan is always required) |
| Unit has no lessons (dropdown navigation) | Navigate to `/courses/:courseId` as fallback |
| Student note is empty | Placeholder text: "Write your personal notes here… They save automatically." (preserved from existing `StudentNotePanel`) |

### Validation and API errors

| Scenario | Behavior |
|---|---|
| `GET` on page load fails | `<ErrorMessage message={error} />` replaces page |
| `PUT /resources/:id` or `PUT /tools/:id` fails | Optimistic update rolled back; `<ErrorMessage>` displayed inline near the item (local `itemError` state in `AssignmentListItem` or via a toast if the project adds one) |
| `DELETE` resource/tool fails | Item reappears (optimistic removal reverted); `<ErrorMessage>` shown |
| `POST /assessments/:id/attempts` returns `REQUIRED_ASSIGNMENTS_INCOMPLETE` | Display: "Complete all required assignments to unlock the quiz." This is a server-side guard; the client's quiz lock UI should prevent reaching this state under normal use |
| 401 on any call | Global `auth:unauthorized` event fires → `apiClient` handles logout automatically |
| 403 on required/optional toggle | `<ErrorMessage>` shown; UI control was not supposed to be accessible to students — log a warning |
| Required/optional toggle on `lessonPlan` or `quiz` items | These items must never render the REQ/OPT badge toggle; the toggle is only shown for `AssignmentItem.kind === 'resource'` or `'tool'`. Guard in `AssignmentListItem` |

### Completion and quiz lock edge cases

| Scenario | Behavior |
|---|---|
| All items are optional (`isRequired: false`) | `quizUnlocked` is `true` on page load (no required items → guard passes) |
| Teacher changes an item to required after student completed it | `completedIds` still includes the item → quiz remains unlocked if all required are done |
| Teacher changes a completed item to required, student has not completed it | Quiz becomes locked; lock hint shows the correct incomplete item |
| Student clicks locked quiz | `showLockHint` toggled; inline message appears below quiz item; no navigation |
| Student tools during quiz | `StudentToolsBar` and `StudentMaterialsModal` not rendered when `isQuizActive`; `activeTool` resets to `null`; notes auto-saved. The quiz `AssignmentSection` renders `QuizSection` inline — the rest of the scroll is still visible above it but no new sections below. |
| Lesson change within the same unit | `useEffect` re-fires on `lessonId` change; all state resets; `activeStepKey` resets to first item; scroll position resets to top; `StudentNotePanel` resets on `lessonId` change (existing behavior preserved) |

### Responsive / mobile

| Scenario | Behavior |
|---|---|
| Mobile: sidebar closed, assignment clicked | Panel collapses after selection (existing pattern in `UnitLessonSidebar`) |
| Mobile: quiz active | Tools bar and modal not rendered; same as desktop |
| Sidebar collapsed (desktop) | Icon-only mode: assignment items show only icon + optional completion dot; title hidden; teacher controls hidden |
