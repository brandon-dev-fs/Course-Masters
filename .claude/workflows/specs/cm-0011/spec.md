---
id: cm-0011
title: Decompose Oversized Frontend Components
stage: spec
status: approved
approver: human
approved_at: 2026-05-08T00:00:00Z
---

# Decompose Oversized Frontend Components

## Problem Statement

Three areas of the frontend codebase have grown beyond maintainable size and violate single-responsibility principles. LessonDetailPage is 855 lines with 20+ useState declarations, mixing concerns for resources, tools, assignments, modals, and assessments in one component. QuizSection, TestSection, and ExamSection are three nearly identical components that duplicate the same assessment lifecycle UI with minor variations. PracticeProblemAssignmentForm inlines four separate question-type editors (MultipleChoiceEditor, TrueFalseEditor, MatchingEditor, FillInBlankEditor) that share the same interface pattern but are defined as private functions with no reuse path. This refactor improves maintainability and readability without changing any user-facing behavior.

## Scope

### In Scope

- Decomposing LessonDetailPage into focused sub-components that each manage a coherent slice of state and rendering logic
- Unifying QuizSection, TestSection, and ExamSection into a single shared AssessmentSection component parameterized by assessment type
- Extracting the four question-type editors from PracticeProblemAssignmentForm into standalone, reusable components
- Preserving all existing functionality, visual appearance, and behavior exactly as-is

### Out of Scope

- Any backend changes, API changes, or new endpoints
- Changes to data models, types, or the API layer
- Adding new features or altering existing user-facing behavior
- Modifying shared UI primitives (Button, Modal, Input, etc.)
- Refactoring other pages or components not listed above
- Performance optimizations beyond what naturally results from smaller components
- Changes to the existing AssessmentForm or its QuestionEditor (the assessment-level question editor is a separate concern from the practice-problem question-type editors)

## Requirements

### Functional Requirements

- FR-01: LessonDetailPage must be decomposed so that no single component file exceeds approximately 300 lines
- FR-02: Resource rendering logic (video, note, lecture display and editing) must be extracted into a dedicated sub-component that receives only the props it needs
- FR-03: Tool rendering logic (flash card, practice problem, vocab display and editing) must be extracted into a dedicated sub-component that receives only the props it needs
- FR-04: Assignment rendering logic (note, video, reading, vocab, practice problem assignment views) must be extracted into a dedicated sub-component
- FR-05: Modal orchestration (settings, plan edit, tool edit, assignment create/edit/delete confirmation) must be extracted from LessonDetailPage into a dedicated sub-component or co-located with the features they serve
- FR-06: The data-fetching effect, derived state computations (useMemo hooks), and handler functions in LessonDetailPage must be organized into a custom hook or a small number of focused hooks so the page component itself is primarily layout and composition
- FR-07: QuizSection, TestSection, and ExamSection must be replaced by a single AssessmentSection component that accepts parameters distinguishing assessment type (lesson quiz, unit test, course exam), parent entity ID, display labels, and behavioral differences (edit capability, unlock gating, attempt history display)
- FR-08: The unified AssessmentSection must support all behavioral variations currently present across the three components: ExamSection's modal-only pattern with open/close control, TestSection's inline display with edit capability and lesson-completion gating, and QuizSection's inline display without edit capability
- FR-09: The four question-type editors (MultipleChoiceEditor, TrueFalseEditor, MatchingEditor, FillInBlankEditor) currently defined inside PracticeProblemAssignmentForm must be extracted into their own component files
- FR-10: Each extracted question-type editor must conform to a shared interface pattern so that the QuestionCard component can render any editor by question type without conditional branching per type
- FR-11: All existing test and assessment behavior must continue to work identically after the refactor, including quiz taking, attempt history, assessment creation, and results display
- FR-12: All existing keyboard navigation, focus management, and aria attributes must be preserved in the extracted components

### Non-Functional Requirements

- NFR-01: No new runtime dependencies may be introduced by this refactor
- NFR-02: The refactored components must follow the project's existing feature-based directory structure under `client/src/features/`
- NFR-03: No changes to the public API surface of existing shared components (Button, Modal, Input, Textarea, etc.)

## Systems-Level Architecture

### Components Involved

**Existing components being decomposed:**

- `client/src/features/lessons/LessonDetailPage.tsx` (855 lines) -- the primary page component orchestrating the entire lesson view
- `client/src/features/quizzes/QuizSection.tsx` (85 lines) -- lesson quiz UI using useAssessment hook with quizApi adapter
- `client/src/features/tests/TestSection.tsx` (131 lines) -- unit test UI using useAssessment hook with testApi adapter, adds edit and gating logic
- `client/src/features/exams/ExamSection.tsx` (58 lines) -- course exam UI using useAssessment hook with examApi adapter, modal-only pattern
- `client/src/features/assignments/PracticeProblemAssignmentForm.tsx` (535 lines) -- assignment form with four inlined question-type editors and a QuestionCard wrapper

**Existing shared infrastructure (unchanged):**

- `client/src/hooks/useAssessment.ts` -- assessment lifecycle hook already parameterized by API adapter
- `client/src/features/assessments/AssessmentForm.tsx` -- shared assessment creation form
- `client/src/features/assessments/AssessmentTaker.tsx` -- shared assessment-taking UI
- `client/src/features/assessments/AssessmentResults.tsx` -- shared results display
- `client/src/features/assessments/QuestionEditor.tsx` -- existing assessment-level question editor (multiple-choice only, separate from practice-problem editors)
- `client/src/features/lessons/AssignmentSection.tsx` -- existing assignment wrapper component
- `client/src/features/lessons/AssignmentStepper.tsx` -- existing stepper navigation

**New components to be created:**

- A custom hook (or hooks) to encapsulate LessonDetailPage's data fetching, derived state, and handler functions
- Sub-components for resource content rendering, tool content rendering, assignment content rendering, and modal orchestration within the lesson feature
- A unified AssessmentSection component replacing the three separate assessment type components
- Individual question-type editor components extracted from PracticeProblemAssignmentForm

### Data Model Changes

None. This is a pure frontend refactor with no data model impact.

### API Changes

None. No API endpoints are added, modified, or removed.

### Data Flow

The data flow remains unchanged. LessonDetailPage currently fetches lesson, units, course, resources, tools, completions, progress, and assignments in a single Promise.all on mount, then distributes that data to child components via props. After this refactor, the same data fetching occurs in a custom hook, and the same data flows to the same rendering logic -- it is simply organized into smaller, focused components rather than one monolithic render function. The assessment sections continue to use the useAssessment hook with their respective API adapters, but through a single parameterized component rather than three separate ones.

### Integration Points

- `useAssessment` hook: The unified AssessmentSection must continue to use this hook with the appropriate API adapter object, matching the existing pattern where each assessment type constructs an adapter from `assessmentsApi` methods
- `resourceCompletionsApi`: Completion toggling logic currently in LessonDetailPage handlers must remain connected to the same API calls
- `lessonResourcesApi` and `lessonToolsApi`: CRUD and reorder operations currently handled inline in LessonDetailPage must be preserved in the extracted hooks/components
- `assignmentsApi`: Assignment CRUD, reorder, and completion operations must remain functionally identical
- `AuthContext`: The `canEdit` derivation from `user.role` must continue to gate edit/delete actions throughout all extracted components
- Existing component contracts: AssignmentSection, AssignmentStepper, StudentToolsBar, StudentMaterialsModal, and all view components (VideoCard, NoteEditor, FlashCard, etc.) must continue to receive the same props they currently receive

## Required Design Artifacts

- [ ] Backend plan (`backend-plan.md`)
- [ ] API contract (`api-contract.md`)
- [x] Frontend plan (`frontend-plan.md`)
- [ ] UI wireframe (`wireframe.md`)
