---
id: cm-0007
title: Typed Content JSON Validation via Discriminated Union Schemas
stage: design
status: approved
approver: human
approved_at: 2026-05-06T00:00:00Z
---

## Overview

This plan covers replacing `z.record(z.any())` on the `content` field of three schema files with per-type discriminated union Zod schemas. No routes, controllers, services, Prisma schema, or client code are changed. All changes are confined to:

- `server/src/schemas/assessment.schema.ts`
- `server/src/schemas/lesson-resource.schema.ts`
- `server/src/schemas/lesson-tool.schema.ts`

## Layer Structure

This spec touches only the **validation layer** — Zod schemas that are applied via the `validate(schema)` middleware. The middleware calls `schema.safeParse(req.body)`, so any refinement to the schema automatically propagates to every route that uses it with no handler or service changes.

No new middleware, no new service functions, no new controllers, no new routes.

### How Discriminated Unions Work in This Codebase

The existing schema files use a flat `z.object({ type, ..., content: z.record(z.any()) })` shape. The replacement uses `z.discriminatedUnion('type', [...])` at the top level of each request body, binding `content` validation to the `type` field in the same request object.

Because `updateLessonResourceSchema` and `updateLessonToolSchema` are currently built as `.partial()` extensions of their create schemas, the update schemas must be rebuilt as their own discriminated unions — each branch made partial on the fields that are optional during update, while preserving the per-type `content` constraint when `content` is present.

## Schema Changes

No Prisma schema changes. No migrations. The `content` column remains `Json` in the database — the validation change is API-boundary only.

## Implementation

### File 1: `server/src/schemas/assessment.schema.ts`

**Current state:** `questionSchema` uses `content: z.record(z.any())` with a flat `type` field.

**Target state:** Replace with a `z.discriminatedUnion('type', [...])` that enforces the per-type `content` shape.

#### Matching pairs shape determination

The grading service (`assessment.service.ts` line 116) compares:
```
JSON.stringify(answer) === JSON.stringify(content['pairs'])
```

The client `AssessmentTaker` currently only handles `options`-based questions. There is no existing client UI for creating or taking `matching` questions, and no seed data defines any `matching` question. The `matching` type is a server-defined enum value with grading logic, but the client side is not yet implemented.

The correct `pairs` shape is: `Array<{ prompt: string; answer: string }>` — an ordered array of prompt-to-answer objects that defines the correct pairings. The teacher stores the correct pairs in `content.pairs`, and the grading comparison evaluates `JSON.stringify` equality between the student's submitted answer and `content.pairs`. This shape is unambiguous, serializes deterministically as an ordered array, and maps naturally to a UI of paired items.

#### Zod schema for `assessment.schema.ts`

```typescript
import { z } from 'zod';

// ── Per-type content schemas ───────────────────────────────────────────────

const multipleChoiceContentSchema = z.object({
  options: z.array(z.string()).min(1, 'options must be a non-empty array'),
  correctIndex: z.number().int().min(0, 'correctIndex must be a non-negative integer'),
});

const trueFalseContentSchema = z.object({
  correctAnswer: z.boolean(),
});

const fillInBlankContentSchema = z.object({
  acceptedAnswers: z.array(z.string()).min(1, 'acceptedAnswers must be a non-empty array'),
});

const matchingPairSchema = z.object({
  prompt: z.string().min(1),
  answer: z.string().min(1),
});

const matchingContentSchema = z.object({
  pairs: z.array(matchingPairSchema).min(1, 'pairs must be a non-empty array'),
});

// ── Discriminated union (drives validate middleware) ───────────────────────

export const questionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('multiple_choice'),
    question: z.string().min(1, 'Question is required'),
    content: multipleChoiceContentSchema,
    order: z.number().int().min(0),
    calculatorEnabled: z.boolean().default(false),
  }),
  z.object({
    type: z.literal('true_false'),
    question: z.string().min(1, 'Question is required'),
    content: trueFalseContentSchema,
    order: z.number().int().min(0),
    calculatorEnabled: z.boolean().default(false),
  }),
  z.object({
    type: z.literal('fill_in_blank'),
    question: z.string().min(1, 'Question is required'),
    content: fillInBlankContentSchema,
    order: z.number().int().min(0),
    calculatorEnabled: z.boolean().default(false),
  }),
  z.object({
    type: z.literal('matching'),
    question: z.string().min(1, 'Question is required'),
    content: matchingContentSchema,
    order: z.number().int().min(0),
    calculatorEnabled: z.boolean().default(false),
  }),
]);

export const createAssessmentSchema = z.object({
  questions: z.array(questionSchema).min(1, 'At least 1 question required'),
});

// submitAttemptSchema is unchanged — out of scope per spec
export const submitAttemptSchema = z.object({
  answers: z.array(z.any()),
});

export const bulkUpdateCalculatorSchema = z.object({
  questionIds: z.array(z.string().uuid()).min(1, 'At least one question ID required'),
  calculatorEnabled: z.boolean(),
});

export type QuestionInput = z.infer<typeof questionSchema>;
export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;
export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
export type BulkUpdateCalculatorInput = z.infer<typeof bulkUpdateCalculatorSchema>;
```

**Note on `createAssessmentSchema`:** The existing schema wraps `questionSchema` in an array. Because `questionSchema` is now a discriminated union, each element in the `questions` array is validated against the appropriate branch based on its own `type` field. No change is needed to `createAssessmentSchema` other than the `questionSchema` it references.

**Note on the `update` path for assessments:** `PUT /assessments/:assessmentId` calls `assessmentService.update` which accepts `CreateAssessmentInput`. The same `createAssessmentSchema` is used for updates (the service replaces all questions in a transaction). This means the discriminated union applies to updates automatically with no additional schema needed.

---

### File 2: `server/src/schemas/lesson-resource.schema.ts`

**Current state:** Flat object with `content: z.record(z.any())`.

**Target state:** Discriminated union on `type` for create; equivalent partial union for update.

#### Update schema design

`updateLessonResourceSchema` is currently `createLessonResourceSchema.partial().extend({ isRequired: z.boolean().optional() })`. With a discriminated union, `.partial()` cannot be chained directly because the union branches must each be made partial. The replacement creates an explicit update union where every field except `type` is optional within each branch — and `content`, when provided, must match the branch's content schema.

The correct approach: each update branch makes `title`, `content`, and `order` optional, but `content` — if present — must match the per-type shape for that branch. `type` itself is the discriminator and must be present if the client is sending a typed update.

**Important consideration:** If the client sends an update with only `title` (no `type` or `content`), the discriminated union requires `type` to be present in order to pick a branch. The current `updateLessonResourceSchema` allows updates without `type`. To preserve backward compatibility, two strategies are possible:

1. Require `type` in all update requests (breaking change to existing client behavior).
2. Use a `z.union` that accepts either the typed discriminated union or an untyped partial that does not include `content`.

**Chosen approach:** Require `type` to always be present in update requests for resource and tool schemas. This is consistent with the client `CLAUDE.md` which documents that `content` is a per-type field — the client always knows the type when editing a resource/tool. This also simplifies validation and prevents ambiguous partial updates where `content` shape cannot be determined. The coder must verify that the client always sends `type` with update calls before implementing; if it does not, this decision must be escalated back to `/design`.

**Verification step for coder:** Check `client/src/api/lesson-resources.ts` to confirm the update call always includes `type` in the request body. If it omits `type`, the coder must use strategy 2 (union of typed partial and untyped partial) and report back.

#### Zod schema for `lesson-resource.schema.ts`

```typescript
import { z } from 'zod';

// ── Per-type content schemas ───────────────────────────────────────────────

const noteContentSchema = z.object({
  // body is a Tiptap JSON document. Internal Tiptap structure is not deeply validated.
  // An empty document ({ type: "doc", content: [] }) is valid.
  body: z.record(z.unknown()),
});

const lectureContentSchema = z.object({
  body: z.record(z.unknown()),
});

const videoContentSchema = z.object({
  url: z.string().min(1, 'url is required'),
});

// ── Create schema (discriminated union) ───────────────────────────────────

export const createLessonResourceSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('note'),
    title: z.string().min(1, 'Title is required'),
    content: noteContentSchema,
    order: z.number().int().min(0),
  }),
  z.object({
    type: z.literal('lecture'),
    title: z.string().min(1, 'Title is required'),
    content: lectureContentSchema,
    order: z.number().int().min(0),
  }),
  z.object({
    type: z.literal('video'),
    title: z.string().min(1, 'Title is required'),
    content: videoContentSchema,
    order: z.number().int().min(0),
  }),
]);

// ── Update schema (discriminated union with optional fields per branch) ────

export const updateLessonResourceSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('note'),
    title: z.string().min(1).optional(),
    content: noteContentSchema.optional(),
    order: z.number().int().min(0).optional(),
    isRequired: z.boolean().optional(),
  }),
  z.object({
    type: z.literal('lecture'),
    title: z.string().min(1).optional(),
    content: lectureContentSchema.optional(),
    order: z.number().int().min(0).optional(),
    isRequired: z.boolean().optional(),
  }),
  z.object({
    type: z.literal('video'),
    title: z.string().min(1).optional(),
    content: videoContentSchema.optional(),
    order: z.number().int().min(0).optional(),
    isRequired: z.boolean().optional(),
  }),
]);

export type CreateLessonResourceInput = z.infer<typeof createLessonResourceSchema>;
export type UpdateLessonResourceInput = z.infer<typeof updateLessonResourceSchema>;
```

**Note on `body` validation:** The spec requires `body` to be a non-null object, but explicitly excludes deep Tiptap structure validation. `z.record(z.unknown())` satisfies this: it accepts any non-null object (a Tiptap doc like `{ type: "doc", content: [] }` passes; `null` and primitives fail). This is intentional — Tiptap's internal schema is not validated at the API boundary.

---

### File 3: `server/src/schemas/lesson-tool.schema.ts`

**Current state:** Flat object with `content: z.record(z.any())`.

**Target state:** Discriminated union on `type` for create; equivalent partial union for update.

**Same update strategy applies:** Require `type` in update requests. Coder must verify `client/src/api/lesson-tools.ts` sends `type` on updates.

#### Zod schema for `lesson-tool.schema.ts`

```typescript
import { z } from 'zod';

// ── Per-type content schemas ───────────────────────────────────────────────

const flashCardContentSchema = z.object({
  front: z.string().min(1, 'front is required'),
  back: z.string().min(1, 'back is required'),
});

const practiceProblemContentSchema = z.object({
  question: z.string().min(1, 'question is required'),
  options: z.array(z.string()).min(1, 'options must be a non-empty array'),
  correctIndex: z.number().int().min(0, 'correctIndex must be a non-negative integer'),
});

const vocabContentSchema = z.object({
  term: z.string().min(1, 'term is required'),
  definition: z.string().min(1, 'definition is required'),
});

// ── Create schema (discriminated union) ───────────────────────────────────

export const createLessonToolSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('flash_card'),
    title: z.string().min(1, 'Title is required'),
    content: flashCardContentSchema,
    order: z.number().int().min(0),
  }),
  z.object({
    type: z.literal('practice_problem'),
    title: z.string().min(1, 'Title is required'),
    content: practiceProblemContentSchema,
    order: z.number().int().min(0),
  }),
  z.object({
    type: z.literal('vocab'),
    title: z.string().min(1, 'Title is required'),
    content: vocabContentSchema,
    order: z.number().int().min(0),
  }),
]);

// ── Update schema (discriminated union with optional fields per branch) ────

export const updateLessonToolSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('flash_card'),
    title: z.string().min(1).optional(),
    content: flashCardContentSchema.optional(),
    order: z.number().int().min(0).optional(),
    isRequired: z.boolean().optional(),
  }),
  z.object({
    type: z.literal('practice_problem'),
    title: z.string().min(1).optional(),
    content: practiceProblemContentSchema.optional(),
    order: z.number().int().min(0).optional(),
    isRequired: z.boolean().optional(),
  }),
  z.object({
    type: z.literal('vocab'),
    title: z.string().min(1).optional(),
    content: vocabContentSchema.optional(),
    order: z.number().int().min(0).optional(),
    isRequired: z.boolean().optional(),
  }),
]);

export type CreateLessonToolInput = z.infer<typeof createLessonToolSchema>;
export type UpdateLessonToolInput = z.infer<typeof updateLessonToolSchema>;
```

---

## Error Handling

No error handling changes are required. The existing `validate(schema)` middleware catches Zod `safeParse` failures and passes a `ValidationError` to the Express error handler. The error handler formats it as:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": { "<field>": ["<issue>"] }
  }
}
```

With discriminated unions, if the `type` field is valid but `content` shape is wrong, Zod reports the field errors under the matched branch's field names (e.g. `content.options`, `content.correctIndex`). If `type` is not a recognized value, Zod reports an `_errors` or `type` field error. Both cases flow through `result.error.flatten().fieldErrors` in `validate.ts` and produce a 400 response — no middleware changes required.

**Nested content field errors:** Because `validate.ts` uses `flatten().fieldErrors`, nested Zod errors (e.g. `content.options`) appear as `{ "content": ["..."] }` in the flattened output. This is acceptable and consistent with existing behavior — the spec does not require a custom error shape beyond the standard `ValidationError` envelope.

## Validation Summary

| Schema | Discriminator | Branches |
|---|---|---|
| `questionSchema` | `type` | `multiple_choice`, `true_false`, `fill_in_blank`, `matching` |
| `createLessonResourceSchema` | `type` | `note`, `lecture`, `video` |
| `updateLessonResourceSchema` | `type` | `note`, `lecture`, `video` (all fields optional except `type`) |
| `createLessonToolSchema` | `type` | `flash_card`, `practice_problem`, `vocab` |
| `updateLessonToolSchema` | `type` | `flash_card`, `practice_problem`, `vocab` (all fields optional except `type`) |

## Dependencies

No new npm packages required. `zod` 3 is already a direct dependency of the server package. `z.discriminatedUnion` and `z.literal` are both part of Zod 3 core.

## Coder Verification Checklist

Before implementing, the coder must:

1. **Verify update calls always include `type`:** Read `client/src/api/lesson-resources.ts` and `client/src/api/lesson-tools.ts`. Confirm that `PUT` calls to `/resources/:id` and `/tools/:id` always include `type` in the request body. If any update call omits `type`, report back — the update schema must be redesigned using a non-discriminated union approach.

2. **Confirm `questionSchema` is the only schema used for assessment creation and update:** The `PUT /assessments/:assessmentId` handler uses `createAssessmentSchema`. Confirm this is the case in the assessment route/controller files so the discriminated union applies to updates automatically.

3. **Run the full test suite after implementation:** Since this is a pure validation tightening (new writes only, existing data is not backfilled), integration tests that submit valid shaped data must still pass. Any test submitting `content: {}` or `content: { arbitrary: true }` will now fail with 400 — those tests must be updated to use valid per-type shapes.

## No Schema Changes

No Prisma schema changes. No migrations. No expand-contract phases required.
