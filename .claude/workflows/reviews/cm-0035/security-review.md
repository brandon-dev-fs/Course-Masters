---
id: cm-0035
title: Security Review — Socrates data layer (TrustedSource, CourseSpec, AgentSession)
stage: review
status: approved
hand_back_to: null
approver: agent
---

# Security Review: Socrates Data Layer

## Summary

This review covers the pure data-layer additions for the Socrates AI agent: three new Prisma models (`TrustedSource`, `CourseSpec`, `AgentSession`), one new enum (`CourseSpecStatus`), a `softDeleteCourseSpec` cascade helper, and ten trusted-source seed upserts. No routes, controllers, or services are introduced. The schema design is secure for its intended purpose, with appropriate FK cascade semantics, correct soft-delete handling, and idempotent seeding. Two low-severity and three informational findings are documented below; none block approval.

## Scope

- Branch: refactor/lesson-activities (pre-implementation review against provided diff)
- Base: develop
- Files changed: 4 (schema.prisma, migration.sql, seed.ts, softDelete.ts)
- Spec: cm-0035

---

## Issues

### [LOW] conversationLog JSONB column may accumulate PII without a retention boundary — sensitive-data-exposure

- **Severity**: low
- **Location**: `server/prisma/schema.prisma` — `AgentSession.conversationLog`
- **Category**: sensitive-data-exposure
- **Hand back to**: backend
- **Description**: `conversationLog` stores a rolling message window and running summary. User-supplied turns in a multi-turn elicitation dialog will inevitably contain PII: learning goals, educational background, age ranges, professional context. The schema design does not enforce any bound on how long this data persists. `AgentSession` uses hard delete, so records survive unless explicitly removed. No `expiresAt`-triggered cleanup mechanism exists in this diff (explicitly out of scope per the spec) and no future-task cleanup story is documented at the data layer. If the session-management service omits expiry enforcement, conversation logs become a long-lived PII store with no automatic deletion.
- **Suggested Fix**: When the session-management service is implemented, enforce `expiresAt` at query time — always filter `where: { expiresAt: { gt: new Date() } }` on session reads, and run a periodic hard-delete job for expired sessions. Document in the session service (and in `server/CLAUDE.md` when updated) that `conversationLog` is PII-bearing and must never appear in any API response without explicit redaction.

---

### [LOW] expiresAt has no database-level enforcement or index — data-layer

- **Severity**: low
- **Location**: `server/prisma/schema.prisma` — `AgentSession.expiresAt`
- **Category**: data-layer
- **Hand back to**: backend
- **Description**: `expiresAt` is an optional `DateTime` with no constraint, trigger, or index. There is no mechanism preventing future queries from reading expired sessions as valid. Because `AgentSession` holds `conversationLog` (potentially PII) and `elicitationState`, stale sessions represent both a data-privacy risk and a potential confused-deputy risk if the session-management layer treats any existing record as active without checking the timestamp.
- **Suggested Fix**: Add `@@index([expiresAt])` to `AgentSession` in the schema to make cleanup queries efficient. When the session-management service is built, all session reads must guard with `where: { expiresAt: { gt: new Date() } }` (or `expiresAt: null` for open-ended sessions). A scheduled cleanup job or on-read lazy deletion should be planned for expired rows.

---

### [INFO] TrustedSource.domain is not normalised at the schema level — input-validation

- **Severity**: info
- **Location**: `server/prisma/schema.prisma` — `TrustedSource.domain`
- **Category**: input-validation
- **Description**: The `domain` field is `@unique` and admin-controlled, so SQL injection is not a concern. However, the schema accepts any string. A future admin write endpoint could insert `"khanacademy.org "` (trailing space) or `"KhanAcademy.ORG"` as a distinct row from `"khanacademy.org"`, bypassing the unique constraint and allowing duplicate trusted-source entries with subtly different representations. This does not affect the seeded data (all lowercase, no whitespace) but would affect runtime admin writes.
- **Suggested Fix**: When the admin API for `TrustedSource` is built, normalize domain values at the service layer before persistence: `domain.trim().toLowerCase()`. Add a Zod `refine()` rule on the create/update schema that validates the value matches a hostname pattern (e.g., `/^[a-z0-9][a-z0-9\-\.]+\.[a-z]{2,}$/`). No schema migration change needed now.

---

### [INFO] ON DELETE CASCADE from User to CourseSpec and AgentSession — authorization

- **Severity**: info
- **Location**: `server/prisma/schema.prisma` — `CourseSpec` and `AgentSession` FK relations
- **Category**: authorization
- **Description**: `ON DELETE CASCADE` from `User` to `CourseSpec` and `AgentSession` is the correct semantic — a user's AI session data and draft specs should not survive account deletion. This aligns with the project's established cascade pattern and the spec's FR-05. The `softDeleteCourseSpec` helper correctly hard-deletes child `AgentSession` records before soft-deleting the `CourseSpec`, preserving referential integrity. Documenting as info to confirm cascade semantics were intentionally reviewed and are correct.
- **Suggested Fix**: No action required. When the user-deletion endpoint is extended to handle Socrates cleanup, verify that DB-level cascade covers `AgentSession` records even when the spec is soft-deleted. The `AgentSession.courseSpecId` FK uses `ON DELETE SET NULL` to `CourseSpec`, so user deletion cascades `AgentSession` via the `User` FK independently of the spec's soft-delete state — this is correct.

---

### [INFO] softDeleteCourseSpec does not guard against double soft-delete — data-layer

- **Severity**: info
- **Location**: `server/src/utils/softDelete.ts` — `softDeleteCourseSpec`
- **Category**: data-layer
- **Description**: The cascade helper calls `tx.courseSpec.update({ where: { id }, data: { deletedAt: new Date() } })` without first checking that the record exists and has `deletedAt: null`. Calling this on an already-soft-deleted spec silently updates `deletedAt` to a newer timestamp. This is a correctness concern rather than a security vulnerability, and it is consistent with the pattern used by the existing `softDeleteCourse`/`softDeleteUnit`/`softDeleteLesson` helpers.
- **Suggested Fix**: Consistent with existing helpers — no change required for this diff. Future call-sites should verify the spec exists via `findFirst({ where: { id, deletedAt: null } })` and throw `NotFoundError` before invoking the cascade helper.

---

## Checklist Coverage

| Category | Result |
|---|---|
| Input Validation | pass — no user input accepted in this diff; seed uses hardcoded values; domain uniqueness enforced at DB level; advisory for future admin endpoint (info) |
| Injection | pass — no raw queries; no string interpolation; all Prisma ORM parameterized; seed uses structured upsert objects |
| Authentication | n/a — no routes or middleware introduced |
| Authorization | pass — FK cascade semantics reviewed and confirmed correct; no IDOR surface introduced; ownership chain preserved |
| Sensitive Data Exposure | issues found (low) — conversationLog PII retention without bound, no enforcement of expiresAt |
| Rate Limiting | n/a — no routes introduced |
| Dependency Vulnerabilities | pass — no new packages added |
| Data Layer | issues found (low/info) — expiresAt unindexed and unenforced; softDelete idempotency advisory |
| API Security | n/a — no API endpoints introduced |

---

## Verdict

APPROVED — Zero issues at medium severity or above. Two low-severity findings (conversationLog PII retention boundary and unenforced/unindexed expiresAt) are advisory items for the session-management implementation task. Three informational findings confirm intentional design decisions. The schema is structurally sound and consistent with the project's established conventions.
