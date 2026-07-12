---
id: cm-0035
title: Add Socrates data layer — TrustedSource, CourseSpec, AgentSession
stage: spec
status: approved
---

# Add Socrates data layer — TrustedSource, CourseSpec, AgentSession

## Problem Statement

The Socrates AI agent requires three new database models to function: a registry of approved external content sources, a draft artifact representing the course being built, and a session model tracking conversation state across multi-turn interactions. None of the agent's application code (session management, LLM integration, elicitation, curation, or build phases) can be implemented until these models and their relations to the existing User and Course models exist in the schema.

## Scope

### In Scope

- Three new Prisma models: `TrustedSource`, `CourseSpec`, `AgentSession`
- One new Prisma enum: `CourseSpecStatus`
- New relation fields on the existing `User` model pointing to `AgentSession` and `CourseSpec`
- An optional relation field on `CourseSpec` pointing to the existing `Course` model
- A single Prisma migration covering all three models and the enum
- Seed script additions to populate `TrustedSource` with ten initial approved sources

### Out of Scope

- API routes, controllers, or services for any of the new models
- Frontend components or pages
- LLM integration, AI SDK dependencies, or agent logic
- Admin UI for managing trusted sources
- Session management endpoints or expiry logic
- The `LearnerProfile` model proposed in the original blueprint (deferred; elicitation preferences are stored per-build in `CourseSpec.elicitationData`)

## Requirements

### Functional Requirements

- FR-01: A new `CourseSpecStatus` enum is added to the Prisma schema with values: `drafting`, `reviewing`, `approved`, `building`, `completed`, `failed`.

- FR-02: A `TrustedSource` model is added with the following fields:
    - `id` — UUID, primary key, auto-generated
    - `name` — String, required (human-readable source name)
    - `domain` — String, required, unique (e.g., "khanacademy.org")
    - `contentTypes` — Json, required (array of content types the source provides, e.g., ["video", "reading"])
    - `categories` — Json, required (array of subject categories the source covers, e.g., ["math", "science"])
    - `active` — Boolean, required, default true
    - `createdAt` — DateTime, default now
    - `updatedAt` — DateTime, auto-updated
    - Table name mapped to `trusted_source` via `@@map`
    - No soft delete — uses the `active` flag for deactivation instead
    - No `order` field
    - No foreign key relations to other models

- FR-03: A `CourseSpec` model is added with the following fields:
    - `id` — UUID, primary key, auto-generated
    - `userId` — String, required, foreign key to `User`
    - `courseId` — String, optional, unique, foreign key to `Course`
    - `status` — `CourseSpecStatus` enum, required, default `drafting`
    - `elicitationData` — Json, optional (stores collected preferences, topic, scope, goals)
    - `outline` — Json, optional (stores generated course outline with unit/lesson structure)
    - `buildLog` — Json, optional (tracks build progress for resume-on-failure)
    - `createdAt` — DateTime, default now
    - `updatedAt` — DateTime, auto-updated
    - `deletedAt` — DateTime, optional (soft delete)
    - Table name mapped to `course_spec` via `@@map`
    - Index on `userId`

- FR-04: An `AgentSession` model is added with the following fields:
    - `id` — UUID, primary key, auto-generated
    - `userId` — String, required, foreign key to `User`
    - `courseSpecId` — String, optional, unique, foreign key to `CourseSpec` (1:1 relation; optional at creation, set when the session creates its spec)
    - `phase` — String, required (tracks which of the six agent phases the session is in)
    - `currentStep` — String, optional (tracks sub-step within a phase)
    - `elicitationState` — Json, optional (stores stage completion markers and collected field values)
    - `conversationLog` — Json, optional (stores rolling message window and running summary)
    - `expiresAt` — DateTime, optional (for session cleanup)
    - `createdAt` — DateTime, default now
    - `updatedAt` — DateTime, auto-updated
    - Table name mapped to `agent_session` via `@@map`
    - Index on `userId`
    - No soft delete — uses hard delete

- FR-05: Relations are configured as follows:
    - `User` to `CourseSpec` — one-to-many. `CourseSpec.userId` references `User.id`. `onDelete: Cascade` (deleting a user deletes their specs).
    - `User` to `AgentSession` — one-to-many. `AgentSession.userId` references `User.id`. `onDelete: Cascade` (deleting a user deletes their sessions).
    - `AgentSession` to `CourseSpec` — one-to-one via `AgentSession.courseSpecId`. `onDelete: SetNull` (deleting a session nulls out the FK, preserving the spec).
    - `CourseSpec` to `Course` — optional one-to-one via `CourseSpec.courseId`. `onDelete: SetNull` (deleting a spec does not delete the built course; the FK is nulled).
    - The `User` model receives two new relation fields: `courseSpecs CourseSpec[]` and `agentSessions AgentSession[]`.
    - The `Course` model receives one new optional relation field: `courseSpec CourseSpec?` (back-reference from the optional 1:1).

- FR-06: The seed script is extended to upsert ten initial `TrustedSource` rows (upsert on `domain` to ensure idempotency):
    - Khan Academy — domain: khanacademy.org
    - freeCodeCamp — domain: freecodecamp.org
    - MDN Web Docs — domain: developer.mozilla.org
    - Python.org — domain: python.org
    - React docs — domain: react.dev
    - Node.js docs — domain: nodejs.org
    - TypeScript docs — domain: typescriptlang.org
    - W3Schools — domain: w3schools.com
    - Codecademy — domain: codecademy.com
    - GitHub — domain: github.com
    - Each row includes appropriate `contentTypes` and `categories` Json values reflecting the source's actual offerings.
    - All seeded rows have `active: true`.

- FR-07: The migration is named descriptively following the project convention (e.g., `add_socrates_data_layer`). It covers all three models and the enum in a single migration.

### Non-Functional Requirements

- NFR-01: The migration must be non-destructive — it adds new models and an enum without altering or dropping any existing tables, columns, or indexes.
- NFR-02: The seed script remains idempotent — running it multiple times does not duplicate `TrustedSource` rows (upsert on the unique `domain` field).
- NFR-03: All new models follow the project's established schema conventions: UUID primary keys, `@@map` snake_case table names, `createdAt`/`updatedAt` timestamps, explicit `onDelete` on all relations, and `@@index` on foreign key columns.

## Systems-Level Architecture

### Components Involved

- **Prisma schema** (`server/prisma/schema.prisma`) — receives three new models and one new enum
- **Prisma migration** (`server/prisma/migrations/`) — new migration directory generated by `prisma migrate dev`
- **Seed script** (`server/prisma/seed.ts`) — extended with `TrustedSource` upserts
- **Existing `User` model** — gains two new relation fields (no column changes, only Prisma-level back-references)
- **Existing `Course` model** — gains one new optional relation field (no column changes; `CourseSpec.courseId` adds the FK column on the `course_spec` table, not on `course`)

### Data Model Changes

Three new models are added to the schema as described in the functional requirements. The `User` model gains `courseSpecs` and `agentSessions` relation arrays. The `Course` model gains an optional `courseSpec` back-reference. No existing columns are modified or removed.

A new `CourseSpecStatus` enum is added with six values representing the lifecycle of a course spec through the agent pipeline.

The `TrustedSource` model is standalone with no foreign keys. `CourseSpec` has two foreign keys (`userId` to `User`, `courseId` to `Course`). `AgentSession` has two foreign keys (`userId` to `User`, `courseSpecId` to `CourseSpec`).

### API Changes

None. This task introduces no routes, controllers, or services.

### Data Flow

This task has no runtime data flow. It establishes the storage layer that subsequent tasks will read from and write to. The seed script populates `TrustedSource` rows at database setup time.

### Integration Points

- **User model** — new relation fields added for `CourseSpec` and `AgentSession`. The cascade delete helpers in `src/utils/softDelete.ts` may need awareness of these new relations in future tasks, but no changes to `softDelete.ts` are required in this task since the new models are not yet used by any application code.
- **Course model** — new optional back-reference to `CourseSpec`. No impact on existing course CRUD operations since the FK column lives on `course_spec`, not on `course`.
- **Seed script** — new `TrustedSource` upserts are added alongside existing seed data. The seed function's execution order should place `TrustedSource` seeding before or after course seeding (order does not matter since there are no FK dependencies between them).

## Technical Notes

- The Prisma schema file to edit is `server/prisma/schema.prisma`.
- The seed script to extend is `server/prisma/seed.ts`.
- Generate the migration with: `npx prisma migrate dev --name add_socrates_data_layer` (run from `server/`).
- Run `npx prisma generate` after schema changes to update client types.
- Run the seed script with: `node --env-file=.env --import=tsx/esm prisma/seed.ts` (from `server/`). Do not use `prisma db seed`.
- `CourseSpec` has soft delete (`deletedAt`). Queries against it must use `findFirst` with `{ deletedAt: null }` rather than `findUnique` when filtering by `id` combined with soft-delete status. This convention is established by existing models (`Course`, `Unit`, `Lesson`, `Assessment`).
- `AgentSession` uses hard delete (no `deletedAt`). It can use `findUnique` by `id` without restriction.
- `TrustedSource` uses neither soft delete nor hard delete for deactivation — it uses the `active` boolean flag. Queries should filter `{ active: true }` when retrieving sources for agent use.
- The `AgentSession.courseSpecId` is unique, enforcing the 1:1 relationship at the database level. The field is optional to allow session creation before a spec is created.
- The `CourseSpec.courseId` is unique, enforcing the 1:1 relationship with `Course` at the database level. The field is optional because the course does not exist until the build phase completes.
- Review the generated migration SQL to confirm it only contains `CREATE TABLE`, `CREATE TYPE`, and `ALTER TABLE ... ADD CONSTRAINT` statements — no drops or modifications to existing tables.

## Required Design Artifacts

- [x] Backend plan (`backend-plan.md`)
- [ ] API contract (`api-contract.md`)
- [ ] Frontend plan (`frontend-plan.md`)
- [ ] UI wireframe (`wireframe.md`)
