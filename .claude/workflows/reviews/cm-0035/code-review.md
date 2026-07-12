---
id: cm-0035
title: Add Socrates data layer — TrustedSource, CourseSpec, AgentSession
stage: review
status: approved
approver: agent
---

# Code Review: Add Socrates data layer — TrustedSource, CourseSpec, AgentSession

## Summary

Targeted review of the `softDeleteCourseSpec` fix in `server/src/utils/softDelete.ts`. This is the third attempt to land the function with the correct signature. The actual git diff against `develop` confirms this is a net-new export added to an existing utility file — the function did not exist on `develop`; the "before" state in the submission was from a prior branch iteration.

One changed backend file reviewed. No frontend files changed in this targeted diff. Backend scoped rules loaded.

## Scope Coverage

- **Backend files reviewed**: `server/src/utils/softDelete.ts`
- **Frontend files reviewed**: none (this diff touches only the utility)
- **Config/other files reviewed**: none
- **Rules loaded**: `backend.md`, `data.md`

## Issues

No issues found.

**Verification checklist:**

1. Signature `(tx: TransactionClient, id: string)` — matches every other helper in the file (`softDeleteCourse`, `softDeleteUnit`, `softDeleteLesson`, `softDeleteUser`). Consistent.
2. No dynamic `import()` — removed. Consistent with project rules (no lazy imports in request-path utilities).
3. No self-managed `$transaction` inside the helper — removed. Transaction ownership correctly belongs to the caller, matching the established pattern.
4. All operations use `tx` directly — `tx.agentSession.deleteMany` and `tx.courseSpec.update`. No mixing of `tx` and the global `prisma` singleton.
5. Hard-delete of `AgentSession` children before soft-delete of `CourseSpec` — correct cascade order per data rules (AgentSession has no `deletedAt`, hard deletes are acceptable for non-content-hierarchy models).
6. `deletedAt: new Date()` inline — acceptable; other helpers in this file hoist `const now = new Date()` as a micro-optimization to share the timestamp across multiple `updateMany` calls. `softDeleteCourseSpec` only issues one soft-delete, so the inline `new Date()` is correct and incurs no consistency risk.
7. JSDoc updated — old comment about optional-tx / self-managed transaction removed; new comment accurately describes the contract.
8. No callers outside `softDelete.ts` yet — function is introduced but not yet wired to a service, which is consistent with a data-layer PR scoped to schema + utilities.
9. TypeScript: `TransactionClient` type reused from the top-level alias in the same file. No `any`. Return type is `Promise<void>`.
10. Mechanical grep: zero issues at `severity: medium | high | critical`.

## Verdict

**Status**: APPROVED

Zero issues at medium or above. Approved by agent.

## Next Steps

Next: `/test cm-0035`

Override: `/approve .claude/workflows/reviews/cm-0035/code-review.md` or edit frontmatter to `status: rejected`
