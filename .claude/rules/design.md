---
description: Run the design stage. Produces wireframe, plans, and api-contract based on the spec's Required Design Artifacts checklist.
argument-hint: <spec id> [review.md]
---

# /design

You are running the **Design stage**. Read the approved spec, determine which design artifacts are needed, orchestrate the relevant agents and skills.

## Arguments

- Spec ID: $ARGUMENTS (first argument, required)
- Review doc path: (optional second argument) — rejected review for revision

If spec ID is empty, ask and stop.

## Procedure

### 1. Verify environment

- `CLAUDE.md` exists. If missing: `Run /init to generate CLAUDE.md first.`
- `.claude/config.yaml` and `.claude/rules.md` exist.
- Create `.claude/designs/<id>/` and `.claude/plans/<id>/` if missing.

### 2. Read and verify spec

- Load `.claude/specs/<id>/spec.md`. If not found, stop.
- If not `approved`, stop with approval instructions.

### 3. Parse Required Design Artifacts

Determine which skills to run from the checklist.

### 4. Check review feedback

If review doc provided: verify `status: rejected` and `hand_back_to: design`. Extract issues for agents.

### 5. Orchestrate skills (order matters)

**Step A: Backend plan + API contract** (if required)
- `backend-architect` agent. Reads `CLAUDE.md` and scoped rules lazily.
- Outputs: `.claude/plans/<id>/backend-plan.md`, `.claude/plans/<id>/api-contract.md`

**Step B: UI design** (if required, parallel with Step A)
- `designer` agent. Reads `CLAUDE.md` and design rules.
- Output: `.claude/designs/<id>/wireframe.md`

**Step C: Frontend plan** (if required, after Step A)
- `frontend-architect` agent. Reads api-contract from Step A.
- Output: `.claude/plans/<id>/frontend-plan.md`

### 6. Verify mechanically

Check each artifact has `status: pending` in frontmatter.

### 7. Report

List all produced artifacts awaiting approval with next steps.

## Constraints

- Write only to `.claude/designs/<id>/` and `.claude/plans/<id>/`.
- Never set `status: approved` on design artifacts.
- Overwrite existing artifacts on re-run.
