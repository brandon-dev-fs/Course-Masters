---
id: cm-0007
title: Typed Content JSON Validation via Discriminated Union Schemas
stage: review
status: approved
approver: agent
approved_at: 2026-05-07T00:00:00Z
---

## Scope

Backend-only. Files reviewed:
- `server/src/schemas/assessment.schema.ts`
- `server/src/schemas/lesson-resource.schema.ts`
- `server/src/schemas/lesson-tool.schema.ts`

## Issues

### [MEDIUM] `z.record(z.any())` used where plan specified `z.record(z.unknown())` for `body` in create schemas

- **Severity:** medium
- **Location:** `server/src/schemas/lesson-resource.schema.ts:10` (`noteContentSchema.body`), `:14` (`lectureContentSchema.body`)
- **Description:** The approved backend plan explicitly chose `z.record(z.unknown())` for `body`. The implementation silently downgrades to `z.record(z.any())`, citing "Prisma Json column compatibility." This justification is incorrect — `z.record(z.unknown())` also produces a plain JS object that Prisma's `InputJsonValue` accepts without issue. `z.record(z.any())` is a full type system escape hatch that disables downstream TypeScript checking on the record's values. The global rules require escape hatches to be justified; the stated reason is factually wrong.
- **Suggested fix:** Change both `body: z.record(z.any())` usages in `noteContentSchema` and `lectureContentSchema` to `body: z.record(z.unknown())`. Remove or correct the Prisma compatibility comment — it does not apply to these create-side schemas.

### [MEDIUM] Comment/code mismatch: update schemas claim `z.record(z.unknown())` but implement `z.record(z.any())`

- **Severity:** medium
- **Location:** `server/src/schemas/lesson-resource.schema.ts:49,58`, `server/src/schemas/lesson-tool.schema.ts:49,58`
- **Description:** Both update schema comment blocks state: "content uses `z.record(z.unknown())` (not `z.any()`) to preserve type safety while remaining type-agnostic." The code that follows uses `content: z.record(z.any()).optional()` in both files. This is a direct contradiction — a reviewer reading the comment concludes the stricter type is in use when it is not. Misleading inline documentation on a type-safety decision is a correctness and auditability issue.
- **Suggested fix:** Align comment and code. If `z.record(z.any())` is the intent, remove the "(not `z.any()`)" claim and state the actual justification (the flat partial schema cannot enforce per-type shapes without a discriminator, so content passes through loosely validated until a client change enables discriminated union enforcement on updates). If `z.record(z.unknown())` was intended, fix the code to match.

### [LOW] Update schema deviation not formally tracked as follow-on work

- **Severity:** low
- **Location:** `server/src/schemas/lesson-resource.schema.ts:44-61`, `server/src/schemas/lesson-tool.schema.ts:44-61`
- **Description:** The coder correctly verified that the client omits `type` on PUT requests and took the plan's fallback path. The rationale is well-documented. However, there is no formal follow-on ticket. The deviation is well-reasoned and does not block merge — a future spec should track enforcement on update endpoints once the client sends `type`.
- **Suggested fix:** No code change required. Create a follow-up spec to enforce discriminated union validation on update endpoints when the client is updated to include `type` in PUT request bodies.

### [INFO] `submitAttemptSchema` retains `z.array(z.any())` — pre-existing, explicitly out of scope

- **Severity:** info
- **Location:** `server/src/schemas/assessment.schema.ts:65-67`
- **Description:** Pre-existing and explicitly excluded by the spec. The inline comment confirms this. No action required.

## Summary

| Issue | Severity | Blocks merge |
|---|---|---|
| `z.any()` used where plan specified `z.unknown()` for `body` (create schemas) | medium | yes |
| Comment/code mismatch in both update schemas | medium | yes |
| Update schema deviation not formally tracked | low | no |
| `submitAttemptSchema` `z.any()` — pre-existing, out of scope | info | no |

The core create-side discriminated union logic in `assessment.schema.ts` and the union branches in `lesson-resource.schema.ts` / `lesson-tool.schema.ts` is correct and faithful to the plan. Both blocking issues are localized to the `body` field type and comment accuracy in the resource/tool schemas — small fixes that do not require redesign.

**Next: fix the two medium issues and re-run `/review cm-0007`.**
