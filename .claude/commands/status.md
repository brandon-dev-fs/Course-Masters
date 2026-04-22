---
description: Show current status of all artifacts for a spec ID.
argument-hint: <spec id>
---

# /status

Read-only. Scan artifacts, format a report.

## Arguments

Spec ID: $ARGUMENTS

If empty, list all spec IDs found in `.claude/specs/` and ask the user to pick one.

## Procedure

### 1. Read the spec

Load `.claude/specs/<id>/spec.md`. Get `title`, `status`, and Required Design Artifacts checklist.

### 2. Scan artifacts

Check for each file, reading frontmatter:

| Artifact | Path | Required? |
|----------|------|-----------|
| Spec | `.claude/specs/<id>/spec.md` | always |
| Wireframe | `.claude/designs/<id>/wireframe.md` | if `ui-design` checked |
| Frontend plan | `.claude/plans/<id>/frontend-plan.md` | if checked |
| Backend plan | `.claude/plans/<id>/backend-plan.md` | if checked |
| API contract | `.claude/plans/<id>/api-contract.md` | if checked |
| Code review | `.claude/reviews/<id>/code-review.md` | after implementation |
| Security review | `.claude/reviews/<id>/security-review.md` | after implementation |
| Test report | `.claude/tests/<id>/test-report.md` | after review |

### 3. Determine current stage

Based on what exists and its status: Spec → Design → Implementation → Review → Test → PR ready.

### 4. Check branches (skip if git unavailable)

Report current branch and existence of temporary coder branches `<id>-backend`, `<id>-frontend`.

### 5. Output

```
Status: <id> — <title>
Current stage: <stage>

Artifacts:
  Spec              .claude/specs/<id>/spec.md                    approved
  ...

Branches:
  Current:        <current branch>
  <id>-backend    not found
  <id>-frontend   not found

Next step: <specific actionable instruction>
```

Use `—` for files that don't exist yet. `(not required)` for unchecked artifacts.

## Constraints

- Read-only. Never modify any file.
- Keep output compact.
