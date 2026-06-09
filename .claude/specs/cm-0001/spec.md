---
id: cm-0001
title: Per-Question Calculator Toggle
stage: spec
status: approved
approver: human
approved_at: 2026-04-19T00:00:00Z
---

# cm-0001: Per-Question Calculator Toggle

## Problem Statement

Students working through assessments (practice problems, quizzes, exams) currently have no access to a calculator within the app. When a question requires arithmetic, exponent, or square root computation, students must leave the app or use a separate device — breaking focus and flow. Teachers also have no way to indicate whether calculator use is appropriate for a given question, leaving the intent ambiguous.

## Proposed Solution

Add an optional calculator to assessment questions. Teachers toggle calculator availability on a per-question basis when authoring an assessment. Students see a calculator button with the question when the toggle is enabled; tapping it opens a floating calculator panel that sits above the page content so the question and answer choices remain fully accessible beneath it. Each question gets a fresh calculator instance — no state carries between questions.

If a floating panel is not technically feasible on a given viewport (e.g., very small screens), an inline panel stacked below the question text is the fallback.

A bulk-apply shortcut in the assessment editor lets teachers enable or disable the calculator for all questions in one action, reducing repetitive toggling when the intent applies to the whole assessment.

## User Stories

1. **As a teacher**, I want to mark individual questions as "calculator allowed" so that students have access to computation help exactly where I intend it.
2. **As a teacher**, I want to bulk-enable or bulk-disable the calculator for all questions in an assessment at once so that I don't have to toggle each question individually when the intent is uniform.
3. **As a student**, I want to open a calculator inline while reading a question so that I can compute without leaving the app or losing my place.
4. **As a student**, I want the calculator to reset when I move to a new question so that leftover numbers from a previous answer don't cause confusion.

## Scope

### In scope (MVP)

- `calculatorEnabled` boolean field on `AssessmentQuestion`, defaulting to `false`.
- Calculator supports: addition, subtraction, multiplication, division, exponentiation, and square root.
- Calculator rendered as a **floating panel** above page content, toggled open/closed by a button attached to the question. The panel must not obscure the question text or answer choices.
- Fallback: if a floating panel is not technically feasible (e.g., constrained viewport), an inline panel stacked below the question text is acceptable.
- Calculator state resets each time a new question is displayed.
- Teacher toggle per question in the assessment question editor.
- Bulk-apply action in the assessment editor header: "Enable calculator for all" / "Disable calculator for all".
- API: PATCH endpoint (or reuse existing PUT) to update `calculatorEnabled` on one or more questions.

### Out of scope (MVP)

- Trigonometric functions (sin, cos, tan) and logarithms.
- Scientific notation input/display.
- History or memory registers.
- Calculator state persistence across sessions or questions.
- Graphing or equation solving.
- Per-assessment or per-unit default settings stored in the database (bulk-apply is a UI convenience only, not a new model).

## Functional Requirements

### Data model

- Add `calculatorEnabled Boolean @default(false)` to the `AssessmentQuestion` model.
- No new models or relations required.

### API

- Existing PUT `/assessments/:assessmentId` or question-level endpoints must accept and persist `calculatorEnabled`.
- A bulk-update convenience must be supported — either via a dedicated endpoint or via the existing question update path accepting an array of question IDs with a shared value.

### Teacher UI (assessment editor)

- Each question card in the editor shows a toggle labeled "Calculator" (or an icon + tooltip).
- An assessment-level toolbar action applies the same value to all questions at once.
- The bulk action must confirm intent if toggling from mixed state (some on, some off).

### Student UI (question view)

- When `calculatorEnabled` is `true` for the active question, a calculator button is rendered with the question (e.g., below the question text, before the answer choices).
- Clicking the button toggles a **floating calculator panel** open or closed. The panel hovers above page content so the question and answer choices remain visible and interactable beneath it.
- The panel position should be draggable or anchored in a non-obstructing area (e.g., bottom-right corner of the viewport).
- Fallback: on viewports where a floating panel is not feasible, the panel renders inline below the question text.
- The panel is dismissed automatically on question navigation.
- The calculator instance is destroyed and recreated on each question mount.

### Calculator operations

| Category | Operations |
|---|---|
| Basic arithmetic | +, -, ×, ÷ |
| Exponentiation | xʸ (x to the power y) |
| Square root | √x |
| Utility | Clear (C), backspace, decimal point, equals |

## Non-Functional Requirements

- The calculator component must be accessible (keyboard navigable, ARIA labels on all buttons).
- The floating panel must not obscure answer choices — it should be positioned so the question and choices are accessible beneath it (e.g., anchored to the bottom-right corner).
- On mobile viewports where a floating panel is not feasible, the panel stacks vertically below the question text.
- Opening/closing the panel must not trigger a re-render of the question or reset the student's selected answer.

## Technical Decision: Third-Party vs. In-House Calculator

The design stage should evaluate reputable, actively maintained, open-source calculator UI libraries before committing to a custom build. Criteria: React 19 compatibility, Tailwind-friendly or headless, bundle size, accessibility story, operator coverage (must support exponent and square root at minimum). If no suitable library is found, the calculator will be built in-house as a small purpose-built component.

Recommended libraries to evaluate (non-exhaustive): `react-calculator`, `math.js` (logic only, pair with custom UI), `Decimal.js` (precision arithmetic, pair with custom UI). The design stage should document the chosen approach and rationale in the wireframe or frontend plan.

## Required Design Artifacts

- [x] ui-design — wireframe for the floating calculator panel (desktop) and inline fallback (mobile), the question-level toggle in the editor, and the bulk-apply toolbar action
- [x] frontend-plan — component structure, state management, library selection decision, integration points with existing question and assessment views
- [x] backend-plan — migration for `calculatorEnabled` field, update to question update handler, bulk-update strategy
- [x] api-contract — updated question shape, bulk-update endpoint contract

## Open Questions

_None. All clarifying questions resolved prior to spec authoring._

## Assumptions

- The existing `AssessmentQuestion` PUT endpoint is the correct place to persist `calculatorEnabled`; no new route is needed unless the bulk-update pattern requires one.
- "Reset per question" means the React component is unmounted and remounted on question change — no explicit calculator state reset logic is needed beyond normal React lifecycle.
- The teacher bulk-apply is purely a client-side convenience — it fires individual update calls or a batch call; there is no server-side "assessment-level calculator default" stored in the database.
