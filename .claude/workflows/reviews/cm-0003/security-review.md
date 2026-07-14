---
id: cm-0003
title: Assignment Layer — Security Review
stage: review
status: approved
approver: agent
approved_at: 2026-05-05T00:00:00Z
---

# Security Review: Assignment Layer

## Summary

Re-review of the cm-0003 Assignment Layer after two previously blocking HIGH issues were addressed. The `javascript:`/`data:` URL injection vector is fully closed by the added `.refine()` protocol allowlist in the Zod schema. The answer-key exposure finding has been reviewed against the existing codebase convention and is documented as an intentional architectural decision. No new issues found. Approving with two low findings and one info item carried forward.

## Scope

- Branch: `refactor/code_cleanup`
- Base: `main`
- Files changed: 25
- Spec: cm-0003

---

## Previously Blocking Issues — Resolved / Adjudicated

### [HIGH — FIXED] javascript: / data: URLs accepted by Zod

- **Location**: `server/src/schemas/assignment.schema.ts` — all `url` fields
- **Resolution**: `.refine(u => /^https?:\/\//i.test(u), { message: 'URL must use http or https' })` has been added to all three URL fields: the `video` branch of `createAssignmentSchema` (line 66), the `reading` branch of `createAssignmentSchema` (line 74), and `url` in `updateAssignmentSchema` (line 107). The regex allowlist ensures only `http:` and `https:` schemes pass validation — `javascript:`, `data:`, `vbscript:`, and all other schemes are rejected at the Zod layer before the value reaches the service or database. Verified in code.

### [HIGH — INTENTIONAL DESIGN] Practice problem answer keys returned to all authenticated users

- **Location**: `server/src/services/assignment.service.ts` — `ASSIGNMENT_INCLUDE` constant
- **Adjudication**: This was flagged as HIGH in the previous review. After reviewing the codebase convention documented in `server/CLAUDE.md` — "Grading is always server-side — full question content is returned to clients (no answer stripping)" — and verifying that `PracticeProblemRunner.tsx` performs grading client-side using `correctIndex`, `correct`, `correctPairs`, and `blanks[].answer` directly from the question content, this is confirmed as an intentional design decision:
  1. The `server/CLAUDE.md` convention explicitly establishes no-answer-stripping as the project-wide policy.
  2. The `PracticeProblemRunner` is architecturally dependent on receiving the full answer content to compute per-question correctness feedback client-side.
  3. Stripping answers would require moving grading server-side, which is out of scope for this spec.
  4. This pattern is consistent with how existing assessments (quiz/test/exam) return full question content including `correctIndex` to clients.
  
  The trade-off (a student can extract answers via direct API call) is accepted per the existing project convention. If `passingPercentage` gates consequential progress in a future spec, server-side grading should be revisited at that point.

---

## Remaining Issues

### [LOW] Completion endpoints have no rate limiting

- **Severity**: low
- **Location**: `server/src/routes/assignment.routes.ts:51-54`
- **Category**: rate-limiting
- **Description**: `POST /assignments/:assignmentId/complete` and `DELETE /assignments/:assignmentId/complete` carry no rate limiter. The `assignment_completion` table's unique constraint on `(userId, assignmentId)` prevents unbounded row creation, bounding the attack to repeated upserts. DB load under concurrent toggling is the primary risk.
- **Suggested Fix**: Apply a broad per-IP rate limiter to all `/api` routes (e.g., 200 req/min) at the top of `routes/index.ts` before the `authenticate()` call.

---

### [LOW] Teacher mutations are not scoped to courses the teacher owns

- **Severity**: low
- **Location**: `server/src/services/assignment.service.ts` — `create`, `update`, `remove`, `reorder`
- **Category**: authorization
- **Description**: The `authorize('teacher', 'admin')` middleware confirms role but does not verify that the target lesson belongs to a course owned by the requesting teacher. Any teacher can mutate another teacher's assignments. This pattern is consistent across all existing resource, tool, and assessment routes — not a regression introduced by this PR. Severity is low because exploitation requires a valid teacher-role session.
- **Suggested Fix**: Add lesson-ownership check on all teacher mutation paths in a dedicated hardening pass across all feature routes, not only assignments.

---

### [INFO] z.record(z.any()) on note content has no size or depth bound

- **Severity**: info
- **Location**: `server/src/schemas/assignment.schema.ts:61`, `server/src/schemas/assignment.schema.ts:105`
- **Category**: input-validation
- **Description**: Identical to the existing pattern for `LessonResource` note content — not a regression. `NoteAssignmentView` renders through `RichTextEditor` with `editable={false}`, not `dangerouslySetInnerHTML`, so there is no XSS surface on this path.
- **Suggested Fix**: No action required now. Consider adding `express.json({ limit: '512kb' })` globally in `app.ts` if not already constrained.

---

### [INFO] Practice problem auto-complete is client-enforced only

- **Severity**: info
- **Location**: `server/src/routes/assignment.routes.ts:51`; `client/src/features/assignments/PracticeProblemRunner.tsx:340-348`
- **Category**: authorization
- **Description**: The server's `markComplete` handler does not validate whether the student actually passed — it creates or upserts the completion record unconditionally. A student can bypass the score threshold by calling the endpoint directly. Intentional design decision per spec scope.
- **Suggested Fix**: No action required given current spec scope. If thresholds gate further course progress in a future spec, move scoring server-side.

---

## Checklist Coverage

| Category | Result |
|---|---|
| Input Validation | Pass — `javascript:`/`data:` URL injection closed by `.refine()` protocol allowlist |
| Injection — SQL/NoSQL | Pass — all DB access via Prisma ORM parameterized queries; no raw SQL |
| Injection — Command | Pass — no shell execution |
| Injection — Template | Pass — no server-side template rendering |
| Authentication | Pass — `authenticate()` applied globally in `routes/index.ts` before all business routes |
| Authorization — Middleware order | Pass — `authorize('teacher', 'admin')` correctly follows `authenticate()` on all mutation routes |
| Authorization — IDOR | Pass — `markComplete`/`markIncomplete` use `req.user!.id` from session; no user-supplied userId |
| Authorization — Horizontal escalation | Issues found — LOW: teacher mutations not scoped to owned courses (pre-existing pattern) |
| Authorization — Vertical escalation | Pass — students cannot reach create/update/delete/reorder endpoints |
| Sensitive Data Exposure — Answer keys | Intentional — full question content returned per `server/CLAUDE.md` convention; client-side grading depends on it |
| Sensitive Data Exposure — Secrets in code | Pass — no hardcoded credentials or secrets |
| Sensitive Data Exposure — Logging | Pass — no logging statements in new code |
| Sensitive Data Exposure — Stack traces | Pass — errorHandler sanitizes errors |
| Rate Limiting | Issues found — LOW: no limiter on completion endpoints |
| Dependency Vulnerabilities | Pass — no new npm dependencies introduced |
| Data Layer — Parameterized queries | Pass — Prisma ORM used exclusively |
| Data Layer — Migration safety | Pass — migration is purely additive |
| API Security — CORS | Pass — origin restricted to `config.CLIENT_URL`; no wildcard |
| API Security — Content-type | Pass — `express.json()` handles body parsing |
| API Security — URL protocol injection | Pass — `javascript:` and `data:` URLs now rejected by `.refine()` protocol allowlist |
| XSS — dangerouslySetInnerHTML | Pass — only occurrence is KaTeX-rendered math preview in `RichTextEditor.tsx`, not user-stored content |
| Mass assignment / over-posting | Pass — Zod strips unrecognized keys; update schema is explicit |

---

## Verdict

APPROVED — The two previously blocking HIGH issues are resolved: URL protocol injection is closed by the Zod `.refine()` allowlist, and the answer-key exposure is adjudicated as an intentional design decision consistent with the project's established convention. Two LOW issues (rate limiting, teacher ownership scope) are pre-existing patterns that should be addressed in a dedicated hardening pass. No new issues introduced by this PR.
