---
id: cm-0019
title: Add @@map Directive to StudentNote Model
stage: review
status: approved
approver: agent
approved_at: 2026-05-14T00:00:00Z
---

# Code Review: Add @@map Directive to StudentNote Model

## Summary

Reviewed 3 changed files across 3 commits on branch `refactor/code_cleanup` relative to `develop`. All changes are confined to the Prisma schema and migration files — no application code, API routes, or frontend files were touched. The review confirms FR-04 compliance (every model has an explicit `@@map` directive), non-destructive rename semantics (NFR-01), and correct commit message formatting.

This is a re-review following the previous rejection (FR-04 not satisfied). The branch has since been updated with a second migration and schema edits that add `@@map` to `Course`, `Unit`, and `Lesson`.

## Scope Coverage

- **Backend files reviewed**: `server/prisma/schema.prisma`, `server/prisma/migrations/20260514000000_add_student_note_map/migration.sql`, `server/prisma/migrations/20260514000001_add_course_unit_lesson_map/migration.sql`
- **Frontend files reviewed**: none
- **Config/other files reviewed**: none
- **Rules loaded**: `.claude/rules/rules.md`, `.claude/rules/data.md`, `.claude/rules/backend.md`

## FR-04 Verification

Mechanical check: 25 `model` declarations, 25 `@@map` directives — every model maps to a snake_case table name. All four newly mapped models use correct snake_case values matching their model names: `Course` → `"course"`, `Unit` → `"unit"`, `Lesson` → `"lesson"`, `StudentNote` → `"student_note"`.

## Issues

### [INFO] Scope expansion beyond spec title
- **Location**: `server/prisma/schema.prisma` (lines 138, 157, 181)
- **Description**: The spec title and problem statement describe adding `@@map` only to `StudentNote`. The implementation correctly extended this to `Course`, `Unit`, and `Lesson` to satisfy FR-04 (all models must have explicit `@@map`). This is a beneficial scope expansion fully covered by FR-04, but the spec title and "Out of Scope" section ("Changes to any other models or their `@@map` directives") are technically contradicted. No blocking concern — FR-04 governs, and the implementation satisfies it.
- **Suggested Fix**: No code change needed. Consider updating the spec title to "Add missing @@map directives to core models" in a future documentation pass if desired.

### [INFO] Missing explanatory comments in second migration file
- **Location**: `server/prisma/migrations/20260514000001_add_course_unit_lesson_map/migration.sql`
- **Description**: The first migration (`20260514000000`) includes a SQL comment explaining the rename rationale. The second migration omits equivalent comments for the three renames it performs, making it slightly less self-documenting by comparison.
- **Suggested Fix**: Add comments above each `ALTER TABLE` statement, e.g. `-- Rename Course table to course to match @@map("course") in schema`.

## Verdict

**Status**: APPROVED

Zero issues at medium or above. Approved by agent.

The changes are minimal, correct, and safe. Both migrations use `ALTER TABLE ... RENAME TO`, which is non-destructive and preserves all existing data (NFR-01 satisfied). No application code changes are required because Prisma abstracts table names from the application layer. All 25 models in the schema now carry explicit `@@map` directives (FR-04 satisfied). Commit messages follow the `<id>: <imperative summary>` format.

## Next Steps

Next: `/test cm-0019`

Override: `/approve .claude/reviews/cm-0019/code-review.md` or edit frontmatter to `status: rejected`
