---
id: cm-0011
title: Decompose Oversized Frontend Components
stage: review
status: approved
approver: agent
---

# Code Review: Decompose Oversized Frontend Components

## Summary

Second-pass review of the pure frontend refactor across 20 changed files in `client/src/`. The three blocking issues identified in the first review have all been correctly resolved: `openEdit` now uses `toQuestionDraft` from `AssessmentForm`, `setView` is present in the `useEffect` dependency array, and `client/CLAUDE.MD` has been updated to remove stale references to the deleted `ExamSection`, `QuizSection`, and `TestSection` components and document the new hooks convention. No new issues at medium or above were introduced by the fixes. The four low and two info issues from the first review remain unchanged — none block approval.

Commits follow the required `<id>: <imperative summary>` format.

## Scope Coverage

- **Backend files reviewed**: none (pure frontend refactor)
- **Frontend files reviewed**:
  - `client/src/features/assessments/AssessmentSection.tsx` (new)
  - `client/src/features/assignments/PracticeProblemAssignmentForm.tsx` (modified)
  - `client/src/features/assignments/question-editors/FillInBlankEditor.tsx` (new)
  - `client/src/features/assignments/question-editors/MatchingEditor.tsx` (new)
  - `client/src/features/assignments/question-editors/MultipleChoiceEditor.tsx` (new)
  - `client/src/features/assignments/question-editors/TrueFalseEditor.tsx` (new)
  - `client/src/features/assignments/question-editors/index.ts` (new)
  - `client/src/features/lessons/ActiveItemContent.tsx` (new)
  - `client/src/features/lessons/LessonAssignmentContent.tsx` (new)
  - `client/src/features/lessons/LessonDetailPage.tsx` (modified)
  - `client/src/features/lessons/LessonResourceContent.tsx` (new)
  - `client/src/features/lessons/LessonToolContent.tsx` (new)
  - `client/src/features/lessons/LessonToolModals.tsx` (new)
  - `client/src/features/lessons/hooks/useAssignments.ts` (new)
  - `client/src/features/lessons/hooks/useLesson.ts` (new)
  - `client/src/features/lessons/hooks/useResources.ts` (new)
  - `client/src/features/lessons/hooks/useTools.ts` (new)
  - `client/src/features/exams/ExamSection.tsx` (deleted)
  - `client/src/features/quizzes/QuizSection.tsx` (deleted)
  - `client/src/features/tests/TestSection.tsx` (deleted)
- **Config/other files reviewed**: `client/CLAUDE.MD` (modified)
- **Rules loaded**: `.claude/rules/frontend.md`, `.claude/rules/api.md`, `.claude/rules/rules.md`

## First-Pass Fixes Verified

### Fix 1 — `openEdit` now uses `toQuestionDraft`

`AssessmentSection.tsx:3` imports `toQuestionDraft` from `AssessmentForm.js` and `AssessmentSection.tsx:84` uses `assessment.questions.map(toQuestionDraft)`. The manual hard-coded mapping has been removed. Fix is correct and complete.

### Fix 2 — `setView` added to `useEffect` dependency array

`AssessmentSection.tsx:80`: the dependency array is now `[open, assessment, displayMode, setView]`. Fix is correct.

### Fix 3 — `client/CLAUDE.MD` updated

The `exams / quizzes / tests` Features table row has been removed. `AssessmentSection` is now documented under the `assessments` row. The `useAssessment` reference at the bottom now points to `AssessmentSection` in `LessonDetailPage`, `UnitAccordionItem`, and `CourseDetailPage`. The hooks convention paragraph has been added. Fix is correct and complete.

## Issues

### [LOW] `useAssignments`, `useResources`, and `useTools` silently swallow fetch errors

- **Location**: `client/src/features/lessons/hooks/useAssignments.ts:124-126`, `client/src/features/lessons/hooks/useResources.ts` (parallel location), `client/src/features/lessons/hooks/useTools.ts` (parallel location)
- **Description**: The initial data-fetch `useEffect` in each hook catches all errors with an empty handler and a comment stating "errors surface at the page level via useLesson". However, `useLesson` fetches a distinct set of data and has no visibility into assignment, resource, or tool fetch failures. A network error in any of these hooks will silently leave the corresponding state as an empty array with no user feedback. The original monolithic `LessonDetailPage` had a single `Promise.all` with a shared `catch` that set page-level error state — this refactor regresses that behavior.
- **Suggested Fix**: Accept an optional `onError` callback in the three hooks and call it in the catch block, or centralize all parallel fetches inside `useLesson`'s existing `Promise.all` and distribute results via returned state.

---

### [LOW] `testApi` adapter is defined at module scope in `LessonDetailPage` rather than co-located with peer adapters

- **Location**: `client/src/features/lessons/LessonDetailPage.tsx:31-37`
- **Description**: `testApi` is defined at module scope in `LessonDetailPage`, while the parallel `quizApi` adapter is defined at module scope in `ActiveItemContent.tsx`. Having peer adapters split across two separate files increases the import surface of `LessonDetailPage` unnecessarily and makes the adapter pattern harder to discover.
- **Suggested Fix**: Move both `testApi` and `quizApi` into a shared `client/src/features/assessments/assessmentAdapters.ts` module and import them where needed. Advisory — current approach is functional.

---

### [LOW] Inline API mutation calls remain inside `LessonResourceContent` and `LessonToolContent`

- **Location**: `client/src/features/lessons/LessonResourceContent.tsx:40-56`, `client/src/features/lessons/LessonToolContent.tsx:28-58`
- **Description**: These components call `lessonResourcesApi.delete`, `lessonResourcesApi.update`, and `lessonToolsApi.delete` directly from inline event handlers rather than via callbacks passed as props. This is not a regression from the original code, but the refactor could have lifted these mutations to the parent to improve testability and SRP.
- **Suggested Fix**: Accept `onDelete`/`onUpdate` callbacks as props in these components and move the API calls to the parent (`useResources`, `useTools`, or `LessonDetailPage`). Defer to a future pass.

---

### [LOW] `QuestionTypeEditorProps.index` is required but unused by `MatchingEditor` and `FillInBlankEditor`

- **Location**: `client/src/features/assignments/question-editors/index.ts:6-8`
- **Description**: The shared `QuestionTypeEditorProps` interface requires `index: number` on all editors, but `MatchingEditor` and `FillInBlankEditor` do not use it. `MultipleChoiceEditor` and `TrueFalseEditor` need it for radio `name` attributes to prevent cross-question interference. The current design is acceptable per FR-10's uniform interface goal, but making it required on unused editors adds noise.
- **Suggested Fix**: Mark `index` as optional (`index?: number`) and have `MultipleChoiceEditor` and `TrueFalseEditor` default internally with `const idx = index ?? 0`. Low priority.

---

### [INFO] `setAssignments` is exported from `useAssignments` but never consumed

- **Location**: `client/src/features/lessons/hooks/useAssignments.ts` (return object), `client/src/features/lessons/LessonDetailPage.tsx` (no destructure of `setAssignments`)
- **Description**: `UseAssignmentsReturn` exposes `setAssignments` as a public member. `LessonDetailPage` does not destructure or use it. Exporting raw state setters increases the hook's API surface and creates a path for external mutations that bypass the hook's internal logic.
- **Suggested Fix**: Remove `setAssignments` from `UseAssignmentsReturn` and the return object. All mutations should flow through the named handler callbacks already exported.

---

### [INFO] `QuestionDraft.type` optionality is not visible from the `index.ts` interface

- **Location**: `client/src/features/assignments/question-editors/index.ts:6-8`
- **Description**: `QuestionTypeEditorProps` requires `draft: QuestionDraft` and `onChange: (draft: QuestionDraft) => void`, but the `QuestionDraft` type (defined in `QuestionEditor.tsx`) has `type?` as optional. This is consistent with the existing codebase and causes no functional issue.
- **Suggested Fix**: Advisory only — no action required.

## Verdict

**Status**: APPROVED

Zero issues at medium or above. All three blocking issues from the first review have been correctly resolved. Approved by agent.

## Next Steps

Next: `/test cm-0011`

Override: `/approve .claude/reviews/cm-0011/code-review.md` or edit frontmatter to `status: rejected`
