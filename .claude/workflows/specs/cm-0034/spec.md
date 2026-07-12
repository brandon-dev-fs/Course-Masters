---
id: cm-0034
title: Practice Problem Form UX Overhaul
stage: spec
status: approved
---

## Problem Statement

The practice problem activity builder is difficult to use as question lists grow. Four specific friction points exist:

1. **No collapse** — all questions are always fully expanded, making long forms overwhelming and hard to navigate.
2. **Multiple choice defaults** — starts with only 2 options (users typically want 4) and allows duplicate option text, which creates invalid questions.
3. **Fill-in-blank is fragile** — users must manually type `___` in a plain text field to denote blanks. There is no enforced link between blank positions in the question text and the per-blank answer fields, making it easy to create mismatched questions.
4. **Matching is confusing** — the left-input → dropdown selector → right-input layout is non-intuitive; the dropdown that references items by index ("Right 1", "Right 2") is not readable at a glance.

## Goals

- Make the question list navigable via accordion collapse so teachers can focus on one question at a time.
- Set sensible multiple choice defaults and prevent invalid duplicate options.
- Tie fill-in-blank positions to answer slots via explicit in-text tokens rather than manual `___` characters.
- Redesign matching as a clear two-column pair table.

## Non-Goals

- True/False editor (already simple and uncontested).
- Any server-side or schema changes — all question content is freeform JSON, so no migrations or API changes are needed.
- Changing the passing percentage field behavior.
- Adding new question types.

## Requirements

### R1 — Accordion question list

- Each question in `PracticeProblemAssignmentForm` collapses to a single-line header showing: question number, type badge, and a truncated text preview of the question prompt (or "New question" if empty).
- Only one question is expanded at a time. Clicking an accordion header expands it and collapses any previously open question.
- When a new question is added, it auto-opens and all others collapse.
- When a question is deleted, if it was open, the question above it (or the first question if none above) opens.
- The move-up/down and delete controls remain visible in the collapsed header row so they don't require expanding.

### R2 — Multiple choice: 4 defaults + duplicate validation

- `defaultContent` for `multiple_choice` initializes with 4 blank options instead of 2: `{ question: '', options: ['', '', '', ''], correctIndex: 0 }`.
- Min options: 2 (existing enforcement retained).
- Max options: 6 (existing enforcement retained).
- Validation: if two or more non-empty options share the exact same text, display an inline error beneath the offending option(s): *"Options must be unique."* The form should prevent saving while duplicates exist (disable the outer save action or mark the question invalid).

### R3 — Fill-in-blank token input

**Question authoring:**
- Replace the plain textarea with a composite input:
  - A regular `<textarea>` for typing question text.
  - An "Insert blank" button that appends `{{blank_1}}`, `{{blank_2}}`, etc. at the end of the current text (or at cursor position if feasible with a plain textarea; appending to end is acceptable).
  - The textarea renders the raw text (with `{{blank_N}}` markers visible) — no rich-text rendering required in the editor.
- The blank counter increments sequentially based on how many `{{blank_N}}` tokens already exist in the text.
- Users can manually delete a `{{blank_N}}` token from the textarea text; the answers section re-derives from the remaining tokens.

**Answer section:**
- Derives the list of blank entries by scanning the current question text for `{{blank_N}}` tokens in order.
- Renders one answer row per token, labeled "Blank 1", "Blank 2", etc. (matching the screenshot mockup).
- Each row: correct answer input + optional comma-separated alternatives input.
- If the text contains no tokens, the answers section is hidden or shows an empty-state hint.

**Data shape (no backend change):**
- `content.question` remains a plain string, now expected to contain `{{blank_N}}` markers instead of `___`.
- `content.blanks` remains `Array<{ answer: string; alternatives: string[] }>` — index 0 corresponds to `{{blank_1}}`, index 1 to `{{blank_2}}`, etc.

**Migration of existing data:**
- Existing records that use `___` notation will display as-is in the textarea. Teachers will need to manually update old questions; no automated migration is required.

### R4 — Matching: two-column pair table

- Remove the current layout (left input → index-based dropdown → right input).
- Replace with a simple table where each row is one pair:
  - Left column: labeled "Term" — plain text input.
  - Right column: labeled "Definition" (or "Match") — plain text input.
  - Far-right column: trash/delete icon button (disabled when only 2 pairs remain).
- "+ Add pair" link at the bottom (existing behavior retained).
- Min 2 pairs, max 8 pairs (existing enforcement retained).
- The optional "Question (optional context)" textarea at the top is retained.

**Data shape (no backend change):**
- Simplify: store `content.pairs` as `Array<{ left: string; right: string }>` instead of the separate `leftItems`, `rightItems`, `correctPairs` arrays.
- When saving, the index position in the array defines the pair (pair[0].left matches pair[0].right).
- **Migration:** existing `MatchingEditor` data uses `leftItems`/`rightItems`/`correctPairs`. The editor must handle both shapes on read — if `content.pairs` exists use it; if `content.leftItems` exists, derive pairs from it (zip leftItems and rightItems using the correctPairs mapping). On any edit the data is re-saved in the new `pairs` shape.

## Affected Files

| File | Change |
|---|---|
| `client/src/features/assignments/PracticeProblemAssignmentForm.tsx` | Add accordion state; change add/delete behavior to manage open index |
| `client/src/features/assignments/question-editors/MultipleChoiceEditor.tsx` | Change default to 4 options; add duplicate validation |
| `client/src/features/assignments/question-editors/FillInBlankEditor.tsx` | Rewrite question input with token insertion; derive blank rows from tokens |
| `client/src/features/assignments/question-editors/MatchingEditor.tsx` | Rewrite as two-column pair table; normalize data shape |
| `client/src/api/types.ts` | No type changes required (content remains `Record<string, unknown>`) |

## Required Design Artifacts

- [x] ui-design
- [x] frontend-plan
- [ ] backend-plan
- [ ] api-contract

## Open Questions

_None — all requirements are fully specified above._
