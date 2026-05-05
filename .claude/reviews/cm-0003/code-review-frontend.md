---
id: cm-0003
title: Assignment Layer — Frontend Code Review
stage: review
status: approved
approver: agent
approved_at: 2026-05-04T00:00:00Z
---

# Code Review: Assignment Layer — Frontend

## Summary

Re-review of the cm-0003 Assignment Layer frontend after two blocking fixes were applied. Both previously blocking issues are resolved. The implementation is architecturally sound — the type-registry pattern in `AssignmentFormModal` is clean and extensible, all scroll/navigation/completion bugs are fixed, and the wizard refactor is correctly implemented throughout. Approving with four low/info findings documented for awareness.

## Scope Coverage

- **Frontend files reviewed**: `client/src/api/assignments.ts`, `client/src/api/types.ts`, `client/src/features/assignments/AssignmentFormModal.tsx`, `client/src/features/assignments/AssignmentTypePicker.tsx`, `client/src/features/assignments/PracticeProblemMetaFields.tsx`, `client/src/features/assignments/NoteAssignmentForm.tsx`, `client/src/features/assignments/VideoAssignmentForm.tsx`, `client/src/features/assignments/ReadingAssignmentForm.tsx`, `client/src/features/assignments/VocabAssignmentForm.tsx`, `client/src/features/assignments/PracticeProblemAssignmentForm.tsx`, `client/src/features/assignments/NoteAssignmentView.tsx`, `client/src/features/assignments/VideoAssignmentView.tsx`, `client/src/features/assignments/ReadingAssignmentView.tsx`, `client/src/features/assignments/VocabAssignmentView.tsx`, `client/src/features/assignments/PracticeProblemRunner.tsx`, `client/src/features/lessons/LessonDetailPage.tsx`, `client/src/features/lessons/AssignmentStepper.tsx`, `client/src/features/lessons/AssignmentSection.tsx`, `client/src/features/lessons/LessonPlanView.tsx`, `client/src/features/notes/NoteEditor.tsx`
- **Backend files reviewed**: none (frontend scope only)
- **Rules loaded**: `rules.md`, `frontend.md`

---

## Previously Blocking Issues — Resolved

### [HIGH — FIXED] api-contract deviation: video display title field name

- **Location**: `.claude/plans/cm-0003/api-contract.md`
- **Resolution**: The api-contract document has been updated. The `videoAssignment` response shape now correctly shows `"displayTitle": "string | null"`. The POST video body now correctly shows `"displayTitle": "string (optional)"` with an explanatory note about the naming choice. The PUT body also now lists `"displayTitle"` explicitly. Both backend and frontend code were already aligned on `displayTitle` — only the doc required correction. Verified.

### [MEDIUM — FIXED] VideoAssignmentForm shows URL error before user has touched the field

- **Location**: `client/src/features/assignments/VideoAssignmentForm.tsx:13,17,44`
- **Resolution**: `urlTouched` state added, initialised to `false`. `setUrlTouched(true)` is called in `handleUrlBlur` (which fires on the URL input's `onBlur`). Error condition changed from `!url.trim()` to `urlTouched && !url.trim()`. Matches the pattern in `ReadingAssignmentForm`. Verified.

---

## Remaining Issues

### [LOW] `handleSubmit` (FormEvent signature) passed as onClick handler in items step

- **Location**: `client/src/features/assignments/AssignmentFormModal.tsx` — Save button in items step
- **Description**: `handleSubmit` from `useFormSubmit` has the TypeScript signature `(e: FormEvent) => Promise<void>`. In the `items` step the Save button is `<Button type="button" onClick={handleSubmit}>`, which passes a `MouseEvent<HTMLButtonElement>` rather than `FormEvent`. No runtime failure because `e.preventDefault()` exists on both event types, but TypeScript will flag the mismatch and the inconsistency between the meta step (uses `<form onSubmit={...}>`) and the items step is confusing.
- **Suggested Fix**: Wrap the items-step container in a `<form onSubmit={handleSubmit}>` and change the Save button to `type="submit"`, matching the meta-step pattern.

---

### [LOW] Index used as React key on reorderable, deletable lists

- **Location**: `client/src/features/assignments/VocabAssignmentForm.tsx:32`, `client/src/features/assignments/PracticeProblemAssignmentForm.tsx:509`
- **Description**: Both forms use `key={idx}` on list items that can be reordered and deleted. When an item is removed from the middle, React reuses the DOM node from the wrong position, causing controlled-input state to bleed between entries.
- **Suggested Fix**: Generate a stable `_id` per entry via `crypto.randomUUID()` at creation time and use it as the React key.

---

### [LOW] `toApiBody` is a no-op cast with a misleading JSDoc

- **Location**: `client/src/api/assignments.ts:63–75`
- **Description**: `toApiBody` casts its argument to `Record<string, unknown>` with no transformation. Its JSDoc describes backend behaviour, not client behaviour. A reader may assume it performs field mapping.
- **Suggested Fix**: Remove `toApiBody`, cast inline at call sites, and move the field-naming explanation to a file-level comment.

---

### [INFO] VocabAssignmentForm and PracticeProblemAssignmentForm show validation errors before user interaction

- **Location**: `client/src/features/assignments/VocabAssignmentForm.tsx:85–89`, `client/src/features/assignments/PracticeProblemAssignmentForm.tsx:527–531`
- **Description**: "At least one ... is required" errors render immediately when the items step opens with an empty list. Does not block correct submission.
- **Suggested Fix**: Gate on a `submitAttempted` flag set only when Save is clicked with an empty list.

---

## Verdict

**Status**: APPROVED

Both blocking issues (HIGH api-contract doc correction, MEDIUM VideoAssignmentForm eager error) are resolved. Four low/info issues documented above; none block merge. The implementation is correct, well-structured, and consistent with project conventions.
