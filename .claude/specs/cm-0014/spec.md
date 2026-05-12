---
id: cm-0014
title: Standardize Form State Management and Error Display
stage: spec
status: approved
approver: human
approved_at: 2026-05-12T00:00:00Z
---

# Standardize Form State Management and Error Display

## Problem Statement

The client codebase has eight form components that rely on the `useFormSubmit` hook for async submission state (loading, error handling, `preventDefault`). These forms also display errors using an ad-hoc inline pattern (`<p className="text-sm text-destructive">`) rather than the existing shared `ErrorMessage` component. This creates two competing error display patterns in the codebase and couples form logic to a thin hook that obscures what is happening. The forms should be migrated to a consistent, modern pattern and the ad-hoc error display should be replaced with the shared `ErrorMessage` component everywhere.

## Scope

### In Scope

- Migration of all eight forms currently using `useFormSubmit`: CourseForm, UnitForm, LessonForm, FlashCardForm, VocabForm, PracticeProblemForm, VideoForm, and AssignmentFormModal
- Replacement of the ad-hoc inline error pattern (`<p className="text-sm text-destructive">`) with the shared `ErrorMessage` component in every form touched by this migration
- Replacement of the same ad-hoc error pattern in AssessmentForm, AssessmentTaker, and any other components that display errors using the ad-hoc `<p>` pattern (16 files identified), so that only one error display pattern exists in the codebase
- Deletion of `useFormSubmit` hook and its file (`src/hooks/useFormSubmit.ts`) after all consumers are migrated
- Updating the client CLAUDE.md to remove `useFormSubmit` from the documented hooks table

### Out of Scope

- **NoteEditor and RichTextEditor**: NoteEditor manages its own save/cancel lifecycle with `useRef`-based content tracking and inline edit toggling. RichTextEditor is a shared content editor component with no form submission logic. Neither uses `useFormSubmit`, and including them would expand scope into editor/content management territory unrelated to form standardization.
- **AssessmentForm and AssessmentTaker form logic**: Both components manage complex domain-specific state (multi-question pagination, bulk operations, answer tracking) with custom submission handlers. Neither uses `useFormSubmit`. Their form state management is fundamentally different from the simple create/edit forms being migrated. However, their ad-hoc error `<p>` tags ARE in scope for replacement with `ErrorMessage`.
- **Auth forms** (LoginPage, RegisterPage, ProfilePage): Excluded per project decision. These remain as-is.
- **Validation strategy decisions**: The specific validation approach (Zod schemas, manual checks, etc.) is deferred to the frontend plan.
- **New shared form hook creation**: Whether to introduce a replacement hook or inline the state management directly is a design-time decision, not a spec-level requirement.
- **Backend changes**: No API or data model changes are needed.

## Requirements

### Functional Requirements

- FR-01: Each of the eight `useFormSubmit` consumer forms (CourseForm, UnitForm, LessonForm, FlashCardForm, VocabForm, PracticeProblemForm, VideoForm, AssignmentFormModal) must be migrated away from `useFormSubmit` to manage submission state (loading flag, error state, `preventDefault`) directly or via a replacement pattern determined during design.
- FR-02: Every component in the client codebase that currently renders errors using the ad-hoc `<p className="text-sm text-destructive">` pattern must be updated to use the shared `ErrorMessage` component instead. This applies to all 16 identified files, including the eight `useFormSubmit` forms and the additional components (AssessmentForm, AssessmentTaker, and the six assignment sub-forms).
- FR-03: After migration, no component in the codebase may use the ad-hoc `<p className="text-sm text-destructive">` pattern for error display. A codebase search for this pattern must return zero results.
- FR-04: The `useFormSubmit` hook file (`src/hooks/useFormSubmit.ts`) must be deleted after all consumers are migrated. No file in the codebase may import from `useFormSubmit`.
- FR-05: The client CLAUDE.md hooks table must be updated to remove the `useFormSubmit` entry.
- FR-06: All migrated forms must preserve their existing behavior: field validation, error messages, loading/disabled states during submission, and successful submission callbacks must remain functionally identical.
- FR-07: The `ErrorMessage` component must support all current use cases without modification, or be extended if any migrated form requires capabilities (such as inline/compact display) that it does not currently support. Any extension must be backward-compatible with existing `ErrorMessage` consumers.

### Non-Functional Requirements

- NFR-01: No new runtime dependencies may be introduced for this migration.
- NFR-02: The migration must not introduce any visual regression in form appearance or error display styling. The `ErrorMessage` component's styled container (background, border, padding) replaces the plain `<p>` tag, which is an intentional visual upgrade, not a regression.

## Systems-Level Architecture

### Components Involved

**Existing components being modified (form migration):**
- `src/features/courses/CourseForm.tsx`
- `src/features/units/UnitForm.tsx`
- `src/features/lessons/LessonForm.tsx`
- `src/features/flashcards/FlashCardForm.tsx`
- `src/features/vocab/VocabForm.tsx`
- `src/features/practice-problems/PracticeProblemForm.tsx`
- `src/features/videos/VideoForm.tsx`
- `src/features/assignments/AssignmentFormModal.tsx`

**Existing components being modified (error display only):**
- `src/features/assessments/AssessmentForm.tsx`
- `src/features/assessments/AssessmentTaker.tsx`
- `src/features/assignments/VideoAssignmentForm.tsx`
- `src/features/assignments/PracticeProblemAssignmentForm.tsx`
- `src/features/assignments/VocabAssignmentForm.tsx`
- `src/features/assignments/ReadingAssignmentForm.tsx`
- `src/features/assignments/PracticeProblemMetaFields.tsx`
- `src/features/assignments/PracticeProblemRunner.tsx`

**Existing shared component (may need extension):**
- `src/components/ErrorMessage.tsx`

**File being deleted:**
- `src/hooks/useFormSubmit.ts`

**Documentation being updated:**
- `client/CLAUDE.md` (hooks table)

### Data Model Changes

None. This is a purely frontend refactor with no impact on Prisma models, database schema, or API contracts.

### API Changes

None. No endpoints are added, modified, or removed.

### Data Flow

The data flow for form submission remains unchanged. Each form collects field values via local state, validates on submit, calls an async `onSubmit` callback passed by the parent, and displays any resulting error. The only change is in how submission state (loading, error) is managed internally within each form component and how errors are rendered to the DOM.

### Integration Points

- **ErrorMessage component**: All 16 modified files will import and render the shared `ErrorMessage` component. If the component needs to support additional display modes (e.g., a more compact inline variant for tight form layouts), that decision is made during design.
- **Parent components**: No changes to parent components are required. All forms maintain their existing props interfaces (`onSubmit`, `onCancel`, `initial`, etc.).
- **useResourceList hook**: Some forms are rendered within contexts that use `useResourceList` for CRUD operations. The migration does not affect `useResourceList` or its callers.
- **ApiClientError and classifyError**: Forms will continue to use the existing `ApiClientError` type and `classifyError` utility from `src/api/client.ts` for error classification.

## Required Design Artifacts

- [ ] Backend plan (`backend-plan.md`)
- [ ] API contract (`api-contract.md`)
- [x] Frontend plan (`frontend-plan.md`)
- [ ] UI wireframe (`wireframe.md`)
