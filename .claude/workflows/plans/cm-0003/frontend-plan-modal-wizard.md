---
id: cm-0003
title: Assignment Layer — Modal Wizard Refactor
stage: design
status: approved
approver: human
approved_at: 2026-05-04T00:00:00Z
depends_on: frontend-plan.md
---

# Frontend Plan — cm-0003 Modal Wizard Refactor

## Overview

Refactors `AssignmentFormModal` from a two-step flow (`'pick' | 'form'`) to a three-step flow (`'pick' | 'meta' | 'items'`) to eliminate the large vertical scroll in `vocab` and `practice_problem` forms. No backend changes. No API changes. No new files.

The modal adopts a **type registry** pattern so that adding a new assignment type in the future requires only one new registry entry and one new form component — zero changes to the modal's rendering or navigation logic.

---

## 1. New Step Model

```typescript
type ModalStep = 'pick' | 'meta' | 'items';
```

| Step   | Renders                                       | When shown                       |
|--------|-----------------------------------------------|----------------------------------|
| `pick` | `AssignmentTypePicker` card grid              | Create mode only                 |
| `meta` | Title + Objective + `config.MetaFields`       | Always (after type is chosen)    |
| `items`| `config.ItemsForm`                            | Only when `config.ItemsForm` exists |

---

## 2. Type Registry

A single `TYPE_CONFIG` map owns all per-type decisions. **This is the only place that changes when a new assignment type is added.**

```typescript
// Shared state bag — the modal owns all fields; each sub-form uses only what it needs.
// Having one flat bag avoids per-type state juggling in the modal shell.
export interface TypeFormState {
  noteContent: Record<string, unknown> | null;
  url: string;               // video + reading
  displayTitle: string;      // video
  description: string;       // reading
  estimatedMinutes: string;  // reading
  passingPercentage: string; // practice_problem
  entries: VocabEntry[];     // vocab
  questions: PracticeQuestionDraft[]; // practice_problem
}

export interface TypeFormHandlers {
  onNoteContentChange: (v: Record<string, unknown>) => void;
  onUrlChange: (v: string) => void;
  onDisplayTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onEstimatedMinutesChange: (v: string) => void;
  onPassingPercentageChange: (v: string) => void;
  onEntriesChange: (entries: VocabEntry[]) => void;
  onQuestionsChange: (questions: PracticeQuestionDraft[]) => void;
}

// Props passed to every sub-form component
export type SubFormProps = TypeFormState & TypeFormHandlers;

interface TypeConfig {
  label: string;                                      // Display label and modal title
  icon: LucideIcon;                                   // Stepper + picker icon
  nextLabel?: string;                                 // "Next: Terms →" — present only when ItemsForm exists
  MetaFields?: React.ComponentType<SubFormProps>;     // Type-specific fields on the meta step
  ItemsForm?: React.ComponentType<SubFormProps>;      // Bulk items on the items step (optional step)
}

const TYPE_CONFIG: Record<AssignmentType, TypeConfig> = {
  note:             { label: 'Note',             icon: FileText,    MetaFields: NoteAssignmentForm },
  video:            { label: 'Video',             icon: Video,       MetaFields: VideoAssignmentForm },
  reading:          { label: 'Reading',           icon: ExternalLink, MetaFields: ReadingAssignmentForm },
  vocab:            { label: 'Vocab',             icon: BookMarked,  nextLabel: 'Terms',
                      ItemsForm: VocabAssignmentForm },
  practice_problem: { label: 'Practice Problem',  icon: Brain,       nextLabel: 'Questions',
                      MetaFields: PracticeProblemMetaFields,
                      ItemsForm: PracticeProblemAssignmentForm },
};
```

`AssignmentTypePicker` derives its card list directly from `TYPE_CONFIG`:
```typescript
const TYPES = Object.entries(TYPE_CONFIG) as [AssignmentType, TypeConfig][];
// renders each as a card — no separate ASSIGNMENT_TYPES array needed
```

---

## 3. New File: PracticeProblemMetaFields

**File:** `client/src/features/assignments/PracticeProblemMetaFields.tsx`

Renders only the passing percentage field. Exists so the registry can point to a component rather than inlining a `selectedType === 'practice_problem'` branch in the modal shell.

```typescript
export default function PracticeProblemMetaFields({ passingPercentage, onPassingPercentageChange }: SubFormProps) {
  const [touched, setTouched] = useState(false);
  const pct = Number(passingPercentage);
  const error = touched && passingPercentage !== '' && (pct < 0 || pct > 100)
    ? 'Must be between 0 and 100'
    : '';

  return (
    <div>
      <label className="text-sm font-medium text-foreground">
        Passing percentage <span className="text-muted-foreground font-normal">(optional)</span>
      </label>
      <div className="flex items-center gap-2 mt-1">
        <Input
          type="number" min={0} max={100}
          value={passingPercentage}
          onChange={e => onPassingPercentageChange(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="e.g. 80"
          className="w-24"
        />
        <span className="text-sm text-muted-foreground">% — leave empty for manual completion</span>
      </div>
      {error && <p role="alert" className="text-sm text-destructive mt-1">{error}</p>}
    </div>
  );
}
```

---

## 4. AssignmentFormModal — Internal State

**Step state** — replaces `'pick' | 'form'`:
```typescript
const [step, setStep] = useState<ModalStep>(initial ? 'meta' : 'pick');
const [selectedType, setSelectedType] = useState<AssignmentType | null>(
  initial ? initial.type : null
);
```

**Flat type-form state** — all fields initialised from `initial` if present:
```typescript
const [typeState, setTypeState] = useState<TypeFormState>({
  noteContent: initial?.noteAssignment?.content ?? null,
  url: initial?.videoAssignment?.url ?? initial?.readingAssignment?.url ?? '',
  displayTitle: initial?.videoAssignment?.title ?? '',
  description: initial?.readingAssignment?.description ?? '',
  estimatedMinutes: String(initial?.readingAssignment?.estimatedMinutes ?? ''),
  passingPercentage: String(initial?.practiceProblemAssignment?.passingPercentage ?? ''),
  entries: initial?.vocabAssignment?.entries ?? [],
  questions: (initial?.practiceProblemAssignment?.questions ?? []).map(q => ({ ...q })),
});

const typeHandlers: TypeFormHandlers = {
  onNoteContentChange:       v => setTypeState(s => ({ ...s, noteContent: v })),
  onUrlChange:               v => setTypeState(s => ({ ...s, url: v })),
  onDisplayTitleChange:      v => setTypeState(s => ({ ...s, displayTitle: v })),
  onDescriptionChange:       v => setTypeState(s => ({ ...s, description: v })),
  onEstimatedMinutesChange:  v => setTypeState(s => ({ ...s, estimatedMinutes: v })),
  onPassingPercentageChange: v => setTypeState(s => ({ ...s, passingPercentage: v })),
  onEntriesChange:           v => setTypeState(s => ({ ...s, entries: v })),
  onQuestionsChange:         v => setTypeState(s => ({ ...s, questions: v })),
};

const subFormProps: SubFormProps = { ...typeState, ...typeHandlers };
```

---

## 5. Modal Rendering — Registry-Driven

The modal shell contains **no per-type branches**. All type-specific decisions go through the registry.

```typescript
const config = selectedType ? TYPE_CONFIG[selectedType] : null;
const hasItems = !!config?.ItemsForm;
```

**Modal title:**
```typescript
const title = step === 'pick'
  ? 'Add Assignment'
  : initial ? `Edit ${config!.label}` : `Add ${config!.label}`;
```

**Step indicator** (shown only for two-step types):
```tsx
{hasItems && step !== 'pick' && (
  <span className="text-xs text-muted-foreground">
    {step === 'meta' ? '1 of 2' : '2 of 2'}
  </span>
)}
```

**Body content:**
```tsx
{step === 'pick' && (
  <AssignmentTypePicker config={TYPE_CONFIG} onSelect={handleTypeSelected} />
)}

{step === 'meta' && (
  <div className="flex flex-col gap-4">
    <Input label="Title" required value={title} onChange={...} error={titleError} />
    <Textarea label="Objective (optional)" value={objective} onChange={...} />
    {config!.MetaFields && <config.MetaFields {...subFormProps} />}
  </div>
)}

{step === 'items' && config!.ItemsForm && (
  <config.ItemsForm {...subFormProps} />
)}
```

**Footer:**
```tsx
{step !== 'pick' && !initial && (
  <button onClick={handleBack}>‹ Back</button>
)}
<button onClick={onClose}>Cancel</button>

{step === 'meta' && !hasItems && (
  <Button onClick={handleSubmit} loading={submitting}>Save assignment</Button>
)}
{step === 'meta' && hasItems && (
  <Button onClick={handleAdvanceToItems}>
    Next: {config!.nextLabel} →
  </Button>
)}
{step === 'items' && (
  <Button onClick={handleSubmit} loading={submitting}>Save assignment</Button>
)}
```

---

## 6. Navigation Handlers

```typescript
function handleTypeSelected(type: AssignmentType) {
  setSelectedType(type);
  setStep('meta');
}

function handleBack() {
  if (step === 'items') { setStep('meta'); return; }
  // meta in create mode — return to picker and wipe all state
  setSelectedType(null);
  setStep('pick');
  setTitle(''); setObjective('');
  setTypeState(EMPTY_TYPE_STATE);
}

function handleAdvanceToItems() {
  if (!title.trim()) { setTitleError('Title is required'); return; }
  setTitleError('');
  setStep('items');
}
```

---

## 7. Payload Assembly (unchanged logic)

```typescript
function buildPayload(): CreateAssignmentPayload {
  const base = { title, objective: objective || undefined, type: selectedType! };
  switch (selectedType) {
    case 'note':             return { ...base, content: typeState.noteContent ?? {} };
    case 'video':            return { ...base, url: typeState.url, displayTitle: typeState.displayTitle || undefined };
    case 'reading':          return { ...base, url: typeState.url, description: typeState.description || undefined,
                                      estimatedMinutes: typeState.estimatedMinutes ? Number(typeState.estimatedMinutes) : undefined };
    case 'vocab':            return { ...base, entries: typeState.entries };
    case 'practice_problem': return { ...base,
                                      passingPercentage: typeState.passingPercentage ? Number(typeState.passingPercentage) : undefined,
                                      questions: typeState.questions };
  }
}
```

The switch here is intentional — payload shapes are type-specific and map 1:1 to the API contract. Unlike the modal rendering logic, this switch does not grow with UI complexity; it changes only when the API contract changes.

---

## 8. PracticeProblemAssignmentForm — Prop Change

**Remove** `passingPercentage` and `onPassingPercentageChange` from props (now owned by `PracticeProblemMetaFields`). The component renders only the questions list.

```typescript
// Before
interface PracticeProblemAssignmentFormProps {
  passingPercentage: string;
  questions: PracticeQuestionDraft[];
  onPassingPercentageChange: (v: string) => void;
  onQuestionsChange: (questions: PracticeQuestionDraft[]) => void;
}

// After — component now implements SubFormProps, uses only questions fields
export default function PracticeProblemAssignmentForm({ questions, onQuestionsChange }: SubFormProps) { ... }
```

All other sub-form components (`NoteAssignmentForm`, `VideoAssignmentForm`, `ReadingAssignmentForm`, `VocabAssignmentForm`) update their signatures to accept `SubFormProps` and destructure only the fields they use. No logic changes.

---

## 9. Adding a Future Assignment Type — Checklist

Adding a new type (e.g. `file_upload`) requires exactly:

1. Add `file_upload` to `AssignmentType` union in `api/types.ts`
2. Create `FileUploadMetaFields.tsx` and/or `FileUploadItemsForm.tsx` in `features/assignments/`
3. Add one entry to `TYPE_CONFIG`:
   ```typescript
   file_upload: { label: 'File Upload', icon: Upload, MetaFields: FileUploadMetaFields }
   ```
4. Add the `file_upload` case to `buildPayload()`

**Zero changes** to: `AssignmentFormModal` rendering, `AssignmentTypePicker`, navigation handlers, step indicator, footer buttons.

---

## 10. Files Changed

| File | Change |
|---|---|
| `AssignmentFormModal.tsx` | New step model; flat `typeState`; registry-driven rendering; no per-type branches in body/footer |
| `PracticeProblemMetaFields.tsx` | **New file** — passing percentage field, registered at `practice_problem.MetaFields` |
| `PracticeProblemAssignmentForm.tsx` | Remove passing% props; accept `SubFormProps` |
| `NoteAssignmentForm.tsx` | Accept `SubFormProps`; destructure `noteContent`, `onNoteContentChange` |
| `VideoAssignmentForm.tsx` | Accept `SubFormProps`; destructure `url`, `displayTitle`, `onUrlChange`, `onDisplayTitleChange` |
| `ReadingAssignmentForm.tsx` | Accept `SubFormProps`; destructure url/description/estimatedMinutes fields |
| `VocabAssignmentForm.tsx` | Accept `SubFormProps`; destructure `entries`, `onEntriesChange` |
| `AssignmentTypePicker.tsx` | Accept `config: Record<AssignmentType, TypeConfig>`; derive card list from it |
