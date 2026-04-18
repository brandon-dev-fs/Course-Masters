---
description: Create a new feature spec. Produces .claude/specs/<id>/spec.md awaiting human approval.
argument-hint: <feature description>
---

# /spec

You are starting the **Spec stage**. Turn the user's feature description into a structured spec document.

## Arguments

Feature description: $ARGUMENTS

If empty, ask the user for a description and stop.

## Procedure

### 1. Verify environment

- `CLAUDE.md` exists at the project root. If missing, stop: `CLAUDE.md not found. Run /init to generate one before using the workflow.`
- `.claude/config.yaml` exists — read `project_prefix`. If missing, stop: `Workflow not configured. Create .claude/config.yaml with at least project_prefix and default_branch.`
- `.claude/rules.md` exists — load into context.

### 2. Generate the spec ID

- Read `project_prefix` from config.
- Scan `.claude/specs/` for existing `<prefix>-<####>` folders.
- New ID = `<prefix>-<highest + 1>`, zero-padded to 4 digits. First spec: `<prefix>-0001`.
- Create `.claude/specs/<id>/`.

### 3. Delegate to technical-architect agent

Invoke with the feature description, spec ID, and `spec-writing` skill.

The agent will:
- Read `CLAUDE.md` for project context and tech stack
- Read the skill's `template.md`
- **Ask clarifying questions in the terminal** and wait for answers
- Write `.claude/specs/<id>/spec.md` with `status: pending`

### 4. Verify mechanically

```bash
grep -q '## Problem Statement' .claude/specs/<id>/spec.md &&
grep -q '## Required Design Artifacts' .claude/specs/<id>/spec.md &&
grep -q 'status: pending' .claude/specs/<id>/spec.md &&
echo "PASS" || echo "FAIL"
```

### 5. Report

```
Spec created: <id>
File: .claude/specs/<id>/spec.md
Status: pending (awaiting human approval)

Required design artifacts:
  [x/blank] ui-design
  [x/blank] frontend-plan
  [x/blank] backend-plan
  [x/blank] api-contract

Next: review the spec, then /approve .claude/specs/<id>/spec.md
```

## Constraints

- Write only to `.claude/specs/<id>/`.
- Never set `status: approved`. Only humans approve specs.
- No technical architecture (function signatures, pseudocode).
