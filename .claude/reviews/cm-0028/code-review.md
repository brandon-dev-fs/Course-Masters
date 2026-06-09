---
id: cm-0028
title: Lesson Activities — Backend Code Review
stage: review
status: approved
approver: agent
---

# Code Review: Lesson Activities — Backend (Pass 5)

## Summary

Pass 5 backend-only review. Scope is unchanged from pass 4: 22 source files changed in `server/` (6 migrations, Prisma schema, 3 controllers, 3 services, 3 schemas, 3 route files, assignment service/schema/routes updates). This pass adds three new test files that were the sole blocking issue in pass 4:

- `server/src/__tests__/services/bookmark.service.test.ts` (new)
- `server/src/__tests__/services/checklist.service.test.ts` (new)
- `server/src/__tests__/services/assignment.service.test.ts` (extended with 3 new `describe` blocks)

All medium+ issues from passes 1–4 are confirmed resolved. Zero blocking issues remain.

---

## Scope Coverage

**Backend files reviewed**:
- `server/prisma/migrations/20260604000000_add_vocab_assignment_entry_table/migration.sql`
- `server/prisma/migrations/20260604000001_remove_student_vocab_flash_card/migration.sql`
- `server/prisma/migrations/20260604000002_add_activity_bookmark_and_lesson_checklist_item/migration.sql`
- `server/prisma/migrations/20260605000001_make_bookmark_note_nullable/migration.sql`
- `server/prisma/migrations/20260605000002_drop_vocab_assignment_entries_column/migration.sql`
- `server/prisma/migrations/20260606000001_make_bookmark_note_required/migration.sql`
- `server/prisma/schema.prisma`
- `server/src/__tests__/routes/routes.test.ts`
- `server/src/__tests__/services/assignment.service.test.ts`
- `server/src/__tests__/services/bookmark.service.test.ts` (new)
- `server/src/__tests__/services/checklist.service.test.ts` (new)
- `server/src/controllers/assignment.controller.ts`
- `server/src/controllers/bookmark.controller.ts`
- `server/src/controllers/checklist.controller.ts`
- `server/src/routes/assignment.routes.ts`
- `server/src/routes/bookmark.routes.ts`
- `server/src/routes/checklist.routes.ts`
- `server/src/routes/index.ts`
- `server/src/schemas/assignment.schema.ts`
- `server/src/schemas/bookmark.schema.ts`
- `server/src/schemas/checklist.schema.ts`
- `server/src/schemas/lesson-tool.schema.ts`
- `server/src/services/assignment.service.ts`
- `server/src/services/bookmark.service.ts`
- `server/src/services/checklist.service.ts`

**Frontend files reviewed**: none (backend-only pass)
**Config/other files reviewed**: none
**Rules loaded**: `rules.md`, `backend.md`, `api.md`, `data.md`

---

## Prior-Pass Fix Verification

All fixes from passes 1–4 are confirmed in the current source:

- `bookmarkService.getByAssignment` throws `NotFoundError` when no bookmark found (`bookmark.service.ts` line 20).
- `createBookmarkSchema` / `updateBookmarkSchema`: `note` is `z.string().min(1).max(500)` — required and bounded.
- `ActivityBookmark.note` is `VARCHAR(500) NOT NULL` in final migration and `schema.prisma`.
- `saveVocabEntryFlashCard` uses `select: { id: true, entryId: true, createdAt: true }` — no `userId` leakage.
- `vocabAssignmentEntry.update` where-clause includes `vocabAssignmentId` scoping.
- `getSavedVocabEntryFlashCards` begins with `prisma.lesson.findFirst({ where: { id: lessonId, deletedAt: null } })` and throws `NotFoundError` on null.
- All stale `note: string | null` annotations removed — `normalizeBookmark` and inline casts are correct.

---

## Pass 5 Test Coverage Verification

### bookmark.service.test.ts

All required scenarios present and correctly structured:

| Scenario | Coverage |
|---|---|
| `getByAssignment` — happy path (returns bookmark) | line 46 |
| `getByAssignment` — not found throws `NotFoundError` | line 60 |
| `create` — happy path (returns created bookmark) | line 79 |
| `create` — Prisma P2002 propagates without conversion | line 93 |
| `upsert` — updates existing bookmark | line 116 |
| `upsert` — creates new bookmark when none exists | line 131 |
| `remove` — deletes when bookmark exists | line 155 |
| `remove` — throws `NotFoundError` when not found | line 167 |

The P2002 test on `create` correctly verifies the service's intentional design: the unique-constraint error bubbles to `errorHandler` unchanged, which converts P2002 to a 409 response. The upsert tests verify both the `where` compound key and the `create`/`update` data shapes against the actual Prisma call. Fixtures use inline typed interfaces appropriate for the service's `BOOKMARK_SELECT` projection.

### checklist.service.test.ts

All required scenarios present and correctly structured:

| Scenario | Coverage |
|---|---|
| `findAllByLesson` — returns items ordered by `order asc` | line 66 |
| `findAllByLesson` — lesson not found throws `NotFoundError` | line 78 |
| `create` — creates with correct `order` and `checked: false` | line 100 |
| `create` — lesson not found throws `NotFoundError` | line 114 |
| `update` — updates item and returns result | line 132 |
| `update` — item not found throws `NotFoundError` | line 148 |
| `update` — wrong user throws `AppError FORBIDDEN` (403) | line 156 |
| `remove` — deletes when item belongs to user | line 173 |
| `remove` — item not found throws `NotFoundError` | line 186 |
| `remove` — wrong user throws `AppError FORBIDDEN` (403) | line 193 |
| `reorder` — updates order values correctly | line 220 |
| `reorder` — count mismatch throws `ValidationError` | line 241 |
| `reorder` — foreign item ID throws `ValidationError` | line 248 |
| `reorder` — lesson not found throws `NotFoundError` | line 257 |

The reorder test correctly mocks `prisma.$transaction` with the array-of-promises variant the service uses (`prisma.$transaction(itemIds.map(...))`), and verifies the resulting `update` calls carry sequential `order` values starting at 1.

### assignment.service.test.ts — new vocab flashcard blocks

All required scenarios present:

| Scenario | Coverage |
|---|---|
| `getSavedVocabEntryFlashCards` — lesson not found throws `NotFoundError` | line 454 |
| `getSavedVocabEntryFlashCards` — returns mapped entry objects | line 462 |
| `saveVocabEntryFlashCard` — entry not found throws `NotFoundError` | line 500 |
| `saveVocabEntryFlashCard` — creates record, returns only `id`/`entryId`/`createdAt` | line 508 |
| `removeVocabEntryFlashCard` — record not found throws `NotFoundError` | line 538 |
| `removeVocabEntryFlashCard` — deletes record using compound key | line 546 |

The `saveVocabEntryFlashCard` happy-path test explicitly asserts `result` does not have a `userId` property (line 523), verifying the security-sensitive select projection. The `removeVocabEntryFlashCard` test verifies the compound `userId_entryId` where-key is used for deletion.

---

## Issues

### [LOW] Unnecessary nullable/NOT NULL migration oscillation on `activity_bookmark.note`

- **Location**: `server/prisma/migrations/20260605000001_make_bookmark_note_nullable/migration.sql`, `server/prisma/migrations/20260606000001_make_bookmark_note_required/migration.sql`
- **Description**: The `activity_bookmark` table was created with `note VARCHAR(500) NOT NULL` in migration `20260604000002`. Migration `20260605000001` drops the NOT NULL constraint; migration `20260606000001` restores it. No data backfill or incremental deployment required the temporary nullable window — the table was created empty in the preceding migration. The result is three migrations expressing what one migration already established correctly. Any environment where only the first two migrations have applied will have a nullable `note` column until the third runs.
- **Suggested Fix**: No change required at this point since all three migrations are committed and the final state is correct. Document the reason for the oscillation in a code comment or PR description if it was intentional (e.g., a failed rollout or intermediate deploy). Going forward, avoid toggling nullability on a freshly-created table — use a single corrective migration instead.

---

### [INFO] `assertExists(prisma.lesson, …)` on a soft-deleted model — pre-existing, not introduced by this PR

- **Location**: `server/src/services/assignment.service.ts` lines 46, 102, 307
- **Description**: `assertExists` calls `findUnique({ where: { id } })` without `deletedAt: null`, so a soft-deleted `Lesson` passes the check and allows creating/listing assignments under it. Project rules state `assertExists` is only for non-soft-deleted models. These calls all predate this PR and none were added or modified by the current diff. The newly-added `getSavedVocabEntryFlashCards` method correctly uses `findFirst` with `deletedAt: null`, demonstrating the right pattern is known.
- **Suggested Fix**: Replace the three `assertExists(prisma.lesson, ...)` calls with explicit `findFirst({ where: { id: lessonId, deletedAt: null } })` guards, as done in `getSavedVocabEntryFlashCards` and `checklistService.assertLessonExists`. Recommended as a follow-up cleanup in a dedicated commit — not a blocker for this PR.

---

## Verdict

**Status**: APPROVED

Zero issues at medium or above. Approved by agent.

The three new test files added in pass 5 resolve the sole blocking issue from pass 4. All bookmark service methods, all checklist service methods (including FORBIDDEN and ownership-validation paths), and all three new vocab-flashcard methods on the assignment service now have direct unit test coverage with correctly typed fixtures and behaviorally meaningful assertions. All source-level conventions — asyncHandler wrapping, Zod validation, typed error classes, select scoping, `deletedAt: null` guards on soft-deleted models, and API contract compliance — remain in conformance with prior passes.

## Next Steps

Next: `/test cm-0028`

Override: `/approve .claude/reviews/cm-0028/code-review.md` or edit frontmatter to `status: rejected`
