---
id: cm-0002
title: Redesign Lesson Detail Page Layout
stage: design
status: approved
approver: human
approved_at: 2026-04-27T00:00:00Z
---

# Backend Plan — cm-0002: Redesign Lesson Detail Page Layout

## Summary of Changes

This feature introduces two boolean fields (`isRequired`) on `LessonResource` and `LessonTool`, exposes them through existing PATCH-style endpoints (via the existing `PUT /resources/:resourceId` and `PUT /tools/:toolId` routes — no new routes needed), enriches the `GET /lessons/:lessonId/resource-completions` response to include `isRequired` metadata, and updates the lesson completion gating logic at `POST /lessons/:lessonId/complete` to only require items marked `isRequired: true`.

---

## Layer Structure

### Route Handlers

All routes follow the existing mount pattern in `server/src/routes/index.ts`. No new route files are required. Changes are confined to schema, service, and controller layers.

**Modified routes (existing files):**

| File | Change |
|---|---|
| `server/src/routes/lesson-resource.routes.ts` | No structural change; the existing `PUT /:resourceId` route already accepts `authorize('teacher', 'admin')` + `validate(updateLessonResourceSchema)` — schema update only |
| `server/src/routes/lesson-tool.routes.ts` | Same as above |
| `server/src/routes/resource-completion.routes.ts` | No structural change; service response shape enriched |

**No new route files.**

---

### Schema Layer (Zod)

**File: `server/src/schemas/lesson-resource.schema.ts`**

Add `isRequired` as an optional boolean to `updateLessonResourceSchema`. It must not be in `createLessonResourceSchema` because the database default (`true`) handles the initial value on create — teachers only toggle it after creation.

```typescript
// createLessonResourceSchema — unchanged
// updateLessonResourceSchema — add:
isRequired: z.boolean().optional()
```

**File: `server/src/schemas/lesson-tool.schema.ts`**

Same pattern:

```typescript
// updateLessonToolSchema — add:
isRequired: z.boolean().optional()
```

---

### Service Layer

**File: `server/src/services/lesson-resource.service.ts`**

`findAllByLesson` — no change to signature; `isRequired` is a scalar field and will be returned automatically by `prisma.lessonResource.findMany` once the migration adds it.

`update` — no change to implementation; Prisma `update` passes through `req.body` (already typed via `UpdateLessonResourceInput`), so adding `isRequired` to the schema type is sufficient.

**File: `server/src/services/lesson-tool.service.ts`**

Same as above for `lessonToolService.update` and `findAllByLesson`.

**File: `server/src/services/resource-completion.service.ts`**

`getByLesson` must be enriched to return `isRequired` for each resource/tool tracked in the completion set, plus return all required resources/tools regardless of completion status so the client can determine quiz lock state.

Pseudocode for enriched `getByLesson`:

```
async getByLesson(lessonId, userId):
  // Fetch all completions for this user+lesson
  completions = prisma.lessonResourceCompletion.findMany({
    where: { lessonId, userId },
    select: { resourceType, resourceId }
  })

  // Fetch all resources and tools for the lesson to get isRequired
  [resources, tools] = await Promise.all([
    prisma.lessonResource.findMany({ where: { lessonId }, select: { id, isRequired } }),
    prisma.lessonTool.findMany({ where: { lessonId }, select: { id, isRequired } })
  ])

  // Build a lookup: resourceId -> isRequired
  requiredMap = Map from [...resources, ...tools] keyed by id

  // Annotate completions with isRequired
  annotatedCompletions = completions.map(c => ({
    resourceType: c.resourceType,
    resourceId: c.resourceId,
    isRequired: requiredMap.get(c.resourceId) ?? true  // default true if not found
  }))

  // Also return the full required set so client can gate the quiz
  requiredItems = [
    ...resources.map(r => ({ resourceType: 'resource', resourceId: r.id, isRequired: r.isRequired })),
    ...tools.map(t => ({ resourceType: 'tool', resourceId: t.id, isRequired: t.isRequired }))
  ]

  return { completions: annotatedCompletions, requiredItems }
```

**File: `server/src/services/progress.service.ts`**

No changes required. Progress service derives lesson completion from `AssessmentAttempt.passed`, which is set by the assessment flow. The lesson completion endpoint (which previously wrote to `LessonCompletion`) is checked below. The spec's requirement is that the quiz gating (i.e., when can a student take the quiz) is enforced client-side using the enriched completion data; server-side progress scoring already keys off `AssessmentAttempt.passed`.

**Completion gating analysis:**

Looking at `progress.service.ts`, lesson completion is determined by `l.assessment?.attempts[0]?.passed === true` — i.e., passing the quiz. There is no server-side enforcement that all required resources must be complete before a quiz attempt is accepted. The spec says "lesson completion = all required assignments done + quiz done" and the quiz item in the sidebar is "visually locked" client-side.

The existing `POST /lessons/:lessonId/complete` and `DELETE /lessons/:lessonId/complete` routes manage `LessonCompletion` records — but progress scoring ignores `LessonCompletion` entirely (it reads `AssessmentAttempt`). This means the `complete` endpoints are used for a different purpose or are legacy.

**Decision: Server-side quiz attempt gating.** The spec requires lesson completion to be gated on required items. To enforce this at the server boundary (not just client-side), the `POST /assessments/:assessmentId/attempts` handler should verify that all required resources and tools have completion records before accepting an attempt for a `lesson_quiz`. This is the correct enforcement point.

**File: `server/src/services/assessment.service.ts`** (new guard in attempt creation)

Pseudocode for required-completion guard in `createAttempt`:

```
async createAttempt(assessmentId, userId, answers):
  assessment = prisma.assessment.findUnique({ where: { id: assessmentId }, include: { lesson: true } })
  if not assessment: throw NotFoundError

  if assessment.type === 'lesson_quiz' and assessment.lessonId:
    lessonId = assessment.lessonId

    // Fetch all required resources and tools for the lesson
    [requiredResources, requiredTools] = await Promise.all([
      prisma.lessonResource.findMany({ where: { lessonId, isRequired: true }, select: { id } }),
      prisma.lessonTool.findMany({ where: { lessonId, isRequired: true }, select: { id } })
    ])

    if requiredResources.length > 0 or requiredTools.length > 0:
      // Fetch user's completions for this lesson
      completions = prisma.lessonResourceCompletion.findMany({
        where: { lessonId, userId },
        select: { resourceId }
      })
      completedIds = Set(completions.map(c => c.resourceId))

      allRequiredIds = [
        ...requiredResources.map(r => r.id),
        ...requiredTools.map(t => t.id)
      ]

      allComplete = allRequiredIds.every(id => completedIds.has(id))
      if not allComplete:
        throw new AppError(400, 'REQUIRED_ASSIGNMENTS_INCOMPLETE',
          'All required assignments must be completed before taking the quiz')

  // ... proceed with existing grading logic
```

---

### Controller Layer

**File: `server/src/controllers/resource-completion.controller.ts`**

`getCompletions` — response shape changes to `{ completions, requiredItems }` to match the enriched service return.

```typescript
getCompletions: asyncHandler(async (req, res) => {
  const lessonId = req.params['lessonId'] as string;
  const userId = req.user!.id;
  const data = await resourceCompletionService.getByLesson(lessonId, userId);
  res.json(data);  // { completions, requiredItems }
}),
```

**File: `server/src/controllers/assessment.controller.ts`**

No structural changes; the guard logic lives in the service layer.

---

## Schema Changes

### Phase 1 — Add `isRequired` fields (non-destructive, safe to deploy immediately)

Add to `LessonResource`:
```prisma
isRequired Boolean @default(true)
```

Add to `LessonTool`:
```prisma
isRequired Boolean @default(true)
```

Both fields use `@default(true)` so all existing rows are automatically backfilled with `true` by Prisma's migration. No data migration script is required.

**Migration command:**
```bash
npm run db:migrate
# Migration name suggestion: add_is_required_to_resource_and_tool
```

No cascade implications. No new models. No new enums.

### Phase 2 (not required for this feature)

No destructive changes. No expand-contract phases needed beyond Phase 1.

---

## Error Handling

All new errors follow the project's existing `AppError` pattern returning:
```json
{ "error": { "code": "...", "message": "...", "details": {} } }
```

New error codes introduced:

| Code | HTTP Status | Trigger |
|---|---|---|
| `REQUIRED_ASSIGNMENTS_INCOMPLETE` | 400 | Attempt to submit a `lesson_quiz` attempt when not all `isRequired` resources/tools have completion records |

All existing error codes (`NOT_FOUND`, `FORBIDDEN`, `UNAUTHORIZED`, `VALIDATION_ERROR`, `CONFLICT`) remain unchanged.

The Prisma error handler in `errorHandler.ts` already covers `P2025` (→ 404) and `P2002` (→ 409) — no additions needed there.

---

## Validation

**`updateLessonResourceSchema`** (updated):
```typescript
z.object({
  type: z.enum(['note', 'video', 'lecture']).optional(),
  title: z.string().min(1).optional(),
  content: z.record(z.any()).optional(),
  order: z.number().int().min(0).optional(),
  isRequired: z.boolean().optional(),   // NEW
})
```

**`updateLessonToolSchema`** (updated):
```typescript
z.object({
  type: z.enum(['flash_card', 'practice_problem', 'vocab']).optional(),
  title: z.string().min(1).optional(),
  content: z.record(z.any()).optional(),
  order: z.number().int().min(0).optional(),
  isRequired: z.boolean().optional(),   // NEW
})
```

Create schemas remain unchanged — `isRequired` is not accepted at creation time; the database default handles it.

---

## Affected Files Summary

| File | Change Type |
|---|---|
| `server/prisma/schema.prisma` | Add `isRequired Boolean @default(true)` to `LessonResource` and `LessonTool` |
| `server/src/schemas/lesson-resource.schema.ts` | Add `isRequired: z.boolean().optional()` to update schema |
| `server/src/schemas/lesson-tool.schema.ts` | Add `isRequired: z.boolean().optional()` to update schema |
| `server/src/services/resource-completion.service.ts` | Enrich `getByLesson` to return `requiredItems` alongside `completions` |
| `server/src/services/assessment.service.ts` | Add required-completion guard before `lesson_quiz` attempt creation |
| `server/src/controllers/resource-completion.controller.ts` | Update `getCompletions` response shape to pass through `{ completions, requiredItems }` |

---

## Dependencies

No new npm packages required. All changes use existing Prisma 6, Zod 3, and Express 5 capabilities.
