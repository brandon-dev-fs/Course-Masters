---
id: cm-0018
title: Add Soft Delete to Core Models
stage: review
status: approved
approver: agent
---

# Code Review: Add Soft Delete to Core Models

## Summary

Reviewed 12 changed files across the backend scope only (no frontend files modified). The implementation adds `deletedAt DateTime?` to five Prisma models, a non-destructive migration with partial indexes, a cascade soft-delete utility, a new user service/controller/route for `DELETE /api/users/:userId`, and `deletedAt: null` filters across all affected read paths. Two commits were reviewed: `cm-0018: add soft delete to core models` and `cm-0018: integrate backend`. The implementation is structurally sound and closely follows the approved backend plan and API contract.

## Scope Coverage

- **Backend files reviewed**: `server/prisma/schema.prisma`, `server/prisma/migrations/20260513000000_soft_delete/migration.sql`, `server/src/utils/softDelete.ts`, `server/src/services/user.service.ts`, `server/src/services/course.service.ts`, `server/src/services/unit.service.ts`, `server/src/services/lesson.service.ts`, `server/src/services/assessment.service.ts`, `server/src/services/progress.service.ts`, `server/src/controllers/user.controller.ts`, `server/src/routes/user.routes.ts`, `server/src/routes/index.ts`
- **Frontend files reviewed**: None (backend-only change)
- **Config/other files reviewed**: None
- **Rules loaded**: `.claude/rules/rules.md`, `.claude/rules/backend.md`, `.claude/rules/api.md`, `.claude/rules/data.md`

## Issues

### [LOW] Inconsistent `deletedAt` timestamps across cascade levels in user soft-delete

- **Location**: `server/src/utils/softDelete.ts:157-176` (`softDeleteUser`), and `softDeleteCourse` at `:24`
- **Description**: `softDeleteUser` calls `softDeleteCourse` inside a `for` loop. Each call to `softDeleteCourse` creates its own `const now = new Date()` on entry, independently of the `now` created in `softDeleteUser`. In a busy transaction, all timestamps will differ by at most a few milliseconds, but the user row's `deletedAt` and each cascaded course's `deletedAt` are not guaranteed to be identical. For audit purposes — the primary motivation for soft delete per the spec — having all cascade records share one consistent timestamp would be more accurate.
- **Suggested Fix**: Pass `now` as a parameter to all cascade functions, or compute it once at the top of the `prisma.$transaction` call and thread it through. Example: change signatures to `softDeleteCourse(tx, courseId, now: Date)` and `softDeleteUser(tx, userId, now: Date)`, with the caller supplying `const now = new Date()` before the transaction body.

---

### [LOW] `assessmentService.findByParent` adds an extra round-trip for every GET assessment request

- **Location**: `server/src/services/assessment.service.ts:33-55`
- **Description**: The original `findByParent` queried the assessment directly and returned `null` when absent — one DB call. The new implementation prepends an `assertParentExists` call (a `findFirst` on the parent table), adding a second DB round-trip to every `GET /api/lessons/:lessonId/assessment`, `GET /api/units/:unitId/assessment`, and `GET /api/courses/:courseId/assessment` request. The behavioral change is correct per the API contract (404 for soft-deleted parents), but the additional query is an avoidable overhead for the common case where the parent is not soft-deleted.
- **Suggested Fix**: Combine the parent existence check with the assessment query using a nested `where` filter. For example, for `lesson_quiz`, use `prisma.assessment.findFirst({ where: { lessonId: parentId, deletedAt: null, lesson: { deletedAt: null } } })`. If the result is `null`, determine whether to throw 404 (parent doesn't exist or is soft-deleted) or return `null` (assessment doesn't exist) by doing a parent check only on the null path. This eliminates the extra round-trip in the hot path while preserving correct 404 behavior.

---

### [INFO] No unit tests for new code

- **Location**: `server/src/utils/softDelete.ts`, `server/src/services/user.service.ts`, `server/src/controllers/user.controller.ts`
- **Description**: The cascade utility and user service are new code paths with non-trivial logic (transaction atomicity, cascade ordering, partial-batch guard with `if (unitIds.length > 0)`). No test files were added in this diff. The project's `min_coverage` is 70%.
- **Suggested Fix**: Add unit tests covering: (1) `softDeleteCourse` — verifies assessments, lessons, units, and the course itself are soft-deleted in the correct order; (2) `softDeleteUser` — verifies all user courses cascade; (3) `userService.remove` — 404 on missing or already-soft-deleted user; (4) skipped branches when `unitIds` or `lessonIds` are empty.

---

### [INFO] `softDeleteUser` computes `now` but it is only used for the final user `update`

- **Location**: `server/src/utils/softDelete.ts:160`
- **Description**: `const now = new Date()` is declared at the top of `softDeleteUser` but the cascade calls to `softDeleteCourse` create their own `now` internally. The `now` variable in `softDeleteUser` is only used for `tx.user.update`. This is a minor readability concern — a future reader may expect `now` to be threaded through the cascade. There is no functional bug.
- **Suggested Fix**: Address by implementing the fix suggested for the LOW timestamp-consistency issue above, which threads a single `now` through all functions. If that fix is deferred, add a brief comment: `// now is used only for the user row; each softDeleteCourse call creates its own timestamp.`

## Verdict

**Status**: APPROVED

Zero issues at medium or above. Approved by agent.

The implementation correctly applies `deletedAt: null` filters across all read, update, and delete paths for all five affected models. The migration is non-destructive with appropriate partial indexes. The cascade utility is well-structured with batched `updateMany` calls and correct transaction wrapping. The new `DELETE /api/users/:userId` route is admin-gated and inherits the global `authenticate()` middleware from `routes/index.ts`. The API contract is fully implemented.

## Next Steps

Next: `/test cm-0018`

Override: `/approve .claude/reviews/cm-0018/code-review.md` or edit frontmatter to `status: rejected`
