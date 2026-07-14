---
id: cm-0013
title: Frontend Error Handling and Type Safety
stage: spec
status: approved
approver: human
approved_at: 2026-05-12T00:00:00Z
---

## Problem Statement

The frontend has three overlapping reliability gaps that together degrade both user experience and developer confidence.

**Silent failures:** Several hooks suppress errors entirely with empty `.catch(() => {})` blocks — most notably `useAssessment`'s attempt loading. When these operations fail, the user sees nothing and has no way to know a problem occurred or retry.

**Undifferentiated error messages:** `useFetch`, `useFormSubmit`, and other hooks surface a single generic string ("Failed to load", "Something went wrong") regardless of whether the failure was caused by invalid user input (400), a server fault (500), or no network connection. Each case warrants a different message and different guidance.

**Runtime type casts throughout content rendering:** API response types model `content` as `Record<string, unknown>` on `LessonResource`, `LessonTool`, and `AssessmentQuestion`. Components then cast to concrete shapes at the call site (`content.options as string[]`, `content.body as TiptapJSON`, etc.). These casts are unsafe — TypeScript cannot verify them — and a mismatched shape causes a runtime crash rather than a caught error.

Additionally, there is no React ErrorBoundary anywhere in the tree, so an uncaught render error in any component crashes the entire page with no recovery path.

## Scope

### In Scope

- `ErrorBoundary` component placed at the app root and at key feature boundaries (lesson content, assessment runner, resource list)
- Fallback UI for each boundary that allows the user to recover (retry or navigate away)
- Removal of silent `.catch(() => {})` patterns in `useAssessment`, `useResources`, and `StudentNotePanel`; replaced with surfaced error state
- Error classification in the API client (`client.ts`) distinguishing 4xx client errors, 5xx server errors, and network failures (fetch throws before a response is received)
- Updated user-facing error messages in hooks that consume the classified error type
- Discriminated union types for `LessonResource.content`, `LessonTool.content`, and `AssessmentQuestion.content` in `client/src/api/types.ts`, keyed on their respective `type` enum fields
- Removal of all unsafe `as` casts in components that render these content variants, replaced with narrowing via the discriminated union

### Out of Scope

- Backend changes — error classification is a client-side concern only; no server response shape changes
- New toast or notification infrastructure — existing `<ErrorMessage>` component is sufficient; this spec does not introduce a global toast system
- Retry logic or exponential backoff in the API client
- Type safety for any content shape not currently in the codebase (no new resource or question types)
- Changes to `AuthContext` session restoration error handling

## Requirements

### Functional

1. Any unhandled React render error within a bounded subtree must display a fallback UI with a recovery action rather than crashing the full page.
2. The app root boundary must catch errors that escape all inner boundaries.
3. Feature boundaries must be placed around: the lesson content area (resources + tools), the assessment runner, and the resource list panel.
4. `useAssessment` must surface attempt-load failures as an `error` string visible to the consuming component; the empty catch must be removed.
5. All hooks that currently expose `error: string` must populate that field with a message that reflects the error class:
   - 4xx → indicate the request was invalid and suggest the user check their input or refresh
   - 5xx → indicate a server problem and suggest trying again later
   - Network failure → indicate no connection could be established
6. `LessonResource`, `LessonTool`, and `AssessmentQuestion` API types must be discriminated unions. Each variant must carry a `content` type specific to that variant (e.g. `NoteContent`, `VideoContent`, `MultipleChoiceContent`).
7. Components rendering these types must narrow via the discriminated union rather than casting with `as`.

### Non-Functional

1. No existing functionality may regress — error boundary placement must be transparent to the happy path.
2. The discriminated union refactor must not widen or change any runtime behavior; it is a compile-time safety improvement only.
3. TypeScript strict mode must remain satisfied after the refactor; no new `any` or `unknown` casts may be introduced.

## Systems Architecture

### Components

- **`ErrorBoundary`** — New React class component (class components are required for `componentDidCatch`). Accepts `fallback` prop (render prop or ReactNode) and `onError` callback. Placed as a wrapper at the app root in `App.tsx` and around each feature boundary in the lesson and assessment views.
- **`ApiClientError` (extended)** — Existing error class in `client.ts` gains an `errorClass` field: `'client' | 'server' | 'network'`. Classification logic added in the fetch response handler.
- **Content type variants** — New named interfaces in `types.ts` for each `ResourceType`, `ToolType`, and `QuestionType` variant. `LessonResource`, `LessonTool`, and `AssessmentQuestion` become discriminated unions on their `type` field.

### Data Flow

1. API fetch → response received → `client.ts` classifies status code into `errorClass` → `ApiClientError` thrown with `errorClass` set.
2. Hook catches `ApiClientError` → maps `errorClass` to a human-readable message → sets `error` state.
3. Component reads `error` state → renders `<ErrorMessage>` with the classified message.
4. If a render error escapes to a boundary → `ErrorBoundary.componentDidCatch` fires → fallback UI replaces the subtree.

### Integration Points

- `client/src/api/client.ts` — error classification
- `client/src/api/types.ts` — discriminated union definitions
- `client/src/hooks/useAssessment.ts`, `useFetch.ts`, `useFormSubmit.ts`, `useResourceList.ts` — error message updates
- `client/src/App.tsx` — root boundary placement
- `client/src/pages/LessonDetailPage.tsx` — feature boundary placement
- Components consuming content types: `NoteEditor`, `VideoCard`, `VocabCard`, `PracticeProblemCard`, `PracticeProblemRunner`, `AssignmentForm`

## Required Design Artifacts

- [ ] ui-design
- [x] frontend-plan
- [ ] backend-plan
- [ ] api-contract
