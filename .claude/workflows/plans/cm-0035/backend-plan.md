---
id: cm-0035
title: Socrates data layer — TrustedSource, CourseSpec, AgentSession
stage: design
type: backend-plan
status: approved
---

# Backend Plan: Socrates Data Layer

## 1. Overview

This task adds the foundational storage layer for the Socrates AI agent: three new Prisma models (`TrustedSource`, `CourseSpec`, `AgentSession`), one new enum (`CourseSpecStatus`), relation fields on existing `User` and `Course` models, and seed data for ten trusted content sources. No API routes, controllers, or services are introduced. All subsequent Socrates work (session management, elicitation, curation, build) depends on these models existing.

---

## 2. Schema Changes (`server/prisma/schema.prisma`)

### 2.1 New Enum: `CourseSpecStatus`

Place immediately after the `AssignmentType` enum (after line 37 in the current schema).

```prisma
enum CourseSpecStatus {
  drafting
  reviewing
  approved
  building
  completed
  failed
}
```

### 2.2 New Model: `TrustedSource`

Place after the `LessonChecklistItem` model (end of schema file). This is a standalone model with no foreign keys.

```prisma
model TrustedSource {
  id           String   @id @default(uuid())
  name         String
  domain       String   @unique
  contentTypes Json
  categories   Json
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("trusted_source")
}
```

### 2.3 New Model: `CourseSpec`

Place after `TrustedSource`. Has foreign keys to `User` and `Course`. Supports soft delete.

```prisma
model CourseSpec {
  id              String           @id @default(uuid())
  userId          String
  courseId         String?          @unique
  status          CourseSpecStatus  @default(drafting)
  elicitationData Json?
  outline         Json?
  buildLog        Json?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  deletedAt       DateTime?

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  course       Course?       @relation(fields: [courseId], references: [id], onDelete: SetNull)
  agentSession AgentSession?

  @@index([userId])
  @@map("course_spec")
}
```

### 2.4 New Model: `AgentSession`

Place after `CourseSpec`. Has foreign keys to `User` and `CourseSpec`. Uses hard delete (no `deletedAt`).

```prisma
model AgentSession {
  id                String    @id @default(uuid())
  userId            String
  courseSpecId       String?   @unique
  phase             String
  currentStep       String?
  elicitationState  Json?
  conversationLog   Json?
  expiresAt         DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  user       User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  courseSpec  CourseSpec?  @relation(fields: [courseSpecId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@map("agent_session")
}
```

### 2.5 Modified Model: `User`

Add two new relation fields to the existing `User` model. These are Prisma-level back-references only — no new database columns are added to the `user` table.

Add the following two lines inside the `User` model block, after the existing `checklistItems` relation (line 65):

```prisma
  courseSpecs           CourseSpec[]
  agentSessions         AgentSession[]
```

### 2.6 Modified Model: `Course`

Add one new optional relation field to the existing `Course` model. This is a Prisma-level back-reference only — no new database columns are added to the `course` table. The FK column (`courseId`) lives on `course_spec`.

Add the following line inside the `Course` model block, after the existing `assessment` relation (line 128):

```prisma
  courseSpec  CourseSpec?
```

---

## 3. Migration

### 3.1 Migration Command

Run from the `server/` directory:

```bash
npx prisma migrate dev --name add_socrates_data_layer
```

### 3.2 Post-Migration

```bash
npx prisma generate
```

### 3.3 Migration SQL Review Checklist

After the migration is generated, open the SQL file in `server/prisma/migrations/<timestamp>_add_socrates_data_layer/migration.sql` and verify:

- **Expected statements**: `CREATE TYPE "CourseSpecStatus"`, three `CREATE TABLE` statements (`trusted_source`, `course_spec`, `agent_session`), `CREATE UNIQUE INDEX` for `domain` on `trusted_source`, `courseId` on `course_spec`, `courseSpecId` on `agent_session`, plus `CREATE INDEX` for `userId` on both `course_spec` and `agent_session`, and foreign key constraints via `ALTER TABLE ... ADD CONSTRAINT`.
- **Must not contain**: any `DROP`, `ALTER TABLE ... DROP COLUMN`, or modifications to existing tables (`user`, `course`, `session`, `account`, etc.). The only changes to existing tables should be the addition of foreign key constraints pointing FROM the new tables TO existing tables.

---

## 4. Seed Script Changes (`server/prisma/seed.ts`)

### 4.1 Placement

Add a `TrustedSource` seeding block inside the `main()` function, **after** the user seeding section and **before** the course cleanup/creation section. Place it after the `console.log('Seeded users: ...')` line (around line 144) and before the `// -- Cleanup` comment (line 148).

### 4.2 Trusted Source Seed Block

```typescript
// ── Trusted Sources ──────────────────────────────────────────────────
const trustedSources = [
	{
		name: 'Khan Academy',
		domain: 'khanacademy.org',
		contentTypes: ['video', 'article', 'exercise'],
		categories: ['math', 'science', 'programming', 'cs-fundamentals'],
	},
	{
		name: 'freeCodeCamp',
		domain: 'freecodecamp.org',
		contentTypes: ['tutorial', 'article', 'exercise', 'course'],
		categories: ['web', 'programming', 'cs-fundamentals', 'data-science'],
	},
	{
		name: 'MDN Web Docs',
		domain: 'developer.mozilla.org',
		contentTypes: ['documentation', 'article', 'tutorial'],
		categories: ['web', 'programming'],
	},
	{
		name: 'Python.org',
		domain: 'python.org',
		contentTypes: ['documentation', 'tutorial'],
		categories: ['programming'],
	},
	{
		name: 'React Docs',
		domain: 'react.dev',
		contentTypes: ['documentation', 'tutorial'],
		categories: ['web', 'programming'],
	},
	{
		name: 'Node.js Docs',
		domain: 'nodejs.org',
		contentTypes: ['documentation', 'article'],
		categories: ['web', 'programming', 'devops'],
	},
	{
		name: 'TypeScript Docs',
		domain: 'typescriptlang.org',
		contentTypes: ['documentation', 'tutorial'],
		categories: ['web', 'programming'],
	},
	{
		name: 'W3Schools',
		domain: 'w3schools.com',
		contentTypes: ['tutorial', 'article', 'exercise'],
		categories: ['web', 'programming'],
	},
	{
		name: 'Codecademy',
		domain: 'codecademy.com',
		contentTypes: ['course', 'tutorial', 'exercise'],
		categories: ['web', 'programming', 'data-science', 'cs-fundamentals'],
	},
	{
		name: 'GitHub',
		domain: 'github.com',
		contentTypes: ['documentation', 'tutorial'],
		categories: ['programming', 'devops', 'web'],
	},
];

for (const source of trustedSources) {
	await prisma.trustedSource.upsert({
		where: { domain: source.domain },
		update: {
			name: source.name,
			contentTypes: source.contentTypes,
			categories: source.categories,
			active: true,
		},
		create: {
			name: source.name,
			domain: source.domain,
			contentTypes: source.contentTypes,
			categories: source.categories,
			active: true,
		},
	});
}

console.log(`Seeded ${trustedSources.length} trusted sources.`);
```

### 4.3 Idempotency Notes

- `upsert` on `where: { domain }` leverages the `@unique` constraint on `TrustedSource.domain`.
- The `update` block overwrites `name`, `contentTypes`, `categories`, and `active` so that re-running the seed updates existing rows to match the seed data.
- No `CourseSpec` or `AgentSession` rows are seeded — those are created at runtime by the agent.

---

## 5. Verification Steps

After completing the implementation, the developer should verify:

1. **Schema validation**: Run `npx prisma validate` from `server/` — must pass with no errors.
2. **Migration applied**: Run `npx prisma migrate dev --name add_socrates_data_layer` — should create a single migration with no warnings about drift.
3. **Types generated**: Run `npx prisma generate` — TypeScript types for `TrustedSource`, `CourseSpec`, `AgentSession`, and `CourseSpecStatus` are available in `@prisma/client`.
4. **Prisma Studio inspection**: Run `npx prisma studio` and confirm three new tables appear: `trusted_source`, `course_spec`, `agent_session`.
5. **Seed idempotency**: Run the seed command twice in sequence. Both runs must complete without error. After the second run, `trusted_source` should contain exactly 10 rows (no duplicates).
    ```bash
    node --env-file=.env --import=tsx/esm prisma/seed.ts
    node --env-file=.env --import=tsx/esm prisma/seed.ts
    ```
6. **Migration SQL review**: Open the generated migration SQL file and confirm it contains only `CREATE TYPE`, `CREATE TABLE`, `CREATE UNIQUE INDEX`, `CREATE INDEX`, and `ALTER TABLE ... ADD CONSTRAINT` statements — no drops or modifications to existing tables.
7. **TypeScript compilation**: Run `npx tsc --noEmit` from `server/` to confirm no type errors were introduced.

---

## 6. Implementation Order

1. Add the `CourseSpecStatus` enum to `server/prisma/schema.prisma` (after the `AssignmentType` enum).
2. Add the `TrustedSource` model to the schema (after `LessonChecklistItem`).
3. Add the `CourseSpec` model to the schema (after `TrustedSource`).
4. Add the `AgentSession` model to the schema (after `CourseSpec`).
5. Add the `courseSpecs` and `agentSessions` relation fields to the `User` model.
6. Add the `courseSpec` relation field to the `Course` model.
7. Run `npx prisma validate` to confirm the schema is valid before generating the migration.
8. Run `npx prisma migrate dev --name add_socrates_data_layer` from `server/`.
9. Run `npx prisma generate` to update TypeScript types.
10. Review the generated migration SQL against the checklist in section 3.3.
11. Add the trusted source seed block to `server/prisma/seed.ts` (after user seeding, before course cleanup).
12. Run the seed script: `node --env-file=.env --import=tsx/esm prisma/seed.ts` from `server/`.
13. Run the seed script a second time to verify idempotency.
14. Run `npx tsc --noEmit` from `server/` to confirm no type errors.

---

## Schema Changes Summary

| Change             | Type      | Details                                                                                 |
| ------------------ | --------- | --------------------------------------------------------------------------------------- |
| `CourseSpecStatus` | New enum  | 6 values: `drafting`, `reviewing`, `approved`, `building`, `completed`, `failed`        |
| `TrustedSource`    | New model | Standalone, `@unique` on `domain`, no FK relations, no soft delete                      |
| `CourseSpec`       | New model | FK to `User` (cascade), FK to `Course` (set null), soft delete, `@@index([userId])`     |
| `AgentSession`     | New model | FK to `User` (cascade), FK to `CourseSpec` (set null), hard delete, `@@index([userId])` |
| `User`             | Modified  | Two new relation arrays: `courseSpecs`, `agentSessions` (no column changes)             |
| `Course`           | Modified  | One new optional relation: `courseSpec` (no column changes)                             |

---

## Error Handling

No error handling changes required. This task introduces no routes, controllers, or services. Error patterns for querying these models will be defined in future tasks when API endpoints are added.

---

## Validation

No validation schemas required. This task introduces no API endpoints. Zod schemas for `CourseSpec` and `AgentSession` payloads will be defined in future tasks.

---

## Dependencies

No new packages required. All changes use existing Prisma and the seed script's existing dependencies (`@prisma/client`, `better-auth/crypto`).
