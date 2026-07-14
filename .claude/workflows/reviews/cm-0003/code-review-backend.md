---
id: cm-0003
title: Add Assignment Layer to Lessons — Backend Code Review
stage: review
status: approved
approver: agent
---

# Code Review: Add Assignment Layer to Lessons — Backend

## Summary

Reviewed 7 server-side files introduced or modified by the `refactor/code_cleanup` branch for spec cm-0003. This is a re-review; the two medium issues from the prior pass (non-atomic delete/reorder and missing `.min(1)` on `objective`) have both been fixed in the current implementation. The implementation now covers the full assignment lifecycle correctly: Prisma schema additions with all required cascade deletes, a single migration, Zod discriminated-union validation, a service layer with interactive transactions, a controller, and route mounting behind the global `authenticate` middleware. Three remaining issues were found: one low-severity API contract field-name deviation and two info-level observations.

## Scope Coverage

- **Backend files reviewed**:
  - `server/prisma/migrations/20260428000000_add_assignment_layer/migration.sql`
  - `server/prisma/schema.prisma`
  - `server/src/schemas/assignment.schema.ts`
  - `server/src/services/assignment.service.ts`
  - `server/src/controllers/assignment.controller.ts`
  - `server/src/routes/assignment.routes.ts`
  - `server/src/routes/index.ts`
- **Frontend files reviewed**: none (out of scope)
- **Config/other files reviewed**: none
- **Rules loaded**: `rules.md`, `backend.md`, `api.md`, `data.md`

---

## Issues

### [LOW] `displayTitle` request field name deviates from the API contract's `title` field for video assignments

- **Location**: `server/src/schemas/assignment.schema.ts:69` (create), `server/src/schemas/assignment.schema.ts:109` (update), `server/src/services/assignment.service.ts:99,165`
- **Description**: The approved API contract specifies the video assignment body field as `"title": "string (optional)"` for both `POST /lessons/:lessonId/assignments` and `PUT /assignments/:assignmentId`. The implementation renames this field to `displayTitle` in the Zod schemas and service to avoid key shadowing with the shared `title` field (the assignment's own display title). The renaming is internally consistent and commented, but it is a deviation from the immutable contract. A client that follows the contract and sends `{ type: "video", title: "...", url: "..." }` will have the video title silently dropped by Zod (the key is simply unknown to the schema) and the `VideoAssignment` row will be created with `title: null`.
- **Suggested Fix**: Two options, both require a design-stage amendment first. Option A (recommended): escalate to `/design` to update the API contract to use `displayTitle` for the video assignment's optional title field — this makes the naming unambiguous on the wire. Option B: keep `displayTitle` in the schema and update the API contract to match. Either way the contract and schema must agree. The field is optional so no data is at risk, but a client following the current contract will not get the behaviour it expects.

---

### [INFO] `reorder` service uses the batch transaction form while every other transaction uses the interactive callback form

- **Location**: `server/src/services/assignment.service.ts:261–268`
- **Description**: The `reorder` method calls `prisma.$transaction([...array of pre-built query promises...])` (the sequential batch overload). The `remove` method and every other transactional operation in the file use `prisma.$transaction(async (tx) => { ... })` (the interactive callback overload). The batch form is correct for this use case — Prisma 6 wraps all the pre-built promises in a single transaction — but the inconsistency creates a maintenance hazard and makes it look superficially like the outer `prisma` client is being used inside an interactive transaction (a real bug pattern).
- **Suggested Fix**: Standardize on the interactive callback form for consistency with the rest of the file:
  ```typescript
  await prisma.$transaction(async (tx) => {
    await Promise.all(
      assignmentIds.map((id, index) =>
        tx.assignment.update({ where: { id }, data: { order: index + 1 } }),
      ),
    );
  });
  ```

---

### [INFO] `update` service comment implies `null` clears `objective`, but `null` is not accepted by the schema

- **Location**: `server/src/schemas/assignment.schema.ts:51,103`
- **Description**: The comment `// min(1) prevents persisting an empty-string objective; use null to clear` appears in both the create and update schemas. The `objective` field is typed as `z.string().min(1).optional()` — `undefined` omits the field but `null` is not a valid value and will cause a Zod error if sent. No `null`-clearing path is actually implemented. The comment is misleading.
- **Suggested Fix**: Remove the "use null to clear" portion of the comment, or add `.nullable()` to `objective` and update the service's `sharedUpdates` type to `objective?: string | null` to make null-clearing actually work. The latter is slightly more useful for teachers who want to delete an objective after setting one.

---

## Verdict

**Status**: APPROVED

Zero issues at medium or above. One low-severity API contract field-name deviation (advisory — the field is optional and no clients have shipped against the old name) and two info-level observations. Approved by agent.

## Next Steps

Next: `/test cm-0003`

Override: `/approve .claude/reviews/cm-0003/code-review-backend.md` or edit frontmatter to `status: rejected`
