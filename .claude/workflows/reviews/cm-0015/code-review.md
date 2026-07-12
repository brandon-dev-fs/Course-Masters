---
id: cm-0015
title: Fix Accessibility Issues — Color-Only Status, Modal Focus, Stepper aria-current
stage: review
status: approved
approver: agent
artifact: code-review
---

# Code Review: Fix Accessibility Issues — Color-Only Status, Modal Focus, Stepper aria-current

## Summary

Re-review of 6 frontend files on `refactor/code_cleanup` vs `develop` after fixes were applied to address issues from the prior rejected review. All changes are client-side accessibility fixes covering: color-only status labels (FR-01–FR-04), modal ARIA attributes and focus management (FR-05–FR-07), and AssignmentStepper `aria-current` (FR-08).

Both previously reported blocking/advisory issues have been resolved correctly. No new issues were found.

## Scope Coverage

- **Backend files reviewed**: none
- **Frontend files reviewed**:
  - `client/src/components/Modal.tsx`
  - `client/src/features/assessments/AssessmentResults.tsx`
  - `client/src/features/assessments/AssessmentSection.tsx`
  - `client/src/features/lessons/AssignmentStepper.tsx`
  - `client/src/features/progress/LessonStatusBadge.tsx`
  - `client/src/features/tests/UnitTestCard.tsx`
- **Config/other files reviewed**: none
- **Rules loaded**: `rules.md`, `frontend.md` (scoped)

## Issues

### Previously Rejected Issues — Resolved

**[HIGH] Modal.tsx — `previousFocusRef` overwritten after mount** — RESOLVED.

The fix splits the concern into two independent empty-dep effects declared in order. The first effect captures `document.activeElement` into a local `trigger` closure variable at mount (before focus moves) and restores it in its cleanup. Because React runs same-dep effects in declaration order, this capture effect fires before the focus-into-modal effect, guaranteeing the pre-open element is recorded. The approach is sound and correctly handles inline-function `onClose` props without re-running the capture.

**[LOW] AssessmentResults.tsx — ✓/✗ symbols not `aria-hidden`** — RESOLVED.

Both symbols are now wrapped in `<span aria-hidden="true">` with the pass/fail text rendered as a separate text node. Screen readers will announce "Passed!" or "Not passed" without the symbol character name.

---

### [INFO] New code has no automated test coverage

- **Location**: all changed files
- **Description**: No test files were added or modified. The accessibility changes (ARIA attributes, focus management) are exactly the kind of logic that benefits from automated testing with a library such as Testing Library's `toHaveFocus()` or `axe-core`. The focus management logic in `Modal.tsx` in particular is behavioral and easy to regress silently.
- **Suggested Fix**: No action required at this time — the project has no configured test framework. Consider adding accessibility-focused unit tests when a test framework is introduced.

## Verdict

**Status**: APPROVED

Zero issues at medium or above. All spec requirements (FR-01 through FR-08) are satisfied by the implementation. Approved by agent.

## Next Steps

Next: `/test cm-0015`

Override: `/approve .claude/reviews/cm-0015/code-review.md` or edit frontmatter to `status: rejected`
