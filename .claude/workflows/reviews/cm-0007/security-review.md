---
id: cm-0007
title: Typed Content JSON Validation via Discriminated Union Schemas
stage: review
status: approved
approver: agent
approved_at: 2026-05-07T00:00:00Z
---

## Summary

The diff replaces `z.record(z.any())` with per-type discriminated union Zod schemas for create paths on `AssessmentQuestion`, `LessonResource`, and `LessonTool`. This is a pure validation tightening at the API boundary with no route, controller, service, or database changes. The overall security posture is improved. The remaining loose validation on update paths is a documented, intentional limitation bounded by strong authentication and ownership enforcement.

## Scope

- Branch: `refactor/code_cleanup`
- Base: `develop`
- Files reviewed: `server/src/schemas/assessment.schema.ts`, `server/src/schemas/lesson-resource.schema.ts`, `server/src/schemas/lesson-tool.schema.ts`
- Spec: cm-0007

## Issues

### [LOW] Update paths retain `z.record(z.any())` — unvalidated content shape reaches the database

- **Severity:** low
- **Location:** `server/src/schemas/lesson-resource.schema.ts:58`, `server/src/schemas/lesson-tool.schema.ts:58`
- **hand_back_to:** frontend
- **Description:** Both `updateLessonResourceSchema` and `updateLessonToolSchema` keep `content: z.record(z.any()).optional()` because the client omits the `type` discriminator from PUT request bodies. Any key-value JSON object passes validation and is written directly to the Prisma `Json` column. The risk is bounded: both routes require an authenticated teacher or admin session that passes `requireCourseOwnership`, so unauthenticated or unauthorized actors cannot reach this path. The downstream risk is silent data corruption for the authenticated user and potential memory pressure from oversized nested JSON payloads. This is not a merge blocker.
- **Suggested fix:** Update the client components (`NoteEditor`, `VideoList`, `FlashCardList`, `VocabList`, `PracticeProblemList`) to include `type` in PUT request bodies, then replace the loose content field in both update schemas with the same discriminated union used for create. Deferred per spec cm-0007 — should be tracked as a follow-on frontend task.

### [INFO] `submitAttemptSchema` uses `z.array(z.any())` for student answers

- **Severity:** info
- **Location:** `server/src/schemas/assessment.schema.ts:65-67`
- **Description:** Out of scope per spec. Grading is server-side and reads only specific fields from stored question content — student answer values never overwrite question content. No security issue in current implementation.

### [INFO] `noteContentSchema`/`lectureContentSchema` use `z.record(z.any())` for Tiptap body

- **Severity:** info
- **Location:** `server/src/schemas/lesson-resource.schema.ts:5-15`
- **Description:** Consistent with the spec's explicit decision not to deeply validate Tiptap document internals. Body is rendered client-side only and never evaluated server-side, so no server-side XSS surface exists.

### [INFO] `assignment.schema.ts` update schema also retains `z.record(z.any())`

- **Severity:** info
- **Location:** `server/src/schemas/assignment.schema.ts:105`
- **Description:** Out of scope for cm-0007. Same authentication and ownership gates apply. Should be included in any follow-on discriminated-union enforcement work.

## Checklist

| Category | Result |
|---|---|
| Input Validation | Low + 3 info issues — documented above |
| Injection | Pass — all Prisma queries parameterized; no raw query interpolation |
| Authentication | Pass — `authenticate()` applied globally before all protected routes |
| Authorization | Pass — write routes chain `authorize` → `requireCourseOwnership` → `validate` → controller |
| Sensitive Data Exposure | Pass — `ValidationError` envelope; no stack traces or internals exposed |
| Rate Limiting | Pass — no new endpoints; existing auth rate limiting unchanged |
| Dependency Vulnerabilities | Pass — no new dependencies; Zod already in use |
| Data Layer | Pass — no migrations, raw queries, or schema changes |

## Verdict

**APPROVED** — The discriminated union schemas correctly close the injection surface on all three create paths. The loose validation retained on update paths is intentional and bounded by strong auth and ownership enforcement — low residual risk appropriate for a follow-on frontend task, not a merge blocker. Zero issues at medium severity or above.
