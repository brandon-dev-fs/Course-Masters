---
id: cm-0016
title: Database Schema Data Integrity Fixes
stage: design
status: approved
approver: human
approved_at: 2026-05-13T00:00:00Z
---

## Overview

This plan implements four data integrity fixes:
1. Split polymorphic `LessonResourceCompletion` into two typed tables
2. Add a `CHECK` constraint on `Assessment` enforcing exactly one owner FK
3. Add a `BEFORE INSERT/UPDATE` trigger on `assignment` enforcing sub-table existence
4. Merge `PracticeQuestionType` enum into `QuestionType` and drop the duplicate

No production data migration is required for any of these changes (the existing
`LessonResourceCompletion` table has no production data; the enum values are
identical; existing Assessment rows must be audited and cleaned before the
constraint is applied — see Step 2).

---

## Layer Structure

### Files modified

| Layer | File | Change |
|---|---|---|
| Schema | `server/prisma/schema.prisma` | Drop `LessonResourceCompletion`, add `LessonResourceCompletion` + `LessonToolCompletion`, update `User`/`Lesson` relations, drop `PracticeQuestionType`, update `PracticeProblemQuestion.type` |
| Raw SQL | `server/prisma/raw/cm-0016-constraints.sql` | CHECK constraint + trigger (new file) |
| Service | `server/src/services/resource-completion.service.ts` | Rewrite for split tables |
| Schema/Validation | `server/src/schemas/resource-completion.schema.ts` | Update Zod schema for new request shape |
| Controller | `server/src/controllers/resource-completion.controller.ts` | Update body destructuring |
| Routes | `server/src/routes/resource-completion.routes.ts` | No structural change needed |

---

## Step 1: Prisma Schema Changes

### 1a. Replace polymorphic `LessonResourceCompletion`

Remove the existing model:

```prisma
// DELETE this model entirely:
model LessonResourceCompletion {
  id           String   @id @default(uuid())
  userId       String
  lessonId     String
  resourceType String
  resourceId   String
  completedAt  DateTime @default(now())
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  lesson Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  @@unique([userId, resourceType, resourceId])
  @@index([userId, lessonId])
  @@map("lesson_resource_completions")
}
```

Add two typed replacement models:

```prisma
model LessonResourceCompletion {
  id          String   @id @default(uuid())
  userId      String
  resourceId  String
  completedAt DateTime @default(now())

  user     User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  resource LessonResource @relation(fields: [resourceId], references: [id], onDelete: Cascade)

  @@unique([userId, resourceId])
  @@index([userId])
  @@map("lesson_resource_completion")
}

model LessonToolCompletion {
  id          String   @id @default(uuid())
  userId      String
  toolId      String
  completedAt DateTime @default(now())

  user User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  tool LessonTool @relation(fields: [toolId], references: [id], onDelete: Cascade)

  @@unique([userId, toolId])
  @@index([userId])
  @@map("lesson_tool_completion")
}
```

### 1b. Update `User` model relations

Replace:
```prisma
resourceCompletions   LessonResourceCompletion[]
```
With:
```prisma
resourceCompletions   LessonResourceCompletion[]
toolCompletions       LessonToolCompletion[]
```

Remove the `LessonResourceCompletion[]` relation from `Lesson` (the old model
used `lessonId`; the new models navigate through `resource.lessonId` or
`tool.lessonId`, so no direct `lessonId` FK exists on the completion rows).

### 1c. Update `LessonResource` and `LessonTool` back-relations

Add to `LessonResource`:
```prisma
completions LessonResourceCompletion[]
```

Add to `LessonTool`:
```prisma
completions LessonToolCompletion[]
```

### 1d. Merge `PracticeQuestionType` into `QuestionType`

Remove the `PracticeQuestionType` enum entirely (values are identical to
`QuestionType`: `multiple_choice`, `true_false`, `matching`, `fill_in_blank`).

Update `PracticeProblemQuestion.type`:
```prisma
// Before:
type PracticeQuestionType

// After:
type QuestionType
```

No data migration is needed — the underlying DB column stores string values
and the values are identical.

---

## Step 2: Raw SQL — CHECK Constraint and Trigger

Prisma does not support `CHECK` constraints or trigger functions in its schema
DSL. These must be applied via raw SQL.

### Delivery mechanism

Create `server/prisma/raw/cm-0016-constraints.sql`. This file is applied
manually (or via the seed script) using `prisma.$executeRawUnsafe` after
`prisma db push`. Document this in the project README / CLAUDE.md under
"Post-push SQL."

Alternative (preferred for repeatability): extend `server/prisma/seed.ts` with
an idempotent raw SQL block that runs at seed time using `CREATE OR REPLACE`
and `IF NOT EXISTS` patterns.

### Pre-constraint audit

Before applying the `CHECK` constraint, run this cleanup query to find and
delete any malformed assessment rows:

```sql
-- Identify violations
SELECT id, "lessonId", "unitId", "courseId"
FROM assessment
WHERE (
  ("lessonId" IS NOT NULL)::int +
  ("unitId"   IS NOT NULL)::int +
  ("courseId" IS NOT NULL)::int
) <> 1;

-- Delete violations (adjust as appropriate for the environment)
DELETE FROM assessment
WHERE (
  ("lessonId" IS NOT NULL)::int +
  ("unitId"   IS NOT NULL)::int +
  ("courseId" IS NOT NULL)::int
) <> 1;
```

### CHECK constraint on `assessment`

```sql
ALTER TABLE assessment
  DROP CONSTRAINT IF EXISTS chk_assessment_single_owner,
  ADD CONSTRAINT chk_assessment_single_owner
    CHECK (
      (("lessonId" IS NOT NULL)::int +
       ("unitId"   IS NOT NULL)::int +
       ("courseId" IS NOT NULL)::int) = 1
    );
```

### BEFORE INSERT/UPDATE trigger on `assignment`

```sql
CREATE OR REPLACE FUNCTION enforce_assignment_subtype()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Verify exactly one sub-table row exists for the declared type
  IF NEW.type = 'note' THEN
    IF NOT EXISTS (SELECT 1 FROM note_assignment WHERE "assignmentId" = NEW.id) THEN
      RAISE EXCEPTION 'assignment % declared type=note but no note_assignment row exists', NEW.id;
    END IF;
  ELSIF NEW.type = 'video' THEN
    IF NOT EXISTS (SELECT 1 FROM video_assignment WHERE "assignmentId" = NEW.id) THEN
      RAISE EXCEPTION 'assignment % declared type=video but no video_assignment row exists', NEW.id;
    END IF;
  ELSIF NEW.type = 'reading' THEN
    IF NOT EXISTS (SELECT 1 FROM reading_assignment WHERE "assignmentId" = NEW.id) THEN
      RAISE EXCEPTION 'assignment % declared type=reading but no reading_assignment row exists', NEW.id;
    END IF;
  ELSIF NEW.type = 'vocab' THEN
    IF NOT EXISTS (SELECT 1 FROM vocab_assignment WHERE "assignmentId" = NEW.id) THEN
      RAISE EXCEPTION 'assignment % declared type=vocab but no vocab_assignment row exists', NEW.id;
    END IF;
  ELSIF NEW.type = 'practice_problem' THEN
    IF NOT EXISTS (SELECT 1 FROM practice_problem_assignment WHERE "assignmentId" = NEW.id) THEN
      RAISE EXCEPTION 'assignment % declared type=practice_problem but no practice_problem_assignment row exists', NEW.id;
    END IF;
  ELSE
    RAISE EXCEPTION 'assignment % has unknown type: %', NEW.id, NEW.type;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assignment_subtype ON assignment;
CREATE CONSTRAINT TRIGGER trg_assignment_subtype
  AFTER INSERT OR UPDATE ON assignment
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION enforce_assignment_subtype();
```

**Note on trigger timing**: Using `AFTER INSERT ... DEFERRABLE INITIALLY DEFERRED`
allows the parent `assignment` row and the sub-table row to be inserted in the
same transaction without ordering constraints. The trigger fires at transaction
commit. The service layer already creates both rows in a single Prisma
transaction (`$transaction`), so this is compatible with existing patterns.

---

## Step 3: Service Layer — `resource-completion.service.ts`

Full rewrite. The new service queries `LessonResourceCompletion` and
`LessonToolCompletion` separately and merges the results.

### `getByLesson(lessonId, userId)`

Pseudocode:
```
1. Run three parallel Prisma queries:
   a. prisma.lessonResourceCompletion.findMany
        where: { resource: { lessonId }, userId }
        select: { resourceId, completedAt }
   b. prisma.lessonToolCompletion.findMany
        where: { tool: { lessonId }, userId }
        select: { toolId, completedAt }
   c. prisma.lessonResource.findMany
        where: { lessonId }
        select: { id, isRequired }
      + prisma.lessonTool.findMany
        where: { lessonId }
        select: { id, isRequired }
      (can be combined into two queries or four total — four is fine)

2. Build completedResourceIds = Set from step a results
3. Build completedToolIds = Set from step b results

4. Build requiredItems array:
   - For each resource: { type: 'resource', targetId: id, isRequired, completed: completedResourceIds.has(id) }
   - For each tool: { type: 'tool', targetId: id, isRequired, completed: completedToolIds.has(id) }

5. Return { completions: [...resourceCompletions, ...toolCompletions], requiredItems }
   where each completion entry has shape: { type: 'resource'|'tool', targetId, completedAt }
```

### `toggle(lessonId, userId, type, targetId)`

Pseudocode:
```
if type === 'resource':
  1. Verify prisma.lessonResource.findUnique({ where: { id: targetId } })
     - must exist AND resource.lessonId === lessonId, else throw NotFoundError
  2. Check existing = prisma.lessonResourceCompletion.findUnique
       where: { userId_resourceId: { userId, resourceId: targetId } }
  3. If exists → delete; else → create { userId, resourceId: targetId }

else if type === 'tool':
  1. Verify prisma.lessonTool.findUnique({ where: { id: targetId } })
     - must exist AND tool.lessonId === lessonId, else throw NotFoundError
  2. Check existing = prisma.lessonToolCompletion.findUnique
       where: { userId_toolId: { userId, toolId: targetId } }
  3. If exists → delete; else → create { userId, toolId: targetId }

else:
  throw ValidationError('INVALID_TYPE', 'type must be resource or tool')

4. Return getByLesson(lessonId, userId)
```

### Function signatures

```typescript
interface CompletionItem {
  type: 'resource' | 'tool';
  targetId: string;
  completedAt: Date;
}

interface RequiredItem {
  type: 'resource' | 'tool';
  targetId: string;
  isRequired: boolean;
  completed: boolean;
}

interface CompletionResult {
  completions: CompletionItem[];
  requiredItems: RequiredItem[];
}

export const resourceCompletionService = {
  async getByLesson(lessonId: string, userId: string): Promise<CompletionResult>
  async toggle(lessonId: string, userId: string, type: 'resource' | 'tool', targetId: string): Promise<CompletionResult>
}
```

---

## Step 4: Schema/Validation Changes — `resource-completion.schema.ts`

Replace the current `toggleCompletionSchema`:

```typescript
// Before:
export const toggleCompletionSchema = z.object({
  resourceType: z.enum(['lessonPlan', 'note', 'video', 'lecture', 'flash_card', 'practice_problem', 'vocab']),
  resourceId: z.string().uuid(),
});

// After:
export const toggleCompletionSchema = z.object({
  type: z.enum(['resource', 'tool']),
  targetId: z.string().uuid(),
});

export type ToggleCompletionInput = z.infer<typeof toggleCompletionSchema>;
```

---

## Step 5: Controller Changes — `resource-completion.controller.ts`

Update `toggleCompletion` to destructure the new field names:

```typescript
// Before:
const { resourceType, resourceId } = req.body;
const data = await resourceCompletionService.toggle(lessonId, userId, resourceType, resourceId);

// After:
const { type, targetId } = req.body;
const data = await resourceCompletionService.toggle(lessonId, userId, type, targetId);
```

The `getCompletions` handler needs no changes to its logic, but its response
shape changes implicitly via the service rewrite.

---

## Step 6: Route Changes — `resource-completion.routes.ts`

No structural route changes. The `requireSelf` guard remains in place on POST.
The `validate(toggleCompletionSchema)` middleware validates the updated body shape.

Note: the current mount point in `server/src/routes/index.ts` is
`/lessons/:lessonId/completions` (not `/lessons/:lessonId/resource-completions`
as CLAUDE.md states). The mount point is unchanged by this spec. The API
contract documents it under its actual live path.

---

## Step 7: TypeScript Type Changes

- `PracticeQuestionType` Prisma enum is removed. Any TypeScript code importing
  or referencing `PracticeQuestionType` from `@prisma/client` must be updated
  to use `QuestionType`. Scope this search to `server/src/`.
- The `User` Prisma type gains `toolCompletions: LessonToolCompletion[]`.
- The `Lesson` Prisma type loses the `resourceCompletions` back-relation (it no
  longer has a direct FK). Any progress or other service code selecting
  `resourceCompletions` via `lesson.include` must be removed or rewritten.
- Verify `server/src/services/progress.service.ts` — confirmed it does NOT query
  `resourceCompletions`; no changes needed there.

---

## Step 8: `prisma db push` Sequence

Because this project uses `prisma db push` (not `prisma migrate dev`), the
sequence is:

```
1. Apply schema.prisma changes (Steps 1a–1d)
2. npm run db:push       # drops old table, creates two new tables, updates enum usage
3. Apply raw SQL manually or via seed:
   psql $DATABASE_URL -f server/prisma/raw/cm-0016-constraints.sql
   # or extend seed.ts to call prisma.$executeRawUnsafe(sql)
```

---

## Schema Changes Summary

| Change | Type | Migration risk |
|---|---|---|
| Drop `lesson_resource_completions` table | Destructive | No production data — safe |
| Create `lesson_resource_completion` table | Additive | None |
| Create `lesson_tool_completion` table | Additive | None |
| Drop `PracticeQuestionType` enum | Destructive | Values identical to `QuestionType` — safe |
| Update `practice_problem_question.type` column | Modify | No value changes — safe |
| ADD CONSTRAINT `chk_assessment_single_owner` | Additive | Requires pre-constraint cleanup query |
| CREATE TRIGGER `trg_assignment_subtype` | Additive | Deferred trigger — compatible with existing transaction patterns |

---

## Error Handling

Use existing error types from `server/src/errors/`:
- `NotFoundError` — when `targetId` does not exist in the expected table or does not belong to the given `lessonId`
- `ValidationError` — invalid `type` value (caught by Zod before reaching the service)
- Prisma `P2002` → `409 CONFLICT` via `errorHandler.ts` (unique constraint violation — already handled globally)
- Prisma `P2003` → FK violation (e.g. referencing deleted resource) — `errorHandler.ts` maps this to 400

---

## No New Dependencies

All changes use existing stack: Prisma 6, Zod 3, Express 5, TypeScript 5.
No new npm packages required.
