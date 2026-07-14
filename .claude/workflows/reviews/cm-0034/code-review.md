---
id: cm-0034
title: Practice Problem Form UX Overhaul — Code Review
stage: review
status: approved
---

## Summary

Incremental code review for cm-0034 frontend implementation tasks.

## Files Reviewed

<!-- Updated mechanically after each task -->

## Findings

<!-- Appended mechanically after each task review -->

---

### Task 1: Accordion Question List

**Commit:** cm-0034: accordion question list — single expand, auto-open on add/delete
**Files reviewed:** `client/src/features/assignments/PracticeProblemAssignmentForm.tsx`
**Result:** APPROVED (after 1 revision)

**Issues found:**
- [MEDIUM → FIXED] Array-index key on reorderable list — replaced with `crypto.randomUUID()` in `addQuestion` + `key={q.id ?? String(idx)}`
- [LOW → FIXED] Inline style for ChevronDown rotation — replaced with `rotate-180` Tailwind class
- [LOW → FIXED] Missing aria-label on accordion trigger — added dynamic expand/collapse label
- [INFO → FIXED] `fill_in_blank` label accidentally shortened — restored to "Fill in the Blank"

---

### Task 2: Multiple Choice — 4 Defaults + Duplicate Validation

**Commit:** cm-0034: multiple choice — 4 default options + duplicate validation
**Files reviewed:** `PracticeProblemAssignmentForm.tsx`, `MultipleChoiceEditor.tsx`, `AssignmentFormModal.tsx`
**Result:** APPROVED (first pass)

**Issues found:**
- [LOW] Colliding error id when index=0 for multiple simultaneous editors — pre-existing, not introduced by this diff
- [INFO] getDuplicateIndices mutates seen Map value in-place — no bug, advisory style only

---

### Task 3: Fill-in-Blank Token Input

**Commit:** cm-0034: fill-in-blank — token insertion with cursor support, derived blank rows
**Files reviewed:** `FillInBlankEditor.tsx`, `PracticeProblemAssignmentForm.tsx`, `AssignmentFormModal.tsx`
**Result:** APPROVED (after 1 revision)

**Issues found:**
- [MEDIUM → FIXED] Missing htmlFor/id on Question label+textarea — added questionId using index prop
- [LOW → FIXED] id="fib-hint" collision for multiple simultaneous editors — namespaced with index
- [LOW → FIXED] Duplicate token numbers silently merge blank data — added hasDuplicateTokens guard with role="alert" warning
- [INFO → FIXED] Trailing space double-space in fallback insertBlank — trimEnd() applied

---

### Task 4: Matching Redesign + Data Migration

**Commit:** cm-0034: matching — two-column pair table, backward-compat data migration
**Files reviewed:** `MatchingEditor.tsx`, `PracticeProblemAssignmentForm.tsx`, `AssignmentFormModal.tsx`
**Result:** APPROVED (after 1 revision)

**Issues found:**
- [HIGH → FIXED] Unassociated mobile <label> elements — replaced with <span aria-hidden="true">; inputs retain aria-label
- [MEDIUM → FIXED] Array-index key on reorderable list — added id: string to MatchingPair, crypto.randomUUID() in all creation paths, key={pair.id}
- [LOW] idx variable assigned but unused — pre-existing dead code, not introduced by this diff
- [LOW] Delete button touch target ~32px (WCAG requires 44px) — pre-existing from design, not introduced by this diff
