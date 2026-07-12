---
id: cm-0011
title: Decompose Oversized Frontend Components
stage: design
status: approved
approver: human
approved_at: 2026-05-08T00:00:00Z
---

# Frontend Plan: Decompose Oversized Frontend Components

## 1. Overview

This plan covers three independent decompositions that together eliminate the three oversized components identified in the spec. All behavioral contracts, visual output, API calls, and accessibility attributes are preserved exactly — this is a structural refactor only.

**Decomposition A — LessonDetailPage**: Replace the monolithic component with domain-scoped hooks — `useLesson` (shared lesson/course/unit metadata), `useResources` (resource state + handlers), `useTools` (tool state + handlers), `useAssignments` (assignment state + handlers) — plus focused sub-components (`LessonResourceContent`, `LessonToolContent`, `LessonAssignmentContent`, `LessonToolModals`) each consuming only the hook that owns their domain. UI navigation state (`activeStepKey`, `activeTool`) and page-level modal flags (`showSettings`, `showPlanEdit`) stay in `LessonDetailPage` — they are genuinely cross-cutting. The page component becomes ~150 lines of layout and composition.

**Decomposition B — Unified AssessmentSection**: Replace `QuizSection`, `TestSection`, and `ExamSection` with a single `AssessmentSection` component parameterized by an `AssessmentConfig` object. The three original files are deleted after all call sites are updated.

**Decomposition C — Question-Type Editors**: Lift `MultipleChoiceEditor`, `TrueFalseEditor`, `MatchingEditor`, and `FillInBlankEditor` out of `PracticeProblemAssignmentForm` into their own files under `client/src/features/assignments/question-editors/`. A shared `QuestionTypeEditorProps` interface governs all four. `QuestionCard` inside `PracticeProblemAssignmentForm` renders them via a lookup map with no per-type branching.

---

## 2. Folder Structure

New files to create (all paths relative to repo root):

```
client/src/features/lessons/hooks/useLesson.ts
client/src/features/lessons/hooks/useResources.ts
client/src/features/lessons/hooks/useTools.ts
client/src/features/lessons/hooks/useAssignments.ts

client/src/features/lessons/LessonResourceContent.tsx
client/src/features/lessons/LessonToolContent.tsx
client/src/features/lessons/LessonAssignmentContent.tsx
client/src/features/lessons/LessonToolModals.tsx

client/src/features/assessments/AssessmentSection.tsx

client/src/features/assignments/question-editors/MultipleChoiceEditor.tsx
client/src/features/assignments/question-editors/TrueFalseEditor.tsx
client/src/features/assignments/question-editors/MatchingEditor.tsx
client/src/features/assignments/question-editors/FillInBlankEditor.tsx
client/src/features/assignments/question-editors/index.ts
```

Files to be modified:

```
client/src/features/lessons/LessonDetailPage.tsx          (gutted to layout + composition, ~150 lines)
client/src/features/assignments/PracticeProblemAssignmentForm.tsx  (QuestionCard uses lookup map; editor code deleted)
```

Files to be deleted (after call sites updated):

```
client/src/features/quizzes/QuizSection.tsx
client/src/features/tests/TestSection.tsx
client/src/features/exams/ExamSection.tsx
```

---

## 3. Component Tree

### Decomposition A — LessonDetailPage sub-components

#### Domain-scoped hooks (replacing the single `useLessonDetail` approach)

Rather than one monolithic hook that returns 35+ values, state is co-located with the domain that owns it. Each sub-component calls its own hook directly. `LessonDetailPage` calls `useLesson` for shared metadata and retains only the two pieces of cross-cutting UI state that no single section owns.

---

#### `useLesson`

- **File**: `client/src/features/lessons/hooks/useLesson.ts`
- **Consumed by**: `LessonDetailPage`
- **Owns**: lesson, courseTitle, units, unitLessons, loading, error — all fetched together in one `Promise.all` since they are all needed before any section can render; `canEdit` derived from `useAuth()`; `handleAddLesson`, `handleUpdate`, `handleDelete` (lesson-level CRUD); `unitProgress` (needed for assignment gating)
- **Does NOT own**: resources, tools, assignments, any modal state, any navigation state

---

#### `useResources`

- **File**: `client/src/features/lessons/hooks/useResources.ts`
- **Consumed by**: `LessonDetailPage` (passed into `LessonResourceContent` and `LessonToolModals` as props)
- **Owns**: `resources`, `completionsData`, `completedIds` (Set), `editingVideoId`, `newNoteIdRef`; handlers: `handleToggleCompletion`, `handleToggleRequired`, `handleAddNote`, `handleMoveResource`; `setResources` setter (for modal updates)
- **Parameters**: `lessonId: string | undefined`
- **Does NOT own**: tools, assignments, any modal rendering

---

#### `useTools`

- **File**: `client/src/features/lessons/hooks/useTools.ts`
- **Consumed by**: `LessonDetailPage` (passed into `LessonToolContent` and `LessonToolModals`)
- **Owns**: `tools`, `editingTool`, `setEditingTool`; handler: `handleMoveTool`; `setTools` setter (for post-save updates from modals)
- **Parameters**: `lessonId: string | undefined`
- **Does NOT own**: resources, assignments

---

#### `useAssignments`

- **File**: `client/src/features/lessons/hooks/useAssignments.ts`
- **Consumed by**: `LessonDetailPage` (passed into `LessonAssignmentContent` and assignment modal layer)
- **Owns**: `assignments`, `assignmentItems`, `completedAssignmentIds`, `incompleteRequired`, `availableTools`; modal state: `isAddingAssignment`, `editingAssignment`, `deletingAssignmentId` and their setters; handlers: `handleCreateAssignment`, `handleUpdateAssignment`, `handleDeleteAssignment`, `handleMoveAssignment`, `handleToggleAssignmentCompletion`; `buildAssignmentItems` and `nextOrder` as module-level helpers in this file; `completionKeyOf` helper
- **Parameters**: `lessonId: string | undefined`, `unitProgress: UnitProgress | null`
- **Does NOT own**: resources, tools, lesson metadata

---

#### State that stays in `LessonDetailPage`

| State | Reason |
|---|---|
| `activeStepKey`, `setActiveStepKey` | Controls stepper navigation across all section types — no single section owns it |
| `activeTool`, `setActiveTool` | Controls the student tool strip — cross-cutting UI |
| `showSettings`, `setShowSettings` | Page-level settings modal |
| `showPlanEdit`, `setShowPlanEdit` | Page-level plan edit modal |

These four pieces of state belong in the page component because they govern layout and overlay behavior that spans all sections. Moving them into a hook would just be indirection with no isolation benefit.

---

#### `LessonResourceContent`

- **File**: `client/src/features/lessons/LessonResourceContent.tsx`
- **Type**: UI component
- **Responsibility**: Renders the correct UI for a `LessonResource` given its type (`video`, `note`, `lecture`). Handles the inline video form toggle, NoteEditor with `initialEditing` flag for new notes. Returns `null` for unknown types.
- **Props**:

```typescript
interface LessonResourceContentProps {
  resource: LessonResource;
  canEdit: boolean;
  editingVideoId: string | null;
  newNoteIdRef: React.RefObject<string | null>;
  onVideoEditStart: (id: string) => void;
  onVideoEditCancel: () => void;
  onVideoUpdated: (updated: LessonResource) => void;
  onVideoDeleted: (id: string) => void;
  onNoteUpdated: (updated: LessonResource) => void;
}
```

- **Does NOT own**: state, API calls (those are passed in as callbacks), routing

---

#### `LessonToolContent`

- **File**: `client/src/features/lessons/LessonToolContent.tsx`
- **Type**: UI component
- **Responsibility**: Renders the correct read-mode UI for a `LessonTool` given its type (`flash_card`, `practice_problem`, `vocab`). Does not render edit forms — those live in modals owned by `LessonToolModals`. Signals edit intent via `onEditRequest`.
- **Props**:

```typescript
interface LessonToolContentProps {
  tool: LessonTool;
  canEdit: boolean;
  onEditRequest: (tool: LessonTool) => void;
  onDeleted: (id: string) => void;
  onToolUpdated: (updated: LessonTool) => void;
}
```

- **Notes**: `FlashCard` handles its own inline edit state (receives `onUpdate` callback). For `practice_problem` and `vocab`, edit is routed to a modal via `onEditRequest`. The delete callbacks call the API inline (same pattern as current code) and then call `onDeleted`.
- **Does NOT own**: modal rendering, form components

---

#### `LessonAssignmentContent`

- **File**: `client/src/features/lessons/LessonAssignmentContent.tsx`
- **Type**: UI component
- **Responsibility**: Renders the correct view component for a given `Assignment` type (`note`, `video`, `reading`, `vocab`, `practice_problem`). Also handles the `PracticeProblemRunner` auto/manual complete callbacks.
- **Props**:

```typescript
interface LessonAssignmentContentProps {
  assignment: Assignment;
  onToggleAssignmentCompletion: (assignment: Assignment) => Promise<void>;
}
```

- **Does NOT own**: assignment CRUD, stepper navigation, completion state (passed in via callback)

---

#### `LessonToolModals`

- **File**: `client/src/features/lessons/LessonToolModals.tsx`
- **Type**: UI component (modal orchestration fragment)
- **Responsibility**: Renders the three tool-edit modals (`FlashCardForm`, `PracticeProblemForm`, `VocabForm`) that are currently inlined at the bottom of `LessonDetailPage`. Conditionally renders based on `editingTool?.type`.
- **Props**:

```typescript
interface LessonToolModalsProps {
  canEdit: boolean;
  editingTool: LessonTool | null;
  onClose: () => void;
  onToolUpdated: (updated: LessonTool) => void;
}
```

- **Does NOT own**: assignment modals, settings modals, plan modals (those stay in the page or are already in their own files)
- **Notes**: The API calls to `lessonToolsApi.update` move into this component from `LessonDetailPage`. After a successful update, `onToolUpdated` is called with the server response so the page hook's `setTools` can update the list.

---

#### `LessonDetailPage` (after refactor)

- **File**: `client/src/features/lessons/LessonDetailPage.tsx`
- **Type**: page component
- **Responsibility**: Route entry point. Calls `useLesson`, `useResources`, `useTools`, `useAssignments`; owns `activeStepKey`, `activeTool`, `showSettings`, `showPlanEdit`; assembles `stepperItems`, computes `activeItem`/`activeIdx`; renders layout shell (sidebar, header, stepper, main, desktop tool strip); delegates content rendering to `LessonResourceContent`, `LessonToolContent`, and `LessonAssignmentContent`; renders modal layer (settings, plan edit, `LessonToolModals`, assignment create/edit/delete). Target: ≤ 280 lines.
- **Does NOT own**: domain data fetching, domain state, or domain handler logic (those live in the four scoped hooks)

---

### Decomposition B — AssessmentSection

#### `AssessmentSection`

- **File**: `client/src/features/assessments/AssessmentSection.tsx`
- **Type**: UI component
- **Responsibility**: Unified replacement for `QuizSection`, `TestSection`, and `ExamSection`. Accepts an `AssessmentConfig` object that parameterizes all behavioral differences. Internally calls `useAssessment` with the provided API adapter.

**Prop interface**:

```typescript
type AssessmentDisplayMode = 'inline' | 'modal-only';

interface AssessmentConfig {
  /** The ID of the parent entity (lessonId, unitId, or courseId) */
  parentId: string;

  /** The API adapter built from assessmentsApi methods */
  api: AssessmentApi;  // same interface as useAssessment expects

  /** Display label for the assessment (e.g. "Lesson Quiz", "Unit Test", "Final Exam") */
  label: string;

  /** Labels for action buttons and modal titles */
  createLabel: string;   // e.g. "Create Quiz", "Create Test", "Create Exam"
  takeLabel: string;     // e.g. "Take Quiz", "Take Test"
  retakeLabel: string;   // e.g. "Retake Test"
  modalTitle: string;    // e.g. "Lesson Quiz", "Unit Test", "Final Exam"
  resultsTitle: string;  // e.g. "Quiz Results", "Test Results", "Final Exam Results"

  /** 'inline' = renders a card with buttons; 'modal-only' = renders nothing when idle */
  displayMode: AssessmentDisplayMode;

  /** Whether teacher/admin users can edit the assessment questions */
  canEdit?: boolean;

  /**
   * 'modal-only' mode only: external open/close control.
   * When open=true, the component immediately opens the appropriate modal.
   */
  open?: boolean;
  onClose?: () => void;

  /**
   * 'inline' mode only: when provided and false (and canEdit is false),
   * the take button is disabled and a gating message is shown.
   */
  unlocked?: boolean;

  /** Message shown when unlocked=false and canEdit=false */
  lockedMessage?: string;
}
```

**Behavioral mapping**:

| Variation | `displayMode` | `canEdit` | `unlocked` | `open`/`onClose` |
|-----------|--------------|-----------|------------|-----------------|
| QuizSection | `'inline'` | not provided (no edit) | not provided (no gating) | not used |
| TestSection | `'inline'` | passed from parent | `allLessonsComplete` | not used |
| ExamSection | `'modal-only'` | not needed | not needed | controlled externally |

**Internal behavior**:
- When `displayMode === 'modal-only'`: no card is rendered when idle; component responds to `open` prop changes via a `useEffect` that calls `setView(exam === null ? 'creating' : 'taking')` when `open` becomes true (same logic as current `ExamSection`).
- When `displayMode === 'inline'`: renders the same card layout as current `QuizSection`/`TestSection`, including the attempt history list. Shows edit button only when `canEdit` is true and an assessment exists. Shows gating message when `unlocked === false && !canEdit`.
- Edit capability: when `canEdit` is true, exposes edit flow using `handleUpdate` from `useAssessment`. The `editQuestions` local state (currently only in `TestSection`) moves into `AssessmentSection` behind the `canEdit` flag.

**Call sites after migration**:

In `LessonDetailPage`, replace:
```tsx
<QuizSection lessonId={lesson!.id} />
```
with:
```tsx
<AssessmentSection
  parentId={lesson!.id}
  api={quizApi}
  label="Lesson Quiz"
  createLabel="Create Quiz"
  takeLabel="Take Quiz"
  retakeLabel="Retake Quiz"
  modalTitle="Lesson Quiz"
  resultsTitle="Quiz Results"
  displayMode="inline"
/>
```

Replace:
```tsx
<TestSection unitId={unitId!} canEdit={canEdit} allLessonsComplete={allLessonsComplete} />
```
with:
```tsx
<AssessmentSection
  parentId={unitId!}
  api={testApi}
  label="Unit Test"
  createLabel="Create Test"
  takeLabel="Take Test"
  retakeLabel="Retake Test"
  modalTitle="Unit Test"
  resultsTitle="Test Results"
  displayMode="inline"
  canEdit={canEdit}
  unlocked={allLessonsComplete}
  lockedMessage="Complete all lessons to unlock the unit test."
/>
```

In `CourseDetailPage` (wherever `ExamSection` is called), replace with:
```tsx
<AssessmentSection
  parentId={courseId}
  api={examApi}
  label="Final Exam"
  createLabel="Create Final Exam"
  takeLabel="Take Exam"
  retakeLabel="Retake Exam"
  modalTitle="Final Exam"
  resultsTitle="Final Exam Results"
  displayMode="modal-only"
  open={examOpen}
  onClose={() => setExamOpen(false)}
/>
```

---

### Decomposition C — Question-Type Editors

#### Shared interface

All four extracted editors conform to:

```typescript
// client/src/features/assignments/question-editors/index.ts

export interface QuestionTypeEditorProps {
  content: Record<string, unknown>;
  /** The index of this question within the list (used for unique input name attributes) */
  index: number;
  onChange: (content: Record<string, unknown>) => void;
}

export type QuestionTypeEditor = React.ComponentType<QuestionTypeEditorProps>;
```

Note: `MatchingEditor` and `FillInBlankEditor` do not currently use `index` in their JSX. The prop is included in the shared interface to keep all four editors substitutable. Those two components simply ignore it.

#### `MultipleChoiceEditor`

- **File**: `client/src/features/assignments/question-editors/MultipleChoiceEditor.tsx`
- **Props**: `QuestionTypeEditorProps` (uses `content`, `index`, `onChange`)
- **Extracted from**: lines 37–115 of `PracticeProblemAssignmentForm.tsx`
- **Owns**: option management (add, remove, setOption), correct-index selection UI

#### `TrueFalseEditor`

- **File**: `client/src/features/assignments/question-editors/TrueFalseEditor.tsx`
- **Props**: `QuestionTypeEditorProps` (uses `content`, `index`, `onChange`)
- **Extracted from**: lines 125–165 of `PracticeProblemAssignmentForm.tsx`
- **Owns**: true/false radio button pair

#### `MatchingEditor`

- **File**: `client/src/features/assignments/question-editors/MatchingEditor.tsx`
- **Props**: `QuestionTypeEditorProps` (uses `content`, `onChange`; `index` accepted but unused)
- **Extracted from**: lines 174–283 of `PracticeProblemAssignmentForm.tsx`
- **Owns**: pair management (add, remove, updateLeft, updateRight, updatePair)

#### `FillInBlankEditor`

- **File**: `client/src/features/assignments/question-editors/FillInBlankEditor.tsx`
- **Props**: `QuestionTypeEditorProps` (uses `content`, `onChange`; `index` accepted but unused)
- **Extracted from**: lines 298–377 of `PracticeProblemAssignmentForm.tsx`
- **Owns**: blank management (add, remove, updateBlankAnswer, updateAlternatives)

#### `index.ts` (barrel)

```typescript
// client/src/features/assignments/question-editors/index.ts

export type { QuestionTypeEditorProps, QuestionTypeEditor } from './index.js';
export { default as MultipleChoiceEditor } from './MultipleChoiceEditor.js';
export { default as TrueFalseEditor } from './TrueFalseEditor.js';
export { default as MatchingEditor } from './MatchingEditor.js';
export { default as FillInBlankEditor } from './FillInBlankEditor.js';
```

#### `QuestionCard` after extraction (stays in `PracticeProblemAssignmentForm.tsx`)

The `QuestionCard` function remains in `PracticeProblemAssignmentForm.tsx` but replaces the four conditional render blocks with a lookup map:

```typescript
import {
  MultipleChoiceEditor,
  TrueFalseEditor,
  MatchingEditor,
  FillInBlankEditor,
  type QuestionTypeEditor,
} from './question-editors/index.js';
import type { PracticeQuestionType } from '../../api/types.js';

const EDITORS: Record<PracticeQuestionType, QuestionTypeEditor> = {
  multiple_choice: MultipleChoiceEditor,
  true_false: TrueFalseEditor,
  matching: MatchingEditor,
  fill_in_blank: FillInBlankEditor,
};
```

Inside `QuestionCard.render`:
```tsx
const Editor = EDITORS[question.type];
<Editor content={question.content} index={index} onChange={handleContentChange} />
```

This replaces the four `{question.type === 'x' && <XEditor ... />}` branches with a single expression and satisfies FR-10.

---

## 4. Client Routes

No new or modified routes. All changes are internal to `LessonDetailPage` (path: `/courses/:courseId/units/:unitId/lessons/:lessonId`) and `CourseDetailPage` (path: `/courses/:courseId`). Route components, auth guards, and path params are unchanged.

---

## 5. Hooks and Data Fetching

The four domain hooks replace the single `useLessonDetail` approach. API calls are distributed to the hook that owns that domain. No new API calls are introduced — the set is identical to today's `LessonDetailPage`.

### `useLesson`

- **File**: `client/src/features/lessons/hooks/useLesson.ts`
- **Parameters**: `{ courseId, unitId, lessonId }: Record<string, string | undefined>`
- **API calls**:
  - `lessonsApi.getOne(unitId, lessonId)` — fetched together in a single `Promise.all` with units and course
  - `unitsApi.getAll(courseId)`
  - `coursesApi.getOne(courseId)`
  - `lessonsApi.getAll(unitId)` (unit lesson list for stepper)
  - `progressApi.getUnit(courseId, unitId)` (unitProgress for assignment gating)
  - `lessonsApi.update`, `lessonsApi.delete`, `unitsApi.addLesson` (handlers)
- **Loading / error**: `loading: boolean`, `error: string` — gate all section rendering at the page level

### `useResources`

- **File**: `client/src/features/lessons/hooks/useResources.ts`
- **Parameters**: `lessonId: string | undefined`
- **API calls**:
  - `lessonResourcesApi.getAll(lessonId)` — initial fetch
  - `resourceCompletionsApi.get(lessonId)` — initial fetch (fetched in same effect)
  - `lessonResourcesApi.create`, `lessonResourcesApi.update`, `lessonResourcesApi.delete`, `lessonResourcesApi.reorder` (handlers)
  - `resourceCompletionsApi.toggle` (handleToggleCompletion)

### `useTools`

- **File**: `client/src/features/lessons/hooks/useTools.ts`
- **Parameters**: `lessonId: string | undefined`
- **API calls**:
  - `lessonToolsApi.getAll(lessonId)` — initial fetch
  - `lessonToolsApi.reorder` (handleMoveTool)
  - (Tool CRUD happens inside `LessonToolModals` which calls `lessonToolsApi.update` directly and calls `onToolUpdated` callback)

### `useAssignments`

- **File**: `client/src/features/lessons/hooks/useAssignments.ts`
- **Parameters**: `lessonId: string | undefined`, `unitProgress: UnitProgress | null`
- **API calls**:
  - `assignmentsApi.getAll(lessonId)` — initial fetch
  - `assignmentsApi.create`, `assignmentsApi.update`, `assignmentsApi.delete`, `assignmentsApi.reorder` (handlers)
  - `assignmentsApi.toggleCompletion` (handleToggleAssignmentCompletion)

**No cache strategy** — all hooks match current behavior: fetch on mount, update state directly on mutations, no SWR/React Query.

---

## 6. API Integration

This refactor introduces no new API calls. The mapping is 1:1 with the current `LessonDetailPage` and the three assessment sections. Every call that exists today moves to the appropriate hook or component without modification to method, path, or payload shape.

The only structural change is that `lessonToolsApi.update` calls (currently in the modal closures inside `LessonDetailPage`) move into `LessonToolModals`. The call signatures are identical.

No api-contract is required for this spec — there are no backend or API changes.

---

## 7. State Management

All state remains local — this project has no global store (per `client/CLAUDE.md`). The refactor reorganizes local state as follows:

| State slice | Current owner | After refactor |
|---|---|---|
| lesson, courseTitle, units, unitLessons, unitProgress | LessonDetailPage | `useLesson` |
| loading, error, canEdit | LessonDetailPage | `useLesson` |
| handleAddLesson, handleUpdate, handleDelete | LessonDetailPage | `useLesson` |
| resources, completionsData, completedIds | LessonDetailPage | `useResources` |
| editingVideoId, newNoteIdRef | LessonDetailPage | `useResources` |
| handleToggleCompletion, handleToggleRequired, handleAddNote, handleMoveResource | LessonDetailPage | `useResources` |
| tools, editingTool | LessonDetailPage | `useTools` |
| handleMoveTool | LessonDetailPage | `useTools` |
| assignments, assignmentItems, completedAssignmentIds, incompleteRequired, availableTools | LessonDetailPage | `useAssignments` |
| isAddingAssignment, editingAssignment, deletingAssignmentId | LessonDetailPage | `useAssignments` |
| handleCreateAssignment, handleUpdateAssignment, handleDeleteAssignment, handleMoveAssignment, handleToggleAssignmentCompletion | LessonDetailPage | `useAssignments` |
| activeStepKey, activeTool | LessonDetailPage | LessonDetailPage (cross-cutting UI) |
| showSettings, showPlanEdit | LessonDetailPage | LessonDetailPage (cross-cutting UI) |
| editQuestions (test edit state) | TestSection | AssessmentSection (behind canEdit flag) |

No state is promoted to context. No state is duplicated across components. Child components receive only what they render — they do not hold their own copy of shared data.

---

## 8. Authentication and Authorization

No changes to auth patterns. The `canEdit` boolean (derived as `user?.role === 'teacher' || user?.role === 'admin'` from `useAuth()`) is computed once in `useLesson` and threaded through to child components via props, exactly as it is today.

- `LessonResourceContent`: receives `canEdit` to gate video edit/delete and note editor mode
- `LessonToolContent`: receives `canEdit` to gate edit/delete calls
- `LessonToolModals`: receives `canEdit` guard so modals only mount when true
- `AssessmentSection`: receives `canEdit` to gate edit button visibility
- `LessonDetailPage`: retains its existing `canEdit` check before rendering the settings button and assignment CRUD modals

No new `RequireAuth` or `RequireRole` wrappers are added. The page route is unchanged and relies on the existing auth gate in the router.

---

## 9. Pseudocode for Complex Logic

No pseudocode required per the task instructions for this refactor plan. The logic being moved is a mechanical extraction — all algorithms, optimistic update patterns, and revert strategies are preserved byte-for-byte from the originals. The sequencing notes in section 11 describe the safe migration order.

---

## 10. Styling Notes

No styling changes. All Tailwind classes are preserved exactly as authored in the source files. No new utility classes are introduced. The semantic token set (`bg-surface`, `text-foreground`, `border-border`, etc.) and shadow utilities remain as-is in every extracted component.

The project does not use `dark:` prefixes — this convention is already followed and is unchanged by this refactor.

---

## 11. Migration Order and Sequencing

Each step must leave the application in a working state before the next step begins.

### Step 1 — Extract question-type editors (Decomposition C, lowest risk)

1. Create `client/src/features/assignments/question-editors/` directory.
2. Create `MultipleChoiceEditor.tsx`, `TrueFalseEditor.tsx`, `MatchingEditor.tsx`, `FillInBlankEditor.tsx` by lifting the four private functions verbatim from `PracticeProblemAssignmentForm.tsx`, converting them to default exports, and applying the `QuestionTypeEditorProps` interface.
3. Create the barrel `index.ts`.
4. In `PracticeProblemAssignmentForm.tsx`: delete the four private functions, import from the barrel, replace the four conditional render branches in `QuestionCard` with the `EDITORS` lookup map.
5. Smoke test: open an assignment form with practice problem type and verify all four question types render and function correctly.

### Step 2 — Extract domain-scoped hooks (Decomposition A, prerequisite for page split)

Extract one hook at a time, keeping the page functional after each step.

1. Create `client/src/features/lessons/hooks/useLesson.ts`. Move lesson/course/unit fetching, `unitProgress`, `canEdit`, and lesson-level handlers out of `LessonDetailPage`. Replace with `const { lesson, courseTitle, ... } = useLesson({ courseId, unitId, lessonId })`. Smoke test: page loads and lesson CRUD works.

2. Create `client/src/features/lessons/hooks/useAssignments.ts`. Move `assignments`, all assignment state, `buildAssignmentItems`, `nextOrder`, `completionKeyOf`, and all assignment handlers. Move `availableTools` and `incompleteRequired` derivations here. Replace in `LessonDetailPage` with `const { assignments, assignmentItems, ... } = useAssignments(lessonId, unitProgress)`. Smoke test: assignment creation, editing, deletion, reorder, and completion toggling all work.

3. Create `client/src/features/lessons/hooks/useResources.ts`. Move `resources`, `completionsData`, `completedIds`, `editingVideoId`, `newNoteIdRef`, and all resource handlers. Replace in `LessonDetailPage`. Smoke test: resource add/edit/delete/reorder and completion toggling work.

4. Create `client/src/features/lessons/hooks/useTools.ts`. Move `tools`, `editingTool`, `setEditingTool`, and `handleMoveTool`. Replace in `LessonDetailPage`. Smoke test: tool reorder and modal open/close work.

After Step 2, `LessonDetailPage` should contain only the four cross-cutting state pieces (`activeStepKey`, `activeTool`, `showSettings`, `showPlanEdit`), the hook calls, and the render tree. The visual output is identical.

### Step 3 — Extract LessonResourceContent (Decomposition A, continued)

1. Create `LessonResourceContent.tsx` with the video/note/lecture rendering logic lifted from `renderContent` in `LessonDetailPage`.
2. In `LessonDetailPage`'s `renderContent`: replace the resource block with `<LessonResourceContent resource={resource} ... />`.
3. Smoke test: video, note, and lecture rendering and edit flows work.

### Step 4 — Extract LessonToolContent (Decomposition A, continued)

1. Create `LessonToolContent.tsx` with flash card, practice problem, and vocab read-mode rendering.
2. In `LessonDetailPage`'s `renderContent`: replace the tool block with `<LessonToolContent tool={tool} ... />`.
3. Smoke test: all three tool types render and their delete flows work.

### Step 5 — Extract LessonAssignmentContent (Decomposition A, continued)

1. Create `LessonAssignmentContent.tsx` with the five assignment type renderers.
2. In `LessonDetailPage`'s `renderContent`: replace the assignment block with `<LessonAssignmentContent assignment={assignment} ... />`.
3. Smoke test: all five assignment types render and complete correctly.

### Step 6 — Extract LessonToolModals (Decomposition A, continued)

1. Create `LessonToolModals.tsx` with the three tool-edit modals (flash card, practice problem, vocab) and the `lessonToolsApi.update` calls they contain.
2. In `LessonDetailPage`: replace the three modal blocks with `<LessonToolModals canEdit={canEdit} editingTool={editingTool} onClose={() => setEditingTool(null)} onToolUpdated={updated => setTools(prev => prev.map(t => t.id === updated.id ? updated : t).sort((a, b) => a.order - b.order))} />`.
3. Smoke test: flash card, practice problem, and vocab edit modals open, save, and close correctly.
4. Verify `LessonDetailPage.tsx` is ≤ 280 lines.

### Step 7 — Create AssessmentSection (Decomposition B)

1. Create `client/src/features/assessments/AssessmentSection.tsx`. This is additive — no existing files are modified yet.
2. Implement the component with `displayMode`, `canEdit`, `unlocked`, `open`/`onClose` prop handling.
3. Update `LessonDetailPage` to use `AssessmentSection` in place of `QuizSection` and `TestSection`.
4. Find `ExamSection` call sites (expected: `CourseDetailPage`) and update them to use `AssessmentSection` with `displayMode="modal-only"`.
5. Smoke test: quiz and unit test flows work from the lesson page; course exam flow works from the course page.
6. Delete `QuizSection.tsx`, `TestSection.tsx`, `ExamSection.tsx`.
7. Final smoke test: confirm no import errors and all three assessment type flows are fully functional.

---

## 12. Edge Cases and Error Handling

The following edge cases are preserved exactly from the current implementation:

**LessonDetailPage / useLessonDetail**

- `loading` shows `<LoadingSpinner />` at the page level; `error` shows `<ErrorMessage />`. These gate all rendering — unchanged.
- `courseId`, `unitId`, `lessonId` can be `undefined` from `useParams`. The effect guards `if (!unitId || !lessonId || !courseId) return`. This guard moves into the hook unchanged.
- `handleDeleteAssignment` references `activeIdx` (derived from `assignmentItems` and `activeStepKey`). Because `activeIdx` is a derived value that must be computed from the memoized `assignmentItems` at the moment of deletion, it should be computed inside the handler using the current state snapshot rather than relying on a closed-over variable. This is the same pattern already present; the extraction should preserve it.
- Optimistic revert in `handleMoveResource` and `handleMoveTool`: rollback on catch. Preserved verbatim.
- Optimistic update in `handleToggleAssignmentCompletion`: revert on catch. Preserved verbatim.
- The `newNoteIdRef` one-shot flag: `isNew` is read and immediately cleared (`newNoteIdRef.current = null`) inside `LessonResourceContent`. The ref is passed from the hook through the page component into `LessonResourceContent` as a prop.

**AssessmentSection**

- `displayMode === 'modal-only'`: renders `null` when `!open && view === 'idle'` (same condition as current `ExamSection`). The `useEffect` on `open` must fire before any modal is shown — this is the same `useEffect` lifted verbatim from `ExamSection`.
- `unlocked === false && !canEdit`: take button is `disabled` and gating message is shown. Same as current `TestSection` logic.
- No assessment exists + `canEdit === false`: shows "not yet available" message (same as `TestSection` line 68-69: "Unit test not yet available."). For quiz mode, shows "No quiz created yet." with no create button (current `QuizSection` behavior — the create button renders for all users since quiz creation isn't teacher-gated in the original).
- Attempt history: only rendered when `attempts.length > 0`. Unchanged.
- `handleUpdate` is only called when `assessment` is non-null (guarded inside `useAssessment`). `editQuestions` state inside `AssessmentSection` is only initialized on `openEdit`, which is only reachable when `canEdit && assessment` is truthy.

**Question-type editors**

- `MultipleChoiceEditor`: `removeOption` guard `if (options.length <= 2) return` — preserved.
- `MatchingEditor`: `removePair` guard `if (leftItems.length <= 2) return` — preserved.
- `FillInBlankEditor`: `removeBlank` guard `if (blanks.length <= 1) return` — preserved.
- All `aria-label` attributes on buttons and inputs are preserved as authored.
- All `role="alert"` on the required-question validation message in `PracticeProblemAssignmentForm` is preserved.
