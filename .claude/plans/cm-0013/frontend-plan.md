---
id: cm-0013
title: Frontend Error Handling and Type Safety
stage: design
status: approved
approver: human
approved_at: 2026-05-12T00:00:00Z
---

## 1. Overview

This plan implements four coordinated improvements to the frontend that address reliability and type-safety gaps. The work is purely client-side with no API or backend changes.

Acceptance criteria addressed:
- Every bounded subtree shows a fallback UI with a recovery action on uncaught render errors (spec FR1–FR3)
- `useAssessment` surfaces attempt-load failures as `error` state; no silent swallows remain (spec FR4)
- All hooks that expose `error: string` populate it with a message reflecting the error class — client, server, or network (spec FR5)
- `LessonResource`, `LessonTool`, and `AssessmentQuestion` types become discriminated unions; all unsafe `as` casts in rendering components are replaced with narrowing (spec FR6–FR7)

## 2. Folder Structure

New files to create:

```
client/src/components/ErrorBoundary.tsx
```

No new directories are required. All other changes are modifications to existing files.

## 3. Component Tree

### New Component

**`client/src/components/ErrorBoundary.tsx`**
- Type: UI/utility component (class component)
- Responsibilities: Catch uncaught render errors in its subtree via `componentDidCatch`; render a fallback UI in place of the crashed subtree; expose an optional `onError` callback for instrumentation.
- Props interface:
  ```ts
  interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode | ((error: Error, reset: () => void) => React.ReactNode);
    onError?: (error: Error, info: React.ErrorInfo) => void;
  }
  interface ErrorBoundaryState {
    error: Error | null;
  }
  ```
- The `reset` function passed to a render-prop `fallback` sets `error: null` in state so the subtree can be re-mounted.
- Default fallback (used when `fallback` prop is omitted) renders a `bg-surface border border-border rounded-lg p-4` container with a short message ("Something went wrong") and a "Try again" button styled with the `secondary` variant of the shared `Button` component.

### Modified Components — placement of `<ErrorBoundary>` wrappers

**`client/src/App.tsx`**
- Wrap the entire `<ThemeProvider>` tree with `<ErrorBoundary>` as the outermost element so errors that escape all inner boundaries have a recovery path.
- Use the default fallback. No custom `onError` needed in this phase.

**`client/src/features/lessons/LessonDetailPage.tsx`**
- Wrap the `<main>` block that renders `<AssessmentSection>` for the unit test (the `unitTestActive` branch) with `<ErrorBoundary>`.
- Wrap the `<main>` block that renders `<AssignmentSection>` / `<ActiveItemContent>` (the else branch) with a separate `<ErrorBoundary>`.
- Each boundary uses a custom fallback that renders an inline error card (styled with `bg-surface border border-border rounded-lg p-4 text-sm text-muted-foreground`) with a "Reload page" anchor and, where applicable, a "Go back" button that calls `window.history.back()`.
- Do not wrap the outer page shell (sidebar, header) — only the content-area `<main>` elements are bounded.

### Modified Components — discriminated-union narrowing

The following components currently cast `content` fields with `as`. Once the discriminated union types are in place (Phase 1), all `as` casts are replaced with direct property access on the narrowed variant:

- `client/src/features/videos/VideoCard.tsx` — `video.content.url as string` → `video.content.url` after narrowing to `type === 'video'`
- `client/src/features/notes/NoteEditor.tsx` — two occurrences of `note.content.body as Record<string, unknown>` → `note.content.body` after narrowing to `type === 'note'` or `type === 'lecture'`
- `client/src/features/vocab/VocabCard.tsx` — `vocab.content.term as string`, `vocab.content.definition as string` → direct access after narrowing to `type === 'vocab'`
- `client/src/features/practice-problems/PracticeProblemCard.tsx` — four `as` casts (`question`, `options`, `correctIndex`, `calculatorEnabled`) → direct access after narrowing to `type === 'practice_problem'`
- `client/src/features/assessments/AssessmentTaker.tsx` — `q.content?.options as string[]` → direct access after narrowing to `type === 'multiple_choice'`
- `client/src/features/assessments/AssessmentForm.tsx` — `toQuestionDraft` helper casts `q.content.options as string[]` and `q.content.correctIndex as number` → direct access after narrowing to `type === 'multiple_choice'`

## 4. Client Routes

No new routes. No route changes. `LessonDetailPage` is already registered at `/courses/:courseId/units/:unitId/lessons/:lessonId`.

## 5. Hooks and Data Fetching

No new hooks are created. Existing hooks are modified:

**`client/src/hooks/useFetch.ts`**
- Import `ApiClientError` from `client.ts`.
- In the `.catch` handler, check `err instanceof ApiClientError` and call a shared `classifyError(err)` helper (see Section 9) to produce the user-facing message. Fall back to `'Failed to load'` for non-`ApiClientError` throws.

**`client/src/hooks/useFormSubmit.ts`**
- Same pattern as `useFetch`: import `ApiClientError`, use `classifyError` to map to a user-facing message. Fall back to `'Something went wrong'`.

**`client/src/hooks/useResourceList.ts`**
- Same pattern in the `useEffect` fetch `.catch` handler.

**`client/src/hooks/useAssessment.ts`**
- First `useEffect` (initial assessment load): already calls `setError`. Replace the raw `err.message` fallback with `classifyError` as above.
- Second `useEffect` (attempt history load): remove the empty `.catch(() => {})`. Replace with a `.catch` that calls `setError` with the classified message. The `attempts` state remains empty on failure; the error state is shared with the rest of the hook.
- `handleSubmit`: errors bubble up to the caller (`AssessmentSection` / `AssessmentTaker`); no change needed here — the inner `AssessmentTaker` already displays its own submission error.

**`client/src/features/lessons/hooks/useResources.ts`**
- The `resourceCompletionsApi.get` call inside `useEffect` has a comment-suppressed `.catch`. Remove the comment and replace the empty catch with one that logs a structured message (the completions failure is non-fatal; a console warning is acceptable for now given that the page-level error surface is already used for other resource errors). This is a lower-severity silent failure than the ones in `useAssessment` — it is acceptable to not surface it to the user but the empty catch must not remain.

## 6. API Integration

This spec contains no API contract. All changes are classification of existing error responses and type narrowing of existing response shapes. There are no new API calls and no changes to request or response bodies.

The `errorClass` field added to `ApiClientError` is derived from the HTTP status code already present in the response — this is a pure client-side classification, not a server contract change.

## 7. State Management

All state is local (component or hook). No shared context or global store changes.

**New state in `ErrorBoundary`:**
- `error: Error | null` — class component state. `null` means healthy; non-null means boundary has caught an error and renders fallback.

**Changed state in `useAssessment`:**
- The existing `error: string` state now receives values from the attempt-history fetch failure (previously swallowed). No new state fields.

**No state changes** in `useFetch`, `useFormSubmit`, or `useResourceList` — only the messages written to the existing `error` state change.

## 8. Authentication and Authorization

No changes to auth. `ErrorBoundary` is transparent on the happy path and does not interact with `AuthContext`. The root boundary wraps `AuthProvider`, so it catches errors thrown during auth-context initialization — this is intentional per spec FR2.

`RequireAuth` and `RequireRole` components are unaffected.

## 9. Pseudocode for Complex Logic

Per the user's instructions, pseudocode is omitted. Implementation ordering constraints and logic descriptions are given in prose where needed.

**Error classification helper** — add a module-level function `classifyError` in `client/src/api/client.ts` (not exported as a separate file; keep it co-located with `ApiClientError`):

The function receives an `ApiClientError` and returns a human-readable string:
- If `errorClass === 'client'`: indicate the request was invalid and the user should check their input or refresh the page.
- If `errorClass === 'server'`: indicate a server problem occurred and the user should try again later.
- If `errorClass === 'network'`: indicate no connection could be established and the user should check their network.

Export `classifyError` so hooks can import it alongside `ApiClientError`.

**`errorClass` assignment in `client.ts`** — in the `request` function, the error is thrown after the `!res.ok` check. At that point:
- Status 400–499 → `errorClass = 'client'`
- Status 500–599 → `errorClass = 'server'`
- For network failures, `fetch` itself throws before a response is received; wrap the outer `await fetch(...)` call in a try/catch that re-throws as `new ApiClientError('NETWORK_ERROR', ..., ...)` with `errorClass = 'network'`.

`ApiClientError` gains a fourth constructor parameter `errorClass: 'client' | 'server' | 'network'` with a default of `'server'` so existing callers that do not pass it are unaffected.

## 10. Styling Notes

**`ErrorBoundary` default fallback:**
- Container: `rounded-lg bg-surface border border-border p-4 flex flex-col gap-3`
- Message text: `text-sm text-muted-foreground`
- "Try again" button: use the shared `Button` component with `variant="secondary"` and `size="sm"`

**Inline feature-boundary fallbacks in `LessonDetailPage`:**
- Same container pattern as above
- "Reload page" as a plain `<a href={window.location.href}>` with `text-primary underline text-sm` styling — keep it as a full-page reload so the user gets a clean slate

These patterns are consistent with the existing `ErrorMessage` shared component and the `bg-surface border border-border rounded-lg` pattern used throughout the codebase.

## 11. Edge Cases and Error Handling

### Phase ordering constraint

**Types must be updated before components.** `types.ts` changes must be committed (or at least applied to the working tree) before touching any component that imports `LessonResource`, `LessonTool`, or `AssessmentQuestion`. TypeScript will fail to compile the components until the discriminated union is present.

### Discriminated union narrowing in mixed-content renders

`NoteEditor` accepts a `LessonResource` typed as `type === 'note' | 'lecture'`. Both variants share the same `NoteContent` shape `{ body: TiptapJSON }`. The narrowing in `NoteEditor` can check `note.type === 'note' || note.type === 'lecture'` or simply trust the caller (the component is only ever instantiated for note/lecture resources). Prefer the runtime guard so an unexpected `type` produces a visible "unsupported resource type" fallback rather than a silent crash.

`AssessmentTaker` and `AssessmentForm` currently only handle `multiple_choice` questions. After the discriminated union refactor, when a question's `type` is not `multiple_choice`, the component must not silently render an empty options list. Add an explicit fallback branch (a `<p>` reading "Unsupported question type") to prevent a silent blank-question render.

### `useAssessment` attempt-history error

The attempt history failing is non-fatal — the user can still take the assessment. When the attempt history load fails, `error` is set but the UI currently shows the error alongside the assessment. Consider whether the `AssessmentSection` consumer suppresses the error for attempt-history failures specifically. For this spec the simplest correct behavior is: set `error`, let `AssessmentSection` render `<ErrorMessage>`. The coder may refine to a separate `attemptsError` field if the consuming view requires it, but that is not required by the spec.

### `ErrorBoundary` reset behavior

The boundary resets (clears `error` state) when the user clicks "Try again". React will re-render the children from scratch. If the error was caused by bad data in a parent-supplied prop (e.g., a malformed `LessonResource`), the reset will re-trigger the same error. This is acceptable for this spec — retry is still the correct recovery action from the user's perspective.

### TypeScript strict mode

After the discriminated union change, the compiler will surface all locations where `content` is accessed without narrowing. This is the intended mechanism for finding all remaining unsafe casts. The coder must resolve every TypeScript error before the build passes — no `@ts-ignore` suppressions are permitted per spec NFR3.

### No regression on happy path

`ErrorBoundary` uses `React.Component` (class component) and does not alter the render tree when `error` is `null`. The discriminated union change is compile-time only — emitted JavaScript is identical. Both changes are verified to be transparent on the happy path.
