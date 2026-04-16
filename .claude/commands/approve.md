---
description: Approve a workflow artifact by setting its frontmatter status to approved. Stamps approver and timestamp.
argument-hint: <file path>
---

# /approve

You are approving a workflow artifact. This is a mechanical operation — read the file, update frontmatter, write it back.

## Arguments

The file path to approve is: $ARGUMENTS

If `$ARGUMENTS` is empty, ask the user for a file path and stop. Do not proceed without one.

## Procedure

### 1. Validate the file

- Confirm the file exists at the given path. If not, check if the user gave a short name (e.g., `cm-0007-spec`) and try to resolve it:
    - `cm-*-spec*` → `.claude/specs/`
    - `cm-*-wireframe*` → `.claude/designs/`
    - `cm-*-frontend-plan*` or `cm-*-backend-plan*` or `cm-*-api-contract*` → `.claude/plans/`
    - `cm-*-code-review*` or `cm-*-security-review*` → `.claude/reviews/`
    - `cm-*-test-report*` → `.claude/tests/`

    If exactly one match is found, use it. If multiple or none, list what was found and ask the user to specify.

- Confirm the file has YAML frontmatter with a `status` field. If not, stop — this is not a workflow artifact.

### 2. Check current status

- If `status` is already `approved`, inform the user and stop. Do not re-stamp.
- If `status` is `rejected`, proceed — re-approval after revision is a valid workflow.
- If `status` is `pending`, proceed.

### 3. Update frontmatter

Set the following fields in the existing YAML frontmatter. Do not alter any other fields or any content below the frontmatter.

```yaml
status: approved
approver: human
approved_at: <current ISO 8601 timestamp>
```

If `hand_back_to` exists in frontmatter (from a security review rejection), remove it — approval clears the hand-back routing.

### 4. Report

```
Approved: <file path>
  id: <id from frontmatter>
  title: <title from frontmatter>
  stage: <stage from frontmatter>
  approved_at: <timestamp>
```

## Constraints

- Only modify frontmatter fields (`status`, `approver`, `approved_at`, removal of `hand_back_to`). Never change the document body.
- Never modify `config.yaml` or `rules.md`.
- Never approve a file that lacks frontmatter with a `status` field.
- Always set `approver: human`. This command is a human action; agents use their own approval logic within skills.
