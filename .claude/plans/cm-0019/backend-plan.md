---
id: cm-0019
title: Add @@map Directive to StudentNote Model
stage: design
status: approved
approver: human
approved_at: 2026-05-14T00:00:00Z
---

# Backend Plan: Add @@map Directive to StudentNote Model

## Overview

The `StudentNote` Prisma model currently maps to a PostgreSQL table named `StudentNote` (PascalCase). Every other model in this schema that has been explicitly mapped uses snake_case via `@@map`. This plan adds `@@map("student_note")` to the `StudentNote` model and applies a non-destructive `ALTER TABLE` rename migration.

No application code changes are required. Prisma Client references models by their Prisma model name (`StudentNote`), not the underlying table name. After the migration, all existing runtime behavior and API endpoints remain unchanged.

---

## Layer Structure

No route handlers, service functions, or controllers are added or modified.

The only code-layer change is one line in the Prisma schema file.

---

## Schema Changes

### Current State

```prisma
model StudentNote {
  id        String   @id @default(uuid())
  content   String
  lessonId  String
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  lesson Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([lessonId, userId])
  @@index([userId])
  @@index([lessonId])
}
```

The PostgreSQL table is currently named `StudentNote`.

### Target State

Add `@@map("student_note")` as the final block-level directive, consistent with the ordering used by all other mapped models in this schema (e.g., `lesson_completion`, `unit_completion`, `lesson_resource`):

```prisma
model StudentNote {
  id        String   @id @default(uuid())
  content   String
  lessonId  String
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  lesson Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([lessonId, userId])
  @@index([userId])
  @@index([lessonId])
  @@map("student_note")
}
```

### Migration Strategy: Non-Destructive Rename (NFR-01)

**Critical:** When Prisma detects a `@@map` change where it cannot reconcile the rename automatically, it may generate a destructive migration containing `DROP TABLE "StudentNote"` followed by `CREATE TABLE "student_note"`. This would destroy all existing student note data. The migration SQL must be inspected and corrected before application.

The correct SQL for a non-destructive rename is:

```sql
ALTER TABLE "StudentNote" RENAME TO "student_note";
```

This is a metadata-only operation in PostgreSQL — no rows are moved or rewritten.

---

## Implementation Steps

### Step 1: Edit the Prisma Schema

File: `server/prisma/schema.prisma`

Add `@@map("student_note")` to the `StudentNote` model block, after the existing `@@index([lessonId])` directive and before the closing brace.

### Step 2: Generate the Migration (dry run)

Run:

```bash
cd server && npx prisma migrate dev --name add_student_note_map --create-only
```

The `--create-only` flag generates the migration SQL file without applying it, allowing inspection before execution.

The generated file will be located at:

```
server/prisma/migrations/<timestamp>_add_student_note_map/migration.sql
```

### Step 3: Inspect and Correct the Migration SQL

Open the generated `migration.sql` and check its contents.

**Acceptable (safe):** If Prisma generated:
```sql
ALTER TABLE "StudentNote" RENAME TO "student_note";
```
No edit is needed — proceed to Step 4.

**Unacceptable (destructive):** If Prisma generated anything resembling:
```sql
DROP TABLE "StudentNote";
CREATE TABLE "student_note" (...);
```
Replace the entire file contents with:
```sql
ALTER TABLE "StudentNote" RENAME TO "student_note";
```

No other SQL statements are needed. The indexes on `userId` and `lessonId`, the unique constraint on `(lessonId, userId)`, the foreign key constraints referencing `lesson` and `user`, and all existing rows are automatically preserved by PostgreSQL on a table rename.

### Step 4: Apply the Migration

Run:

```bash
npm run db:migrate
```

This executes `prisma migrate dev`, which will detect the already-created migration file, apply it to the database, and record it in the `_prisma_migrations` table.

If running in a production-like environment, use `prisma migrate deploy` instead of `prisma migrate dev`.

### Step 5: Verify

After the migration applies, confirm the table rename succeeded using one of the following methods:

**Option A — Prisma Studio:**
```bash
npm run db:studio
```
The `StudentNote` model should appear and queries should return existing rows without error.

**Option B — Direct database query:**
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'student_note';
```
Should return one row. A query for `tablename = 'StudentNote'` should return zero rows.

**Option C — Application smoke test:**
Start the server and call `GET /api/lessons/:lessonId/student-notes` with a valid authenticated session. A 200 response confirms the Prisma Client resolves correctly to the renamed table.

---

## Error Handling

No new error handling is introduced. This change is purely a schema/database operation with no application code modifications.

---

## Validation

No new Zod schemas are introduced. No request validation changes.

---

## Dependencies

No new npm packages required. This change uses only the existing Prisma CLI (`prisma`) already present in `server/package.json`.

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|---|---|---|
| Prisma generates destructive DROP+CREATE | Medium | Use `--create-only` flag and inspect before applying (Step 2-3) |
| Foreign key or index names referencing old table name break | Low | PostgreSQL automatically updates constraint/index names on `ALTER TABLE RENAME`; no manual update needed |
| Migration applied in CI without inspection | Low | Document that CI pipelines must run `prisma migrate deploy` only after the migration file has been committed and reviewed |

---

## Notes

- The `server/CLAUDE.md` note states "Schema applied via `prisma db push` (dev) — migration history in `prisma/migrations/` is superseded." If the project is exclusively using `db push` for development, substitute Steps 2-4 with `npx prisma db push` directly. However, because this rename must be non-destructive and `db push` may also generate a destructive diff, the `migrate dev --create-only` + manual inspection approach is safer and is the recommended path per this plan.
- After migration, run `npx prisma generate` if the Prisma Client is not auto-regenerated, to ensure the client's internal table mapping is up to date.
