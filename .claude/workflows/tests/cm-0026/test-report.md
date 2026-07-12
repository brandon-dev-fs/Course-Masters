---
id: cm-0026
title: Redesign Course Detail Page with Vertical Roadmap Layout
stage: test
status: approved
coverage: "Statements 74.29% | Branches 70.24% | Functions 71.35% | Lines 78.15%"
---

## Summary

All 1192 unit tests passed across 140 test files with zero failures and zero skipped tests. All four coverage metrics exceed the 70% minimum threshold defined in `.claude/config.yaml`: statements at 74.29%, branches at 70.24%, functions at 71.35%, and lines at 78.15%. No E2E framework is configured for this project. The test run is approved.

## Unit Test Results

- **Framework**: Vitest v4.1.6 with V8 coverage (`@vitest/coverage-v8`)
- **Command**: `npm run test:coverage -w client` (resolves to `vitest run --coverage`)
- **Passed**: 1192
- **Failed**: 0
- **Skipped**: 0
- **Test files**: 140 passed (140 total)
- **Duration**: 278.14s

No test failures were recorded.

## E2E Test Results

- **Framework**: not configured
- No E2E framework is documented in `CLAUDE.md` or configured via `playwright.config.*` / `cypress.config.*`. This does not block approval.

## Coverage

| Metric     | Reported | Required | Status |
|------------|----------|----------|--------|
| Statements | 74.29%   | 70%      | PASS   |
| Branches   | 70.24%   | 70%      | PASS   |
| Functions  | 71.35%   | 70%      | PASS   |
| Lines      | 78.15%   | 70%      | PASS   |

- **Reported coverage (branches, lowest metric)**: 70.24% (1891 / 2692 branches covered)
- **Required minimum**: 70% (from `.claude/config.yaml`)
- **Coverage status**: PASS — all four metrics meet or exceed the 70% aggregate threshold

### Notable low-coverage files (informational)

| File | Statements | Branches | Functions |
|------|------------|----------|-----------|
| `src/features/courses/CourseDetailPage.tsx` | 31.34% | 23.72% | 18.18% |
| `src/features/lessons/LessonDetailPage.tsx` | 0.72% | 0% | 0% |
| `src/features/home/HomePage.tsx` | 51.72% | 71.42% | 26.08% |
| `src/features/courses/CourseHero.tsx` | 24.00% | 40.00% | 28.57% |
| `src/features/courses/CourseCardMenu.tsx` | 48.57% | 25.00% | 66.66% |
| `src/features/assignments/AssignmentFormModal.tsx` | 41.72% | 46.62% | 31.03% |
| `src/features/assessments/AssessmentForm.tsx` | 51.11% | 46.96% | 57.57% |

These files bring down the aggregate individually but do not trigger threshold failures since `perFile: false` is set in the Vitest config. Coverage for `CourseDetailPage.tsx` and `CourseHero.tsx` reflects new components introduced in this spec with limited test coverage — candidates for improvement in a follow-on spec.
