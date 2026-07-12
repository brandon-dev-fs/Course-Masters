---
id: cm-0008
title: Add Query Parameter Validation for Resource and Tool List Endpoints
stage: design
status: approved
approver: human
approved_at: 2026-05-07T00:00:00Z
---

# Backend Implementation Plan — cm-0008

## Overview

Add Zod-based query parameter validation to the `GET /lessons/:lessonId/resources` and `GET /lessons/:lessonId/tools` handlers. Invalid `type` query param values must be rejected with HTTP 400 before reaching the controller. Valid or absent `type` values preserve existing behavior.

No schema changes. No new npm packages. No changes to the service or data layers.

---

## Layer Structure

### Validation approach

The existing `validate` middleware in `server/src/middleware/validate.ts` only validates `req.body`. This spec requires validation of `req.query`. Rather than altering the signature of the existing `validate` middleware (which would risk breaking all body-validation call sites), a new parallel middleware factory `validateQuery` will be added to the same file. It follows an identical pattern but parses `req.query` instead of `req.body` and writes the parsed result back to `req.query`.

### Data flow per request

1. Request arrives at the router.
2. `validateQuery(schema)` middleware executes.
   - If `req.query.type` is present and not a valid enum member, call `next(new ValidationError(...))` and return. The global `errorHandler` formats the 400 response.
   - If `req.query.type` is absent or valid, write parsed data back to `req.query` and call `next()`.
3. Controller reads `req.query['type']` — now guaranteed to be a valid enum value or `undefined`.
4. Controller calls the service layer unchanged.

---

## Files to Modify

### 1. `server/src/middleware/validate.ts`

Add a `validateQuery` factory function below the existing `validate` function. Do not modify `validate`.

```typescript
export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const details = result.error.flatten().fieldErrors as Record<string, unknown>;
      next(new ValidationError('Invalid query parameters', details));
      return;
    }
    req.query = result.data as Record<string, string>;
    next();
  };
}
```

No changes to imports are needed — `ZodSchema`, `Request`, `Response`, `NextFunction`, and `ValidationError` are already imported.

---

### 2. `server/src/schemas/lesson-resource.schema.ts`

Add a query parameter schema at the bottom of the file, after the existing export types.

```typescript
// ── Query parameter schema ─────────────────────────────────────────────────

export const lessonResourceQuerySchema = z.object({
  type: z.enum(['note', 'video', 'lecture']).optional(),
});

export type LessonResourceQuery = z.infer<typeof lessonResourceQuerySchema>;
```

The enum values mirror the `ResourceType` Prisma enum (`note | video | lecture`). `optional()` ensures omitting `type` is valid and produces `undefined`, preserving the "return all" behavior.

---

### 3. `server/src/schemas/lesson-tool.schema.ts`

Add a query parameter schema at the bottom of the file, after the existing export types.

```typescript
// ── Query parameter schema ─────────────────────────────────────────────────

export const lessonToolQuerySchema = z.object({
  type: z.enum(['flash_card', 'practice_problem', 'vocab']).optional(),
});

export type LessonToolQuery = z.infer<typeof lessonToolQuerySchema>;
```

The enum values mirror the `ToolType` Prisma enum (`flash_card | practice_problem | vocab`). `optional()` preserves the "return all" behavior when `type` is omitted.

---

### 4. `server/src/routes/lesson-resource.routes.ts`

- Add `validateQuery` to the import from `../middleware/validate.js`.
- Add `lessonResourceQuerySchema` to the import from `../schemas/lesson-resource.schema.js`.
- Insert `validateQuery(lessonResourceQuerySchema)` as middleware on the `GET /` route, before the controller.

**Before:**
```typescript
import { validate } from '../middleware/validate.js';
import { createLessonResourceSchema, updateLessonResourceSchema } from '../schemas/lesson-resource.schema.js';
// ...
lessonResourcesRouter.get('/', lessonResourceController.getAll);
```

**After:**
```typescript
import { validate, validateQuery } from '../middleware/validate.js';
import { createLessonResourceSchema, updateLessonResourceSchema, lessonResourceQuerySchema } from '../schemas/lesson-resource.schema.js';
// ...
lessonResourcesRouter.get('/', validateQuery(lessonResourceQuerySchema), lessonResourceController.getAll);
```

No other changes to this file.

---

### 5. `server/src/routes/lesson-tool.routes.ts`

- Add `validateQuery` to the import from `../middleware/validate.js`.
- Add `lessonToolQuerySchema` to the import from `../schemas/lesson-tool.schema.js`.
- Insert `validateQuery(lessonToolQuerySchema)` as middleware on the `GET /` route, before the controller.

**Before:**
```typescript
import { validate } from '../middleware/validate.js';
import { createLessonToolSchema, updateLessonToolSchema } from '../schemas/lesson-tool.schema.js';
// ...
lessonToolsRouter.get('/', lessonToolController.getAll);
```

**After:**
```typescript
import { validate, validateQuery } from '../middleware/validate.js';
import { createLessonToolSchema, updateLessonToolSchema, lessonToolQuerySchema } from '../schemas/lesson-tool.schema.js';
// ...
lessonToolsRouter.get('/', validateQuery(lessonToolQuerySchema), lessonToolController.getAll);
```

No other changes to this file.

---

### 6. `server/src/controllers/lesson-resource.controller.ts`

Replace the unsafe cast of `req.query['type']` with a typed read. After the `validateQuery` middleware runs, `req.query['type']` is guaranteed to be a valid `ResourceType` enum value or `undefined` — no runtime cast needed, but we still need to assert the type for TypeScript.

**Before:**
```typescript
const type = req.query['type'] as ResourceType | undefined;
```

**After:**
```typescript
const type = req.query['type'] as ResourceType | undefined; // validated by validateQuery middleware
```

Note: the cast is still required because Express types `req.query` as `ParsedQs`, which does not narrow to `ResourceType`. The cast is now safe because validation has already run. Add the inline comment to document this guarantee explicitly. This is the minimum change needed; the controller logic is otherwise unchanged.

---

### 7. `server/src/controllers/lesson-tool.controller.ts`

Same pattern as the resource controller.

**Before:**
```typescript
const type = req.query['type'] as ToolType | undefined;
```

**After:**
```typescript
const type = req.query['type'] as ToolType | undefined; // validated by validateQuery middleware
```

---

## Schema Changes

None. This change is purely at the request validation layer. No new Prisma models, fields, enums, relations, or migrations are required.

---

## Error Handling

When `validateQuery` rejects an invalid `type` value, it calls `next(new ValidationError('Invalid query parameters', details))`. The existing global `errorHandler` middleware catches this and produces the project-standard 400 response:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": {
      "type": ["Invalid enum value. Expected 'note' | 'video' | 'lecture', received 'invalid'"]
    }
  }
}
```

The `details` field is produced by Zod's `flatten().fieldErrors`, which is identical to the pattern used by the existing `validate` body middleware. No changes to `errorHandler.ts` are needed.

---

## Validation

Query schemas use `z.object({ type: z.enum([...]).optional() })`. This means:
- `?type=note` → valid, passes `'note'` to the controller.
- `?type=invalid` → invalid, 400 with `VALIDATION_ERROR`.
- No `type` param → `type` is `undefined`, passes through; controller and service return all items.

Validation occurs in middleware before the controller executes, satisfying NFR-02.

---

## Dependencies

No new npm packages. `zod` is already in use. No changes to existing package versions.

---

## Implementation Order

1. `server/src/middleware/validate.ts` — add `validateQuery`.
2. `server/src/schemas/lesson-resource.schema.ts` — add `lessonResourceQuerySchema`.
3. `server/src/schemas/lesson-tool.schema.ts` — add `lessonToolQuerySchema`.
4. `server/src/routes/lesson-resource.routes.ts` — wire `validateQuery` into GET route.
5. `server/src/routes/lesson-tool.routes.ts` — wire `validateQuery` into GET route.
6. `server/src/controllers/lesson-resource.controller.ts` — add explanatory inline comment.
7. `server/src/controllers/lesson-tool.controller.ts` — add explanatory inline comment.

Steps 2–3 and 6–7 are independent and may be done in any order relative to each other. Step 1 must precede steps 4–5.
