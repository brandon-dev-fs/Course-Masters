---
id: cm-0029
title: Frontend Plan — Consolidate LessonResource and LessonTool into Assignment Model
stage: design
status: approved
---

# Frontend Plan — Consolidate LessonResource and LessonTool into Assignment Model

## 1. Overview

This plan describes all client-side changes needed to remove the `LessonResource` and `LessonTool` models and consolidate all lesson content rendering through the existing `Assignment` model. The spec's acceptance criteria require:

- Removing all client API modules, types, components, hooks, and tests related to `LessonResource` and `LessonTool`.
- Updating the lesson detail page stepper and content area to render exclusively from the assignment list.
- Updating the resource completion system to use `assignmentId` instead of `{ resourceType, resourceId }`.
- Updating shared components (`FlashCardList`, `VocabCard`, `PracticeProblemCard`, `VideoCard`, `NoteEditor`, `VideoList`, `PracticeProblemList`) that currently depend on `LessonResource`/`LessonTool` types -- either removing them or refactoring their prop types.
- Adding a question import capability from practice problem assignments into assessments.

---

## 2. Folder Structure

### Files to Delete

```
client/src/api/lesson-resources.ts
client/src/api/lesson-tools.ts
client/src/features/lessons/LessonResourceContent.tsx
client/src/features/lessons/LessonToolContent.tsx
client/src/features/lessons/LessonToolModals.tsx
client/src/features/lessons/hooks/useResources.ts
client/src/features/lessons/hooks/useTools.ts
client/src/features/videos/VideoCard.tsx
client/src/features/videos/VideoForm.tsx
client/src/features/videos/VideoList.tsx
client/src/features/notes/NoteEditor.tsx
client/src/features/practice-problems/PracticeProblemCard.tsx
client/src/features/practice-problems/PracticeProblemList.tsx
client/src/features/flashcards/FlashCardForm.tsx

client/src/__tests__/api/lesson-resources.test.ts
client/src/__tests__/api/lesson-tools.test.ts
client/src/__tests__/api/resource-completions.test.ts
client/src/__tests__/hooks/useResources.test.tsx
client/src/__tests__/hooks/useTools.test.ts
client/src/__tests__/features/lessons/LessonResourceContent.test.tsx
client/src/__tests__/features/lessons/LessonToolContent.test.tsx
client/src/__tests__/features/lessons/LessonToolModals.test.tsx
client/src/__tests__/features/lessons/LearningResourceNav.test.tsx
client/src/__tests__/features/lessons/PracticeResourceSidebar.test.tsx
client/src/__tests__/features/videos/VideoCard.test.tsx
client/src/__tests__/features/videos/VideoForm.test.tsx
client/src/__tests__/features/videos/VideoList.test.tsx
client/src/__tests__/features/notes/NoteEditor.test.tsx
client/src/__tests__/features/practice-problems/PracticeProblemCard.test.tsx
```

**Rationale for deleting `VideoCard`, `VideoForm`, `VideoList`, `NoteEditor`, `PracticeProblemCard`, `PracticeProblemList`:** These components are exclusively typed against `LessonResource` or `LessonTool`. Their assignment-layer equivalents already exist: `VideoAssignmentView`, `NoteAssignmentView`, `PracticeProblemRunner`, etc. in `client/src/features/assignments/`. The `FlashCardForm.tsx` is already a no-op stub (`return null`) with a deletion comment.

### Files to Create

```
client/src/features/assessments/ImportQuestionsModal.tsx
```

### Files to Modify

```
client/src/api/types.ts
client/src/api/resource-completions.ts
client/src/api/assessments.ts
client/src/features/lessons/LessonDetailPage.tsx
client/src/features/lessons/ActiveItemContent.tsx
client/src/features/lessons/AssignmentSection.tsx
client/src/features/lessons/AssignmentStepper.tsx
client/src/features/lessons/hooks/useAssignments.ts
client/src/features/flashcards/FlashCardList.tsx
client/src/features/vocab/VocabCard.tsx
client/src/features/student-notes/StudentMaterialsModal.tsx
client/src/features/assessments/AssessmentSection.tsx
client/src/features/assessments/AssessmentForm.tsx
client/src/components/ResourceCompletionCheckbox.tsx  (if it references LessonResource types)
```

---

## 3. Component Tree

### Deleted Components

| Component               | File                                                 | Reason                                                   |
| ----------------------- | ---------------------------------------------------- | -------------------------------------------------------- |
| `LessonResourceContent` | `features/lessons/LessonResourceContent.tsx`         | Resource rendering replaced by `LessonAssignmentContent` |
| `LessonToolContent`     | `features/lessons/LessonToolContent.tsx`             | Tool rendering replaced by `LessonAssignmentContent`     |
| `LessonToolModals`      | `features/lessons/LessonToolModals.tsx`              | Tool editing replaced by `AssignmentFormModal`           |
| `VideoCard`             | `features/videos/VideoCard.tsx`                      | Replaced by `VideoAssignmentView`                        |
| `VideoForm`             | `features/videos/VideoForm.tsx`                      | Replaced by assignment form video section                |
| `VideoList`             | `features/videos/VideoList.tsx`                      | Replaced by assignment list                              |
| `NoteEditor`            | `features/notes/NoteEditor.tsx`                      | Replaced by `NoteAssignmentView`                         |
| `PracticeProblemCard`   | `features/practice-problems/PracticeProblemCard.tsx` | Replaced by `PracticeProblemRunner`                      |
| `PracticeProblemList`   | `features/practice-problems/PracticeProblemList.tsx` | Replaced by assignment list                              |
| `FlashCardForm`         | `features/flashcards/FlashCardForm.tsx`              | Already a no-op stub                                     |

### New Components

#### `ImportQuestionsModal`

- **File:** `client/src/features/assessments/ImportQuestionsModal.tsx`
- **Type:** UI component (modal)
- **Props:**
    ```ts
    interface ImportQuestionsModalProps {
    	assessmentId: string;
    	lessonId: string;
    	onImported: (questions: AssessmentQuestion[]) => void;
    	onClose: () => void;
    }
    ```
- **Responsibilities:** Displays a modal allowing the teacher to select a practice problem assignment from the current lesson, then calls `POST /assessments/:assessmentId/import-questions` to copy questions into the assessment. Shows loading/error states. On success, calls `onImported` with the new questions and closes.

### Modified Components

#### `ActiveItemContent`

- **File:** `client/src/features/lessons/ActiveItemContent.tsx`
- **Props (simplified):**
    ```ts
    interface ActiveItemContentProps {
    	item: AssignmentItem;
    	lesson: Lesson;
    	assignments: Assignment[];
    	canEdit: boolean;
    	onToggleAssignmentCompletion: (assignment: Assignment) => Promise<void>;
    	onBookmarkChange: (
    		assignmentId: string,
    		bookmark: Bookmark | null,
    	) => void;
    	isStudent: boolean;
    	onPlanEdit: () => void;
    }
    ```
- **Changes:** Remove all `resources`, `tools`, `editingVideoId`, `newNoteIdRef`, video callbacks, note callbacks, tool callbacks, and `savedFlashCardIds`/`onToggleFlashCard` props. Remove `LessonResourceContent` and `LessonToolContent` branches. The `kind === 'resource'` and `kind === 'tool'` branches are deleted. Only `lessonPlan`, `quiz`, and `assignment` branches remain.

#### `AssignmentStepper`

- **File:** `client/src/features/lessons/AssignmentStepper.tsx`
- **Changes:**
    - Remove `resourceType` and `toolType` from `StepperItem` interface.
    - Remove `kind: 'resource' | 'tool'` from `StepperItem.kind`.
    - `StepperItem.kind` becomes `'lessonPlan' | 'quiz' | 'assignment'`.
    - Remove `getStepIcon` branches for `resource` and `tool` kinds.
    - Remove `getStepLabel` branches for `resource` and `tool` kinds.
    - Remove `getStepTypeLabel` branches for `resource` and `tool` kinds.
    - Remove `completedIds` prop (only `completedAssignmentIds` remains).

#### `AssignmentSection` (the wrapper component)

- **File:** `client/src/features/lessons/AssignmentSection.tsx`
- **Changes:**
    - Remove `resourceType` and `toolType` from `AssignmentItem` interface.
    - Remove `kind: 'resource' | 'tool'` from `AssignmentKind`.
    - `AssignmentKind` becomes `'lessonPlan' | 'quiz' | 'assignment'`.
    - Remove `getTypeLabel` branches for `resource` and `tool` kinds.

#### `FlashCardList`

- **File:** `client/src/features/flashcards/FlashCardList.tsx`
- **Changes:** Currently fetches `LessonTool[]` via `lessonToolsApi.getAll(lessonId, 'vocab')`. Must be rewritten to source vocab entries from the `assignments` prop (or fetch assignments and filter for vocab type). See Section 5 for details.

#### `VocabCard`

- **File:** `client/src/features/vocab/VocabCard.tsx`
- **Changes:** Currently typed as `vocab: LessonTool`. This component is only used by `LessonToolContent` (being deleted). If no other consumer exists post-migration, delete it. If any consumer remains (verify during implementation), retype its props to accept a plain `{ term, definition, example }` shape instead of `LessonTool`.

#### `StudentMaterialsModal`

- **File:** `client/src/features/student-notes/StudentMaterialsModal.tsx`
- **Changes:** The `FlashCardList` sub-panel currently uses `lessonToolsApi`. After `FlashCardList` is updated to source from assignments, `StudentMaterialsModal` must pass the `assignments` prop through to `FlashCardList` (or `FlashCardList` fetches assignments itself).

#### `AssessmentSection` (quiz/test/exam)

- **File:** `client/src/features/assessments/AssessmentSection.tsx`
- **Changes:** Add an optional `lessonId` prop. When present and `canEdit` is true, render an "Import from Practice Problems" button in the assessment editing UI. This button opens `ImportQuestionsModal`.

#### `AssessmentForm`

- **File:** `client/src/features/assessments/AssessmentForm.tsx`
- **Changes:** Add an optional `onImport` callback prop. When provided, render an "Import Questions" button in the form toolbar that triggers the import flow. After import, append the new questions to the form's local `questions` state.

---

## 4. Client Routes

No route changes. All routes remain the same:

| Path                                                 | Component          | Auth     |
| ---------------------------------------------------- | ------------------ | -------- |
| `/courses/:courseId/units/:unitId/lessons/:lessonId` | `LessonDetailPage` | required |

---

## 5. Hooks and Data Fetching

### Hooks to Delete

| Hook           | File                                     | Reason                                                 |
| -------------- | ---------------------------------------- | ------------------------------------------------------ |
| `useResources` | `features/lessons/hooks/useResources.ts` | Resources no longer exist; data comes from assignments |
| `useTools`     | `features/lessons/hooks/useTools.ts`     | Tools no longer exist; data comes from assignments     |

### Hooks to Modify

#### `useAssignments` (`features/lessons/hooks/useAssignments.ts`)

**Current behavior:** Accepts `resources: LessonResource[]` and `tools: LessonTool[]` as params, passes them to `buildAssignmentItems()` which merges resources, tools, and assignments into a single `AssignmentItem[]` list.

**New behavior:**

- Remove `resources` and `tools` from `UseAssignmentsParams`.
- Remove `completedIds` from params (no longer needed -- all completions are assignment completions).
- Simplify `buildAssignmentItems()` to accept only `(lesson: Lesson, assignments: Assignment[])`. The function builds `AssignmentItem[]` from:
    1. `lessonPlan` item (order: -1)
    2. Assignment items (sorted by `order`)
    3. `quiz` item (order: Infinity)
- `AssignmentItem.kind` is always `'lessonPlan'`, `'assignment'`, or `'quiz'` -- never `'resource'` or `'tool'`.
- Remove `resourceType` and `toolType` from `AssignmentItem`.
- `completionKeyOf()` simplifies: for assignments, return the assignment ID; for lessonPlan, return lessonId.
- `incompleteRequired` uses only `completedAssignmentIds`.
- Remove export of `completedIds` (no longer exists).

**API endpoints called:**

- `GET /api/lessons/:lessonId/assignments` (unchanged -- via `assignmentsApi.getAll`)
- `POST /api/lessons/:lessonId/assignments` (unchanged -- via `assignmentsApi.create`)
- `PUT /api/assignments/:assignmentId` (unchanged -- via `assignmentsApi.update`)
- `DELETE /api/assignments/:assignmentId` (unchanged -- via `assignmentsApi.delete`)
- `PUT /api/lessons/:lessonId/assignments/reorder` (unchanged -- via `assignmentsApi.reorder`)
- `POST /api/assignments/:assignmentId/complete` (unchanged -- via `assignmentsApi.complete`)
- `DELETE /api/assignments/:assignmentId/complete` (unchanged -- via `assignmentsApi.uncomplete`)

### `FlashCardList` Data Fetching Change

**Current:** Calls `lessonToolsApi.getAll(lessonId, 'vocab')` to fetch `LessonTool[]`.

**New:** Accept `assignments: Assignment[]` as a prop. Filter for `assignment.type === 'vocab'` and extract `vocabAssignment.entries` to build the flip card list and study mode cards. No API call needed -- data is already fetched by `useAssignments`.

Alternatively, if the component must remain independent (used in `StudentMaterialsModal` without direct access to the full assignments array), it can call `assignmentsApi.getAll(lessonId)` and filter client-side. The recommended approach is to pass `assignments` as a prop from `LessonDetailPage` through `StudentMaterialsModal`, since assignments are already fetched.

---

## 6. API Integration

### Updated Endpoints

| UI Action                                               | Method + Path                             | Request Shape              | Response Shape                                                               |
| ------------------------------------------------------- | ----------------------------------------- | -------------------------- | ---------------------------------------------------------------------------- |
| Fetch completions for a lesson                          | `GET /api/lessons/:lessonId/completions`  | None                       | `{ data: { completions: [{ assignmentId: string, completedAt: string }] } }` |
| Toggle assignment completion (via completions endpoint) | `POST /api/lessons/:lessonId/completions` | `{ assignmentId: string }` | `{ data: { completions: [{ assignmentId: string, completedAt: string }] } }` |

**Note:** The current `useAssignments` hook already handles assignment completion toggling via `POST /api/assignments/:assignmentId/complete` and `DELETE /api/assignments/:assignmentId/complete` (on the `Assignment` model's `completed` boolean). The `resource-completions.ts` module uses the separate `/lessons/:lessonId/completions` endpoint. Post-migration, determine whether both completion mechanisms are needed:

- If the `/lessons/:lessonId/completions` endpoint is still used for the lesson plan step completion, update `resource-completions.ts` to match the new contract.
- If all completion tracking is handled by `assignmentsApi.complete`/`uncomplete`, delete `resource-completions.ts` entirely.

The plan assumes `resource-completions.ts` is updated (not deleted) because the lesson plan step completion still goes through it.

### New Endpoint

| UI Action                                         | Method + Path                                          | Request Shape                             | Response Shape                         |
| ------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------- | -------------------------------------- |
| Import practice problem questions into assessment | `POST /api/assessments/:assessmentId/import-questions` | `{ practiceProblemAssignmentId: string }` | `{ data: AssessmentQuestion[] }` (201) |

### Removed API Modules

All calls to the following removed endpoints are eliminated by deleting the API modules:

- `GET /api/lessons/:lessonId/resources`
- `POST /api/lessons/:lessonId/resources`
- `PUT /api/resources/:resourceId`
- `DELETE /api/resources/:resourceId`
- `GET /api/lessons/:lessonId/tools`
- `POST /api/lessons/:lessonId/tools`
- `PUT /api/tools/:toolId`
- `DELETE /api/tools/:toolId`

---

## 7. State Management

### State Removed from `LessonDetailPage`

| State                                   | Source                         | Replacement                                                          |
| --------------------------------------- | ------------------------------ | -------------------------------------------------------------------- |
| `resources` (from `useResources`)       | `lessonResourcesApi.getAll`    | Eliminated -- all content is in `assignments`                        |
| `completionsData` (from `useResources`) | `resourceCompletionsApi.get`   | Eliminated or simplified (see below)                                 |
| `completedIds` (from `useResources`)    | Derived from `completionsData` | Replaced by `completedAssignmentIds` from `useAssignments`           |
| `editingVideoId` (from `useResources`)  | Local state                    | Eliminated -- video editing goes through `AssignmentFormModal`       |
| `newNoteIdRef` (from `useResources`)    | Ref                            | Eliminated -- note creation goes through `AssignmentFormModal`       |
| `tools` (from `useTools`)               | `lessonToolsApi.getAll`        | Eliminated -- all content is in `assignments`                        |
| `editingTool` (from `useTools`)         | Local state                    | Eliminated -- tool editing goes through `AssignmentFormModal`        |
| `savedFlashCardIds`                     | Local state                    | Kept -- still used for flash card study filtering in `FlashCardList` |

### State Kept in `LessonDetailPage`

- `activeStepKey` -- still needed for stepper navigation
- `activeTool` / `setActiveTool` -- still needed for student materials panel
- `savedFlashCardIds` -- still needed for flash card filtering
- `sidebarCollapsed` / `mobileDrawerOpen` -- UI state unchanged
- `settingsDisclosure` / `planEditDisclosure` -- UI state unchanged
- All state from `useAssignments` -- assignment CRUD, ordering, completion toggling

### Quiz Unlock Logic Change

Currently, `quizUnlocked` is derived from `completionsData.requiredItems` (from the resource completions endpoint). Post-migration, the `requiredItems` array is removed from the response. Quiz unlock must be derived from:

```
quizUnlocked = assignments.every(a => completedAssignmentIds.has(a.id))
```

Or more precisely, all assignments are considered "required" in the assignment model (there is no `isRequired` toggle on assignments), so the quiz is unlocked when all assignments are completed.

### Completion State Consolidation

Pre-migration, there are two parallel completion systems:

1. `completedIds` (from `useResources`) -- tracks resource/tool completions via `/lessons/:lessonId/completions`
2. `completedAssignmentIds` (from `useAssignments`) -- tracks assignment completions via `assignment.completed` boolean

Post-migration, only `completedAssignmentIds` remains. The `assignment.completed` boolean on each `Assignment` object (returned by `GET /lessons/:lessonId/assignments`) is the single source of truth.

---

## 8. Authentication and Authorization

No changes to authentication or authorization patterns. The existing mechanisms remain:

- `useAuth()` from `AuthContext` provides `user` and `isLoading`.
- `useCanEdit()` returns `true` for `teacher` and `admin` roles.
- The "Import from Practice Problems" button is gated behind `canEdit`.
- The import endpoint requires `teacher`/`admin` role -- enforced server-side.

---

## 9. Pseudocode for Complex Logic

### 9.1 Simplified `buildAssignmentItems`

```pseudo
function buildAssignmentItems(lesson, assignments):
  items = []

  items.push({ key: 'lessonPlan', kind: 'lessonPlan', id: lesson.id, title: 'Lesson Plan', order: -1 })

  for each assignment in assignments sorted by order:
    items.push({
      key: `assignment:${assignment.id}`,
      kind: 'assignment',
      id: assignment.id,
      title: assignment.title,
      order: assignment.order,
      assignmentType: assignment.type,
    })

  items.push({ key: 'quiz', kind: 'quiz', id: null, title: 'Lesson Quiz', order: Infinity })

  return items
```

### 9.2 Quiz Unlock Derivation

```pseudo
// Pre-migration: checked requiredItems from completions endpoint
// Post-migration: all assignments must be completed
quizUnlocked = assignments.length === 0
  || assignments.every(a => completedAssignmentIds.has(a.id))
```

### 9.3 `handleToggleRequired` Removal

The `handleToggleRequired` function in `LessonDetailPage` currently calls `lessonResourcesApi.update` or `lessonToolsApi.update` to toggle `isRequired`. Since assignments do not have an `isRequired` field, this function is deleted entirely. The `onToggleRequired` prop on `AssignmentSection` is removed.

### 9.4 Import Questions Flow

```pseudo
// In ImportQuestionsModal:
function handleImport(practiceProblemAssignmentId):
  setLoading(true)
  setError('')
  try:
    newQuestions = await assessmentsApi.importQuestions(assessmentId, { practiceProblemAssignmentId })
    onImported(newQuestions)
    onClose()
  catch err:
    setError(classifyError(err))
  finally:
    setLoading(false)

// In AssessmentForm, after import:
function handleQuestionsImported(importedQuestions):
  drafts = importedQuestions.map(toQuestionDraft)
  setQuestions(prev => [...prev, ...drafts])
  setCurrent(questions.length)  // navigate to first imported question
```

### 9.5 FlashCardList Refactor

```pseudo
// Props: { assignments: Assignment[], savedIds?: Set<string> }
function FlashCardList({ assignments, savedIds }):
  vocabAssignments = assignments.filter(a => a.type === 'vocab' && a.vocabAssignment)
  allEntries = vocabAssignments.flatMap(a => a.vocabAssignment.entries)

  if savedIds and savedIds.size > 0:
    entries = allEntries.filter(e => e.id && savedIds.has(e.id))
  else:
    entries = allEntries

  studyCards = entries.map(e => ({ id: e.id, front: e.term, back: e.definition }))

  // Render flip cards and study mode as before, using entries instead of LessonTool[]
```

### 9.6 Reorder Logic Simplification

```pseudo
// Pre-migration: separate reorder logic for resources, tools, and assignments
// Post-migration: only assignment reorder remains
if activeItem?.kind === 'assignment':
  ai = sortedAssignments.findIndex(a => a.id === activeItem.id)
  if ai > 0: onMoveUp = () => handleMoveAssignment(activeItem.id, 'up')
  if ai < sortedAssignments.length - 1: onMoveDown = () => handleMoveAssignment(activeItem.id, 'down')
// No resource or tool reorder cases
```

---

## 10. Styling Notes

No new visual design. All styling changes are subtractive (removing components) or follow existing patterns:

- `ImportQuestionsModal` uses the shared `Modal` component with `Button` (variant `primary` for import, `secondary` for cancel).
- The "Import from Practice Problems" button in `AssessmentForm` uses `Button` with `variant="ghost"` and `size="sm"`, consistent with the existing toolbar button pattern.
- Flash card flip cards in `FlashCardList` retain their existing styling (`bg-surface`, `border-border`, `bg-accent-subtle`).
- The `ResourceCompletionCheckbox` component may need type updates if it imports `LessonResource` types. It should accept generic props (`isComplete`, `onToggle`) without model-specific typing.

---

## 11. Edge Cases and Error Handling

### Loading States

- **Assignment list loading:** Already handled by `useFetch` in `useAssignments`. Shows `<LoadingSpinner />` via `LessonDetailPage`'s existing loading gate.
- **Import questions loading:** `ImportQuestionsModal` shows a disabled submit button with spinner during the API call.

### Empty States

- **No assignments in lesson:** Stepper shows only "Lesson Plan" and "Quiz" steps. The `EmptyState` for assignment content is already handled by `LessonAssignmentContent`.
- **No practice problems available for import:** `ImportQuestionsModal` shows an `EmptyState` message: "No practice problem assignments in this lesson." The import button is disabled.
- **No vocab entries for flash cards:** `FlashCardList` shows `EmptyState` as it does today, with updated messaging.

### Validation Errors

- **Import with invalid assignment ID:** Server returns 404. `ImportQuestionsModal` displays the error via `<ErrorMessage>`.
- **Import from different course's practice problems:** Server returns 403. Displayed as error.

### API Errors

- **Failed completion toggle:** `handleToggleAssignmentCompletion` already has optimistic update with rollback on error (existing pattern in `useAssignments`).
- **Failed assignment CRUD:** Handled by existing `useAssignments` error patterns.

### Backward Compatibility

- **Stale browser cache:** If a user has stale JS that still calls `/api/lessons/:lessonId/resources` or `/api/lessons/:lessonId/tools`, the server will return 404. The `apiClient` error handling will surface a user-friendly error message. This is acceptable -- the user refreshes to get the new bundle.

### Flash Card ID Mapping

- **`savedFlashCardIds` references:** Pre-migration, `savedFlashCardIds` stores `LessonTool` IDs. Post-migration, vocab entries have their own `id` field (`VocabEntry.id`). The `savedFlashCardIds` set must now store `VocabEntry.id` values instead of tool IDs. This is a client-only state (not persisted server-side), so no migration is needed -- the set resets on page load.

### `isRequired` Removal

- Pre-migration, `AssignmentItem.isRequired` is used for resource/tool items and drives the `onToggleRequired` action. Post-migration, all assignments are implicitly required (no `isRequired` field on `Assignment`). The `isRequired` field on `AssignmentItem` can be hardcoded to `true` for all assignment items or removed if it is only consumed for the quiz unlock check.
