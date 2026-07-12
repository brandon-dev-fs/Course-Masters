---
id: cm-0014
title: Standardize Form State Management and Error Display
stage: review
status: approved
approver: agent
approved_at: 2026-05-12T00:00:00Z
---

# Code Review: Standardize Form State Management and Error Display

## Summary

Reviewed 19 changed files (all under `client/`) against the approved spec cm-0014 and frontend plan. The migration removes `useFormSubmit`, inlines submission state into 8 forms, replaces all 16 ad-hoc `<p className="text-sm text-destructive">` patterns with the shared `ErrorMessage` component, extends `ErrorMessage` with a backward-compatible `variant="inline"` prop, deletes the hook file, and updates `client/CLAUDE.md`. All requirements from FR-01 through FR-07 are satisfied. NFR-01 (no new dependencies) and NFR-02 (no visual regression) are satisfied. Residual `text-sm/xs text-destructive` patterns found in the codebase (`Input.tsx`, `Textarea.tsx`, `RichTextEditor.tsx`, `ProfilePage.tsx`) are all confirmed exclusions per the spec.

## Scope Coverage

- **Frontend files reviewed**: `client/CLAUDE.MD`, `client/src/components/ErrorMessage.tsx`, `client/src/features/assessments/AssessmentForm.tsx`, `client/src/features/assessments/AssessmentTaker.tsx`, `client/src/features/assignments/AssignmentFormModal.tsx`, `client/src/features/assignments/PracticeProblemAssignmentForm.tsx`, `client/src/features/assignments/PracticeProblemMetaFields.tsx`, `client/src/features/assignments/PracticeProblemRunner.tsx`, `client/src/features/assignments/ReadingAssignmentForm.tsx`, `client/src/features/assignments/VideoAssignmentForm.tsx`, `client/src/features/assignments/VocabAssignmentForm.tsx`, `client/src/features/courses/CourseForm.tsx`, `client/src/features/flashcards/FlashCardForm.tsx`, `client/src/features/lessons/LessonForm.tsx`, `client/src/features/practice-problems/PracticeProblemForm.tsx`, `client/src/features/units/UnitForm.tsx`, `client/src/features/videos/VideoForm.tsx`, `client/src/features/vocab/VocabForm.tsx`, `client/src/hooks/useFormSubmit.ts` (deleted)
- **Backend files reviewed**: none (pure frontend refactor)
- **Config/other files reviewed**: none
- **Rules loaded**: `rules.md`, `frontend.md`

## Issues

### [LOW] Missing `role="alert"` on `ErrorMessage` default variant

- **Location**: `client/src/components/ErrorMessage.tsx:16`
- **Description**: The `inline` variant correctly renders `<p role="alert" ...>`, but the `default` variant renders a bare `<div>` with no `role="alert"`. Screen readers will not announce new default-variant errors as live region updates when they appear dynamically after form submission. This inconsistency means the same component provides different accessibility behavior depending on variant.
- **Suggested Fix**: Add `role="alert"` to the `<div>` in the `default` variant branch: `<div role="alert" className={...}>`.

### [INFO] Behavior delta: inline validation errors now surface via `err.message`

- **Location**: All 8 migrated CRUD forms (e.g. `client/src/features/courses/CourseForm.tsx:31`)
- **Description**: The deleted `useFormSubmit` hook's catch block was `err instanceof ApiClientError ? classifyError(err) : 'Something went wrong'`. The migrated forms now use `err instanceof ApiClientError ? classifyError(err) : err instanceof Error ? err.message : 'Something went wrong'`. This means locally thrown validation errors (e.g. `throw new Error('Title is required')`) now display their message rather than the generic fallback. This is intentional and matches the plan, but it is a subtle behavior change worth noting for QA.
- **Suggested Fix**: No action required. The change is correct and intentional per the frontend plan.

### [INFO] No tests added or updated

- **Location**: All changed files
- **Description**: No test files are included in the diff. This refactor alters submission behavior in 8 forms. There are no existing unit tests to update and no new tests were added.
- **Suggested Fix**: Consider adding unit tests for the inlined `handleSubmit` handlers as a follow-on task, particularly to verify the error classification branch and the `submitting` state lifecycle.

## Verdict

**Status**: APPROVED

Zero issues at medium or above. One low-severity accessibility gap (missing `role="alert"` on the default variant) and two advisory info notes. All spec requirements (FR-01 through FR-07, NFR-01, NFR-02) are fully satisfied. Approved by agent.

## Next Steps

Next: `/test cm-0014`

Override: `/approve .claude/reviews/cm-0014/code-review.md` or edit frontmatter to `status: rejected`
