---
id: cm-0015
title: Fix Accessibility Issues — Color-Only Status, Modal Focus, Stepper aria-current
stage: spec
status: approved
approver: human
approved_at: 2026-05-12T00:00:00Z
---

# Fix Accessibility Issues — Color-Only Status, Modal Focus, Stepper aria-current

## Problem Statement

Three accessibility barriers exist across the client application. First, pass/fail status in assessment-related components (UnitTestCard, AssessmentSection attempt list, AssessmentResults, and LessonStatusBadge) relies partly on color alone to convey meaning, violating WCAG 2.1 SC 1.4.1 (Use of Color). While some components include text labels, others use color-only indicators (e.g., the green/default checkbox in UnitTestCard, the color-coded score percentage in AssessmentResults, and the checkmark-vs-circle in LessonStatusBadge). Second, the shared Modal component does not manage focus — it neither moves focus into the modal on open nor returns focus to the triggering element on close, violating WCAG 2.1 SC 2.4.3 (Focus Order) and making the modal unusable for keyboard and screen reader users. Third, AssignmentStepper does not communicate the active step to assistive technology via `aria-current="step"`, violating WCAG 2.1 SC 4.1.2 (Name, Role, Value).

## Goals

- All pass/fail and completion status indicators convey their meaning through both color and text, so users who cannot perceive color differences still understand the status.
- Modal focus is fully managed: focus moves into the modal when it opens and returns to the element that triggered the modal when it closes.
- Screen reader users can identify the active step in AssignmentStepper through standard ARIA semantics.

## Non-Goals

- Full WCAG 2.1 AA audit of the entire application — this spec addresses only the three identified issues.
- Adding a focus trap (tab-cycling within the modal) — that is a separate enhancement. This spec covers initial focus placement and focus restoration only.
- Redesigning the visual appearance of any component — changes are limited to adding text labels, ARIA attributes, and focus management logic.
- Backend or API changes — all three issues are purely client-side.

## Requirements

### Functional Requirements

- FR-01: UnitTestCard must display a visible text label (e.g., "Passed" or "Not passed") alongside its colored checkbox indicator so that status is not conveyed by color alone.
  - Acceptance criteria: When a unit test has been attempted, a text label indicating pass or fail is visible adjacent to or within the status indicator area, regardless of the color rendering.

- FR-02: AssessmentSection's "Previous Attempts" list already displays "Passed"/"Failed" text labels alongside color-coded scores. Verify this remains intact and that the score percentage element also has an accessible association with the pass/fail label (e.g., they are in the same logical row so screen readers read both).
  - Acceptance criteria: Each attempt row contains both a percentage score and a "Passed"/"Failed" text label that are programmatically associated (within the same list item or row element).

- FR-03: AssessmentResults must ensure the large score percentage is not interpreted as color-only status. The existing text labels ("Passed!" / "Not passed") must remain visible and be programmatically associated with the score.
  - Acceptance criteria: A screen reader encountering the score percentage also receives the pass/fail text label, either through proximity in the DOM or explicit ARIA association.

- FR-04: LessonStatusBadge must display a visible text label (e.g., "Passed" or "Not taken") alongside its icon-and-color indicator.
  - Acceptance criteria: The badge renders a human-readable text label conveying quiz status, not just a checkmark or circle icon with color.

- FR-05: The shared Modal component must move focus to a focusable element inside the modal when it mounts.
  - Acceptance criteria: When any modal opens, the browser's active element is within the modal container. The close button or the first focusable element inside the modal receives focus.

- FR-06: The shared Modal component must return focus to the element that triggered the modal when the modal closes.
  - Acceptance criteria: After closing any modal (via Escape key, close button, or backdrop click), the browser's active element is the same element that was focused before the modal opened.

- FR-07: The Modal component must apply `role="dialog"` and `aria-modal="true"` to the modal container, and `aria-labelledby` referencing the modal title.
  - Acceptance criteria: The modal's root container element has `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to the rendered title element's ID.

- FR-08: AssignmentStepper must apply `aria-current="step"` to the button representing the currently active step, in both the desktop and mobile layouts.
  - Acceptance criteria: Exactly one step button in the rendered stepper has `aria-current="step"` at any time, and it corresponds to the visually active step. When the active step changes, the attribute moves accordingly.

### Non-Functional Requirements

- NFR-01: All changes must not introduce visual regressions — existing users should see the same layout and color scheme, with additional text labels integrated naturally into the existing design.
- NFR-02: Focus management in Modal must work correctly across all supported browsers (Chrome, Firefox, Safari, Edge latest versions).

## Required Design Artifacts

- [ ] UI wireframe (`wireframe.md`)
- [x] Frontend plan (`frontend-plan.md`)
- [ ] Backend plan (`backend-plan.md`)
- [ ] API contract (`api-contract.md`)

## Open Questions

None. All three issues are well-defined with clear WCAG references and identified source components.
