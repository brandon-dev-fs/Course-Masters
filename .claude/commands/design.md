---
description: Run the design stage for an approved spec. Produces wireframe, frontend plan, backend plan, and api-contract based on the spec's Required Design Artifacts checklist. Each artifact requires human approval.
argument-hint: <spec id> [review.md]
---

# /design

You are running the **Design stage** of the agentic development workflow. This command reads an approved spec, determines which design artifacts are needed, and orchestrates the relevant agents and skills to produce them.

## Arguments

- Spec ID: $ARGUMENTS (first argument, required)
- Review doc path: (optional, second argument) — a rejected review file from `/review` that flagged design-level issues. If provided, this is primary input for revision.

If the spec ID is empty, ask the user for one and stop.

## Procedure

### 1. Verify environment

Confirm the following exist:

- `.claude/config.yaml`
- `.claude/rules.md`
- `.claude/designs/` directory — create if missing
- `.claude/plans/` directory — create if missing

### 2. Read and verify the spec

- Load `.claude/specs/<id>-spec.md`.
- If not found, stop and report. Suggest running `/status` to see available specs.
- If `status` is not `approved`, stop and report:
    ```
    Spec <id> is not approved (current status: <status>).
    Approve it first: /approve .claude/specs/<id>-spec.md
    ```

### 3. Parse the Required Design Artifacts checklist

Read the `## Required Design Artifacts` section from the spec. Determine which of the following are checked:

- `ui-design` → produce wireframe
- `frontend-plan` → produce frontend plan
- `backend-plan` → produce backend plan
- `api-contract` → produce api-contract

If none are checked, stop and report that the spec requires no design artifacts. This shouldn't happen — flag it as likely a spec issue.

### 4. Check for review feedback

If a review doc path was provided as the second argument:

- Read it and verify it has `status: rejected` and `hand_back_to: design`.
- Extract its `## Issues` section. These issues are the primary input for revision — the agents must address each issue at severity `medium` or above.
- The original artifacts will be **overwritten** with revised versions. Git preserves history.

### 5. Orchestrate the skills

Run the required skills in the correct order. **Order matters** because of dependencies between artifacts.

#### Step A: Backend plan + API contract (if required)

If `backend-plan` or `api-contract` is checked, invoke the `backend-architect` agent with:

- The approved spec
- The `backend-plan` skill
- The `api-contract` skill (if checked)
- The review doc (if provided)
- Rules to load: `.claude/rules.md`, `.claude/rules/backend.md`, `.claude/rules/data.md`, `.claude/rules/api.md`

The backend-architect produces:

- `.claude/plans/<id>-backend-plan.md` (if `backend-plan` checked)
- `.claude/plans/<id>-api-contract.md` (if `api-contract` checked)

Both written with `status: pending`.

**This step must complete before frontend-plan** because the frontend-plan depends on the api-contract.

#### Step B: UI design (if required)

If `ui-design` is checked, invoke the `designer` agent with:

- The approved spec
- The `ui-design` skill
- The review doc (if provided)
- Rules to load: `.claude/rules.md`, `.claude/rules/design.md`, `.claude/rules/frontend.md`

The designer produces:

- `.claude/designs/<id>-wireframe.md`

Written with `status: pending`.

This step has no dependency on Step A and can run alongside it.

#### Step C: Frontend plan (if required)

If `frontend-plan` is checked, invoke the `frontend-architect` agent with:

- The approved spec
- The wireframe at `.claude/designs/<id>-wireframe.md` (if `ui-design` was required — it exists from Step B but may still be `pending`, which is fine for planning; it'll need approval before implementation)
- The api-contract at `.claude/plans/<id>-api-contract.md` (**must exist** from Step A)
- The `frontend-plan` skill
- The review doc (if provided)
- Rules to load: `.claude/rules.md`, `.claude/rules/frontend.md`, `.claude/rules/api.md`, `.claude/rules/design.md`

The frontend-architect produces:

- `.claude/plans/<id>-frontend-plan.md`

Written with `status: pending`.

**This step waits for Step A to complete** so the api-contract exists for reference.

### 6. Verify outputs

After all agents complete, verify each produced artifact:

- File exists at the expected path.
- Frontmatter contains `id: <id>`, `stage: design`, `status: pending`.
- All required template sections are present (check section headings match the skill's template).

If any check fails, report the discrepancy. Do not silently fix it.

### 7. Report to the user

Output a summary listing all produced artifacts and their approval status:

```
Design complete for <id>: <title>

Artifacts awaiting human approval:
  [ ] .claude/designs/<id>-wireframe.md
  [ ] .claude/plans/<id>-backend-plan.md
  [ ] .claude/plans/<id>-api-contract.md
  [ ] .claude/plans/<id>-frontend-plan.md

Next steps:
  1. Review each artifact.
  2. Approve each: /approve <file path>
  3. Run /implement <id> once all are approved.
```

Only list artifacts that were actually produced. If `ui-design` wasn't required, don't list the wireframe.

## Execution order summary

```
backend-plan + api-contract  ──→  frontend-plan
         │                              │
         │                              │
ui-design (parallel with backend) ──────┘
                                   (wireframe feeds
                                    into frontend-plan
                                    if both exist)
```

- Backend plan and api-contract run first (or parallel with ui-design).
- Frontend plan runs after api-contract exists.
- UI design has no dependency on backend and can run alongside it.

## Constraints

- Never write outside `.claude/designs/` and `.claude/plans/`.
- Never modify the spec, `config.yaml`, or `rules.md`.
- Never set `status: approved` on design artifacts. Only humans approve at this stage.
- Overwrite existing design artifacts on re-run (revision after rejection). Git preserves history.
- Do not produce implementation-level code. Plans contain function signatures and pseudocode but not actual source files.
- If the api-contract and backend plan disagree on an endpoint shape, the api-contract is the source of truth for the wire format. Flag the disagreement rather than silently resolving it.
- If the frontend plan identifies a capability gap in the api-contract, flag it in the plan's `## Open Questions` section. Do not invent endpoints.
