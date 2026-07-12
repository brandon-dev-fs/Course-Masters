---
id: cm-0005
title: Refactor Backend Service Layer for Clean Separation and Centralized Error Handling
stage: review
status: approved
approver: agent
---

# Code Review: Refactor Backend Service Layer for Clean Separation and Centralized Error Handling

## Summary

Re-review after the previous rejection for `CourseProgressData`/`UnitProgressData` GetPayload types omitting `where` filters. That fix has been correctly applied. Reviewed 14 changed files, all backend (`server/src/`). The diff covers:

- Two new files: `server/src/errors/ConflictError.ts`, `server/src/utils/assertExists.ts`
- One modified infrastructure file: `server/src/middleware/errorHandler.ts`
- One structurally refactored service: `server/src/services/progress.service.ts`
- Ten service files migrated to `assertExists`: `assessment`, `assignment`, `completion`, `course`, `lesson`, `lesson-resource`, `lesson-tool`, `student-note`, `unit`
- One barrel update: `server/src/errors/index.ts`

The spec is `status: approved`. Four commits are present ahead of `develop`, all correctly prefixed `cm-0005:`.

---

## Scope Coverage

- **Backend files reviewed**: `server/src/errors/ConflictError.ts`, `server/src/errors/index.ts`, `server/src/middleware/errorHandler.ts`, `server/src/utils/assertExists.ts`, `server/src/services/progress.service.ts`, `server/src/services/assessment.service.ts`, `server/src/services/assignment.service.ts`, `server/src/services/completion.service.ts`, `server/src/services/course.service.ts`, `server/src/services/lesson.service.ts`, `server/src/services/lesson-resource.service.ts`, `server/src/services/lesson-tool.service.ts`, `server/src/services/student-note.service.ts`, `server/src/services/unit.service.ts`
- **Frontend files reviewed**: none
- **Config/other files reviewed**: none
- **Rules loaded**: `.claude/rules/rules.md`, `.claude/rules/backend.md`, `.claude/rules/api.md`, `.claude/rules/data.md`, `.claude/rules/review.md`

---

## Issues

### [LOW] Misleading inline comment in `lesson.service.ts` `findById`

- **Location**: `server/src/services/lesson.service.ts:14-15` (prior revision; now removed in this diff)
- **Description**: The previous revision contained a comment on `findById` claiming the inline check was retained because `findUnique with include cannot be expressed through the assertExists delegate`. That justification did not apply since `lessonService.findById` has no `include` clause. In the current diff, `findById` has been correctly collapsed to `return assertExists(prisma.lesson, id, 'Lesson')` with no comment — the misleading comment is gone and the migration is complete. No action needed; recorded for history.
- **Suggested Fix**: No action required. The issue from the prior review is resolved.

### [INFO] No unit tests added for new pure functions

- **Location**: `server/src/utils/assertExists.ts`, `server/src/services/progress.service.ts`, `server/src/middleware/errorHandler.ts`
- **Description**: The backend plan explicitly calls out unit tests for `assertExists` (mock delegate returning null → `NotFoundError`; mock delegate returning a record → typed return), pure computation function tests for `computeCourseProgress`/`computeUnitProgress` (zero lessons, partial, all passed, exam passed scenarios), and integration tests for the new Prisma error mappings. No test files appear in this diff.
- **Suggested Fix**: Add tests per the plan's test considerations section before the next release. The pure computation functions are particularly well-suited for fast unit tests with mock data and carry the highest value.

---

## Verdict

**Status**: APPROVED

Zero issues at medium or above. Approved by agent.

The previous rejection point — `CourseProgressData` and `UnitProgressData` GetPayload types missing `where` filters — is correctly resolved. Both types now include `where: { type: '...' }` clauses in all `assessment` include shapes, matching the runtime query filters and the approved plan specification. All other implementation details are sound: `assertExists` is fully typed with no `any` escapes, the delegate structural type correctly infers the concrete Prisma model type, all inline-vs-assertExists decisions are justified and commented, no Prisma internals are exposed in client error responses, all four new Prisma error mappings match the plan's mapping table exactly, and the `console.error` on the fallthrough path in `errorHandler.ts` is pre-existing on `develop` and not introduced by this diff.

## Next Steps

Next: `/test cm-0005`

Override: `/approve .claude/reviews/cm-0005/code-review.md` or edit frontmatter to `status: rejected`
