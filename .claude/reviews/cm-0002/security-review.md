---
id: cm-0002
title: Redesign Lesson Detail Page Layout
stage: review
status: approved
approver: agent
approved_at: 2026-04-27T00:00:00Z
---

# Security Review — cm-0002: Redesign Lesson Detail Page Layout (Pass 3)

**Diff base:** `develop..HEAD`

---

## Summary

No new security issues introduced by the UI fixes in this pass. The pre-existing completion fabrication risk (MEDIUM, pass 1) and resource ID exposure (LOW, pass 1) are unchanged and out of scope for this pass. The quiz guard correctly sources required IDs from the DB rather than user input, so fabricated completions for non-required IDs do not unlock the quiz.

---

## Issues

None new in this pass.

---

## Approved Sections

- **Quiz guard** — `allRequiredIds` sourced from DB by `lessonId`; not user-controlled. A completion for a foreign `resourceId` lands in `completedIds` but will not appear in `allRequiredIds`, so the guard holds. ✓
- **`getByLesson` enrichment** — Returns resource IDs the authenticated user already has access to as lesson content. No sensitive data exposure beyond prior pass. ✓
- **UI-only changes** (`AssignmentStepper`, `AssignmentSection`, `StudentToolsBar`, `LessonDetailPage`) — No server contact beyond existing endpoints; no new attack surface. ✓
- **`lessonId!` guard removed** — `if (!lessonId || !item.id) return;` replaces non-null assertion; no functional security impact but reduces undefined-behavior risk. ✓
- **No new dependencies, secrets, or logging changes.** ✓
