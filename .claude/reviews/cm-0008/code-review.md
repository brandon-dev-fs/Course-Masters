---
id: cm-0008
title: Add Query Parameter Validation for Resource and Tool List Endpoints
stage: review
status: approved
approver: agent
approved_at: 2026-05-07T00:00:00Z
---

# Code Review: Add Query Parameter Validation for Resource and Tool List Endpoints

## Summary

Reviewed 7 changed files, all backend scope (`server/src/`). The change adds `validateQuery` middleware to `validate.ts` and wires it into the GET routes for `GET /lessons/:lessonId/resources` and `GET /lessons/:lessonId/tools`, with matching Zod query schemas in the two schema files and inline comments in the two controllers. No schema/data changes, no new dependencies, no frontend changes. The implementation faithfully follows the approved `backend-plan.md` and satisfies all functional requirements in the spec.

## Scope Coverage

- **Backend files reviewed**: `server/src/middleware/validate.ts`, `server/src/routes/lesson-resource.routes.ts`, `server/src/routes/lesson-tool.routes.ts`, `server/src/schemas/lesson-resource.schema.ts`, `server/src/schemas/lesson-tool.schema.ts`, `server/src/controllers/lesson-resource.controller.ts`, `server/src/controllers/lesson-tool.controller.ts`
- **Frontend files reviewed**: none
- **Config/other files reviewed**: none
- **Rules loaded**: `rules.md`, `backend.md`, `api.md`, `data.md`

## Issues

### [LOW] Missing section comment separator in query schemas

- **Location**: `server/src/schemas/lesson-resource.schema.ts:68`, `server/src/schemas/lesson-tool.schema.ts:67`
- **Description**: The approved backend plan specifies a `// ── Query parameter schema ────` section separator comment above the new `lessonResourceQuerySchema` and `lessonToolQuerySchema` exports. The implemented schemas omit this separator, which is inconsistent with the existing file style (the same files use `// ── Per-type content schemas ─`, `// ── Create schema (discriminated union) ─`, and `// ── Update schema ─` separators for all other sections).
- **Suggested Fix**: Add `// ── Query parameter schema ──────────────────────────────────────────────────` on a blank line before each new schema export, matching the separator style used throughout both files.

### [LOW] Type cast on `req.query` reassignment lacks an explanatory comment

- **Location**: `server/src/middleware/validate.ts:27`
- **Description**: `req.query = result.data as Record<string, string>` uses a type escape hatch. The cast is necessary because Express types `req.query` as `ParsedQs`, which is broader than the inferred Zod output type. The parallel `req.body = result.data` assignment in `validate` has the same pattern but is implicitly understood. A brief inline comment on the `validateQuery` cast would make the justification explicit and match the project's practice of documenting non-obvious casts (as seen in the controllers).
- **Suggested Fix**: Add `// req.query is typed as ParsedQs; cast is safe because the schema has already validated the shape` (or equivalent) on the same line.

### [INFO] No tests added for the new `validateQuery` middleware or query validation behavior

- **Location**: `server/src/middleware/validate.ts`, `server/src/routes/lesson-resource.routes.ts`, `server/src/routes/lesson-tool.routes.ts`
- **Description**: The new `validateQuery` factory and its integration into the two GET routes are not covered by any test files in this diff. The behavior is simple and the logic mirrors the existing `validate` function, but unit/integration tests for the 400 path (`?type=invalid`), the pass-through path (`?type=note`), and the absent-param path would protect against regressions.
- **Suggested Fix**: Add unit tests for `validateQuery` in a middleware test file, and integration tests (or route-level tests) verifying that `GET /lessons/:lessonId/resources?type=invalid` returns 400 with `VALIDATION_ERROR` and that valid and absent `type` values return 200.

## Verdict

**Status**: APPROVED

Zero issues at medium or above. Approved by agent.

The implementation is clean, correctly scoped, and follows the project's established validation pattern. `validateQuery` is a faithful parallel of `validate`, the error path correctly delegates to `ValidationError` and the existing global error handler, the Zod enum values match the Prisma enums, and both GET routes are properly wired. Commit messages follow the `<id>: <imperative>` format.

## Next Steps

Next: `/test cm-0008`

Override: `/approve .claude/reviews/cm-0008/code-review.md` or edit frontmatter to `status: rejected`
