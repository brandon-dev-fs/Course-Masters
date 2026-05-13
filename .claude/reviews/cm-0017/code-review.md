---
id: cm-0017
title: Missing database indexes and audit timestamps
stage: review
status: approved
approver: agent
approved_at: 2026-05-13T00:00:00Z
---

## Summary

Schema-only change: 4 new `@@index` declarations and 10 timestamp fields across 5 models. No routes, controllers, services, or client files were modified. All changes match the approved spec (F-1 through F-9) and backend plan.

## Scope

- `server/prisma/schema.prisma` — backend
- `server/prisma/migrations/20260513182719_add_indexes_and_timestamps/migration.sql` — backend

## Issues

### Issue 1

- **severity:** low
- **location:** `server/prisma/migrations/20260513182719_add_indexes_and_timestamps/migration.sql:2-5`
- **description:** `CREATE INDEX` is used without `CONCURRENTLY`. On a live database with large tables this acquires a lock that blocks writes during index build. Not a problem in the current dev environment, but worth noting for a production deployment.
- **suggested_fix:** Use `CREATE INDEX CONCURRENTLY` if this migration will ever run against a production database with live traffic. No action needed for dev-only use.

### Issue 2

- **severity:** info
- **location:** `server/prisma/migrations/20260513182719_add_indexes_and_timestamps/migration.sql`
- **description:** Migration was hand-written because `prisma migrate dev` failed due to shadow database unavailability (noted in agent report). The SQL is correct and matches the schema changes, but a hand-written migration can drift from what Prisma would generate. If the shadow database is configured in the future, running `prisma migrate dev --create-only` would produce a canonical migration file.
- **suggested_fix:** Advisory only. Verify migration matches schema intent before running against production. Current migration SQL is correct for the changes being made.

## Verdict

Auto-approved. Zero issues at `medium` or above. All spec requirements (F-1–F-9) are implemented correctly. The schema changes are additive and safe for tables with existing rows.
