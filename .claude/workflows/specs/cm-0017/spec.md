---
id: cm-0017
title: Missing database indexes and audit timestamps
stage: spec
status: approved
approver: human
approved_at: 2026-05-13T00:00:00Z
---

## Problem Statement

Several tables in the schema are missing indexes on their foreign key columns, creating full-table scans for common lookup patterns. Separately, five core content entities — `Unit`, `Lesson`, `LessonResource`, `LessonTool`, and `AssessmentQuestion` — have no `createdAt`/`updatedAt` fields, making it impossible to audit when content was created or last modified.

### Missing indexes

The following FK columns have no index (composite unique constraints on `(userId, xId)` exist on each, but only index userId first — lessonId/unitId/assignmentId lookups are not covered):

| Table | Missing index column |
|---|---|
| `lesson_completion` | `lessonId` |
| `unit_completion` | `unitId` |
| `StudentNote` | `lessonId` |
| `assignment_completion` | `assignmentId` |

### Missing audit timestamps

The following content models have no timestamp fields:

| Model | Impact |
|---|---|
| `Unit` | Cannot track when units were created or last edited |
| `Lesson` | Cannot track when lessons were created or last edited |
| `lesson_resource` | Cannot track when resources were added or changed |
| `lesson_tool` | Cannot track when tools were added or changed |
| `assessment_question` | Cannot track when questions were created or modified |

## Goals

1. Add standalone `@@index` declarations for the four missing FK columns.
2. Add `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt` to the five content models.
3. Produce and apply a Prisma migration that is safe for a database that already has rows.

## Non-Goals

- No changes to the five assignment sub-tables (`NoteAssignment`, `VideoAssignment`, `ReadingAssignment`, `VocabAssignment`, `PracticeProblemAssignment`) — their `assignmentId @unique` fields already create an index.
- No changes to `PracticeProblemQuestion` — `practiceProblemAssignmentId` already has `@@index`.
- No API or client changes — this is a schema-only change. Existing API responses do not need to expose the new timestamp fields unless a future spec addresses that.
- No backfilling historical timestamps — existing rows will receive the migration execution time as their `createdAt` value, which is acceptable.

## Requirements

### Functional

- `F-1` — `lesson_completion` gains `@@index([lessonId])`.
- `F-2` — `unit_completion` gains `@@index([unitId])`.
- `F-3` — `StudentNote` gains `@@index([lessonId])`.
- `F-4` — `assignment_completion` gains `@@index([assignmentId])`.
- `F-5` — `Unit` gains `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`.
- `F-6` — `Lesson` gains `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`.
- `F-7` — `lesson_resource` gains `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`.
- `F-8` — `lesson_tool` gains `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`.
- `F-9` — `assessment_question` gains `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`.

### Migration

- `M-1` — A single Prisma migration is generated and applied covering all schema changes in this spec.
- `M-2` — The migration must be safe for tables with existing rows. `createdAt` uses `DEFAULT now()` so no existing row is left NULL.
- `M-3` — `updatedAt` is set to the migration execution time for existing rows (acceptable per clarification).

### Constraints

- `C-1` — No other models, routes, controllers, services, or client files are modified.
- `C-2` — The new indexes do not replace or remove existing indexes or unique constraints.

## Affected Files

- `server/prisma/schema.prisma` — schema changes
- `server/prisma/migrations/` — generated migration file

## Required Design Artifacts

- [ ] ui-design
- [ ] frontend-plan
- [x] backend-plan
- [ ] api-contract
