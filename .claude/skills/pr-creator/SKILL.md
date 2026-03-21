---
name: 'pr-creator'
description: 'Creates a title and summary for github pull request for human developer to input.'
---

# Overview

Create the title and description for a PR from either a specific branch or last current branch to a specific branch or develop branch (unless in develop then main).
This is meant to help document changes throughout the version control process and track changes easily.

## Format

TITLE:
{generated title}

---

BODY:
{generated body}

## Title

1 sentence description of the PR. Should be a short summary with few specifics.

## Body

Defines the work included in the PR for the reviewer to know what is expected before reading code changes.
This should be in markdown format, that means proper header structure, proper list, horizontal lines as needed, etc.

### Include

- List of changes made. This means to review commits and commit descriptions then summarize the changes in a list for easy readability
- List any Db migrations including the change made by the migration and why
- Test plan or parameters for verifying changes made both work and are not breaking to other parts of the code
    - These should be in task list format
- Any additional information relevant to the PR
    - This may include reasons why some changes were made or choices were made
- Include a footer with author credit when commits include AI Agent code so users know some code was created with AI

### Exclude

- Any information easily accessible in the PR itself
    - such as an inclusive list of files changed, this is information included in the PR page
- deep technical details of the PR, that is for the reviewer to see in the review process

## Notes

PR can be split into sections such as client changes and server changes but never deeper splits than that.
PR body must never exceed 100 lines the point is to be a summarizing description for documentation purposes.

## Example

Below is a sample of what an output should look similar to.

```
TITLE: UI overhaul — accordion layout, gated assessments, new content types, and settings modals

---

BODY:

# Summary

This PR consolidates several iterative UI and feature improvements built on top of the existing course/lesson structure. The changes touch navigation, content types, and settings management across the client, with supporting server/DB changes.

## Client Changes

- Unit Accordion: Replaced the flat unit list on CourseDetailPage with a single-open expandable accordion; lessons lazy-load and cache on first expand with three-state completion icons (not started / attempted /passed) - Lesson Card Grid: Swapped the vertical lesson list in the accordion for a responsive card grid (1–3 cols) with status icons and clamped descriptions
- Settings Modals: Replaced inline edit/delete buttons with gear icon modals — CourseSettingsModal (course info + unit management) and LessonSettingsModal (title, description, order, delete); unit management later extracted to a dedica`ted UnitSettingsModal - Removed UnitDetailPage: Consolidated lesson settings into the LessonDetailPage header and moved the unit test into the accordion item; fixed breadcrumb to display course name correctly
- Student Notes Panel: Slide-out panel on lesson pages for per-user notes with auto-save; button relocated from floating bottom-right to the lesson title bar with active-state highlight
- Vocabulary Tab: New Vocabulary tab on LessonDetailPage alongside renamed "Lecture Notes" tab
- Multiple-Choice Practice Problems: Converted practice problems from free-text to multiple-choice format (options + correctIndex) matching quiz/test structure
- Gated Final Exam: Final exam integrated into CourseProgressCard; disabled until all units are mastered, with tooltip; progress recalculated so lessons scale to 90% and passing the exam brings it to 100%
- Gated Unit Test: Unit test moved to a sidebar panel in the accordion, gated behind all lessons complete
- Hero Section Cleanup: Removed redundant CTA buttons that duplicated visible course list functionality

## Server / Database Changes

- Migration add_student_notes_vocab_update_practice: Adds StudentNote model (one per user per lesson, upsert), Vocab model (term + definition per lesson), and converts PracticeProblem to multiple-choice; seeded with sample data - Lesson model: Added optional description field; Zod validator updated accordingly
- Progress API: Added hasQuiz, attempted per lesson in unit progress response; added examScore to course progress response
- Unit test API (findByUnit): Now includes the latest TestAttempt for last-attempt display
- Seed fix: Corrected attempt scores stored as 100 (percentage) instead of 1.0 (fraction)

## Test Plan

- [x] Expand/collapse unit accordion; verify lazy load and single-open behavior
- [x] Confirm lesson cards show correct status icons based on quiz attempt state
- [x] Open course and lesson gear icons; edit, delete, and reorder content
- [x] Create, auto-save, and reload student notes on a lesson page
- [x] Add and view vocabulary terms on the Vocabulary tab
- [x] Complete a multiple-choice practice problem and verify correct/incorrect feedback
- [x] Verify unit test is locked until all lessons pass, then unlocked
- [x] Verify final exam is locked until all units pass; confirm score reflects on the progress card
- [x] Check that percentComplete reaches 100% only after passing the final exam
- [x] Confirm hero section no longer shows duplicate CTA buttons

---

> Author: All code and design decisions in this PR were written by Claude Sonnet 4.6 (claude-sonnet-4-6), Anthropic's AI coding assistant, via Claude Code.
```
