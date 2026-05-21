---
id: cm-0022
title: Redesign Landing Page Hero Section
stage: test
status: approved
coverage: 74.51%
---

## Summary

All 1,114 unit tests across 134 test files passed with zero failures and zero skips. Overall statement coverage is 74.51%, branch coverage is 70.04%, function coverage is 70.85%, and line coverage is 78.80% — every coverage dimension meets or exceeds the 70% minimum threshold from config. No E2E framework is configured for this project. The test run is approved.

## Unit Test Results

- **Framework:** Vitest v4.1.6 with V8 coverage
- **Command:** `npm run test:coverage -w client` (from repo root)
- **Passed:** 1114
- **Failed:** 0
- **Skipped:** 0
- **Duration:** 262.28s

No test failures to report.

## E2E Test Results

- **Framework:** not configured
- **Command:** N/A
- No E2E framework is configured in the project. This does not block approval.

## Coverage

| Metric     | Reported | Required | Status |
|------------|----------|----------|--------|
| Statements | 74.51%   | 70%      | PASS   |
| Branches   | 70.04%   | 70%      | PASS   |
| Functions  | 70.85%   | 70%      | PASS   |
| Lines      | 78.80%   | 70%      | PASS   |

- **Reported coverage (statements):** 74.51% (2076/2786)
- **Required minimum:** 70% (from `.claude/config.yaml`)
- **Status:** PASS

### Notable low-coverage files

The following files are below 60% statement coverage and represent areas where additional test coverage would be beneficial in future iterations:

- `src/features/lessons/LessonDetailPage.tsx` — 0.72% statements (heavily integration-dependent page)
- `src/features/home/HomePage.tsx` — 39.21% statements
- `src/features/courses/CourseDetailPage.tsx` — 47.27% statements
- `src/features/assignments/AssignmentFormModal.tsx` — 41.72% statements

These do not affect approval as the aggregate coverage clears the 70% threshold across all metrics.
