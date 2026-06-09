---
id: cm-0001
title: Per-Question Calculator Toggle
stage: design
status: approved
approver: human
approved_at: 2026-04-19T00:00:00Z
---

# cm-0001 Frontend Plan: Per-Question Calculator Toggle

## 1. Overview

This plan implements the frontend portion of the Per-Question Calculator Toggle feature. It covers:

- A custom `useCalculator` hook backed by `Decimal.js` for precision arithmetic
- A new `CalculatorPanel` component (floating portal on desktop, inline on mobile)
- Modifications to `AssessmentTaker` to render a calculator button and panel when `question.calculatorEnabled` is true
- Modifications to `QuestionEditor` to add a `calculatorEnabled` toggle per question draft
- Modifications to `AssessmentForm` to add a bulk-apply toolbar above the question editor
- Two new API operations in `assessments.ts`: a `patch` method on `apiClient` and a `bulkUpdateCalculator` function
- Type updates to `AssessmentQuestion`, `QuestionDraft`, and `Assessment` to carry `calculatorEnabled`

Acceptance criteria addressed:
- AC1: Teacher can toggle calculator per question in the assessment editor
- AC2: Teacher can bulk-enable/disable calculator for all questions (with mixed-state confirmation)
- AC3: Student sees a calculator button on questions where `calculatorEnabled: true`
- AC4: Calculator resets on each question navigation
- AC5: Floating panel on desktop (≥ 640px), inline panel on mobile (< 640px)
- AC6: Calculator supports +, −, ×, ÷, xʸ, √x, C, ⌫, decimal, equals

---

## 2. Folder Structure

New files to create:

```
client/src/features/assessments/CalculatorPanel.tsx      # New component: floating/inline panel
client/src/hooks/useCalculator.ts                        # New hook: calculator state machine
```

Existing files to modify:

```
client/src/api/types.ts                                  # Add calculatorEnabled to AssessmentQuestion; extend QuestionDraft
client/src/api/assessments.ts                            # Add bulkUpdateCalculator; extend QuestionInput; add patch to apiClient
client/src/api/client.ts                                 # Add patch() method
client/src/features/assessments/QuestionEditor.tsx       # Add calculatorEnabled field + toggle UI
client/src/features/assessments/AssessmentForm.tsx       # Add bulk-apply toolbar + ConfirmDialog
client/src/features/assessments/AssessmentTaker.tsx      # Render CalculatorPanel when calculatorEnabled
```

---

## 3. Component Tree

### New Components

#### `CalculatorPanel`
- **File:** `client/src/features/assessments/CalculatorPanel.tsx`
- **Type:** UI component
- **Responsibilities:** Renders the complete calculator UI. On desktop (≥ sm breakpoint, detected via `window.matchMedia('(min-width: 640px)')` or a CSS approach), renders as a React portal with `fixed bottom-4 right-4 z-50 w-72`. On mobile, renders inline with `w-full`. Delegates all state to the `useCalculator` hook. Contains three internal regions: panel header (drag handle + close button), `CalculatorDisplay`, and `CalculatorKeypad` (composed of `CalculatorKey` buttons).
- **Props:**
  ```ts
  interface CalculatorPanelProps {
    onClose: () => void;       // called by close button and Escape key
    triggerRef: React.RefObject<HTMLButtonElement>; // for focus-return on close
  }
  ```
- **Sub-regions (internal, not separate files):**
  - **CalculatorDisplay:** Two-line display. Top line: expression string (text-sm text-muted-foreground text-right). Bottom line: current result/input (text-2xl font-semibold text-foreground text-right). Has `aria-live="polite"` and `aria-label="Calculator display"`.
  - **CalculatorKeypad:** 4-column `grid grid-cols-4 gap-1.5 px-3 pb-3` of `CalculatorKey` elements.
  - **CalculatorKey:** A `<button type="button">` with variant-based styling. Accepts `variant: 'digit' | 'operator' | 'equals' | 'utility'` and an `ariaLabel` string. Calls `handleKey` from `useCalculator`.

#### Internal `CalculatorKey` props:
```ts
interface CalculatorKeyProps {
  label: string;            // display text: '7', '+', '√x', etc.
  ariaLabel?: string;       // override for symbol keys
  variant: 'digit' | 'operator' | 'equals' | 'utility';
  onPress: () => void;
  disabled?: boolean;
}
```

### Modified Components

#### `QuestionEditor`
- **File:** `client/src/features/assessments/QuestionEditor.tsx`
- **Change:** Add `calculatorEnabled: boolean` to the `QuestionDraft` interface (exported). Add a `<button role="switch">` toggle in the card header row between the "Question N" label and the Remove button. The toggle calls `onChange({ ...value, calculatorEnabled: !value.calculatorEnabled })`.

#### `AssessmentForm`
- **File:** `client/src/features/assessments/AssessmentForm.tsx`
- **Change:** Add a bulk-apply toolbar row between the "Question X of N" label and the `QuestionEditor`. Add a `ConfirmDialog` that opens when the teacher clicks "Enable all" or "Disable all" and questions are in a mixed state. The toolbar fires `bulkUpdateCalculator` from the assessments API module. Since `AssessmentForm` is used both for creating new assessments (no `assessmentId` yet) and editing existing ones, the bulk toolbar is only shown when an `assessmentId` prop is provided. New optional props: `assessmentId?: string`.

#### `AssessmentTaker`
- **File:** `client/src/features/assessments/AssessmentTaker.tsx`
- **Change:** For each question render cycle, check `q.calculatorEnabled`. If true, render a calculator open/close button below the question text and above the answer choices. When open, render `<CalculatorPanel>`. Pass a React `key={currentIdx}` to the `CalculatorPanel` to force remount on question change (resets calculator state). Manage `isCalculatorOpen: boolean` in local state — reset it to `false` in a `useEffect` keyed to `currentIdx`.

---

## 4. Client Routes

No new routes are added. This feature modifies components rendered under the existing route:

| Path | Component | Change |
|------|-----------|--------|
| `/courses/:courseId/units/:unitId/lessons/:lessonId` | `LessonDetailPage` → `QuizSection` / `TestSection` / `ExamSection` → `AssessmentTaker` | Calculator button + panel rendered when active question has `calculatorEnabled: true` |
| Same path, teacher edit mode | `AssessmentForm` + `QuestionEditor` | Calculator toggle per question; bulk toolbar |

Auth requirements are unchanged — existing `RequireAuth` wrappers apply. Teacher/admin role check for toggle and toolbar uses the existing `user?.role` pattern from `AuthContext`.

---

## 5. Hooks and Data Fetching

### `useCalculator` (new)
- **File:** `client/src/hooks/useCalculator.ts`
- **API endpoints called:** None. This is a pure client-side state machine.
- **Purpose:** Encapsulates all calculator logic including expression building, operator precedence for the two-operand model, `Decimal.js`-backed arithmetic, and error state.
- **Return shape:**
  ```ts
  interface UseCalculatorReturn {
    expression: string;     // e.g. "120 ÷ 1.5"
    displayValue: string;   // current operand being entered, or result after =
    isError: boolean;       // true when displayValue is "Error"
    handleKey: (key: CalculatorKey) => void;
    reset: () => void;
  }

  type CalculatorKey =
    | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
    | '.' | '+' | '-' | '*' | '/' | '^' | 'sqrt'
    | '=' | 'clear' | 'backspace';
  ```
- **State managed internally:** `operand1: string | null`, `operator: string | null`, `operand2: string`, `justEvaluated: boolean`
- **Library:** `Decimal.js` — import `Decimal` from `decimal.js`. Use `Decimal.sqrt()`, `Decimal.pow()`, and the four arithmetic methods.

### `useAssessment` (existing — no changes needed to the hook itself)
- The hook already calls `api.update` with the full questions array. The `QuestionDraft` type change (adding `calculatorEnabled`) is sufficient — the hook passes the drafts through transparently.

---

## 6. API Integration

### Type updates required in `client/src/api/types.ts`

```
AssessmentQuestion — add field:
  calculatorEnabled: boolean

QuestionDraft (in QuestionEditor.tsx, re-exported from there) — add field:
  calculatorEnabled?: boolean   // optional, defaults to false
```

### New method on `apiClient` in `client/src/api/client.ts`

```
Action: PATCH request
Add to apiClient:
  patch: <T>(url: string, body: unknown) =>
    request<T>(url, { method: 'PATCH', body: JSON.stringify(body) })
```

### API module changes in `client/src/api/assessments.ts`

Extend `QuestionInput` to include `calculatorEnabled`:
```
QuestionInput — add field:
  calculatorEnabled?: boolean
```

Add new function:
```
Action: Teacher bulk-apply calculator flag
→ PATCH /api/assessments/:assessmentId/questions/calculator
→ Request: { questionIds: string[], calculatorEnabled: boolean }
→ Response: Assessment (full, with all questions including updated calculatorEnabled)

bulkUpdateCalculator: (assessmentId: string, data: { questionIds: string[]; calculatorEnabled: boolean }) =>
  apiClient.patch<Assessment>(`/assessments/${assessmentId}/questions/calculator`, data)
```

### UI action → endpoint mapping

| UI Action | Method + Path | Request Shape | Response Shape |
|-----------|--------------|---------------|----------------|
| Save assessment (existing flow, now includes calculatorEnabled per question) | `PUT /api/assessments/:assessmentId` | `{ questions: QuestionInput[] }` where each item may include `calculatorEnabled: boolean` | `Assessment` with full `questions[]` including `calculatorEnabled` |
| Create assessment (existing flow, now includes calculatorEnabled per question) | `POST /api/lessons/:lessonId/assessment` (or unit/course variant) | Same shape as PUT | `Assessment` with `questions[]` including `calculatorEnabled` |
| Teacher bulk-apply "Enable all" or "Disable all" | `PATCH /api/assessments/:assessmentId/questions/calculator` | `{ questionIds: string[], calculatorEnabled: boolean }` | `Assessment` with all questions updated |
| Student views question (calculatorEnabled arrives via existing GET) | `GET /api/lessons/:lessonId/assessment` (existing) | No change | `Assessment` — `questions[].calculatorEnabled` now present |

The calculator panel itself makes no API calls. All calculator operations are client-side only.

---

## 7. State Management

All new state is **local component state** — no new context or global store.

### `AssessmentTaker` local state additions
- `isCalculatorOpen: boolean` — tracks whether the calculator panel is currently open. Reset to `false` via `useEffect` when `currentIdx` changes.
- No change to `answers` state — opening/closing the calculator must not affect answer selections.

### `AssessmentForm` local state additions
- `bulkConfirm: { target: boolean; open: boolean } | null` — tracks pending bulk-apply confirmation. `target` is the boolean to apply; `open` drives the `ConfirmDialog`.
- `bulkLoading: boolean` — while the PATCH request is in flight; disables the toolbar buttons.
- `bulkError: string` — error message from bulk PATCH failure; displayed below the toolbar.

### `QuestionEditor` / `QuestionDraft` state
- `calculatorEnabled` is simply a field on `QuestionDraft`. `AssessmentForm` owns the `questions: QuestionDraft[]` state; `QuestionEditor` receives `value` and calls `onChange`. The toggle fires `onChange({ ...value, calculatorEnabled: !value.calculatorEnabled })`.
- On bulk-apply success, `AssessmentForm` receives the updated `Assessment` from the API and calls `setQuestions(response.questions.map(q => toQuestionDraft(q)))`. This replaces all local draft state with server truth.

### `useCalculator` internal state
- Owned entirely within the hook. The hook is instantiated inside `CalculatorPanel`, which is mounted fresh on each question (via `key` prop on `CalculatorPanel`), so there is no explicit reset needed.

### Derived state
- In `AssessmentForm`: `const calculatorMixedState = questions.some(q => q.calculatorEnabled) && questions.some(q => !q.calculatorEnabled)` — used to decide whether to show the `ConfirmDialog` or fire the API call directly.
- In `AssessmentForm`: `const allCalculatorEnabled = questions.every(q => q.calculatorEnabled)` and `const allCalculatorDisabled = questions.every(q => !q.calculatorEnabled)` — used to detect no-op bulk actions.

---

## 8. Authentication and Authorization

No new auth wrappers are added. Existing patterns apply:

- `CalculatorPanel` and the calculator button in `AssessmentTaker` are **not role-gated** — they render based solely on `question.calculatorEnabled`. Any user taking an assessment sees the button when enabled.
- The calculator toggle in `QuestionEditor` and the bulk toolbar in `AssessmentForm` are shown only to teachers and admins. The check follows the existing pattern: `{user?.role === 'teacher' || user?.role === 'admin' ? <toggle /> : null}`. The `user` object comes from `AuthContext` via the `useAuth` hook (already used in sibling features).
- If a `403` or `401` is returned from `bulkUpdateCalculator`, the `ApiClientError` is caught, `bulkError` is set, and the 401 path automatically dispatches `auth:unauthorized` via `apiClient`'s existing global handler.
- The `assessmentId` prop added to `AssessmentForm` is only passed from `QuizSection` / `TestSection` / `ExamSection` when the assessment already exists (edit mode). For create mode, no `assessmentId` is available, so the bulk toolbar is hidden — bulk apply only makes sense when there is a persisted assessment to PATCH.

---

## 9. Pseudocode for Complex Logic

### 9a. `useCalculator` state machine

```
State:
  operand1: string | null = null      // first operand, set when operator is pressed
  operator: string | null = null       // pending operator
  currentInput: string = '0'          // current entry on display
  justEvaluated: boolean = false       // true after = was pressed

Derived:
  expression: string
    - if operator is null: ''
    - if operator is set and !justEvaluated: `${operand1} ${operatorSymbol} `
    - after evaluation: `${operand1} ${operatorSymbol} ${operand2} =`
  displayValue: currentInput (or 'Error')

handleKey(key):
  switch key:

  case digit ('0'-'9'):
    if justEvaluated:
      reset all state; currentInput = key; justEvaluated = false
    elif currentInput === '0' and key !== '0':
      currentInput = key
    elif currentInput === 'Error':
      currentInput = key
    else:
      currentInput = currentInput + key (max ~12 chars)

  case '.':
    if justEvaluated: reset; currentInput = '0.'
    elif !currentInput.includes('.'): currentInput += '.'

  case operator ('+', '-', '*', '/', '^'):
    if isError: return (no-op)
    if operand1 is null:
      operand1 = currentInput
      operator = key
      justEvaluated = false
    elif operator is not null and !justEvaluated:
      // chain: evaluate pending, then set new operator
      result = evaluate(operand1, operator, currentInput)
      if result is error: set error state; return
      operand1 = result.toString()
      operator = key
      currentInput = result.toString()
    else:
      // overwrite pending operator
      operator = key
      justEvaluated = false

  case 'sqrt':
    val = new Decimal(currentInput)
    if val < 0: set error state; return
    result = Decimal.sqrt(val)
    currentInput = formatResult(result)
    operand1 = null; operator = null
    expression = `√(${val}) =`
    justEvaluated = true

  case '=':
    if operator is null or operand1 is null: return (no-op or show current)
    result = evaluate(operand1, operator, currentInput)
    if result is error: set error state; return
    currentInput = formatResult(result)
    operand1 = null; operator = null
    justEvaluated = true

  case 'backspace':
    if justEvaluated or isError: reset to '0'; return
    if currentInput.length <= 1: currentInput = '0'
    else: currentInput = currentInput.slice(0, -1)

  case 'clear':
    reset all state to initial values

evaluate(a, op, b):
  da = new Decimal(a); db = new Decimal(b)
  switch op:
    '+': return da.plus(db)
    '-': return da.minus(db)
    '*': return da.times(db)
    '/':
      if db.isZero(): return ERROR
      return da.dividedBy(db)
    '^': return da.pow(db)
  
formatResult(decimal):
  str = decimal.toSignificantDigits(12).toString()
  if str.length > 12: return decimal.toExponential(6)
  return str
```

### 9b. `AssessmentForm` bulk-apply flow

```
onBulkClick(targetValue: boolean):
  allMatch = questions.every(q => q.calculatorEnabled === targetValue)
  if allMatch: return  // no-op

  mixedState = questions.some(q => q.calculatorEnabled) && questions.some(q => !q.calculatorEnabled)

  if mixedState:
    setBulkConfirm({ target: targetValue, open: true })
    return  // wait for ConfirmDialog

  // All questions are opposite of target — no mixed state, no confirm needed
  executeBulkApply(targetValue)

onBulkConfirm():
  setBulkConfirm(prev => ({ ...prev, open: false }))
  executeBulkApply(bulkConfirm.target)

executeBulkApply(targetValue: boolean):
  if !assessmentId: return  // create mode, no ID yet

  questionIds = questions.map(q => q.id).filter(Boolean)
  // Optimistic update
  setQuestions(prev => prev.map(q => ({ ...q, calculatorEnabled: targetValue })))
  setBulkLoading(true)
  setBulkError('')

  try:
    updatedAssessment = await bulkUpdateCalculator(assessmentId, {
      questionIds,
      calculatorEnabled: targetValue,
    })
    // Replace local state with server response (server is source of truth)
    setQuestions(updatedAssessment.questions.map(toQuestionDraft))
  catch (err):
    // Revert optimistic update
    setQuestions(prevQuestionsSnapshot)
    setBulkError(err.message)
  finally:
    setBulkLoading(false)
```

### 9c. `AssessmentTaker` calculator open/close and reset

```
State:
  isCalculatorOpen: boolean = false

useEffect:
  // Reset calculator panel on question change
  dependency: [currentIdx]
  setIsCalculatorOpen(false)

Render:
  if q.calculatorEnabled:
    <button
      ref={calcTriggerRef}
      aria-expanded={isCalculatorOpen}
      aria-controls="calculator-panel"
      aria-label={isCalculatorOpen ? 'Close calculator' : 'Open calculator'}
      onClick={() => setIsCalculatorOpen(prev => !prev)}
    >
      {calculator icon} {isCalculatorOpen ? 'Close calculator' : 'Calculator'}
    </button>

    {isCalculatorOpen && (
      <CalculatorPanel
        key={currentIdx}          // remounts on question change, resetting useCalculator state
        onClose={() => setIsCalculatorOpen(false)}
        triggerRef={calcTriggerRef}
      />
    )}
```

### 9d. `CalculatorPanel` floating vs inline responsive behavior

```
CalculatorPanel render:

  const isDesktop = useMediaQuery('(min-width: 640px)')
  // useMediaQuery: thin hook wrapping window.matchMedia with state and listener cleanup

  panelContent = (
    <div
      id="calculator-panel"
      role="region"
      aria-label="Calculator"
      style={{ transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)` }}
      className={isDesktop
        ? 'fixed bottom-4 right-4 z-50 w-72 bg-surface-raised rounded-2xl border border-border shadow-warm-lg animate-in fade-in slide-in-from-bottom-2 duration-150'
        : 'w-full rounded-xl border border-border bg-surface-raised mt-3 mb-4'
      }
    >
      {isDesktop && <DragHandle onDrag={handleDrag} />}
      {isDesktop && <CloseButton onClick={onClose} />}
      <CalculatorDisplay expression={expression} displayValue={displayValue} isError={isError} />
      <CalculatorKeypad onKey={handleKey} />
    </div>
  )

  if isDesktop:
    return createPortal(panelContent, document.body)
  else:
    return panelContent  // inline, no portal needed
```

### 9e. Drag handle logic (desktop only)

```
State in CalculatorPanel:
  dragOffset: { x: number; y: number } = { x: 0, y: 0 }
  isDragging: boolean = false
  dragStart: { x: number; y: number; offsetX: number; offsetY: number } | null = null

onPointerDown(e: PointerEvent) on drag handle:
  e.currentTarget.setPointerCapture(e.pointerId)
  isDragging = true
  dragStart = { x: e.clientX, y: e.clientY, offsetX: dragOffset.x, offsetY: dragOffset.y }

onPointerMove(e: PointerEvent) on drag handle (when isDragging):
  dx = e.clientX - dragStart.x
  dy = e.clientY - dragStart.y
  setDragOffset({ x: dragStart.offsetX + dx, y: dragStart.offsetY + dy })

onPointerUp:
  isDragging = false
```

### 9f. Focus management on panel open/close

```
On panel open (isCalculatorOpen changes from false → true):
  useEffect dependency: [isCalculatorOpen]
  if isCalculatorOpen:
    // Focus the first focusable element in the panel (Clear button)
    clearButtonRef.current?.focus()

On panel close (onClose called):
  // Return focus to trigger button
  triggerRef.current?.focus()
  setIsCalculatorOpen(false)
```

---

## 10. Styling Notes

All styling follows the project's existing Tailwind CSS conventions. Do not use `dark:` prefixes — CSS custom properties handle theme switching automatically via the `.dark` class on `<html>`.

### Calculator Panel (floating, desktop)
```
fixed bottom-4 right-4 z-50 w-72
bg-surface-raised rounded-2xl border border-border shadow-warm-lg
animate-in fade-in slide-in-from-bottom-2 duration-150
```
Transition: `prefers-reduced-motion` — Tailwind's `motion-safe:` prefix can be applied to animation classes, or check `window.matchMedia('(prefers-reduced-motion: reduce)')` and skip animation classes when true.

### Calculator Panel (inline, mobile)
```
w-full rounded-xl border border-border bg-surface-raised mt-3 mb-4
```

### Panel header row
```
flex items-center justify-between px-3 pt-3 pb-1
```

### Calculator display region
```
bg-surface rounded-xl px-3 py-2 mx-3 mb-2
```
Expression line: `text-sm text-muted-foreground text-right min-h-[1.25rem]`
Result line: `text-2xl font-semibold text-foreground text-right`
Error state on result line: replace `text-foreground` with `text-destructive`

### Calculator keypad
```
grid grid-cols-4 gap-1.5 px-3 pb-3
```

### Calculator key base styles
```
rounded-xl text-sm font-medium py-3 transition-all
focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
active:scale-95
```

Key variants:
- `digit`: `bg-surface text-foreground hover:bg-surface-raised`
- `operator`: `bg-surface text-primary hover:bg-surface-raised`
- `equals`: `bg-primary text-primary-foreground hover:brightness-110`
- `utility` (C): `bg-surface text-destructive hover:bg-surface-raised`
- `utility` (⌫, √x, xʸ): `bg-surface text-muted-foreground hover:bg-surface-raised`

### Calculator button in AssessmentTaker (opens panel)
Reuse the existing `Button` component:
```
variant="secondary" size="sm"
```
Add `border border-border` to distinguish from a plain secondary button, per wireframe.

### Calculator toggle in QuestionEditor (teacher)
Custom pill toggle (not using `Button` component — it is a `<button role="switch">`):
```
Pill: w-9 h-5 rounded-full transition-all duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
Off: bg-border
On: bg-primary
Knob: w-4 h-4 rounded-full bg-surface-raised shadow transition-transform duration-150
Off knob: translate-x-0.5
On knob: translate-x-4
```

### Bulk toolbar in AssessmentForm
```
bg-surface rounded-xl border border-border px-3 py-2
flex items-center justify-between gap-3
```
On mobile (< sm), stack label and buttons vertically:
```
flex-col items-start gap-2
```
Toolbar label: `text-xs text-muted-foreground flex items-center gap-1.5`
Toolbar buttons: `Button variant="ghost" size="sm"`, existing component.

### Calculator button on mobile (AssessmentTaker)
```
w-full min-h-[44px]
```
Using `Button variant="secondary" size="sm" className="w-full min-h-[44px]"`.

---

## 11. Edge Cases and Error Handling

### Calculator arithmetic edge cases
| Edge Case | Handling |
|-----------|----------|
| Division by zero | `evaluate()` detects `db.isZero()` and sets `isError = true`; display shows "Error" in `text-destructive`; next digit keypress clears error |
| Square root of negative | `handleKey('sqrt')` checks `val < 0` before `Decimal.sqrt()`; sets error state |
| Very large result | `formatResult()` checks result string length > 12 chars; falls back to `toExponential(6)` |
| Chaining operators without entering second operand | If user presses operator, then another operator, the second operator overwrites the pending operator (standard calculator behavior) |
| `0.1 + 0.2` floating point | Handled by `Decimal.js` — returns exact `0.3` |
| Pressing `=` with no pending operator | No-op |
| Pressing `=` multiple times (repeat operation) | Not implemented in MVP — `justEvaluated` flag prevents double evaluation; subsequent `=` is a no-op |

### API error handling (bulk-apply)
| Scenario | Handling |
|----------|----------|
| `422 QUESTION_NOT_IN_ASSESSMENT` | Revert optimistic update; display `ApiClientError.message` in `bulkError` below toolbar |
| `403 FORBIDDEN` | Revert; display error message (teacher/admin only see toolbar, so this is an edge case) |
| `401 UNAUTHENTICATED` | `apiClient` dispatches `auth:unauthorized` event; session expired flow handles redirect |
| `500 INTERNAL_ERROR` | Revert optimistic update; display error below toolbar |
| Network failure | Caught as generic `Error`; revert and display message |

### Calculator toggle per-question (teacher) — since the toggle updates local draft state, no API call is made until the teacher saves the assessment via the existing `AssessmentForm` submit. There is therefore no optimistic-revert scenario for individual toggles — errors surface at form save time, which already has error handling in `AssessmentForm`.

### Calculator panel open/close
| Scenario | Handling |
|----------|----------|
| User navigates to next question while calculator is open | `useEffect` on `currentIdx` sets `isCalculatorOpen = false`; `CalculatorPanel` unmounts (calculator state resets via React lifecycle) |
| User submits assessment while calculator is open | The submit flow does not check `isCalculatorOpen`; panel unmounts naturally when `AssessmentTaker` unmounts |
| `CalculatorPanel` rendered in portal but `document.body` not available | `createPortal` is only called on desktop inside a mounted component; `document.body` is always available in a mounted React component |

### Bulk toolbar visibility
- The `assessmentId` prop is only available when editing an existing assessment. The bulk toolbar renders only when `assessmentId` is defined. During the initial create flow, no bulk toolbar is shown — teachers are creating new questions, and `calculatorEnabled` defaults to `false` on each new `QuestionDraft`.

### `QuestionDraft` backward compatibility
- `calculatorEnabled` is optional (`calculatorEnabled?: boolean`) in `QuestionDraft`. `newQuestion()` in `AssessmentForm` sets it explicitly to `false`. When loading `initialQuestions` from an existing `Assessment`, the map function must set `calculatorEnabled: q.calculatorEnabled ?? false` to handle any pre-migration question records.

### Empty assessment
- If `assessment.questions` is empty, the bulk toolbar is rendered but clicking either button is a no-op (empty `questionIds` array would fail Zod validation on the server — the client should guard: `if (questions.length === 0) return`).

### `useMediaQuery` hook for responsive panel
A minimal `useMediaQuery` hook is needed by `CalculatorPanel`. Rather than adding a library, implement it as a small private utility:
```
// client/src/hooks/useMediaQuery.ts (new, tiny)
function useMediaQuery(query: string): boolean
```
Returns `true` if the media query matches. Initializes from `window.matchMedia(query).matches` and updates via the `change` event listener. This avoids a flash of wrong panel mode on initial render.

### Accessibility: focus trap
The calculator panel does NOT implement a focus trap (per wireframe spec — it is a supplementary panel, not a blocking modal). If the existing `Modal` component is open simultaneously (which should not happen during assessment taking), the `z-50` levels are equal; however, this scenario does not arise in the current user flow since modals are closed before assessment taking begins.

### `ConfirmDialog` variant for bulk toolbar
The existing `ConfirmDialog` component accepts `confirmLabel` as a prop and always renders the confirm button with `variant="danger"`. For "Enable for all", the danger variant is semantically mismatched but acceptable for MVP. If a `confirmVariant` prop is added to `ConfirmDialog` in a follow-up, it would allow a `primary` variant for enabling. For now, use `confirmLabel="Enable for all"` or `"Disable for all"` as appropriate.
