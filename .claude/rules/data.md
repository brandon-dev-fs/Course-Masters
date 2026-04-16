# Data Rules

Loaded by: `backend-architect`, `backend-developer`, `code-reviewer`, `security-reviewer`.

## Stack

- Database: PostgreSQL
- ORM: Prisma
- Schema: `server/prisma/schema.prisma`
- Migrations: Prisma Migrate, files under `server/prisma/migrations/`

## Schema conventions

- Model names: PascalCase, singular (`User`, not `Users`).
- Field names: camelCase.
- Table names follow Prisma defaults unless `@@map` is needed.
- Primary keys: `id` of type `String @id @default(cuid())` unless a different type is justified.
- Timestamps: every model includes `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`.
- Soft delete: when needed, add `deletedAt DateTime?` rather than hard-deleting rows.

## Migrations

- Create migrations with `prisma migrate dev --name <descriptive_name>`.
- Migration names: snake_case, descriptive, present tense (`add_user_avatar_url`, not `migration_3` or `added_avatar`).
- Never edit a migration after it has been applied to any shared environment. Create a new migration instead.
- Never delete migration files.
- Always review the generated SQL before committing.

## Destructive operations (expand-contract pattern)

Destructive schema changes are **two-phase**. Never combine the destructive change with the code change that depends on it.

### Dropping a column or table

1. Migration A: deploy code that no longer reads or writes the column/table.
2. Migration B (in a later PR): drop the column/table.

### Renaming a column or table

Never use a true rename. Instead:

1. Migration A: add the new column.
2. Code change: dual-write to old and new, read from new with fallback to old.
3. Backfill migration: copy data from old to new.
4. Code change: stop reading/writing the old.
5. Migration B (later PR): drop the old column.

### Changing a column type

Treat as add-new + backfill + drop-old. Same five-step pattern as rename.

### Adding a NOT NULL column

1. Migration A: add the column as nullable with a default if appropriate.
2. Backfill migration: populate existing rows.
3. Migration B (later PR): add the NOT NULL constraint.

## Indexes

- Add indexes for any field used in `where`, `orderBy`, or as a foreign key target outside Prisma's automatic FK indexes.
- Document why each index exists in a `// index: <reason>` comment in the schema.
- Composite indexes: order columns by selectivity (most selective first).

## Querying

- Prefer Prisma client methods over raw SQL. Use `$queryRaw` only when Prisma cannot express the query, and document why.
- Always use parameterized queries. **Never interpolate user input into raw SQL strings.**
- Avoid N+1 queries. Use `include` or `select` to fetch related data in one round trip.
- Use `select` to limit returned fields when the full model is not needed, especially for fields that may contain sensitive data.

## Transactions

- Use `prisma.$transaction` for multi-step operations that must succeed or fail together.
- Keep transactions short. Do not perform external API calls inside a transaction.

## Seeding

- Seed scripts live at `server/prisma/seed.ts`.
- Seeds are idempotent: running twice produces the same database state.
- Production data is never seeded by code. Seeds are for development and test environments only.

## Sensitive data

- Never store passwords in plaintext. Better Auth handles credential storage.
- PII fields (email, name, etc.) are noted in schema comments.
- Never log raw query results that may contain PII (see `backend.md` logging rules).
