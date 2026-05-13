---
id: cm-0015
title: Fix Accessibility Issues — Color-Only Status, Modal Focus, Stepper aria-current
stage: design
status: approved
approver: human
approved_at: 2026-05-12T00:00:00Z
artifact: frontend-plan
---

## Overview

This plan covers three purely client-side accessibility fixes across six existing components. No new components are created, no routes change, and no API calls are added or modified. The changes are:

1. **Color-only status (FR-01–FR-04):** Four components currently convey pass/fail status through color or icon alone. Each receives a visible text label so that status is unambiguous without color perception.
2. **Modal focus management (FR-05–FR-07):** The shared `Modal` component gains focus-on-open, focus-restore-on-close, and the three required ARIA attributes (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`).
3. **AssignmentStepper aria-current (FR-08):** The active step button in both the desktop and mobile layouts of `AssignmentStepper` receives `aria-current="step"`.

All changes are additive (new attributes, new text nodes) and must not alter the existing visual layout or color scheme.

---

## Affected Files

| File | Reason |
|---|---|
| `client/src/features/progress/LessonStatusBadge.tsx` | FR-04: badge renders only a symbol character (`✓` / `○`); needs a visible text label |
| `client/src/features/tests/UnitTestCard.tsx` | FR-01: colored checkbox conveys pass/fail without text; the existing description line already shows "Passed / Failed" but only when `lastAttempt` exists — the checkbox icon itself has no label |
| `client/src/features/assessments/AssessmentResults.tsx` | FR-03: the large `{pct}%` number has no programmatic association to the adjacent pass/fail label; needs an `aria-describedby` link or DOM restructuring |
| `client/src/features/assessments/AssessmentSection.tsx` | FR-02: verify and, if needed, tighten DOM structure so the percentage and "Passed"/"Failed" label are inside the same element with a shared ARIA relationship |
| `client/src/components/Modal.tsx` | FR-05, FR-06, FR-07: missing focus-on-open, focus-restore-on-close, and dialog ARIA attributes |
| `client/src/features/lessons/AssignmentStepper.tsx` | FR-08: active step button in both desktop and mobile layouts lacks `aria-current="step"` |

---

## Implementation Steps

### Step 1 — LessonStatusBadge: add visible text label (FR-04)

**File:** `client/src/features/progress/LessonStatusBadge.tsx`

Replace the symbol-only content (`✓` / `○`) with a text label. The symbol characters can remain as `aria-hidden="true"` decorative elements, but a visible text string ("Passed" or "Not taken") must follow them inside the `<span>`. The label text should match the badge's existing compact size, using the same `text-xs` class already present.

Acceptance check: the badge renders a human-readable string ("Passed" or "Not taken") visible to all users, not just an icon or color.

---

### Step 2 — UnitTestCard: ensure the status indicator area is not color-only (FR-01)

**File:** `client/src/features/tests/UnitTestCard.tsx`

The colored checkbox (`bg-green-500` when passed, `bg-surface-raised` when not) currently has no text alternative. The `<p>` below it already shows "Passed · 75%" or "Failed · 60%" when `lastAttempt` exists, which satisfies text association for that state. However, when `lastAttempt` is null and the test has not been attempted, the checkbox renders in a neutral (not-passed) state with no label.

Add an `aria-label` attribute to the checkbox `<div>` that reflects the current state: `"Status: Passed"` when `passed` is true, `"Status: Not passed"` when `passed` is false, and `"Status: Locked"` when `locked` is true. Because this `<div>` is not interactive, also add `role="img"` so the label is exposed to screen readers.

Acceptance check: a screen reader announces the status of the checkbox indicator regardless of whether an attempt has been made.

---

### Step 3 — AssessmentResults: associate the score percentage with the pass/fail label (FR-03)

**File:** `client/src/features/assessments/AssessmentResults.tsx`

The large `{pct}%` element and the "Passed!" / "Not passed" paragraph are siblings in a flex column. A screen reader will read both in DOM order, which is sufficient for proximity-based association. To make the relationship explicit and satisfy FR-03's requirement for programmatic association, assign a stable `id` to the pass/fail paragraph (e.g., `id="assessment-result-status"`) and add `aria-describedby="assessment-result-status"` to the percentage `<div>`. This links the two so that when assistive technology focuses or reads the percentage, it also reads the pass/fail label.

No visual changes are needed.

Acceptance check: when a screen reader reads the score percentage, it announces the pass/fail label from the adjacent paragraph.

---

### Step 4 — AssessmentSection: verify attempt row DOM structure (FR-02)

**File:** `client/src/features/assessments/AssessmentSection.tsx`

Inspect the "Previous Attempts" list. Each row is a `<div>` with four children: attempt number, percentage, "Passed"/"Failed", and date. All four are already within the same `<div key={a.id}>` element, so a screen reader reading the row will encounter both the percentage and the label in sequence — the existing structure satisfies FR-02.

The only change needed is to ensure the percentage `<span>` and the label `<span>` have no `aria-hidden` applied to them (they do not currently), so no structural change is required. However, to make the row semantically meaningful as a list item, confirm the wrapping `<div className="flex flex-col gap-1.5">` is either a `<ul>` or has `role="list"`, and each row `<div>` has `role="listitem"`. Change the outer wrapper from `<div className="flex flex-col gap-1.5">` to `<ul className="flex flex-col gap-1.5" role="list">` and each row from `<div key={a.id} className="...">` to `<li key={a.id} className="...">`. This ensures the list semantics are preserved without any visual change.

Acceptance check: each attempt row is a list item containing both the percentage and the pass/fail label in the same element, readable by screen readers in order.

---

### Step 5 — Modal: add ARIA dialog attributes (FR-07)

**File:** `client/src/components/Modal.tsx`

The inner modal container `<div>` (the one with `relative flex flex-col max-h-[85vh] z-10 ...`) needs three attributes added:

- `role="dialog"`
- `aria-modal="true"`
- `aria-labelledby` pointing to a stable `id` on the `<h2>` title element

Assign `id="modal-title"` to the `<h2>` inside the modal header, then add `aria-labelledby="modal-title"` to the container `<div>`.

Note: if multiple modals could theoretically be rendered simultaneously (they are not in current usage, but the component is shared), the `id` should be unique. For this codebase, a single modal is rendered at a time (controlled by `view` state), so a static `id` is acceptable. If future usage requires concurrent modals, this can be revisited.

Acceptance check: the modal container has `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to the `<h2>` id.

---

### Step 6 — Modal: capture the pre-open focused element (FR-06)

**File:** `client/src/components/Modal.tsx`

At the top of the `Modal` component function body, add a `useRef<Element | null>(null)` to store the element that was focused when the modal mounted. In the existing `useEffect` (which currently only attaches the Escape keydown listener), capture `document.activeElement` into this ref at the start of the effect (before the event listener is attached). In the effect's cleanup function, after removing the keydown listener, call `.focus()` on the stored element — but only if it is an `HTMLElement` (use a type guard). This restores focus to the trigger when the modal unmounts for any reason (Escape key, close button, or backdrop click).

Acceptance check: after closing any modal, the browser's focused element is the button or element that opened it.

---

### Step 7 — Modal: move focus into the modal on open (FR-05)

**File:** `client/src/components/Modal.tsx`

Add a second `useRef<HTMLDivElement | null>(null)` and attach it to the inner modal container `<div>` (the same element receiving `role="dialog"` in Step 5). In a second `useEffect` that runs once on mount, call `.focus()` on that ref's current element. For `.focus()` to work on a non-interactive `<div>`, the element needs `tabIndex={-1}` added to it. This programmatically moves keyboard focus into the modal overlay, from which the user can Tab to the close button or interactive content inside.

The close button already has an `aria-label="Close"` attribute, so once focus is inside the modal the user can Tab directly to it.

Acceptance check: immediately after any modal opens, `document.activeElement` is inside the modal container.

---

### Step 8 — AssignmentStepper desktop layout: add aria-current to active step button (FR-08)

**File:** `client/src/features/lessons/AssignmentStepper.tsx`

In the desktop layout section (`hidden lg:flex`), the `<button>` inside each step's column already has `aria-label={item.title}`. Add the attribute `aria-current={isActive ? 'step' : undefined}` to this button. Using `undefined` (rather than `false`) when not active ensures the attribute is omitted from the DOM entirely for inactive steps, which is the correct semantic — only one button should have `aria-current="step"` at a time.

Acceptance check: in the desktop layout, exactly one `<button>` has `aria-current="step"` and it corresponds to the visually highlighted (active) step.

---

### Step 9 — AssignmentStepper mobile layout: add aria-current to active step button (FR-08)

**File:** `client/src/features/lessons/AssignmentStepper.tsx`

In the mobile layout section (`lg:hidden`), the `<button>` for each step already has `aria-label={item.title}`. Apply the same change as Step 8: add `aria-current={isActive ? 'step' : undefined}`.

Acceptance check: in the mobile layout, exactly one `<button>` has `aria-current="step"` and it matches the visually active step. When the user navigates to a different step, the attribute moves to the new active button.

---

## Testing Notes

### FR-01 — UnitTestCard status label
- Open a course with a unit that has a unit test. Before taking the test, use a screen reader (VoiceOver or NVDA) and navigate to the unit test card. Confirm the reader announces "Status: Not passed" or "Status: Locked" for the checkbox area.
- Take the test and pass. Confirm the reader now announces "Status: Passed".
- Visually confirm no layout change occurred.

### FR-02 — AssessmentSection attempt rows
- Take a lesson quiz at least twice to generate multiple attempts.
- Open browser DevTools and inspect the "Previous Attempts" section. Confirm each row is an `<li>` element inside a `<ul>` and that the percentage and "Passed"/"Failed" label are siblings within the same `<li>`.
- Use a screen reader to tab through the attempts list and confirm each row reads out the percentage and pass/fail status together.

### FR-03 — AssessmentResults score association
- Submit an assessment attempt to reach the results screen.
- In DevTools, confirm the `<div>` containing the percentage has `aria-describedby` pointing to the id of the pass/fail paragraph.
- Use a screen reader to navigate to the percentage element and confirm it announces the pass/fail status.

### FR-04 — LessonStatusBadge text label
- Navigate to a course detail page containing lessons. Confirm the `LessonStatusBadge` next to each lesson shows the text "Passed" or "Not taken" (not just `✓` or `○`).
- Confirm no layout regressions on the lesson list by checking that the badge still fits within its row.

### FR-05 — Modal focus on open
- Open any modal (e.g., click "Take Test" on a unit test card).
- Immediately after the modal appears, confirm `document.activeElement` is inside the modal by running `document.activeElement` in the browser console or using a screen reader and noting that focus has moved.
- Confirm Tab moves focus to the first interactive element inside the modal (the close button or first form input).

### FR-06 — Modal focus restore on close
- Click the button that opens a modal and note which element had focus (the trigger button).
- Close the modal via the X button, Escape key, and backdrop click — test each path separately.
- After each close, confirm `document.activeElement` is the trigger button.

### FR-07 — Modal ARIA attributes
- Open any modal and inspect the modal container in DevTools.
- Confirm: `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to the `<h2>` element's id.
- Confirm the `<h2>` has `id="modal-title"` (or the value referenced by `aria-labelledby`).

### FR-08 — AssignmentStepper aria-current
- Navigate to a lesson detail page with multiple steps.
- Inspect the stepper in DevTools. Confirm exactly one `<button>` in the desktop layout has `aria-current="step"` and it matches the highlighted (active) step.
- Click a different step. Confirm `aria-current="step"` moves to the newly active button and is absent from all others.
- Resize the viewport to mobile width and repeat the inspection for the mobile layout.
- Use a screen reader and navigate through the stepper buttons; confirm the active step is announced with "current step" or equivalent phrasing.
