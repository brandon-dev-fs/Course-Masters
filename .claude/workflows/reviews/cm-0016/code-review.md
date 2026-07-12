---
id: cm-0016
title: Code Review — Database Schema Data Integrity Fixes
stage: review
status: approved
approver: agent
---

# Code Review: Database Schema Data Integrity Fixes

## Summary

Second review pass of 7 changed files on branch `refactor/code_cleanup` against `develop`. All changes are backend/server scope. This pass confirms the two blocking issues from pass 1 are correctly resolved, re-examines all four LOW issues from pass 1, and sweeps the full diff fresh for any issues not previously caught.

The implementation correctly:
- Splits the polymorphic `LessonResourceCompletion` into two typed FK-backed tables (`LessonResourceCompletion` and `LessonToolCompletion`)
- Drops `PracticeQuestionType` and migrates `PracticeProblemQuestion.type` to `QuestionType`
- Applies the assessment CHECK constraint and assignment trigger via individually-executed `$executeRawUnsafe` calls
- Seeds `LessonToolCompletion` records for all tools in the three demo lessons
- Rewrites the resource-completion service, schema, controller, and assessment service to use the split-table model
- Matches the approved API contract exactly on both endpoints

All commit messages follow the required `cm-0016: <imperative summary>` format (4 commits).

## Scope Coverage

- **Backend files reviewed**:
  - `server/prisma/schema.prisma`
  - `server/prisma/seed.ts`
  - `server/prisma/raw/cm-0016-constraints.sql`
  - `server/src/services/resource-completion.service.ts`
  - `server/src/services/assessment.service.ts`
  - `server/src/controllers/resource-completion.controller.ts`
  - `server/src/schemas/resource-completion.schema.ts`
- **Frontend files reviewed**: none
- **Config/other files reviewed**: none
- **Rules loaded**: `rules.md`, `backend.md`, `api.md`, `data.md`

---

## Pass 1 Blocking Issues — Resolution Confirmed

### [HIGH — RESOLVED] Multi-statement SQL passed to `$executeRawUnsafe`

The fix correctly splits the six SQL statements into six separate `$executeRawUnsafe` calls in `seed.ts`. Each statement is individually executed: the pre-constraint DELETE, DROP CONSTRAINT, ADD CONSTRAINT, CREATE OR REPLACE FUNCTION (plpgsql body with internal semicolons), DROP TRIGGER, and CREATE CONSTRAINT TRIGGER. The comment at the top of the block explicitly documents why statements are split ("Prisma 6 does not support multi-statement strings in `$executeRawUnsafe`"). The canonical reference copy in `cm-0016-constraints.sql` has been updated with a matching note directing manual psql users to the single-file version.

### [MEDIUM — RESOLVED] Missing `LessonToolCompletion` seed records

All three seeded lessons now have `LessonToolCompletion` records. The fix converts each `lessonTool.createMany` call to `createManyAndReturn` and uses the returned IDs to build the completion inserts. Lesson 1 covers flashcards, vocab, and practice tools. Lessons 2 and 3 cover flashcards and vocab (those lessons have no practice tools defined in the seed data, which is correct). The seed comment correctly explains the intent.

---

## Pass 1 Low Issues — Resolution Status

### [LOW — RESOLVED] Controller re-casts `req.body` after Zod validation

The controller now imports `ToggleCompletionInput` from the schema file and uses `req.body as ToggleCompletionInput`, tying the cast to the schema's inferred type rather than a duplicated inline literal. This matches the suggested fix from pass 1.

### [LOW — RESOLVED] `toggle()` silently no-ops for invalid `type` value

The service now includes an exhaustive `else` branch that throws `new ValidationError('type must be resource or tool')`. `ValidationError` takes `(message, details?)` — the single-string call matches the constructor correctly. This aligns with the approved backend plan's specified behavior.

---

## Issues

No issues found.

All schema changes match the approved backend plan and API contract. The service response shape (`{ completions, requiredItems }`) with `type`/`targetId`/`completedAt` on completions and `type`/`targetId`/`isRequired`/`completed` on required items matches the contract exactly. The Zod schema (`type: z.enum(['resource', 'tool']), targetId: z.string().uuid()`) matches the contract. The assessment service correctly queries both completion tables via relation filters (`resource: { lessonId }`, `tool: { lessonId }`), building a merged `completedIds` Set. The `PracticeQuestionType` enum is fully removed from the schema; no stale references remain in `server/src/` (the only match in `swagger.ts` is a structural reference, not to the removed enum). All FK cascade deletes are schema-configured on both new completion models. Both new models carry correct `@@unique`, `@@index`, and `@@map` directives per plan.

The INFO advisory from pass 1 (DELETE in seed running on every seed) remains present by design. It is harmless in the established execution order (constraints applied after all assessment rows are seeded) and the code comment acknowledges idempotency intent.

---

## Verdict

**Status**: APPROVED

Zero issues at medium or above. Approved by agent.

## Next Steps

Next: `/test cm-0016`

Override: `/approve .claude/reviews/cm-0016/code-review.md` or edit frontmatter to `status: rejected`
