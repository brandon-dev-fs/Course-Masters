---
id: cm-0003
title: Assignment Layer — Modal Wizard Redesign
stage: design
status: approved
approver: human
approved_at: 2026-05-04T00:00:00Z
---

# Wireframe — AssignmentFormModal Wizard Redesign

## Problem

The current two-step modal places all fields on one screen in Step 2 (type picker → single long form). For `vocab` and `practice_problem` types this causes excessive vertical scroll as item lists grow alongside title/objective fields.

## Revised Step Model

Three steps for all types. Each step has exactly one job:

```
Step 1 — pick       Type picker grid (create flow only; edit skips to Step 2)
Step 2 — meta       Title + Objective + type-specific config (compact, no lists)
Step 3 — items      Bulk item entry (vocab terms or practice questions)
                    Only rendered for vocab and practice_problem.
                    For note / video / reading: Step 2 → Save directly.
```

### Per-type step sequence

| Type             | Step 1   | Step 2                                     | Step 3               |
|------------------|----------|--------------------------------------------|----------------------|
| note             | pick     | meta: Title + Objective + rich-text body   | —  (Save on Step 2)  |
| video            | pick     | meta: Title + Objective + URL + Disp.Title | —  (Save on Step 2)  |
| reading          | pick     | meta: Title + Objective + URL + desc + min | —  (Save on Step 2)  |
| vocab            | pick     | meta: Title + Objective                    | items: vocab terms   |
| practice_problem | pick     | meta: Title + Objective + Passing %        | items: questions     |

> Rationale: `note`, `video`, `reading` have no unbounded list — fitting comfortably on one screen after the type is chosen. `vocab` and `practice_problem` move their N-item lists to a dedicated step.

---

## Modal Layout (per step)

### Step 1 — Type picker (unchanged)

```
┌──────────────────────────────────────────────────┐
│  Add Assignment                               [X] │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────┐  ┌──────────┐                      │
│  │  📄 Note │  │ 🎬 Video │                      │
│  └──────────┘  └──────────┘                      │
│  ┌──────────┐  ┌──────────┐                      │
│  │ 🔗 Reading│ │ 📖 Vocab │                      │
│  └──────────┘  └──────────┘                      │
│  ┌──────────────────────────┐                    │
│  │ 🧠 Practice Problem      │                    │
│  └──────────────────────────┘                    │
│                                                  │
├──────────────────────────────────────────────────┤
│                               [Cancel]           │
└──────────────────────────────────────────────────┘
```

---

### Step 2 — Meta (note / video / reading — final step)

```
┌──────────────────────────────────────────────────┐
│  Add Video                                    [X] │
├──────────────────────────────────────────────────┤
│  ‹ Back                                          │
│                                                  │
│  Title *                                         │
│  ┌────────────────────────────────────────┐      │
│  │ e.g. Watch: HTML Basics               │      │
│  └────────────────────────────────────────┘      │
│                                                  │
│  Objective (optional)                            │
│  ┌────────────────────────────────────────┐      │
│  │ What should students be able to do...  │      │
│  └────────────────────────────────────────┘      │
│                                                  │
│  ── type-specific fields ──────────────────────  │
│  YouTube URL *                                   │
│  ┌────────────────────────────────────────┐      │
│  └────────────────────────────────────────┘      │
│  Display Title (optional, auto-filled)           │
│  ┌────────────────────────────────────────┐      │
│  └────────────────────────────────────────┘      │
│                                                  │
├──────────────────────────────────────────────────┤
│  [Cancel]                    [Save assignment →] │
└──────────────────────────────────────────────────┘
```

---

### Step 2 — Meta (vocab — continues to Step 3)

```
┌──────────────────────────────────────────────────┐
│  Add Vocab                                    [X] │
├──────────────────────────────────────────────────┤
│  ‹ Back                                  1 of 2  │
│                                                  │
│  Title *                                         │
│  ┌────────────────────────────────────────┐      │
│  └────────────────────────────────────────┘      │
│                                                  │
│  Objective (optional)                            │
│  ┌────────────────────────────────────────┐      │
│  └────────────────────────────────────────┘      │
│                                                  │
├──────────────────────────────────────────────────┤
│  [Cancel]                        [Next: Terms →] │
└──────────────────────────────────────────────────┘
```

---

### Step 3 — Items (vocab terms)

```
┌──────────────────────────────────────────────────┐
│  Add Vocab                                    [X] │
├──────────────────────────────────────────────────┤
│  ‹ Back                                  2 of 2  │
│                                                  │
│  Vocabulary Terms (optional)                     │
│  ┌──────────────────┐  ┌──────────────────┐ ↑↓🗑 │
│  │ Term             │  │ Definition       │      │
│  └──────────────────┘  └──────────────────┘      │
│  + Add term                                      │
│                                                  │
├──────────────────────────────────────────────────┤
│  [Cancel]                    [Save assignment →] │
└──────────────────────────────────────────────────┘
```

> Note: Saving with no terms creates an empty vocab assignment. Terms can be added later via Edit.

---

### Step 2 — Meta (practice_problem — continues to Step 3)

```
┌──────────────────────────────────────────────────┐
│  Add Practice Problem                         [X] │
├──────────────────────────────────────────────────┤
│  ‹ Back                                  1 of 2  │
│                                                  │
│  Title *                                         │
│  ┌────────────────────────────────────────┐      │
│  └────────────────────────────────────────┘      │
│                                                  │
│  Objective (optional)                            │
│  ┌────────────────────────────────────────┐      │
│  └────────────────────────────────────────┘      │
│                                                  │
│  Passing percentage (optional)                   │
│  ┌──────────┐                                    │
│  │          │  % — leave empty for manual        │
│  └──────────┘        completion                  │
│                                                  │
├──────────────────────────────────────────────────┤
│  [Cancel]                   [Next: Questions →]  │
└──────────────────────────────────────────────────┘
```

---

### Step 3 — Items (practice questions)

```
┌──────────────────────────────────────────────────┐
│  Add Practice Problem                         [X] │
├──────────────────────────────────────────────────┤
│  ‹ Back                                  2 of 2  │
│                                                  │
│  Questions (optional)                            │
│  ┌──────────────────────────────────────────┐    │
│  │ Q1  [Type ▼]                         ↑↓🗑 │    │
│  │ Question text...                          │    │
│  │ ○ Option A   ○ Option B                   │    │
│  └──────────────────────────────────────────┘    │
│  + Add question                                  │
│                                                  │
├──────────────────────────────────────────────────┤
│  [Cancel]                    [Save assignment →] │
└──────────────────────────────────────────────────┘
```

---

## Step Indicator

A small `"1 of 2"` text label in the top-right of the modal body (below the header) shown only for types that have two meta+items steps (vocab, practice_problem). Single-step types (note, video, reading) show no indicator.

## Navigation rules

| Current step | Back goes to      | Next/Save                                       |
|---|---|---|
| pick         | —                 | → meta (immediately on type card click)         |
| meta (1-step)| → pick (create) / close (edit) | Save assignment                    |
| meta (2-step)| → pick (create) / close (edit) | → items                            |
| items        | → meta            | Save assignment                                 |

- **X button / Cancel**: dismiss entire modal immediately at any step — no confirmation
- **Escape key**: handled by `Modal` wrapper — same as X
- **Back on meta in edit mode**: not shown (no type picker step in edit mode)

## Edit mode

Edit mode opens directly at `meta` step (same as current). For `vocab` and `practice_problem`, "Next →" advances to the items step. Behavior is identical to create mode from Step 2 onward.
