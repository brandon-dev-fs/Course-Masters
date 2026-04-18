---
description: Approve a workflow artifact by setting its frontmatter status to approved.
argument-hint: <file path>
---

# /approve

Mechanical operation: read file, update frontmatter, write back.

## Arguments

File path: $ARGUMENTS

If empty, ask the user for a path and stop.

## Procedure

### 1. Resolve the file

If the path doesn't exist, try to resolve a short name by scanning `.claude/` subdirectories for a matching `<id>` folder and artifact file. If ambiguous, list matches and ask.

### 2. Check current status

- Already `approved` → inform and stop.
- `rejected` or `pending` → proceed.

### 3. Update frontmatter

Set only:
```yaml
status: approved
approver: human
approved_at: <ISO 8601 timestamp>
```

Remove `hand_back_to` if present. Do not alter any other fields or document body.

### 4. Report

```
Approved: <file path>
  id: <id>
  title: <title>
  approved_at: <timestamp>
```

## Constraints

- Only modify `status`, `approver`, `approved_at`, and removal of `hand_back_to`.
- Always set `approver: human`.
- Never approve a file without `status` in frontmatter.
