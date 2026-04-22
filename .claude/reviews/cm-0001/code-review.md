---
id: cm-0001
title: Per-Question Calculator Toggle
stage: review
status: approved
approver: agent
---

# Code Review: Per-Question Calculator Toggle

## Summary

Re-review of the cm-0001 feature branch (`feature/calculator-v2`) against `develop`. 22 source
files changed across backend and frontend scopes (9 commits ahead of `develop`). The two
previously-blocking issues — the `bulkUpdateCalculator` null-safety gap (HIGH, commit `cf2ddb9`)
and the duplicate `id="calculator-panel"` ARIA issue (MEDIUM, commit `bdfb6cd`) — have both been
correctly resolved. The commit format exception for pre-feature workflow commits (`dcb48a4`,
`1663f9c`) is acknowledged per the review request and not re-flagged.

The implementation conforms to the approved spec, backend plan, frontend plan, and API contract.
No API contract deviations were found. No console.log or debug artifacts are present. No
unauthorized Prisma instantiation. All route handlers use `asyncHandler`. Auth and authorization
middleware are applied correctly on all write routes.

## Scope Coverage

- **Backend files reviewed**: `server/prisma/schema.prisma`,
  `server/prisma/migrations/20260419000000_add_calculator_enabled_to_assessment_question/migration.sql`,
  `server/src/schemas/assessment.schema.ts`, `server/src/services/assessment.service.ts`,
  `server/src/controllers/assessment.controller.ts`, `server/src/routes/assessment.routes.ts`
- **Frontend files reviewed**: `client/src/api/types.ts`, `client/src/api/client.ts`,
  `client/src/api/assessments.ts`, `client/src/features/assessments/QuestionEditor.tsx`,
  `client/src/features/assessments/AssessmentForm.tsx`,
  `client/src/features/assessments/AssessmentTaker.tsx`,
  `client/src/features/assessments/CalculatorPanel.tsx`,
  `client/src/features/tests/TestSection.tsx`, `client/src/features/exams/ExamCard.tsx`,
  `client/src/hooks/useCalculator.ts`, `client/src/hooks/useMediaQuery.ts`,
  `client/src/features/practice-problems/PracticeProblemCard.tsx`,
  `client/src/features/practice-problems/PracticeProblemForm.tsx`,
  `client/src/features/practice-problems/PracticeProblemList.tsx`
- **Config/other files reviewed**: `client/package.json` (new `decimal.js` dependency verified
  against frontend plan)
- **Rules loaded**: `rules.md`, `backend.md`, `api.md`, `data.md`, `frontend.md`

## Issues

### [LOW] Calculator button in `AssessmentTaker` does not use the shared `Button` component
- **Location**: `client/src/features/assessments/AssessmentTaker.tsx:64-83`
- **Description**: The calculator open/close button is a raw `<button>` element with manually
  composed Tailwind classes. The client CLAUDE.md requires shared UI primitives in `src/components/`
  to always be used and never recreated inline. The frontend plan specifies `Button variant="secondary" size="sm"` for this button. The manual classes duplicate styling that could drift from the design system.
- **Suggested Fix**: Replace the raw `<button>` with the shared `Button` component, passing
  `variant="secondary" size="sm" className="w-full sm:w-auto min-h-[44px] sm:min-h-0"` and the
  existing `aria-*` props. Verify that `Button` forwards refs (needed for `calcTriggerRef`); if not,
  that is a pre-existing gap to address separately.

### [LOW] `PracticeProblemCard` reads `calculatorEnabled` via unchecked `as boolean` cast
- **Location**: `client/src/features/practice-problems/PracticeProblemCard.tsx:18`,
  `client/src/features/practice-problems/PracticeProblemForm.tsx:23`
- **Description**: `(problem.content.calculatorEnabled as boolean) ?? false` casts an unknown JSON
  field to `boolean` without a justification comment. `LessonTool.content` is a freeform `Json`
  column with no server-side shape enforcement (documented in server CLAUDE.md). If the field is a
  non-boolean truthy value (e.g., a string or unexpected type from a migration edge case), the cast
  silently renders the calculator button when it should not. Unlike `correctIndex` and `options`
  which are used in rendering-only contexts, a spurious `true` here changes feature behavior.
- **Suggested Fix**: Replace the cast with a strict equality check:
  `const calculatorEnabled = problem.content.calculatorEnabled === true;`
  This correctly handles `undefined`, `null`, and any non-`true` value as `false` with no escape
  hatch needed.

### [LOW] `PracticeProblemCard` does not reset the calculator panel on answer reset
- **Location**: `client/src/features/practice-problems/PracticeProblemCard.tsx` — `handleReset`
- **Description**: When a student clicks "Try again", `handleReset` resets `selected` and `checked`
  but does not close the calculator panel. The panel remains open after reset, which is inconsistent
  with the spec's intent that the calculator presents a fresh context per attempt. This differs from
  the `AssessmentTaker` pattern where `useEffect` on `currentIdx` closes the panel on navigation.
- **Suggested Fix**: Add `setIsCalculatorOpen(false)` to `handleReset`.

### [INFO] No unit tests added for `useCalculator` hook or `bulkUpdateCalculator` service
- **Location**: `client/src/hooks/useCalculator.ts`, `server/src/services/assessment.service.ts`
- **Description**: The `useCalculator` hook contains a non-trivial state machine (operator chaining,
  division-by-zero guard, sqrt of negative, `justEvaluated` flag). The `bulkUpdateCalculator`
  service function contains ownership-verification logic. No test files were added. Coverage
  requirements apply at the `/test` stage (`min_coverage: 70`).
- **Suggested Fix**: Add `useCalculator.test.ts` covering digit entry, operator chaining, equals,
  sqrt, division by zero, backspace, and clear. Add a service-layer test for `bulkUpdateCalculator`
  covering the happy path, `QUESTION_NOT_IN_ASSESSMENT` rejection, and assessment-not-found path.

### [INFO] Dead code path in `deriveExpression`
- **Location**: `client/src/hooks/useCalculator.ts:236-239`
- **Description**: The branch `if (justEvaluated && operand1 === null)` at line 236 is unreachable.
  The `=` handler (line 194-211) clears both `operand1` and `operator` before setting
  `justEvaluated: true`, so the condition `justEvaluated && operand1 === null && operator !== null`
  (required to reach this branch, since the `operator === null` early return fires first at line 222)
  cannot be satisfied. The dead branch returns `''`, so behavior is correct; this is a readability
  issue only.
- **Suggested Fix**: Remove the dead branch at lines 236-239 and the associated comment at
  lines 226-228, or replace with an `exhaustive` assertion if the intent was to guard an impossible
  state.

## Verdict

**Status**: APPROVED

Zero issues at medium or above. Both previously-blocking issues have been correctly resolved:
- `bulkUpdateCalculator` now guards the post-`updateMany` `findUnique` re-fetch with a null check
  and throws `NotFoundError` on null, satisfying the API contract (`cf2ddb9`).
- `CalculatorPanel` now accepts a `panelId` prop (defaulting to `"calculator-panel"`), and
  `PracticeProblemCard` passes `panelId={`calculator-panel-${problem.id}`}` with a matching
  `aria-controls` on the trigger button, eliminating the duplicate-`id` ARIA violation (`bdfb6cd`).

Approved by agent.

## Next Steps

Next: `/test cm-0001`

Override: `/approve .claude/reviews/cm-0001/code-review.md` or edit frontmatter to `status: rejected`
