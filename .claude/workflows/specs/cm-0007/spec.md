---
id: cm-0007
title: Typed Content JSON Validation via Discriminated Union Schemas
stage: spec
status: approved
approver: human
approved_at: 2026-05-06T00:00:00Z
---

## Problem Statement

All three content-bearing models — `AssessmentQuestion`, `LessonResource`, and `LessonTool` — use `z.record(z.any())` to validate their `content` JSON field. This accepts any object regardless of the question or resource type, so structurally invalid data can pass validation and be persisted. For example, a `multiple_choice` question missing its `options` array or a `video` resource missing its `url` would both pass today.

The grading service, client rendering logic, and rich-text editor all depend on specific shapes being present in `content`. When those shapes are absent, the failure is silent at the API boundary and surfaces only at render or grading time — far from where the bad data entered.

## Goals

- Enforce per-type content shapes at the API boundary for all three models.
- Reject structurally invalid payloads with a clear validation error before any data reaches the service or database layer.
- Apply enforcement to both create and update endpoints.
- Make no changes to API route signatures, response envelopes, or client code.

## Out of Scope

- Backfilling or migrating existing persisted data — only new writes are affected.
- Deep structural validation of Tiptap document internals — the `body` field on `note` and `lecture` resources will be validated as a non-null object only.
- Changes to `submitAttemptSchema` — student answer shapes are separate from stored content shapes and are not part of this work.
- Any changes to the `Assignment` model or its practice-problem schemas — those are distinct from `AssessmentQuestion`.

## Content Shape Requirements

### AssessmentQuestion (`server/src/schemas/assessment.schema.ts`)

The `content` field must be validated as a discriminated union on the sibling `type` field:

| Type | Required fields |
|---|---|
| `multiple_choice` | `options` (non-empty string array), `correctIndex` (non-negative integer) |
| `true_false` | `correctAnswer` (boolean) |
| `fill_in_blank` | `acceptedAnswers` (non-empty string array) |
| `matching` | `pairs` (object — exact structure to be determined during backend design; current grading uses JSON-equality comparison against the submitted answer map) |

> **Open question for backend plan:** The grading service compares `content.pairs` to the student's answer via `JSON.stringify` equality, but no seed data defines the `pairs` shape for `AssessmentQuestion`. The backend architect must confirm the `pairs` structure (e.g. `Record<string, number>`, array of tuples, or another shape) and encode it in the Zod schema accordingly.

### LessonResource (`server/src/schemas/lesson-resource.schema.ts`)

| Type | Required fields |
|---|---|
| `note` | `body` (non-null object; Tiptap JSON — internal structure not deeply validated) |
| `lecture` | `body` (non-null object; same as note) |
| `video` | `url` (non-empty string) |

`body` may represent an empty Tiptap document (e.g. `{ type: "doc", content: [] }`) — the schema must accept a minimal/empty Tiptap document, not require content within it.

### LessonTool (`server/src/schemas/lesson-tool.schema.ts`)

| Type | Required fields |
|---|---|
| `flash_card` | `front` (non-empty string), `back` (non-empty string) |
| `practice_problem` | `question` (non-empty string), `options` (non-empty string array), `correctIndex` (non-negative integer) |
| `vocab` | `term` (non-empty string), `definition` (non-empty string) |

## Validation Behavior

- Validation occurs in the existing `validate(schema)` middleware — no middleware changes required.
- A failed content shape check must return HTTP 400 with the project's standard `ValidationError` envelope, identifying the specific field(s) that failed.
- The discriminated union must be driven by the `type` field that is already present in each request body.
- Update routes (`updateLessonResourceSchema`, `updateLessonToolSchema`) must also enforce the discriminated union. Because update schemas are currently built via `.partial()`, the content field — when present — must still satisfy the per-type shape.

## Affected Files

- `server/src/schemas/assessment.schema.ts` — `questionSchema` content field
- `server/src/schemas/lesson-resource.schema.ts` — `createLessonResourceSchema` and `updateLessonResourceSchema`
- `server/src/schemas/lesson-tool.schema.ts` — `createLessonToolSchema` and `updateLessonToolSchema`

No route, controller, service, or Prisma schema changes are required.

## Required Design Artifacts

- [ ] ui-design
- [ ] frontend-plan
- [x] backend-plan
- [ ] api-contract
