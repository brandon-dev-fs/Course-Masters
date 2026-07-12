---
id: cm-0026
title: Redesign Course Detail Page with Vertical Roadmap Layout
stage: review
status: approved
approver: agent
approved_at: 2026-05-27T00:00:00Z
---

# Code Review: Redesign Course Detail Page with Vertical Roadmap Layout

## Summary

Third and final review pass for cm-0026. Reviewed 20 changed files across frontend source and test layers. All blocking issues from the first two passes have been verified as resolved:

- `isUnitComplete` now derives from `state === 'completed'` only (not the stale progress field).
- Stale `CourseDetailPage` test assertions updated for the new layout.
- Five new test files covering 46 tests present for all new components.
- `text-white` replaced with `text-green-primary-foreground` on the `StateDot` check icon.
- `type="button"` added to all action buttons including the `RoadmapUnitCard` pencil.
- Unused `_course` prop removed from `UnitRoadmap`.
- `opacity-60` is now applied to the locked unit `<li>` in `UnitRoadmap.tsx:91`.
- `aria-hidden="true"` added to all decorative icons in `UnitRoadmap` and `RoadmapUnitCard`.

All 20 commits on the branch follow the `cm-0026: <imperative>` format. No backend files were changed.

## Scope Coverage

- **Backend files reviewed**: none (frontend-only spec)
- **Frontend files reviewed**: `CourseDetailPage.tsx`, `CourseHeader.tsx`, `CourseProgressSidebar.tsx`, `MobileProgressBar.tsx`, `RoadmapUnitCard.tsx`, `UnitRoadmap.tsx`, `ProgressBar.tsx`, `UnitSettingsModal.tsx`, `CourseCard.tsx`, `CourseFilters.tsx`, `HomePage.tsx`, `Layout.tsx`
- **Frontend test files reviewed**: `CourseDetailPage.test.tsx`, `CourseHeader.test.tsx`, `CourseProgressSidebar.test.tsx`, `MobileProgressBar.test.tsx`, `RoadmapUnitCard.test.tsx`, `UnitRoadmap.test.tsx`, `CourseCard.test.tsx`, `HomePage.test.tsx`
- **Config/other files reviewed**: none
- **Rules loaded**: `rules.md`, `review.md`, `frontend.md`, `design.md`

## Issues

### [LOW] `ProgressBar` ARIA attributes placed on outer track wrapper rather than the fill element

- **Location**: `client/src/features/progress/ProgressBar.tsx:23-30`
- **Description**: The `role="progressbar"` and associated `aria-valuenow`/`aria-valuemin`/`aria-valuemax` attributes are applied to the outer container `<div>` (the grey track). The WAI-ARIA spec permits this — the progressbar role does not require the element to be the fill bar — and `aria-valuenow` is accurate. Announcements will be correct in practice. This is advisory.
- **Suggested Fix**: No immediate action required. As a low-priority follow-up, consider whether moving the role and aria attributes to the inner fill `<div>` (which physically changes size) provides more consistent announcements across screen readers.

### [LOW] `CourseHeader` splits one lucide-react import across two lines

- **Location**: `client/src/features/courses/CourseHeader.tsx:1-2`
- **Description**: Two separate `import` statements both source from `'lucide-react'`. The frontend import convention is one import per package. This is a minor style inconsistency.
- **Suggested Fix**: Merge into a single statement: `import { Calendar, Settings, User, LayoutGrid, BookOpen, Calculator, FlaskConical, Languages, Music, GraduationCap } from 'lucide-react';`

### [INFO] `handleReviewFlashCards` navigates to the first lesson, not the first lesson containing flash cards

- **Location**: `client/src/features/courses/CourseDetailPage.tsx:80-90`
- **Description**: FR-21 specifies navigation to "the first available lesson with flash cards." The current implementation navigates to the first lesson of the first unit with any lessons. The spec explicitly defers this: "Flash card review flow (the quick action link navigates to the first unit's first lesson for now)" is in scope exclusions. The `RoadmapUnitCard.tsx` TODO comment also acknowledges this. No action needed this pass.
- **Suggested Fix**: When tool-count data is available from the API, update the function to find the first lesson containing at least one `flash_card` tool.

### [INFO] `UnitRoadmap` Final Exam item has no visual connector to the timeline

- **Location**: `client/src/features/courses/UnitRoadmap.tsx:115-138`
- **Description**: The `<ol>` unit list renders vertical line connectors between unit dots, but the Final Exam block below the `<ol>` has no dot column or connecting line. The timeline visually terminates at the last unit with no continuation to the exam item. This matches the current wireframe but may look disconnected at runtime.
- **Suggested Fix**: Advisory only. Consider adding a dot column with a trophy-colored indicator and a short connector line from the last unit to align the exam item with the roadmap visual language.

### [INFO] Nested `<aside>` landmarks in `CourseDetailPage` + `CourseProgressSidebar`

- **Location**: `client/src/features/courses/CourseDetailPage.tsx:188`, `client/src/features/courses/CourseProgressSidebar.tsx:30`
- **Description**: `CourseDetailPage` wraps the sidebar in `<aside className="w-[260px] ...">` (no label) and `CourseProgressSidebar` renders `<aside aria-label="Course progress">`. The nesting produces two stacked landmark elements in screen reader navigation. Not a WCAG failure, but adds navigational noise.
- **Suggested Fix**: Advisory only. Replace the outer `<aside>` in `CourseDetailPage` with a plain `<div>` since the inner `<aside aria-label="Course progress">` in `CourseProgressSidebar` already provides the correct landmark.

## Verdict

**Status**: APPROVED

Zero issues at medium or above. All blocking issues from the first two review passes are confirmed resolved. The implementation correctly satisfies all 27 functional requirements and all 6 non-functional requirements from the approved spec. Test coverage spans all five new components plus the updated page orchestrator with 46 new tests.

Approved by agent.

## Next Steps

Next: `/test cm-0026`

Override: `/approve .claude/reviews/cm-0026/code-review.md` or edit frontmatter to `status: rejected`
