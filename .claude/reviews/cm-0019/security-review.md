---
id: cm-0019
title: Security Review — Add @@map directives to Course, Unit, Lesson, StudentNote models
stage: review
status: approved
hand_back_to: null
approver: agent
---

# Security Review: Add @@map directives to Course, Unit, Lesson, StudentNote models

## Summary

This review covers four `@@map` additions to the Prisma schema and two paired migration files that rename four PostgreSQL tables from their PascalCase defaults to snake_case names. No application code, routes, middleware, or data surfaces changed. All four renames are non-destructive DDL operations with no security implications.

## Scope

- Branch: refactor/code_cleanup
- Base: develop
- Files changed: 3
- Spec: cm-0019

## Issues

No issues found.

## Checklist Coverage

| Category | Result |
|---|---|
| Input validation | n/a — no new input surfaces |
| Injection | pass — all migration SQL uses hardcoded literal table names; no user input is interpolated; `ALTER TABLE RENAME TO` is a DDL statement with no parameterized query path |
| Authentication | n/a — no route or middleware changes |
| Authorization | n/a — no route or middleware changes |
| Sensitive data exposure | pass — no secrets, credentials, PII, or stack-trace leaks in any migration file or schema diff |
| Rate limiting | n/a — no endpoint changes |
| Dependency vulnerabilities | n/a — no new dependencies added |
| Data layer | pass — `ALTER TABLE "Course" RENAME TO "course"`, `ALTER TABLE "Unit" RENAME TO "unit"`, `ALTER TABLE "Lesson" RENAME TO "lesson"`, and `ALTER TABLE "StudentNote" RENAME TO "student_note"` are all non-destructive renames; they are not DROP + CREATE operations and do not remove or expose any rows; PostgreSQL preserves all foreign key references, indexes, sequences, and constraints on table rename; no expand-contract phasing is required for pure renames |
| API security | n/a — no API surface changes |

## Verdict

APPROVED — all four changes are safe, non-destructive table renames with no security implications. The Course, Unit, and Lesson renames in migration `20260514000001` are identical in character to the StudentNote rename previously approved, and carry the same zero-risk assessment.
