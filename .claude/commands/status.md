---
description: Show the current status of all artifacts for a spec ID. Scans .claude/ directories and reports stage, status, and approval info.
argument-hint: <spec id>
---

# /status

You are reporting the workflow status for a spec. This is a read-only operation — scan artifacts, format a report, output it.

## Arguments

The spec ID is: $ARGUMENTS

If `$ARGUMENTS` is empty, list all spec IDs found in `.claude/specs/` and ask the user to pick one. If no specs exist, tell the user to run `/spec` first and stop.

## Procedure

### 1. Read the spec

- Find `.claude/specs/<id>-spec.md`. If it doesn't exist, stop and report that no spec with that ID was found.
- Read its frontmatter for `title`, `status`.
- Read its `## Required Design Artifacts` checklist to know which downstream artifacts are expected.

### 2. Scan for all artifacts

Check for the following files, reading frontmatter from each that exists:

| Artifact        | Path                                      | Required?                  |
| --------------- | ----------------------------------------- | -------------------------- |
| Spec            | `.claude/specs/<id>-spec.md`              | always                     |
| Wireframe       | `.claude/designs/<id>-wireframe.md`       | if `ui-design` checked     |
| Frontend plan   | `.claude/plans/<id>-frontend-plan.md`     | if `frontend-plan` checked |
| Backend plan    | `.claude/plans/<id>-backend-plan.md`      | if `backend-plan` checked  |
| API contract    | `.claude/plans/<id>-api-contract.md`      | if `api-contract` checked  |
| Code review     | `.claude/reviews/<id>-code-review.md`     | after implementation       |
| Security review | `.claude/reviews/<id>-security-review.md` | after implementation       |
| Test report     | `.claude/tests/<id>-test-report.md`       | after review               |

For each file that exists, extract `status`, `approver`, `approved_at` from frontmatter.
For security review, also extract `hand_back_to` if present.

### 3. Determine current stage

Based on what exists and its status, determine where the workflow currently stands:

- **Spec** — spec exists but is `pending` or `rejected`
- **Design** — spec is `approved`, design artifacts are `pending`, `rejected`, or incomplete
- **Implementation** — all required design artifacts `approved`, no reviews yet
- **Review** — reviews exist but are `pending` or `rejected`
- **Test** — reviews `approved`, test report is `pending` or `rejected`
- **PR ready** — test report `approved`
- **Complete** — PR has been submitted (no artifact tracks this; just report PR ready)

### 4. Check branches

If implementation has started, check for the existence of relevant branches (do not fail if git is unavailable — just skip this section):

- `feature/<id>-frontend`
- `feature/<id>-backend`
- `feature/<id>` (integration)

Report which exist.

### 5. Output the report

```
Status: <id> — <title>
Current stage: <stage>

Artifacts:
  Spec              .claude/specs/<id>-spec.md                    approved  (human, 2026-04-15)
  Wireframe         .claude/designs/<id>-wireframe.md             pending
  Frontend plan     .claude/plans/<id>-frontend-plan.md           approved  (human, 2026-04-15)
  Backend plan      .claude/plans/<id>-backend-plan.md            approved  (human, 2026-04-15)
  API contract      .claude/plans/<id>-api-contract.md            approved  (human, 2026-04-15)
  Code review       .claude/reviews/<id>-code-review.md           —
  Security review   .claude/reviews/<id>-security-review.md       —
  Test report       .claude/tests/<id>-test-report.md             —

Branches:
  feature/<id>-frontend       exists
  feature/<id>-backend        exists
  feature/<id>                not found

Next step: Approve the wireframe, then run /design <id> or /implement <id>.
```

Use `—` for artifacts that don't exist yet. Mark artifacts not required by the spec's checklist as `(not required)` instead.

Include a **Next step** line indicating what the user should do to advance the workflow. Be specific:

- If something is `pending` → "Approve X, then run Y"
- If something is `rejected` → "Address issues in X, then re-run Y"
- If a stage is complete → "Run Z"
- If everything is approved through test → "Run /pr <id>"

## Constraints

- Read-only. Never modify any file.
- Never create files.
- If a file has malformed or missing frontmatter, report it as `(malformed frontmatter)` rather than crashing.
- Keep the output compact. One line per artifact, aligned columns, no unnecessary prose.
