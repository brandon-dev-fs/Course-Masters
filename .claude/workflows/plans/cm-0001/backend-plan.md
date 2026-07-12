---
id: cm-0001
title: Per-Question Calculator Toggle
stage: design
status: approved
approver: human
approved_at: 2026-04-19T00:00:00Z
---

# cm-0001 Backend Plan: Per-Question Calculator Toggle

## Overview

This feature adds a `calculatorEnabled` boolean field to the `AssessmentQuestion` model and surfaces it through the existing assessment API. No new models, relations, or routes are introduced beyond a single bulk-update endpoint. All changes are additive.

---

## Schema Changes

### Migration: Add `calculatorEnabled` to `AssessmentQuestion`

Add one column to the `assessment_question` table:

```prisma
model AssessmentQuestion {
  id                String       @id @default(uuid())
  type              QuestionType @default(multiple_choice)
  question          String
  content           Json
  order             Int
  assessmentId      String
  calculatorEnabled Boolean      @default(false)   // NEW

  assessment Assessment @relation(fields: [assessmentId], references: [id], onDelete: Cascade)

  @@index([assessmentId])
  @@map("assessment_question")
}
```

**This is a purely additive change.** The column is non-nullable with a server-side default of `false`, so no data migration phase is needed and the expand-contract pattern does not apply. Existing rows will have `calculatorEnabled = false` automatically.

**Migration command:**

```
npm run db:migrate
```

Prisma will generate a migration that executes:

```sql
ALTER TABLE "assessment_question" ADD COLUMN "calculatorEnabled" BOOLEAN NOT NULL DEFAULT false;
```

No cascade implications. No enum changes. No new indexes required.

---

## Layer Structure

### 1. Validation — `src/schemas/assessment.schema.ts`

**Change:** Extend `questionSchema` to accept the optional `calculatorEnabled` field.

```ts
export const questionSchema = z.object({
	type: z
		.enum(['multiple_choice', 'true_false', 'matching', 'fill_in_blank'])
		.default('multiple_choice'),
	question: z.string().min(1, 'Question is required'),
	content: z.record(z.any()),
	order: z.number().int().min(0),
	calculatorEnabled: z.boolean().default(false), // NEW
});
```

The field is optional at the Zod layer (`.default(false)`) so that existing clients sending requests without it continue to work without modification.

**New schema for bulk-update endpoint:**

```ts
export const bulkUpdateCalculatorSchema = z.object({
	questionIds: z
		.array(z.string().uuid())
		.min(1, 'At least one question ID required'),
	calculatorEnabled: z.boolean(),
});

export type BulkUpdateCalculatorInput = z.infer<
	typeof bulkUpdateCalculatorSchema
>;
```

### 2. Service Layer — `src/services/assessment.service.ts`

**Change 1:** The existing `update` method calls `prisma.assessmentQuestion.deleteMany` then re-creates all questions via `data.questions`. Because `questionSchema` now includes `calculatorEnabled`, the re-create path automatically persists the field. No logic change is needed in `update` itself — it passes through `data.questions` verbatim to Prisma's `create` call.

The same applies to `create`: `data.questions` is spread directly into `prisma.assessment.create`. Once `questionSchema` accepts `calculatorEnabled`, it will be included in the create payload automatically.

**Change 2:** Add a new `bulkUpdateCalculator` function:

```
function bulkUpdateCalculator(assessmentId: string, data: BulkUpdateCalculatorInput):
  1. Verify the assessment exists — findUnique({ where: { id: assessmentId } })
     If not found → throw NotFoundError('Assessment not found')
  2. Verify all questionIds belong to this assessment:
     findMany({ where: { id: { in: data.questionIds }, assessmentId } })
     If count !== data.questionIds.length → throw AppError('QUESTION_NOT_IN_ASSESSMENT', 422)
  3. Execute prisma.assessmentQuestion.updateMany({
       where: { id: { in: data.questionIds }, assessmentId },
       data: { calculatorEnabled: data.calculatorEnabled },
     })
  4. Return the updated assessment with questions:
     prisma.assessment.findUnique({
       where: { id: assessmentId },
       include: { questions: { orderBy: { order: 'asc' } } },
     })
```

**Rationale for `updateMany` + re-fetch:** Prisma's `updateMany` does not return updated records directly. A subsequent `findUnique` with `include: { questions }` is the idiomatic pattern in this codebase (consistent with how `update` returns the full assessment).

### 3. Route Handler — `src/controllers/assessment.controller.ts`

**Change:** Add `bulkUpdateCalculator` handler to `assessmentController`:

```
bulkUpdateCalculator: asyncHandler(async (req, res) => {
  const assessmentId = req.params['assessmentId'] as string;
  res.json(await assessmentService.bulkUpdateCalculator(assessmentId, req.body));
})
```

### 4. Routes — `src/routes/assessment.routes.ts`

**Change:** Register the new PATCH endpoint on `assessmentsRouter`:

```
assessmentsRouter.patch(
  '/:assessmentId/questions/calculator',
  authorize('teacher', 'admin'),
  validate(bulkUpdateCalculatorSchema),
  assessmentController.bulkUpdateCalculator,
);
```

**Auth chain:** `authenticate()` is applied globally at the root router level (`router.use(authenticate())`). The `authorize('teacher', 'admin')` call in the route file restricts this endpoint to teachers and admins, consistent with all other write routes on `assessmentsRouter`.

---

## Error Handling

All errors follow the existing centralized pattern via `AppError` / `NotFoundError` / `ValidationError`. The error handler in `src/middleware/errorHandler.ts` formats responses as:

```json
{ "error": { "code": "...", "message": "...", "details": {} } }
```

Error codes introduced by this feature:

| Code                         | Status | Trigger                                                             |
| ---------------------------- | ------ | ------------------------------------------------------------------- |
| `NOT_FOUND`                  | 404    | Assessment not found (via `NotFoundError`)                          |
| `QUESTION_NOT_IN_ASSESSMENT` | 422    | One or more `questionIds` do not belong to the specified assessment |
| `UNAUTHENTICATED`            | 401    | No valid session (global middleware)                                |
| `FORBIDDEN`                  | 403    | Role is not `teacher` or `admin` (global `authorize` middleware)    |
| `VALIDATION_FAILED`          | 400    | Zod validation error on request body (global `validate` middleware) |

The `QUESTION_NOT_IN_ASSESSMENT` error is thrown as:

```ts
throw new AppError(
	'QUESTION_NOT_IN_ASSESSMENT',
	'One or more question IDs do not belong to this assessment',
	422,
);
```

---

## Affected Endpoints Summary

| Method  | Path                                                  | Change                                                                        |
| ------- | ----------------------------------------------------- | ----------------------------------------------------------------------------- |
| `POST`  | `/api/assessments/:assessmentId` (via `create`)       | `calculatorEnabled` now accepted in each question object (schema change only) |
| `PUT`   | `/api/assessments/:assessmentId`                      | `calculatorEnabled` now accepted per question (schema change only)            |
| `PATCH` | `/api/assessments/:assessmentId/questions/calculator` | **New endpoint** — bulk-update `calculatorEnabled` for a set of questions     |

---

## Response Shape Changes

The `AssessmentQuestion` object returned by all assessment endpoints gains the `calculatorEnabled` field. Since Prisma selects all scalar fields by default and the codebase uses `include: { questions }` without an explicit `select`, this field will appear in all question payloads automatically once the migration is applied — no include/select modifications are needed.

---

## Dependencies

No new npm packages required. All changes use existing Prisma, Zod, Express, and TypeScript capabilities already present in the codebase.

---

## No Schema Changes Required for Existing Models

No other models are affected. The cascade hierarchy (`User → Course → Unit → Lesson → Assessment → AssessmentQuestion`) is unchanged. The `AssessmentQuestion` cascade delete from `Assessment` continues to function without modification.
