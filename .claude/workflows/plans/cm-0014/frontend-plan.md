---
id: cm-0014
title: Standardize Form State Management and Error Display
stage: design
status: approved
approver: human
approved_at: 2026-05-12T00:00:00Z
---

## Overview

This plan covers the removal of the `useFormSubmit` hook from all eight consumer forms and the elimination of the `<p className="text-sm text-destructive">` ad-hoc error display pattern from all 16 affected files. The migration replaces `useFormSubmit` with inlined `useState` + `useEffect`-free async submission logic (same pattern, no wrapper), and replaces all ad-hoc `<p>` error tags with the shared `ErrorMessage` component. The `ErrorMessage` component needs a single backward-compatible extension to support the two additional display contexts found in this audit: compact inline errors (field-adjacent, with custom margin) and `text-xs` size errors (the AssessmentForm bulk toolbar error). After migration, `useFormSubmit` is deleted and `client/CLAUDE.md` is updated.

No new runtime dependencies are introduced. react-hook-form is not in `client/package.json` and NFR-01 prohibits adding it.

---

## Dependencies

react-hook-form is **not installed** and must **not** be added (NFR-01). The migration inlines the same `useState`-based pattern that `useFormSubmit` currently abstracts — two state variables (`submitting`, `error`) plus an async submit handler with `e.preventDefault()`, a try/catch, and a finally block. This is the identical logic currently inside `useFormSubmit`, moved directly into each form.

No packages need to be installed.

---

## Shared Utilities

No new shared hook or utility is created. The `useFormSubmit` abstraction is thin enough that inlining it into each form is clearer and reduces indirection. The submission pattern (two `useState` + async handler) will appear identically in all eight forms; this is acceptable given the small number of forms and the explicit goal of removing the wrapper.

The `ApiClientError` and `classifyError` imports from `src/api/client.ts` are already used inside `useFormSubmit`. After the hook is deleted, each migrated form imports these directly.

---

## ErrorMessage Component Changes

**File:** `client/src/components/ErrorMessage.tsx`

**Extension required** (backward-compatible). The current component accepts only `message: string` and `className?: string`. Two new use cases found in the audit require additions:

**1. Compact/inline variant (`variant` prop):**
Several ad-hoc `<p>` tags appear inside tight UI contexts with positioning modifiers (`-mt-2`, `mt-1`) that are incompatible with the `ErrorMessage` component's full-width box (background, border, padding). These are inline field-validation hints, not API error banners. Examples:
- `VideoAssignmentForm.tsx`: `<p role="alert" className="text-sm text-destructive -mt-2">URL is required</p>`
- `ReadingAssignmentForm.tsx`: `<p role="alert" className="text-sm text-destructive mt-1">URL is required</p>`
- `AssignmentFormModal.tsx` (titleError): `<p role="alert" className="text-sm text-destructive mt-1">{titleError}</p>`
- `PracticeProblemMetaFields.tsx`: `<p role="alert" className="text-sm text-destructive mt-1">{error}</p>`

These should render as bare `<p>` elements styled `text-sm text-destructive` with no box styling, identical to what they are today but using `ErrorMessage` as the component.

Add a `variant` prop to `ErrorMessage`:
- `variant="default"` (current behavior, box with background/border/padding — this is the default)
- `variant="inline"` (renders a plain `<p className="text-sm text-destructive">` with no box)

The `className` prop continues to work in both variants to allow margin overrides (`mt-1`, `-mt-2`).

**2. `text-xs` size (for AssessmentForm bulk toolbar error):**
`AssessmentForm.tsx` line 208: `<p className="text-xs text-destructive mt-1">{bulkError}</p>` — this is inside a compact toolbar with `text-xs` body text.

Handle this with `variant="inline"` and a `className="text-xs mt-1"` override rather than adding a separate `size` prop. The inline variant renders a plain `<p>` so the `className` fully controls the text size.

**Backward compatibility:** All existing `ErrorMessage` consumers pass only `message` (and optionally `className`). Adding `variant` with `"default"` as the default value means zero changes to existing callers.

---

## Form Migration Plan

### The 7 Simple CRUD Forms (identical pattern)

These forms are structurally identical: `useState` for field values + `useFormSubmit` for submission + a single `{error && <p ...>}` block. They map 1:1 to the same migration template.

**Files:**
- `client/src/features/courses/CourseForm.tsx`
- `client/src/features/units/UnitForm.tsx`
- `client/src/features/lessons/LessonForm.tsx`
- `client/src/features/flashcards/FlashCardForm.tsx`
- `client/src/features/vocab/VocabForm.tsx`
- `client/src/features/practice-problems/PracticeProblemForm.tsx`
- `client/src/features/videos/VideoForm.tsx`

**Migration pattern for each:**

1. Remove the `import useFormSubmit` statement.
2. Add `import { ApiClientError, classifyError } from '../../api/client.js'` (VideoForm already imports this transitively; verify direct import is needed).
3. Add `import ErrorMessage from '../../components/ErrorMessage.js'`.
4. Replace the `useFormSubmit(async () => { ... })` call with two `useState` declarations: `const [error, setError] = useState('')` and `const [submitting, setSubmitting] = useState(false)`.
5. Add an async `handleSubmit` function that calls `e.preventDefault()`, sets `submitting(true)`, clears `error`, runs the validation and `onSubmit` call inside a try block, catches with `setError(err instanceof ApiClientError ? classifyError(err) : err instanceof Error ? err.message : 'Something went wrong')`, and sets `submitting(false)` in a finally block. This is the exact body of `useFormSubmit`, moved inline.
6. Replace `{error && <p className="text-sm text-destructive">{error}</p>}` with `{error && <ErrorMessage message={error} />}`.

The validation logic (`if (!title.trim()) throw new Error(...)`) and the `onSubmit(...)` call remain entirely unchanged in each form.

**VideoForm special note:** VideoForm also uses `useYouTubeTitle`. That hook is unaffected. The `fetchingTitle` state and `handleUrlBlur` from `useYouTubeTitle` remain in place. Only the `useFormSubmit` import and call are replaced.

### AssignmentFormModal

**File:** `client/src/features/assignments/AssignmentFormModal.tsx`

This form is more complex but the migration is mechanically the same for the `useFormSubmit` portion. The form already imports `ErrorMessage` and already uses it for `apiError`. It has a separate inline `titleError` for the title field.

**Changes:**

1. Remove `import useFormSubmit from '../../hooks/useFormSubmit.js'`.
2. Add `import { ApiClientError, classifyError } from '../../api/client.js'` (check if already present — it is not currently in this file).
3. Replace the `useFormSubmit(async () => { ... })` destructure with direct `useState` for `apiError` (rename from `error` to `apiError` to match existing usage) and `submitting`.
4. Inline the async `handleSubmit` function. The existing submission logic (the large if/else block building `createPayload` / `updatePayload`) moves into the try block of the inlined handler verbatim.
5. The `titleError` / `setTitleError` state already uses `<p role="alert" className="text-sm text-destructive mt-1">` — replace with `<ErrorMessage variant="inline" message={titleError} className="mt-1" />`.
6. The existing `{apiError && <ErrorMessage message={apiError} />}` lines (already using the component) remain unchanged.

Note: `handleSubmit` is called both as `onSubmit` on the `<form>` element (step `meta`) and as `onClick` on the "Save assignment" button (step `items`). After inlining, the handler must still support both call sites. In step `items` it is called without an event, so the handler must guard against `e?.preventDefault()` (optional chaining) — or the existing pattern of passing `handleSubmit` directly to `onClick` already does this. Verify the existing behavior is preserved.

---

## Error Display Migration

All 16 occurrences of `<p className="text-sm text-destructive">` (and the two `role="alert"` variants) must be replaced. After the ErrorMessage extension is complete, apply the following replacements:

### Standard form-level errors (use `<ErrorMessage message={...} />` — default variant)

These are standalone error banners below form fields, rendered when `error` is truthy:

| File | Current pattern | Replacement |
|---|---|---|
| `CourseForm.tsx` | `{error && <p className="text-sm text-destructive">{error}</p>}` | `{error && <ErrorMessage message={error} />}` |
| `UnitForm.tsx` | same | same |
| `LessonForm.tsx` | same | same |
| `FlashCardForm.tsx` | same | same |
| `VocabForm.tsx` | same | same |
| `PracticeProblemForm.tsx` | same | same |
| `VideoForm.tsx` | same | same |
| `AssessmentForm.tsx` (line 252, `error`) | `{error && <p className="text-sm text-destructive">{error}</p>}` | `{error && <ErrorMessage message={error} />}` |
| `AssessmentTaker.tsx` (line 123) | `{error && <p className="text-sm text-destructive">{error}</p>}` | `{error && <ErrorMessage message={error} />}` |

### Compact inline errors (use `<ErrorMessage variant="inline" message={...} className="..." />`)

These appear adjacent to specific fields and must not have box styling:

| File | Current pattern | Replacement |
|---|---|---|
| `AssignmentFormModal.tsx` (titleError, line 332) | `{titleError && <p role="alert" className="text-sm text-destructive mt-1">{titleError}</p>}` | `{titleError && <ErrorMessage variant="inline" message={titleError} className="mt-1" />}` |
| `VideoAssignmentForm.tsx` (line 40) | `<p role="alert" className="text-sm text-destructive -mt-2">URL is required</p>` | `<ErrorMessage variant="inline" message="URL is required" className="-mt-2" />` |
| `ReadingAssignmentForm.tsx` (line 27) | `<p role="alert" className="text-sm text-destructive mt-1">URL is required</p>` | `<ErrorMessage variant="inline" message="URL is required" className="mt-1" />` |
| `PracticeProblemMetaFields.tsx` (line 30) | `{error && <p role="alert" className="text-sm text-destructive mt-1">{error}</p>}` | `{error && <ErrorMessage variant="inline" message={error} className="mt-1" />}` |
| `PracticeProblemAssignmentForm.tsx` (line 182) | `<p role="alert" className="text-sm text-destructive">At least one question is required.</p>` | `<ErrorMessage variant="inline" message="At least one question is required." />` |
| `VocabAssignmentForm.tsx` (line 95) | `<p role="alert" className="text-sm text-destructive">At least one term...</p>` | `<ErrorMessage variant="inline" message="At least one term with a non-empty term and definition is required." />` |
| `PracticeProblemRunner.tsx` (line 350, `completeError`) | `<p role="alert" className="text-sm text-destructive">{completeError}</p>` | `<ErrorMessage variant="inline" message={completeError} />` |

### Compact `text-xs` inline error (use `variant="inline"` with `className`)

| File | Current pattern | Replacement |
|---|---|---|
| `AssessmentForm.tsx` (line 208, `bulkError`) | `<p className="text-xs text-destructive mt-1">{bulkError}</p>` | `<ErrorMessage variant="inline" message={bulkError} className="text-xs mt-1" />` |

### Not in scope (confirmed exclusions)

The following `text-xs text-destructive` patterns found in the audit are **not changed** in this migration:
- `Input.tsx` line 26 — component-internal field error built into the `error` prop rendering
- `Textarea.tsx` line 26 — same
- `RichTextEditor.tsx` line 131 — editor component, out of scope per spec
- `ProfilePage.tsx` line 162 — auth form, out of scope per spec

---

## Deletion Plan

**File to delete:** `client/src/hooks/useFormSubmit.ts`

**Prerequisites before deletion:**
- All 8 forms (CourseForm, UnitForm, LessonForm, FlashCardForm, VocabForm, PracticeProblemForm, VideoForm, AssignmentFormModal) have been migrated and the `import useFormSubmit` line removed from each.
- A codebase-wide search for `useFormSubmit` returns zero results.
- A codebase-wide search for `text-sm text-destructive` returns zero results (all 16 instances replaced).

**Verification before deletion:** Run `grep -r "useFormSubmit" client/src` and confirm empty output. Then delete the file.

---

## Documentation Updates

**File:** `client/CLAUDE.md`

**Section: Custom Hooks table** — remove the `useFormSubmit` row:

```
| `useFormSubmit` | Form submission with error/loading state |
```

**Section: Key Conventions** — update the line:

```
- Forms use `useState` for field values, `useFormSubmit` for async submission
```

Replace with:

```
- Forms use `useState` for field values and inline async submit handlers (loading + error state managed directly in each form component)
```

**Section: Shared Components** — `ErrorMessage` is already listed. No change needed to the component list, but a note about the `variant` prop is useful if the docs describe component props. No current docs describe component props in detail, so no additional update is needed.

---

## Implementation Steps

Steps 1–2 are independent and can be done in parallel. All subsequent steps depend on step 1 completing first.

**Step 1: Extend `ErrorMessage` component** (prerequisite for all error display replacements)
- Add `variant?: 'default' | 'inline'` prop to `ErrorMessage` with `'default'` as the default value.
- When `variant === 'inline'`, render `<p className={`text-sm text-destructive ${className}`}>{message}</p>` with `role="alert"`.
- When `variant === 'default'` (or omitted), render the current box div unchanged.
- File: `client/src/components/ErrorMessage.tsx`

**Step 2: Migrate the 7 simple CRUD forms** (independent of each other, can be done in any order or simultaneously)
- CourseForm, UnitForm, LessonForm, FlashCardForm, VocabForm, PracticeProblemForm, VideoForm.
- For each: remove `useFormSubmit` import, add direct imports, inline submission state and handler, replace error `<p>` with `<ErrorMessage>`.
- All seven can be done in parallel.

**Step 3: Migrate AssignmentFormModal** (depends on step 1 being complete; independent of step 2)
- Remove `useFormSubmit` import.
- Inline submission state (rename to `apiError` / `submitting` matching existing destructure names).
- Move the existing large submission logic block into the inlined handler's try block verbatim.
- Replace the `titleError` inline `<p>` with `<ErrorMessage variant="inline" ... />`.
- Verify the `handleSubmit` function works both as `onSubmit` on the form element and as a direct `onClick` handler (the event argument may be undefined in the items-step button case — guard with optional chaining on `e?.preventDefault()`).

**Step 4: Replace ad-hoc `<p>` error patterns in the remaining files** (depends on step 1; independent of steps 2–3)
- AssessmentForm: replace both `error` (line 252) and `bulkError` (line 208).
- AssessmentTaker: replace `error` (line 123).
- VideoAssignmentForm: replace URL error (line 40).
- ReadingAssignmentForm: replace URL error (line 27).
- PracticeProblemMetaFields: replace validation error (line 30).
- PracticeProblemAssignmentForm: replace "at least one question" error (line 182).
- VocabAssignmentForm: replace "at least one term" error (line 95).
- PracticeProblemRunner: replace `completeError` (line 350).
- All files in this step are independent of each other.

**Step 5: Delete `useFormSubmit`** (depends on steps 2 and 3 being complete)
- Verify zero `useFormSubmit` imports remain with a grep.
- Delete `client/src/hooks/useFormSubmit.ts`.

**Step 6: Update `client/CLAUDE.md`** (depends on step 5 being complete)
- Remove `useFormSubmit` row from the hooks table.
- Update the Key Conventions line about form state management.

**Step 7: Final verification**
- Grep for `text-sm text-destructive` — must return zero results in `client/src`.
- Grep for `useFormSubmit` — must return zero results in `client/src`.
- Grep for `import.*useFormSubmit` — must return zero results.

---

## File Inventory

### Modified

| File | Change |
|---|---|
| `client/src/components/ErrorMessage.tsx` | Add `variant` prop (`'default' \| 'inline'`) |
| `client/src/features/courses/CourseForm.tsx` | Inline submission state; replace error `<p>` |
| `client/src/features/units/UnitForm.tsx` | Inline submission state; replace error `<p>` |
| `client/src/features/lessons/LessonForm.tsx` | Inline submission state; replace error `<p>` |
| `client/src/features/flashcards/FlashCardForm.tsx` | Inline submission state; replace error `<p>` |
| `client/src/features/vocab/VocabForm.tsx` | Inline submission state; replace error `<p>` |
| `client/src/features/practice-problems/PracticeProblemForm.tsx` | Inline submission state; replace error `<p>` |
| `client/src/features/videos/VideoForm.tsx` | Inline submission state; replace error `<p>` |
| `client/src/features/assignments/AssignmentFormModal.tsx` | Inline submission state; replace `titleError` `<p>` |
| `client/src/features/assessments/AssessmentForm.tsx` | Replace `error` `<p>` and `bulkError` `<p>` |
| `client/src/features/assessments/AssessmentTaker.tsx` | Replace `error` `<p>` |
| `client/src/features/assignments/VideoAssignmentForm.tsx` | Replace URL error `<p>` |
| `client/src/features/assignments/ReadingAssignmentForm.tsx` | Replace URL error `<p>` |
| `client/src/features/assignments/PracticeProblemMetaFields.tsx` | Replace validation error `<p>` |
| `client/src/features/assignments/PracticeProblemAssignmentForm.tsx` | Replace "at least one question" `<p>` |
| `client/src/features/assignments/VocabAssignmentForm.tsx` | Replace "at least one term" `<p>` |
| `client/src/features/assignments/PracticeProblemRunner.tsx` | Replace `completeError` `<p>` |
| `client/CLAUDE.md` | Remove `useFormSubmit` row; update Key Conventions line |

### Deleted

| File | Reason |
|---|---|
| `client/src/hooks/useFormSubmit.ts` | All consumers migrated; hook is no longer used |

### Created

None.
