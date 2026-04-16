---
id: <prefix>-<n>
title: <Feature name> — backend plan
stage: design
status: pending
# optional: approver: human
# optional: approved_at: 2026-04-15T10:30:00Z
depends_on:
  - <prefix>-<n>-spec
---

# <Title> — Backend Plan

## Summary

<One paragraph describing what's being built on the backend.>

## Folder Layout

Files to be created or modified under `server/src/`.

```
server/src/
├── routes/<resource>.ts
├── controllers/<resource>.controller.ts
├── services/<resource>.service.ts
└── errors/codes.ts        # if new codes added
```

## Controllers

### `<resourceName>Controller.<action>`

- **Route**: `<METHOD> /v1/<path>`
- **Auth**: <required | none>
- **Request validation** (Zod):
  ```ts
  // schema sketch
  ```
- **Calls**: `<service function>`
- **Returns**: <success response shape, status code>
- **Errors thrown**: <AppError subclasses>

## Services

### `<serviceName>.<function>`

- **Signature**: `(args) => Promise<ReturnType>`
- **Responsibility**: <business logic this owns>
- **Calls**: <repositories / Prisma / other services>
- **Errors thrown**: <AppError subclasses>

## Repositories / Prisma Calls

<Data access patterns. Use `select`/`include` to limit fields. Document any `$queryRaw` with justification.>

## Error Codes

New codes to add to `server/src/errors/codes.ts`:

| Code | Status | Class | Meaning |
|------|--------|-------|---------|
| `<CODE>` | <4xx/5xx> | `<AppErrorSubclass>` | <when thrown> |

New `AppError` subclasses to create in `server/src/errors/`:

- `<SubclassName>` — <when thrown, what `details` it carries>

## Schema Changes

Prisma schema additions or modifications. If destructive, follow expand-contract from `data.md`.

### Additions

```prisma
// schema sketch
```

### Migrations

Migration name: `<descriptive_name>`

For destructive changes, list the multi-phase plan:

1. Migration A: <non-destructive change>
2. Code change: <what code stops referencing the old structure>
3. Migration B (separate PR): <destructive change>

## Pseudocode

For non-obvious logic only.

### <Logic name>

```
<pseudocode>
```

## Open Questions

<Anything blocking implementation. Remove section if none.>
