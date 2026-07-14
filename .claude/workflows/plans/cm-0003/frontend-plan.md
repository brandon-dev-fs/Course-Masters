---
id: cm-0003
title: Add Assignment Layer to Lessons
stage: design
status: approved
approver: human
approved_at: 2026-04-28T00:00:00Z
---

# Frontend Plan — cm-0003: Add Assignment Layer to Lessons

## 1. Overview

This plan implements the client-side portion of the Assignment layer for lessons. The feature introduces an ordered, teacher-defined list of typed assignment tasks (note, video, reading, vocab, practice_problem) into the existing `LessonDetailPage`, replacing the current flat add-resource buttons with a unified inline "+ Add assignment" entry that opens a two-step modal.

Acceptance criteria addressed:

- Teachers can create, edit, delete, and reorder assignments of five types. Creating opens a two-step modal: Step 1 picks the type via a card grid; Step 2 presents the form for the selected type. Editing skips Step 1.
- Students see assignments in teacher-defined order, can mark each complete, and can retry practice problems unlimited times.
- The `AssignmentStepper` shows a node per assignment; nodes reflect completion state.
- Practice problems auto-complete when a student's score meets or exceeds `passingPercentage`; otherwise the student marks complete manually.
- The existing page chrome (sidebar, header, stepper shell, student tools bar) is unchanged. All new assignment interactions occur in the center column main area and modals.

All API calls in this plan exactly match the endpoints in the approved api-contract (id: cm-0003).

---

## 2. Folder Structure

New files only. Existing files modified in place are noted in Section 3.

```
client/src/
  api/
    assignments.ts                  # New API module — all assignment endpoints
  features/
    assignments/                    # New feature directory
      AssignmentFormModal.tsx       # Two-step modal shell (owns step + type state)
      AssignmentTypePicker.tsx      # Step 1: 2-column grid of type cards
      NoteAssignmentForm.tsx
      VideoAssignmentForm.tsx
      ReadingAssignmentForm.tsx
      VocabAssignmentForm.tsx
      PracticeProblemAssignmentForm.tsx
      NoteAssignmentView.tsx
      VideoAssignmentView.tsx
      ReadingAssignmentView.tsx
      VocabAssignmentView.tsx
      PracticeProblemRunner.tsx
```

Modified existing files:

```
client/src/
  api/
    types.ts                        # Add Assignment-related types
  features/
    lessons/
      LessonDetailPage.tsx          # Main integration point
      AssignmentStepper.tsx         # Extend StepperItem kind + getStepIcon
      AssignmentSection.tsx         # Add onEdit / onDelete props; wire teacher controls
```

---

## 3. Component Tree

### 3.1 Modified: LessonDetailPage

**File:** `client/src/features/lessons/LessonDetailPage.tsx`
**Type:** Page component
**Responsibilities:**
- Own all assignment state: `assignments: Assignment[]`, `isAddingAssignment: boolean`, `editingAssignment`, `deletingAssignmentId`.
- Fetch assignments via `GET /lessons/:lessonId/assignments` alongside existing page data.
- Derive `completedAssignmentIds` from `Assignment.completed` flag returned by API.
- Render an inline full-width dashed-border `<button>` ("+ Add assignment") as the last item in the assignment list area (after the last assignment card, before the quiz step). Rendered only when `canEdit` is true.
- Open `AssignmentFormModal` when `isAddingAssignment` is true (create flow) or `editingAssignment` is non-null (edit flow). The modal owns type selection internally for create flow.
- Wire create/update/delete/reorder callbacks.
- Extend `buildAssignmentItems` to include a new `'assignment'` kind for each `Assignment`.
- Pass `onEdit` and `onDelete` callbacks to `AssignmentSection` for teacher controls.

**New state:**
```typescript
const [assignments, setAssignments] = useState<Assignment[]>([]);
const [isAddingAssignment, setIsAddingAssignment] = useState<boolean>(false);
const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
const [deletingAssignmentId, setDeletingAssignmentId] = useState<string | null>(null);
```

---

### 3.2 Modified: AssignmentStepper

**File:** `client/src/features/lessons/AssignmentStepper.tsx`
**Type:** UI component
**Responsibilities:**
- Extend `StepperItem.kind` union to include `'assignment'`.
- Add `assignmentType?: AssignmentType` to `StepperItem`.
- Extend `getStepIcon` to map each `AssignmentType` to a Lucide icon:
  - `note` → `FileText`
  - `video` → `Video`
  - `reading` → `ExternalLink`
  - `vocab` → `BookMarked`
  - `practice_problem` → `Brain`

**Props interface change (additive):**
```typescript
export interface StepperItem {
  key: string;
  title: string;
  kind: 'lessonPlan' | 'resource' | 'tool' | 'quiz' | 'assignment'; // extended
  completionId: string | null;
  resourceType?: ResourceType;
  toolType?: ToolType;
  assignmentType?: AssignmentType; // new
}
```

---

### 3.3 Modified: AssignmentSection

**File:** `client/src/features/lessons/AssignmentSection.tsx`
**Type:** UI component (card shell)
**Responsibilities:**
- Accept new optional `onEdit` and `onDelete` props.
- Render Edit (pencil) and Delete (trash) icon buttons in the card header when `canEdit` is true and both callbacks are provided.
- Edit and Delete buttons placed to the left of the existing move up/down and required toggle controls.
- Existing completion toggle and Next button in footer are unchanged.

**Props interface change (additive):**
```typescript
interface AssignmentSectionProps {
  // all existing props unchanged
  onEdit?: () => void;    // new — opens edit modal
  onDelete?: () => void;  // new — opens confirm dialog
}
```

**Accessibility:** Edit button `aria-label="Edit {item.title}"` using `Pencil` icon `w-4 h-4`. Delete button `aria-label="Delete {item.title}"` using `Trash2` icon `w-4 h-4`.

---

### 3.4 New: AssignmentFormModal

**File:** `client/src/features/assignments/AssignmentFormModal.tsx`
**Type:** UI component (modal shell)
**Responsibilities:**
- Wrap the existing `Modal` component (size="lg").
- Own two-step state for the create flow: `step: 'pick' | 'form'` and `selectedType: AssignmentType | null`.
- In create mode (`initial` is undefined): open at Step 1, render `AssignmentTypePicker`. When the user clicks a type card, immediately advance to Step 2 (`step = 'form'`).
- In edit mode (`initial` is present): skip Step 1 entirely; open directly at Step 2 with `selectedType` derived from `initial.type`.
- In Step 2: render shared fields (`Title` Input, required; `Objective` Textarea, optional), a "← Back" ghost button in the modal body above the shared fields (create flow only — not shown in edit mode), and the appropriate type-specific sub-form component based on `selectedType`.
- Modal title: Step 1 → "Add Assignment"; Step 2 (create) → "Add {Type Label}"; Step 2 (edit) → "Edit {Type Label}".
- "← Back" returns to Step 1 and resets all form field state.
- X button in modal header and "Cancel" button in footer both dismiss the entire modal with no state saved (no confirmation required).
- Orchestrate form submission: call `onSubmit(payload)` with merged shared + type-specific fields.
- Display API errors via `<ErrorMessage>` above the action buttons.
- Show loading spinner and disable submit button during submission via `useFormSubmit`.

**Props interface:**
```typescript
interface AssignmentFormModalProps {
  initial?: Assignment;         // present in edit mode; omitted for create
  onSubmit: (payload: CreateAssignmentPayload | UpdateAssignmentPayload) => Promise<void>;
  onClose: () => void;
}
```

**Internal state:**
```typescript
const [step, setStep] = useState<'pick' | 'form'>(initial ? 'form' : 'pick');
const [selectedType, setSelectedType] = useState<AssignmentType | null>(
  initial ? initial.type : null
);
// Shared form fields:
const [title, setTitle] = useState(initial?.title ?? '');
const [objective, setObjective] = useState(initial?.objective ?? '');
// Type-specific field state delegated to sub-form components
```

---

### 3.5 New: AssignmentTypePicker

**File:** `client/src/features/assignments/AssignmentTypePicker.tsx`
**Type:** UI component (sub-component of AssignmentFormModal)
**Responsibilities:**
- Render a 2-column grid of five clickable type cards: Note, Video, Reading, Vocab, Practice Problem.
- Each card shows a Lucide icon and a type label.
- Clicking a card immediately fires `onSelect(type)` — one click selects and advances; no separate confirmation.
- Used exclusively by `AssignmentFormModal` Step 1.

**Props interface:**
```typescript
interface AssignmentTypePickerProps {
  onSelect: (type: AssignmentType) => void;
}
```

**Card grid layout:** `grid grid-cols-2 gap-3`. On mobile, collapses to `grid-cols-1` so each card is full-width and touch-friendly (`min-h-[56px]`).

**Accessibility:** Each card is a `<button>` with `aria-label="Add {type name} assignment"`. Tab moves between cards; Enter or Space selects and advances. Escape is handled by the wrapping `Modal` and dismisses the entire modal.

**Type definitions for the grid:**
```typescript
const ASSIGNMENT_TYPES: { type: AssignmentType; label: string; icon: LucideIcon }[] = [
  { type: 'note',             label: 'Note',             icon: FileText   },
  { type: 'video',            label: 'Video',            icon: Video      },
  { type: 'reading',          label: 'Reading',          icon: ExternalLink },
  { type: 'vocab',            label: 'Vocab',            icon: BookMarked },
  { type: 'practice_problem', label: 'Practice Problem', icon: Brain      },
];
```

---

### 3.6 New: NoteAssignmentForm

**File:** `client/src/features/assignments/NoteAssignmentForm.tsx`
**Type:** UI component (form sub-section)
**Responsibilities:**
- Render a labeled `RichTextEditor` (Tiptap, full toolbar) for the `content` field.
- Expose current content JSON upward via `onChange`.

**Props interface:**
```typescript
interface NoteAssignmentFormProps {
  value: Record<string, unknown> | null;
  onChange: (content: Record<string, unknown>) => void;
}
```

---

### 3.7 New: VideoAssignmentForm

**File:** `client/src/features/assignments/VideoAssignmentForm.tsx`
**Type:** UI component (form sub-section)
**Responsibilities:**
- Render URL `Input` with `onBlur` handler calling `GET /youtube/title` to auto-fill display title.
- Render optional Display Title `Input` (auto-populated, manually overridable).
- Mirror the pattern of the existing `VideoForm.tsx`.

**Props interface:**
```typescript
interface VideoAssignmentFormProps {
  url: string;
  displayTitle: string;
  onUrlChange: (url: string) => void;
  onDisplayTitleChange: (title: string) => void;
}
```

---

### 3.8 New: ReadingAssignmentForm

**File:** `client/src/features/assignments/ReadingAssignmentForm.tsx`
**Type:** UI component (form sub-section)
**Responsibilities:**
- Render URL `Input` (required, labeled "URL").
- Render Description `Textarea` (optional).
- Render Estimated Minutes `Input` type=number (optional, min 1, labeled "Estimated reading time").

**Props interface:**
```typescript
interface ReadingAssignmentFormProps {
  url: string;
  description: string;
  estimatedMinutes: string; // controlled as string; convert to number on submit
  onUrlChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onEstimatedMinutesChange: (v: string) => void;
}
```

---

### 3.9 New: VocabAssignmentForm

**File:** `client/src/features/assignments/VocabAssignmentForm.tsx`
**Type:** UI component (form sub-section)
**Responsibilities:**
- Manage a local list of `{ term: string; definition: string }` pairs.
- Render each pair as a row: term `Input` (`flex-1`), definition `Input` (`flex-1`), move-up button, move-down button, delete button.
- "+ Add term" ghost button appends an empty pair.
- Must have at least one entry with non-empty term and definition before the parent can submit.

**Props interface:**
```typescript
interface VocabEntry {
  term: string;
  definition: string;
}

interface VocabAssignmentFormProps {
  entries: VocabEntry[];
  onChange: (entries: VocabEntry[]) => void;
}
```

**Accessibility:** Each row in a `<fieldset>` with `<legend className="sr-only">Term {n}</legend>`. Delete: `aria-label="Remove term {n}"`. Move: `aria-label="Move term {n} up/down"`.

---

### 3.10 New: PracticeProblemAssignmentForm

**File:** `client/src/features/assignments/PracticeProblemAssignmentForm.tsx`
**Type:** UI component (form sub-section)
**Responsibilities:**
- Render optional Passing Percentage `Input` type=number (0–100) with helper text "Leave empty — student marks complete manually".
- Manage an ordered list of `PracticeQuestionDraft` objects.
- For each question, render a type `<select>` and type-specific answer fields:
  - `multiple_choice`: question text + options list + correct answer radio (reuse `QuestionEditor` from `features/assessments/`)
  - `true_false`: question text + True/False radio buttons
  - `matching`: question text + left items + right items + correct pairs
  - `fill_in_blank`: question text + blank answer(s) + optional alternatives
- Move-up/down and delete controls per question.
- "+ Add question" ghost button appends a new `multiple_choice` question draft.

**Props interface:**
```typescript
type PracticeQuestionType = 'multiple_choice' | 'true_false' | 'matching' | 'fill_in_blank';

interface PracticeQuestionDraft {
  id?: string;
  type: PracticeQuestionType;
  order: number;
  content: Record<string, unknown>;
}

interface PracticeProblemAssignmentFormProps {
  passingPercentage: string;
  questions: PracticeQuestionDraft[];
  onPassingPercentageChange: (v: string) => void;
  onQuestionsChange: (questions: PracticeQuestionDraft[]) => void;
}
```

**Note on QuestionEditor reuse:** The existing `QuestionEditor` in `features/assessments/` handles only `multiple_choice` with a `calculatorEnabled` toggle that is irrelevant here. For `multiple_choice` questions in this form, wrap `QuestionEditor` and ignore `calculatorEnabled`. For other question types, implement inline sub-editors within `PracticeProblemAssignmentForm` rather than modifying `QuestionEditor`.

---

### 3.11 New: NoteAssignmentView

**File:** `client/src/features/assignments/NoteAssignmentView.tsx`
**Type:** UI component (student viewer)
**Responsibilities:**
- Receive Tiptap JSON `content` from `noteAssignment.content`.
- Render read-only rich text using a `<div className="rich-text">` wrapping Tiptap's `generateHTML` output, matching the read-only pattern used in `NoteEditor`.

**Props interface:**
```typescript
interface NoteAssignmentViewProps {
  content: Record<string, unknown>;
}
```

---

### 3.12 New: VideoAssignmentView

**File:** `client/src/features/assignments/VideoAssignmentView.tsx`
**Type:** UI component (student viewer)
**Responsibilities:**
- Receive `url` and optional `title`.
- Convert to embed URL via existing `getEmbedUrl` from `src/utils/youtube.ts`.
- Render a 16:9 `<iframe>` using `youtube-nocookie.com` (same as `VideoCard`).
- Render optional display title below embed in `text-sm text-muted-foreground`.

**Props interface:**
```typescript
interface VideoAssignmentViewProps {
  url: string;
  title?: string | null;
}
```

---

### 3.13 New: ReadingAssignmentView

**File:** `client/src/features/assignments/ReadingAssignmentView.tsx`
**Type:** UI component (student viewer)
**Responsibilities:**
- Render an accent-subtle card with:
  - External link (`<a target="_blank" rel="noopener noreferrer">`) with `ExternalLink` icon + sr-only "(opens in new tab)".
  - Estimated time badge if `estimatedMinutes` present: `~ {n} min read`.
  - Description paragraph if present.

**Props interface:**
```typescript
interface ReadingAssignmentViewProps {
  url: string;
  description?: string | null;
  estimatedMinutes?: number | null;
}
```

---

### 3.14 New: VocabAssignmentView

**File:** `client/src/features/assignments/VocabAssignmentView.tsx`
**Type:** UI component (student viewer)
**Responsibilities:**
- Render a `<dl>` where each entry is a `<div>` containing `<dt>` (term) and `<dd>` (definition).
- Entries divided with `divide-y divide-border`.

**Props interface:**
```typescript
interface VocabAssignmentViewProps {
  entries: VocabEntry[]; // { term: string; definition: string }
}
```

---

### 3.15 New: PracticeProblemRunner

**File:** `client/src/features/assignments/PracticeProblemRunner.tsx`
**Type:** UI component (student viewer)
**Responsibilities:**
- Own all runner state: current question index, per-question answers, submitted flags, phase.
- Render progress bar, question text, and type-appropriate answer controls.
- On submit: validate selection made, show per-question feedback (correct/incorrect + correct answer revealed).
- After last question: compute score, transition to summary.
- In summary: handle auto-complete or manual complete flow.
- Retry resets all local runner state.

**Props interface:**
```typescript
interface PracticeProblemRunnerProps {
  questions: PracticeQuestion[];          // from PracticeProblemAssignmentData
  passingPercentage?: number | null;
  onAutoComplete: () => Promise<void>;    // called when score >= passingPercentage
  onManualComplete: () => Promise<void>;  // called when no passingPercentage and student clicks "Mark complete"
}
```

**Internal state:** `currentIndex: number`, `answers: (unknown | null)[]`, `submittedAt: boolean[]`, `phase: 'question' | 'feedback' | 'summary'`, `autoCompleted: boolean`, `completeError: string`.

---

## 4. Client Routes

No new routes. The feature modifies the existing route:

| Path | Component | Auth |
|---|---|---|
| `/courses/:courseId/units/:unitId/lessons/:lessonId` | `LessonDetailPage` | Authenticated (`RequireAuth`) |

---

## 5. Hooks and Data Fetching

### 5.1 Assignment list — LessonDetailPage

Assignment data is fetched as part of the existing `Promise.all` in `LessonDetailPage`'s `useEffect`. No new custom hook.

**Endpoint:** `GET /lessons/:lessonId/assignments`
**Response:** `Assignment[]` (each with `completed: boolean` and one non-null child object)
**Loading/error:** Covered by the existing `loading` and `error` page states.
**Refetch strategy:** After mutations, update local `assignments` state directly from API response — same pattern as `resources` and `tools`. No automatic refetch interval.

Add `assignmentsApi.getAll(lessonId)` to the `Promise.all` array and destructure the result.

### 5.2 YouTube title fetch — VideoAssignmentForm

The `VideoAssignmentForm` calls `GET /youtube/title?url={encoded}` on URL field blur. This is an inline `apiClient.get` call with local `fetchingTitle: boolean` state — same pattern as `VideoForm.tsx`.

**Endpoint:** `GET /youtube/title` (existing endpoint, not an assignment endpoint)

---

## 6. API Integration

All endpoints are from the approved api-contract. No invented endpoints.

```
Action                               Method + Path                                   Request shape                                      Response shape
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
Load lesson assignments               GET /lessons/:lessonId/assignments              (none)                                             Assignment[]
Create assignment (teacher)           POST /lessons/:lessonId/assignments             { title, objective?, type, ...typeFields }          Assignment (201)
Edit assignment (teacher)             PUT /assignments/:assignmentId                  { title?, objective?, ...typeFields }               Assignment (200)
Delete assignment (teacher)           DELETE /assignments/:assignmentId               (none)                                             204 No Content
Reorder assignments (teacher)         PUT /lessons/:lessonId/assignments/reorder      { assignmentIds: string[] }                        Assignment[] (200)
Mark assignment complete (student)    POST /assignments/:assignmentId/complete        (none / empty body)                                AssignmentCompletion (201)
Unmark assignment complete (student)  DELETE /assignments/:assignmentId/complete      (none)                                             204 No Content
```

**Type-specific POST fields appended to `{ title, objective?, type }`:**

| type | Additional fields |
|---|---|
| `note` | `content: Record<string, unknown>` |
| `video` | `url: string`, `title?: string` (display title — maps to api-contract `title` field) |
| `reading` | `url: string`, `description?: string`, `estimatedMinutes?: number` |
| `vocab` | `entries: { term: string; definition: string }[]` |
| `practice_problem` | `passingPercentage?: number`, `questions: { type, order, content }[]` |

**For PUT, only changed fields are sent; `type` is never included.**

---

## 7. State Management

All assignment state lives locally in `LessonDetailPage`. No global store. Consistent with how `resources` and `tools` are managed.

| State variable | Type | Location | Purpose |
|---|---|---|---|
| `assignments` | `Assignment[]` | LessonDetailPage | Ordered list of lesson assignments |
| `isAddingAssignment` | `boolean` | LessonDetailPage | Controls whether the create modal is open |
| `editingAssignment` | `Assignment \| null` | LessonDetailPage | Controls edit form modal |
| `deletingAssignmentId` | `string \| null` | LessonDetailPage | Controls ConfirmDialog |
| `step` | `'pick' \| 'form'` | AssignmentFormModal (internal) | Two-step modal navigation (create flow only) |
| `selectedType` | `AssignmentType \| null` | AssignmentFormModal (internal) | Type chosen in Step 1; pre-set from `initial.type` in edit mode |

**Derived state in LessonDetailPage:**

```typescript
const completedAssignmentIds = useMemo(
  () => new Set(assignments.filter(a => a.completed).map(a => a.id)),
  [assignments],
);

const assignmentItems = useMemo(
  () => lesson ? buildAssignmentItems(lesson, resources, tools, assignments) : [],
  [lesson, resources, tools, assignments],
);
```

**buildAssignmentItems extension** — assignments are inserted between existing resource/tool items and the quiz item, sorted by `assignment.order`:

```typescript
for (const a of [...assignments].sort((x, y) => x.order - y.order)) {
  items.push({
    key: `assignment:${a.id}`,
    kind: 'assignment',
    id: a.id,
    title: a.title,
    isRequired: true,
    order: a.order,
    assignmentType: a.type,
  });
}
```

**Quiz unlock logic:** The existing `quizUnlocked` derivation from `resourceCompletionsApi` is unchanged. Assignment completion does not feed into it (progress API integration is out of scope for this spec).

**PracticeProblemRunner state** is fully local to that component; the parent `LessonDetailPage` is notified only via `onAutoComplete` / `onManualComplete` callbacks, which trigger `handleToggleAssignmentCompletion`.

---

## 8. Authentication and Authorization

The lesson route is already wrapped in `RequireAuth`. No route changes.

**Role-based UI gating** uses the existing `canEdit` pattern:

```typescript
const canEdit = user?.role === 'teacher' || user?.role === 'admin';
```

- Inline "+ Add assignment" button — only rendered when `canEdit`.
- `AssignmentFormModal` — only opened from `canEdit` code paths.
- `onEdit` / `onDelete` props on `AssignmentSection` — only passed when `canEdit`.
- Move up/down controls on assignment items — only passed when `canEdit`.
- Completion toggle — rendered for all authenticated users; students use it directly.

**API 403 / 401 responses** are caught by `ApiClientError` and surfaced via `ErrorMessage`. 401 triggers the global `auth:unauthorized` event → logout.

---

## 9. Pseudocode for Complex Logic

### 9.1 Teacher: Create an Assignment (two-step modal flow)

```
// In LessonDetailPage:
// User clicks the inline "+ Add assignment" button
function handleOpenAddModal():
  setIsAddingAssignment(true)

// AssignmentFormModal internal (create mode, initial = undefined):
// Opens at step = 'pick'

// Step 1 — user clicks a type card in AssignmentTypePicker:
function handleTypeSelected(type: AssignmentType):
  setSelectedType(type)
  setStep('form')
  // Focus moves to modal title / Title input

// Step 2 — user clicks "← Back":
function handleBack():
  setSelectedType(null)
  setStep('pick')
  resetFormFields()
  // Focus returns to the type card that was previously selected

// Step 2 — user submits form:
async function handleSubmit():
  validate shared + type-specific fields
  if invalid: show inline field errors; return

  const payload = buildPayload(selectedType, title, objective, ...typeFields)
  await onSubmit(payload)
  // onSubmit is handleCreateAssignment in LessonDetailPage

// In LessonDetailPage:
async function handleCreateAssignment(payload: CreateAssignmentPayload):
  const created = await assignmentsApi.create(lessonId, payload)
  setAssignments(prev => [...prev, created].sort((a, b) => a.order - b.order))
  setIsAddingAssignment(false)
  setActiveStepKey(`assignment:${created.id}`)
```

### 9.2 handleUpdateAssignment

```
async function handleUpdateAssignment(assignmentId: string, payload: UpdateAssignmentPayload):
  const updated = await assignmentsApi.update(assignmentId, payload)
  setAssignments(prev => prev.map(a => a.id === assignmentId ? updated : a))
  setEditingAssignment(null)
```

### 9.3 handleDeleteAssignment

```
async function handleDeleteAssignment(assignmentId: string):
  await assignmentsApi.delete(assignmentId)
  const remaining = assignments.filter(a => a.id !== assignmentId)
  setAssignments(remaining)
  setDeletingAssignmentId(null)
  // Navigate to nearest remaining item or lessonPlan
  const prevItem = assignmentItems
    .filter(i => i.id !== assignmentId)
    [Math.max(0, activeIdx - 1)]
  setActiveStepKey(prevItem?.key ?? 'lessonPlan')
```

### 9.4 handleMoveAssignment (optimistic reorder)

```
async function handleMoveAssignment(id: string, direction: 'up' | 'down'):
  const sorted = [...assignments].sort((a, b) => a.order - b.order)
  const idx = sorted.findIndex(a => a.id === id)
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1
  if swapIdx < 0 or swapIdx >= sorted.length: return

  const newIdOrder = sorted.map(a => a.id)
  swap(newIdOrder[idx], newIdOrder[swapIdx])

  // Optimistic update — assign sequential order values
  setAssignments(
    newIdOrder.map((id, i) => ({ ...sorted.find(a => a.id === id)!, order: i + 1 }))
  )

  try:
    const updated = await assignmentsApi.reorder(lessonId, { assignmentIds: newIdOrder })
    setAssignments(updated)
  catch (err):
    setAssignments(sorted)   // revert
    setError(err.message)
```

### 9.5 handleToggleAssignmentCompletion (optimistic)

```
async function handleToggleAssignmentCompletion(assignment: Assignment):
  const wasComplete = assignment.completed

  // Optimistic flip
  setAssignments(prev =>
    prev.map(a => a.id === assignment.id ? { ...a, completed: !wasComplete } : a)
  )

  try:
    if wasComplete:
      await assignmentsApi.uncomplete(assignment.id)
    else:
      await assignmentsApi.complete(assignment.id)
  catch:
    // Revert
    setAssignments(prev =>
      prev.map(a => a.id === assignment.id ? { ...a, completed: wasComplete } : a)
    )
```

### 9.6 PracticeProblemRunner — score + auto-complete

```
function handleLastQuestionSubmitted():
  const correctCount = answers.filter((ans, i) => checkCorrect(questions[i], ans)).length
  const percent = (correctCount / questions.length) * 100
  setScore({ correct: correctCount, total: questions.length, percent })
  setPhase('summary')

  if passingPercentage != null and percent >= passingPercentage:
    onAutoComplete()
      .then(() => setAutoCompleted(true))
      .catch(err => setCompleteError(err.message))
    // announce to screen reader via aria-live region

function handleRetry():
  setCurrentIndex(0)
  setAnswers(new Array(questions.length).fill(null))
  setSubmittedAt(new Array(questions.length).fill(false))
  setPhase('question')
  setAutoCompleted(false)
  setCompleteError('')

function handleManualComplete():
  // Only reachable when passingPercentage is null
  onManualComplete()
    .catch(err => setCompleteError(err.message))
```

### 9.7 AssignmentTypePicker — keyboard navigation

```
// Each type card is a <button> — browser default Tab navigation handles focus movement.
// No custom arrow-key navigation is required; the grid layout is short enough that
// Tab/Shift+Tab is sufficient and simpler. Enter or Space activates the focused card.
// Escape is handled by the parent Modal component and dismisses the entire modal.

onKeyDown (on a type card):
  case Enter | Space:
    e.preventDefault()
    onSelect(type)
    // Modal transitions to Step 2; focus moves to Title input
```

---

## 10. Styling Notes

All classes use existing design tokens. Never use `dark:` prefix.

### Card header — new Edit / Delete buttons (AssignmentSection)

```
// Edit:
"p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"

// Delete:
"p-1.5 rounded text-muted-foreground hover:text-destructive transition-colors"
```

### Inline "+ Add assignment" button (LessonDetailPage)

Rendered as a full-width `<button>` that is the last item in the assignment list area:

```
"w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl
 border border-dashed border-border bg-transparent
 text-sm text-muted-foreground transition-colors
 hover:border-primary/50 hover:text-foreground hover:bg-surface-raised
 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
```

### AssignmentTypePicker — type card grid

Container: `"grid grid-cols-2 gap-3 sm:grid-cols-2"`

Each card:
```
"flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-border
 bg-surface-raised cursor-pointer transition-colors min-h-[80px]
 hover:bg-surface hover:border-primary/50
 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
 active:scale-[0.98]"
```

Icon: `"w-6 h-6 text-muted-foreground"`
Label: `"text-sm font-medium text-foreground"`

Mobile single-column override: `"grid-cols-1 min-h-[56px]"` applied when viewport < `sm`.

### Step 2 — "← Back" button

Ghost variant, rendered in modal body above shared fields:
```
"flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground
 transition-colors mb-4"
```
Icon: `ChevronLeft` `w-4 h-4`. `aria-label="Back to type selection"`.

### ReadingAssignmentView card

```
"rounded-xl border border-border bg-accent-subtle px-5 py-4 flex flex-col gap-2"
```

Link: `"flex items-center gap-2 text-accent font-medium hover:underline"`
Time badge: `"text-xs text-muted-foreground"`
Description: `"text-sm text-foreground mt-1"`

### VocabAssignmentView

```jsx
<dl className="divide-y divide-border">
  <div className="py-3">
    <dt className="text-sm font-semibold text-foreground">{term}</dt>
    <dd className="text-sm text-muted-foreground pl-4 mt-0.5">{definition}</dd>
  </div>
</dl>
```

### PracticeProblemRunner

Progress bar container: `"w-full bg-surface-raised rounded-full h-1.5 mb-4"`
Progress fill: `"bg-primary h-1.5 rounded-full transition-all"`

Answer option row (pre-submit):
```
"flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border cursor-pointer
 transition-colors hover:bg-surface-raised min-h-[44px]"
```

Post-submit correct: `"bg-success/10 border-success text-success"`
Post-submit incorrect (selected): `"bg-destructive/10 border-destructive text-destructive"`
Post-submit disabled overlay: `"pointer-events-none opacity-80"`

Score summary heading: `"text-2xl font-bold text-foreground"`
Auto-complete message: `"text-sm font-medium text-success"`

Mobile full-width buttons: `"w-full sm:w-auto"` on Retry and Mark complete.

### Form field error state

Rendered beneath each field: `<p role="alert" className="text-sm text-destructive mt-1">`
Required marker: `<span aria-hidden="true"> *</span>` in label; `<span className="sr-only"> (required)</span>` after it.

---

## 11. Edge Cases and Error Handling

### Loading states

- **Initial page load:** Existing `LoadingSpinner` covers assignment fetch (part of `Promise.all`).
- **Form submission:** Submit button shows `"Saving..."` and is disabled; `useFormSubmit` manages `submitting` state.
- **Completion toggle:** Optimistic — no spinner. Error reverts state.
- **Reorder:** Optimistic swap — no spinner. Error reverts state, sets page error.

### Empty state (zero assignments)

No assignment card is rendered. The stepper shows only Lesson Plan and Quiz nodes. The inline "+ Add assignment" button appears in the assignment list area (teacher only). Students see only the lesson plan step with no assignment section.

### Validation errors

| Location | Validation | Display |
|---|---|---|
| `AssignmentFormModal` | Title non-empty | `<p role="alert">` beneath Title field |
| `AssignmentFormModal` | API VALIDATION_ERROR (400) | `<ErrorMessage>` above submit buttons |
| `VocabAssignmentForm` | At least 1 entry, term + definition non-empty | `<p role="alert">` beneath form |
| `PracticeProblemAssignmentForm` | At least 1 question | `<p role="alert">` beneath questions list |
| `PracticeProblemAssignmentForm` | Passing percentage 0–100 if provided | `<p role="alert">` beneath field |
| `VideoAssignmentForm` | URL non-empty (basic format check) | `<p role="alert">` beneath URL field |
| `ReadingAssignmentForm` | URL non-empty | `<p role="alert">` beneath URL field |
| `PracticeProblemRunner` | Answer selected before submit | Submit button disabled until selection made |

### API error handling

| Scenario | Handling |
|---|---|
| GET assignments fails | Caught in `Promise.all` catch → page-level `setError` → `<ErrorMessage>` |
| POST/PUT assignment fails | `ApiClientError` caught by `useFormSubmit` → error string in modal |
| DELETE assignment fails | `ApiClientError` caught, page-level error set |
| Reorder fails | Revert optimistic state; page-level error set |
| Complete/uncomplete fails | Revert optimistic state; error surfaced near toggle |
| Auto-complete POST fails | `completeError` state in runner → error message in summary; "Mark complete" still available |
| 401 | Global `auth:unauthorized` event → logout |
| 403 | ApiClientError displayed: "You don't have permission to perform this action" |
| 404 assignment | ApiClientError displayed: "Assignment not found" |

### Delete confirmation

```
ConfirmDialog
  title: "Delete assignment?"
  description: "This will permanently delete \"{title}\" and cannot be undone."
  confirmLabel: "Delete"
  variant: "danger"
  onConfirm: () => handleDeleteAssignment(deletingAssignmentId)
  onCancel: () => setDeletingAssignmentId(null)
```

### Move up/down disabled states

- First assignment: Move Up `disabled` + `aria-disabled="true"` + `opacity-30 cursor-not-allowed` (matches existing pattern in AssignmentSection).
- Last assignment: Move Down disabled similarly.

### Edit mode — type immutability

In `AssignmentFormModal` edit mode, there is no type picker step. The `type` field is rendered as read-only text (e.g., `<span className="text-sm text-muted-foreground capitalize">{type.replace('_', ' ')}</span>`), not a `<select>`. The PUT request never includes `type`.

### Two-step modal — discard behavior

Because the two-step flow is fast and lightweight, there is no "are you sure?" confirmation when exiting mid-fill. The X button in the header and the Cancel button in the footer always dismiss the modal immediately, regardless of which step is active. This applies in both create mode (Step 1 or Step 2) and edit mode.

### Practice problem edge cases

- **Single question:** After submitting, phase goes directly to summary; no "Next question" button rendered.
- **All wrong, no passing percentage:** Summary shows score 0%, "Mark complete" + "Retry" buttons both shown.
- **Auto-complete API fails:** `completeError` shown in summary; "Mark complete" button appears so student can retry.
- **Retry after auto-complete:** Runner resets; `autoCompleted` clears locally. The server completion record already exists (idempotent per contract). A subsequent auto-complete calls POST again, which the server handles idempotently.
- **No answers selected:** Submit button `disabled` until at least one answer is chosen (for all question types).

### Mobile modal scrolling

The content area inside `AssignmentFormModal` uses `overflow-y-auto flex-1` to allow internal scrolling. The existing `Modal` component already constrains to `max-h-[85vh]`. The "← Back" button and X button remain visible in the modal header without scrolling.

---

## New Types to Add to `client/src/api/types.ts`

```typescript
export type AssignmentType = 'note' | 'video' | 'reading' | 'vocab' | 'practice_problem';
export type PracticeQuestionType = 'multiple_choice' | 'true_false' | 'matching' | 'fill_in_blank';

export interface NoteAssignmentData {
  id: string;
  content: Record<string, unknown>;
}

export interface VideoAssignmentData {
  id: string;
  url: string;
  title: string | null;
}

export interface ReadingAssignmentData {
  id: string;
  url: string;
  description: string | null;
  estimatedMinutes: number | null;
}

export interface VocabEntry {
  term: string;
  definition: string;
}

export interface VocabAssignmentData {
  id: string;
  entries: VocabEntry[];
}

export interface PracticeQuestion {
  id: string;
  order: number;
  type: PracticeQuestionType;
  content: Record<string, unknown>;
}

export interface PracticeProblemAssignmentData {
  id: string;
  passingPercentage: number | null;
  questions: PracticeQuestion[];
}

export interface Assignment {
  id: string;
  lessonId: string;
  order: number;
  title: string;
  objective: string | null;
  type: AssignmentType;
  createdAt: string;
  updatedAt: string;
  completed: boolean;
  noteAssignment: NoteAssignmentData | null;
  videoAssignment: VideoAssignmentData | null;
  readingAssignment: ReadingAssignmentData | null;
  vocabAssignment: VocabAssignmentData | null;
  practiceProblemAssignment: PracticeProblemAssignmentData | null;
}

export interface AssignmentCompletion {
  id: string;
  userId: string;
  assignmentId: string;
  completedAt: string;
}
```

---

## New API Module: `client/src/api/assignments.ts`

```typescript
import { apiClient } from './client.js';
import type { Assignment, AssignmentCompletion } from './types.js';

export interface CreateAssignmentPayload {
  title: string;
  objective?: string;
  type: Assignment['type'];
  content?: Record<string, unknown>;
  url?: string;
  description?: string;
  estimatedMinutes?: number;
  entries?: { term: string; definition: string }[];
  passingPercentage?: number | null;
  questions?: { type: string; order: number; content: Record<string, unknown> }[];
}

// NOTE: For video assignments, the optional "title" field in the API contract refers to
// the video display title, distinct from the shared assignment "title". In the form,
// use a local field named "displayTitle" and map it to the key the server expects.
// Cross-reference the backend plan for the exact field name used for the video display
// title in the POST body. If the server uses a separate key (e.g., "videoTitle"), use
// that. If it re-uses "title", the shared assignment title takes the "title" key and
// the video display title must be clarified with the backend coder before implementation.

export type UpdateAssignmentPayload = Omit<Partial<CreateAssignmentPayload>, 'type'>;

export interface ReorderPayload {
  assignmentIds: string[];
}

export const assignmentsApi = {
  getAll: (lessonId: string) =>
    apiClient.get<Assignment[]>(`/lessons/${lessonId}/assignments`),

  create: (lessonId: string, data: CreateAssignmentPayload) =>
    apiClient.post<Assignment>(`/lessons/${lessonId}/assignments`, data),

  update: (assignmentId: string, data: UpdateAssignmentPayload) =>
    apiClient.put<Assignment>(`/assignments/${assignmentId}`, data),

  delete: (assignmentId: string) =>
    apiClient.delete<void>(`/assignments/${assignmentId}`),

  reorder: (lessonId: string, data: ReorderPayload) =>
    apiClient.put<Assignment[]>(`/lessons/${lessonId}/assignments/reorder`, data),

  complete: (assignmentId: string) =>
    apiClient.post<AssignmentCompletion>(`/assignments/${assignmentId}/complete`, {}),

  uncomplete: (assignmentId: string) =>
    apiClient.delete<void>(`/assignments/${assignmentId}/complete`),
};
```
