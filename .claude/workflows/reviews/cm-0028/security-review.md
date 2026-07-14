---
id: cm-0028
title: Lesson Activities — Security Review
stage: review
status: approved
hand_back_to: null
approver: agent
---

# Security Review: Lesson Activities

## Summary

This pass reviews 66 changed files across the full stack for spec cm-0028, covering vocab assignment entry normalization, activity bookmarks, lesson checklist items, and saved flash cards. All new routes are correctly placed behind the global `authenticate()` middleware, all write endpoints carry Zod validation schemas, and all Prisma queries are fully parameterized. No issues at medium severity or above were found. Two findings below the blocking threshold are documented for awareness.

## Scope

- Branch: `refactor/lesson-activities`
- Base: `develop`
- Files changed: 66
- Spec: cm-0028

## Issues

### [LOW] `saveVocabEntryFlashCard` does not verify the entry belongs to a lesson accessible to the caller — authorization

- **Severity**: low
- **Location**: `server/src/services/assignment.service.ts` — `saveVocabEntryFlashCard` (~line 381)
- **Category**: authorization
- **Hand back to**: backend
- **Description**: The service confirms the `VocabAssignmentEntry` row exists by `id` but does not traverse the ownership chain to verify that the calling user has any access relationship to the lesson containing that entry. Any authenticated user who obtains a valid `entryId` UUID can write a `StudentVocabAssignmentFlashCard` row against it. The practical impact is bounded: the record is scoped to `req.user!.id`, it is never surfaced to other users, and the operation does not modify course content. The codebase has no enrollment model yet; the same scope gap applies to student notes, assignment completions, and checklist items. `getSavedVocabEntryFlashCards` correctly filters by both `userId` and `lessonId` at read time, so flash cards saved to inaccessible entries are silently invisible.
- **Suggested Fix**: In the `saveVocabEntryFlashCard` service call, add a `where` clause that traces the entry back to a `lessonId` the caller is expected to be working within. The `lessonId` is already available through the parent `lessonAssignmentsRouter` context and could be passed as an additional parameter. Example:
  ```ts
  const entry = await prisma.vocabAssignmentEntry.findFirst({
    where: {
      id: entryId,
      vocabAssignment: { assignment: { lessonId } },
    },
  });
  if (!entry) throw new NotFoundError('Vocab entry not found');
  ```
  Alternatively, document the known gap alongside a tracking comment until the enrollment model is introduced.

---

### [INFO] iframe sandbox combines `allow-scripts` with `allow-same-origin` — api-security

- **Severity**: info
- **Location**: `client/src/features/assignments/ExternalLinkAssignmentView.tsx` — both `<iframe>` elements (~lines 96 and 132)
- **Category**: api-security
- **Hand back to**: frontend
- **Description**: Both iframe elements use `sandbox="allow-scripts allow-same-origin allow-forms allow-popups"`. The combination of `allow-scripts` and `allow-same-origin` is a recognized sandbox weakening: a document served from the same origin as the parent can run scripts that escape the sandbox. In practice this requires a teacher to create an assignment whose URL points to the application's own origin — an insider-threat scenario. All URLs are validated server-side with `z.string().url()` plus an https/http refinement, and realistic external URLs are cross-origin. The `rel="noopener noreferrer"` on the fallback anchor tags is correct. The raw `{url}` rendered as a React text node in the fallback block is not an XSS risk because React escapes text content.
- **Suggested Fix**: Remove `allow-same-origin` from both `sandbox` attributes. The remaining tokens (`allow-scripts allow-forms allow-popups`) are sufficient for the majority of embeddable third-party content and eliminate the escape-combination risk.

---

## Checklist Coverage

| Category | Result |
|---|---|
| Input validation — request bodies | Pass — `createBookmarkSchema` and `updateBookmarkSchema` enforce `z.string().min(1).max(500)`; `createChecklistItemSchema` and `updateChecklistItemSchema` cap `text` at 200 chars; `reorderChecklistSchema` requires a `z.array(z.string().uuid()).min(1)` array; `updateAssignmentSchema` correctly adds optional `id` and `example` fields; all schemas applied via `validate()` middleware before controllers |
| Input validation — query params / path params | Pass — no new query param endpoints; path params are UUIDs handled by Prisma's typed where clauses |
| Input validation — type coercion | Pass — Zod rejects array-where-string and non-UUID values on all new endpoints |
| Injection — SQL/NoSQL via user input | Pass — all Prisma queries use the ORM parameterized builder; the migration data migration uses `jsonb_array_elements` extraction with no user-supplied interpolation |
| Injection — command or template | N/A — no shell execution or template rendering introduced |
| Authentication — missing auth on new routes | Pass — all new routes (`/vocab-entries`, `/lessons/:lessonId/checklist`, `/checklist-items`, `/:assignmentId/bookmark`) are mounted after `router.use(authenticate())` in `routes/index.ts` |
| Authentication — middleware ordering | Pass — `authenticate()` precedes all feature routers; no route registered before the auth guard |
| Authentication — hardcoded credentials or secrets | Pass — no secrets found anywhere in the diff |
| Authorization — RBAC gaps | Pass — bookmark and checklist operations are student-scoped by design; `checklistService.update` and `.remove` both perform `if (item.userId !== userId) throw new AppError('FORBIDDEN', ...)` |
| Authorization — IDOR | Low finding documented above (vocab flash card save lacks lessonId scope) |
| Authorization — horizontal privilege escalation | Pass — every query that returns or modifies user-owned data includes `userId` in its `where` clause; bookmark `upsert` and `remove` use the composite `{ userId, assignmentId }` key; checklist `reorder` verifies all submitted `itemIds` belong to the caller before executing |
| Sensitive data exposure — secrets/PII in logs | Pass — no new log statements; pino logger is the only logging mechanism and no new structured fields are added that carry PII |
| Sensitive data exposure — sensitive fields in API responses | Pass — `BOOKMARK_SELECT` and `ITEM_SELECT` constants explicitly whitelist safe fields; `saveVocabEntryFlashCard` uses `select: { id: true, entryId: true, createdAt: true }` — `userId` is not returned |
| Sensitive data exposure — client-side storage | Pass — no localStorage, sessionStorage, or URL param storage of sensitive data introduced |
| Rate limiting — new endpoints | Pass — all new endpoints inherit `apiLimiter` (300 req/15 min) via the root router; no new auth-equivalent or resource-intensive endpoints that would warrant a stricter limiter |
| Dependency vulnerabilities | Pass — no new npm dependencies introduced in this diff |
| Data layer — parameterized queries | Pass — no raw SQL in application code |
| Data layer — destructive migrations | Pass — the `entries` JSON column removal follows expand-contract phasing: `20260604000000` creates the new table and migrates data in-place; `20260605000002` drops the old column in a separate migration after the code no longer references it. The note nullable/required flip is staged safely across two separate migrations. |
| API security — CORS | N/A — no CORS configuration changes |
| API security — content-type validation | Pass — `express.json()` and the Zod `validate()` middleware reject non-JSON payloads on all new write routes |
| API security — resource existence leakage | Pass — `bookmarkService.getByAssignment` throws `NotFoundError` (404) for a missing bookmark rather than returning null with 200; the 404 only reveals whether the *calling user* has a bookmark (no cross-user leakage since `userId` is always `req.user!.id`) |

## Verdict

APPROVED — Zero issues at medium severity or above. One low-severity authorization scope gap on vocab flash card save and one info-level iframe sandbox advisory are documented for awareness but do not block merge.
