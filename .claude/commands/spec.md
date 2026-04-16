---
description: Create a new feature spec with auto-generated ID and systems-level architecture. Produces .claude/specs/<id>-spec.md awaiting human approval.
argument-hint: <feature description>
---

# /spec

You are starting the **Spec stage** of the agentic development workflow. Your job is to turn the user's feature description into a structured spec document.

## Arguments

The user's feature description is provided as: $ARGUMENTS

If `$ARGUMENTS` is empty, ask the user for a feature description and stop. Do not proceed without one.

## Procedure

### 1. Verify environment

Before doing anything else, confirm the following exist in the current working directory:

- `.claude/config.yaml` — read `project_prefix` from it
- `.claude/rules.md` — global rules (load into context)
- `.claude/specs/` directory — create it if missing

If `.claude/config.yaml` is missing, stop and tell the user the workflow is not initialized in this repo. Do not create the file yourself.

### 2. Generate the spec ID

- Read `project_prefix` from `.claude/config.yaml` (e.g., `cm`).
- List files in `.claude/specs/` matching the pattern `<prefix>-<####>-spec.md`.
- Find the highest `<####>` and increment by 1. If no specs exist, start at 1. **Always zero-pad to 4 digits** (`cm-0001`, `cm-0042`, `cm-0123`).
- The new ID is `<prefix>-<####>` (e.g., `cm-0007`).

### 3. Delegate to the technical-architect agent

Invoke the `technical-architect` subagent with:

- The user's feature description (`$ARGUMENTS`)
- The generated spec ID
- Instruction to use the `spec-writing` skill

The technical-architect agent will:

1. Load the `spec-writing` skill.
2. Read the skill's `template.md` to learn the exact output structure.
3. Apply the global `rules.md` (context budget, file ownership, frontmatter requirements).
4. Ask clarifying questions if scope, users, success criteria, or frontend/backend boundaries are unclear. **Do not let the agent guess.** If it asks questions, relay them to the user and wait for answers before continuing.
5. Write the completed spec to `.claude/specs/<id>-spec.md` with:
    - Frontmatter `id`, `title`, `stage: spec`, `status: pending`
    - All required sections from the template, in order
    - Systems-level architecture only (no function signatures, no pseudocode)
    - A `## Required Design Artifacts` checklist reflecting what the feature actually needs

### 4. Verify the output

After the agent reports completion, verify:

- The file exists at `.claude/specs/<id>-spec.md`.
- Frontmatter contains `id: <prefix>-<####>`, `stage: spec`, `status: pending`.
- All required template sections are present: Problem Statement, Scope, Requirements, Systems Architecture, Required Design Artifacts.
- The Required Design Artifacts checklist has at least one item checked.

If any check fails, report the discrepancy. Do not silently fix it — surface the issue so the user can decide.

### 5. Report to the user

Output a concise summary:

```
Spec created: <id>
File: .claude/specs/<id>-spec.md
Status: pending (awaiting human approval)

Required design artifacts:
  [x] <artifact>
  [x] <artifact>
  [ ] <artifact>

Next steps:
  1. Review the spec.
  2. Approve by editing frontmatter to status: approved, or run /approve .claude/specs/<id>-spec.md
  3. Run /design <id> once approved.
```

## Constraints

- Never write outside `.claude/specs/`.
- Never invent details. Ask the user when unclear.
- Never modify `config.yaml`, `rules.md`, or any existing spec.
- Never set `status: approved` yourself. Only humans approve specs.
- Do not produce technical architecture (function signatures, pseudocode, file paths). That's design-stage work.
