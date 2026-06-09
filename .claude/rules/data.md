# Data Rules

Load on-demand when encountering database schema or migration files.
Read `CLAUDE.md` for the project's database and ORM conventions.

## Schema Conventions

- All IDs are UUIDs (`String @id @default(uuid())`). Never use auto-incrementing integers.
- Table names use `@@map("snake_case_plural")` to match PostgreSQL conventions. Model names are PascalCase in Prisma.
- Column names are camelCase in the Prisma schema. Prisma auto-maps to snake_case in PostgreSQL via `@@map` / `@map` where needed.
- Every model that represents user-created content must have `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`.
- Models with soft deletes (`Course`, `Unit`, `Lesson`, `Assessment`) have `deletedAt DateTime?`. New models in the content hierarchy should follow this pattern.
- Models outside the content hierarchy (completions, attempts, notes) use hard deletes.
- Freeform JSON columns (`Json` type) are used for `LessonResource.content`, `LessonTool.content`, and `AssessmentQuestion.content`. The shape is determined by the `type` enum — never add JSON schema validation at the database level.
- Enum values use `snake_case`: `lesson_quiz`, `flash_card`, `multiple_choice`.
- Foreign key fields are named `<parentModel>Id` in camelCase: `courseId`, `unitId`, `lessonId`.
- All relationships must have explicit `onDelete` behavior. Use `Cascade` for parent-child ownership. Use `Restrict` or `SetNull` for cross-references.
- Ordered collections (`Unit`, `Lesson`, `LessonResource`, `LessonTool`, `AssessmentQuestion`) have an `order Int` field. Default to the next available integer on creation.

## Migrations

- Always generate migrations with `npx prisma migrate dev --name <descriptive_snake_case_name>`.
- Migration names should describe the change: `add_deleted_at_to_assessments`, `create_lesson_completion_table`. Never use generic names like `update` or `changes`.
- Never edit a migration file after it has been applied to any environment. Create a new migration to fix issues.
- Never combine unrelated schema changes in a single migration. One logical change per migration.
- After generating a migration, review the SQL to verify it matches your intent — Prisma sometimes generates unexpected operations (e.g., dropping and recreating indexes).
- Run `npx prisma generate` after schema changes to update the client types.

## Destructive Operations

- Soft deletes: set `deletedAt = new Date()` instead of `DELETE`. Use the cascade helpers in `src/utils/softDelete.ts` which walk the hierarchy in a `$transaction`.
- Never add `ON DELETE CASCADE` at the database level for soft-deletable models — cascade logic is handled in application code to set `deletedAt` on children.
- Hard deletes are acceptable for: completions, attempts, student notes, resource completions — models without `deletedAt`.
- Never drop a column or table in the same migration/PR that removes the code using it. Use expand-contract:
  1. First PR: remove all code references to the column/table.
  2. Second PR: drop the column/table via migration.
- Index drops follow the same expand-contract pattern if the index backs a query path.

## Querying

- Always import the Prisma singleton from `src/lib/prisma.ts` — never instantiate `PrismaClient` elsewhere.
- Always filter `where: { deletedAt: null }` on reads for soft-deletable models. Forgetting this filter will surface deleted records to users.
- Use `findFirst` (not `findUnique`) when combining `id` with `deletedAt: null` — `findUnique` only accepts fields in a `@@unique` or `@id` constraint.
- Use `assertExists(prisma.model, id, 'Label')` for simple existence checks on non-soft-deleted models. For soft-deleted models, use `findFirst` manually and throw `NotFoundError` if null.
- Use `select` or `include` explicitly — never return `findMany()` without scoping the fields. Avoid leaking internal fields like `deletedAt` to the client unless needed.
- Use `orderBy` on every `findMany` that returns user-visible data. Default to `order: 'asc'` for ordered collections, `createdAt: 'desc'` for chronological lists.
- Use `$transaction(async tx => { ... })` for multi-step writes. Pass `tx` to all operations within the block. Never mix `tx` and the global `prisma` inside a transaction.
- Avoid N+1 queries — use `include` for related data needed in the same response. If you need data from multiple unrelated models, use `Promise.all()` with separate queries.
- Use `_count` for aggregate counts instead of fetching full records: `include: { _count: { select: { lessons: true } } }`.

## Seeding

- Seed script is at `prisma/seed.ts`. Run with: `node --env-file=.env --import=tsx/esm prisma/seed.ts`.
- Do NOT use `prisma db seed` — the seed script requires the `--env-file` flag.
- Seed data should be idempotent — safe to run multiple times without duplicating records. Use `upsert` where possible.

## Sensitive Data

- Never store plaintext passwords. better-auth handles password hashing — do not implement custom password handling.
- Never log or return `password`, `token`, `secret`, or session data in API responses.
- Never include `deletedAt` timestamps in client-facing responses — they are internal bookkeeping.
- Database connection strings (`DATABASE_URL`) live in `server/.env` only. Never commit `.env` files.
- The `User` model's `email` is PII — never log it at `info` level or include in bulk list responses without justification.
