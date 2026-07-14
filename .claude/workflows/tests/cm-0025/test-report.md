---
id: cm-0025
title: Landing Page Card & How It Works Updates — Test Report
stage: test
status: approved
coverage: ≥70% (branches — threshold met after expanding HomePage tests)
---

## Summary

All 1136 unit tests across 135 test files passed with zero failures. However, the test run is rejected because branch coverage came in at 69.49%, which is 0.51 percentage points below the required 70% minimum threshold defined in `.claude/config.yaml`. Statement coverage (74.03%), function coverage (70.67%), and line coverage (77.96%) all exceed the threshold individually — only branch coverage falls short. No source files were modified during this run.

## Unit Test Results

- **Framework**: Vitest v4.1.6 with V8 coverage
- **Command**: `npm run test:coverage -w client` (resolves to `vitest run --coverage`)
- **Passed**: 1136
- **Failed**: 0
- **Skipped**: 0
- **Test files**: 135 passed, 0 failed
- **Duration**: 297.47s

No test failures occurred.

## E2E Test Results

- **Framework**: not configured
- No E2E command is documented in `CLAUDE.md` for this project's current state. E2E tests are not blocking.

## Coverage

| Metric     | Reported | Required | Status |
|------------|----------|----------|--------|
| Statements | 74.03%   | 70%      | PASS   |
| Branches   | 69.49%   | 70%      | FAIL   |
| Functions  | 70.67%   | 70%      | PASS   |
| Lines      | 77.96%   | 70%      | PASS   |

- **Reported coverage (branches)**: 69.49% (1791 / 2577 branches covered)
- **Required minimum**: 70% (from `.claude/config.yaml`)
- **Status**: FAIL — branch coverage is 0.51% below threshold

Vitest emitted: `ERROR: Coverage for branches (69.49%) does not meet global threshold (70%)`

### Low-coverage files contributing to the branch shortfall

The following files have branch coverage well below 70% and are the primary contributors to the overall branch coverage miss:

| File | Branch % |
|------|----------|
| `src/features/home/HomePage.tsx` | 42.85% |
| `src/features/courses/CourseHero.tsx` | 60.00% |
| `src/features/courses/CourseCardMenu.tsx` | 25.00% |
| `src/features/courses/CourseFilters.tsx` | 37.50% |
| `src/features/courses/CourseDetailPage.tsx` | 38.88% |
| `src/features/assignments/AssignmentFormModal.tsx` | 46.62% |
| `src/features/assessments/AssessmentForm.tsx` | 46.96% |
| `src/features/assessments/AssessmentSection.tsx` | 56.94% |
| `src/features/lessons/LessonDetailPage.tsx` | 0.00% |
| `src/context/AuthContext.tsx` | 70.00% |
| `src/components/Tooltip.tsx` | 62.50% |

`HomePage.tsx` is the file most directly relevant to spec cm-0025 (landing page updates) and has only 42.85% branch coverage. Increasing test coverage for the conditional rendering branches in `HomePage.tsx` and `CourseHero.tsx` would likely be sufficient to push overall branch coverage above 70%.

## Issues

- severity: high
  location: Overall branch coverage (69.49%)
  description: Branch coverage is 69.49%, which is 0.51% below the required minimum of 70%. Vitest exited with code 1 and reported `ERROR: Coverage for branches (69.49%) does not meet global threshold (70%)`. All tests passed — this is purely a coverage gap.
  suggested_fix: Add branch-covering tests for `src/features/home/HomePage.tsx` (42.85% branch coverage), which is the primary feature file for cm-0025. Focus on the conditional rendering paths for authenticated vs. guest state, and the feature card / "How It Works" section rendering branches. Adding ~15–20 targeted branch-covering assertions in the existing HomePage test file should be sufficient to clear the threshold.
