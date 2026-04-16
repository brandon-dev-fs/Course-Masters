---
name: spec-writing
description: Generate a complete spec document from a freeform feature description. Use when /spec command is invoked. Produces .claude/specs/<id>-spec.md with systems-level architecture and a Required Design Artifacts checklist.
---

# spec-writing

## Purpose

Turn a user's feature description into a structured spec document containing scope, requirements, systems-level architecture, and a checklist of required design artifacts.

## Inputs

- User-provided feature description (passed as command argument)
- `.claude/config.yaml` — for `project_prefix`
- `.claude/specs/` — to determine the next available ID

## Output

A single file at `.claude/specs/<id>-spec.md` matching the structure of `template.md` in this skill's directory.

## Procedure

1. **Read** `template.md` in this skill directory. The output must match its frontmatter fields, section headings, and section order exactly.

2. **Generate the spec ID**:
    - Read `project_prefix` from `.claude/config.yaml`.
    - Scan `.claude/specs/` for files matching `<prefix>-<####>-spec.md`.
    - The new ID is `<prefix>-<####>` where `####` is the highest existing number + 1, zero-padded to 4 digits. If no specs exist, start at `<prefix>-0001`.

3. **Clarify before writing** if any of the following are unclear from the user description:
    - Who the user/actor is
    - What problem is being solved
    - What success looks like
    - Whether this is frontend-only, backend-only, or both

    Ask the user; do not guess.

4. **Fill the template**:
    - Replace `<placeholder>` text with real content.
    - Frontmatter `id`, `title`, `stage: spec`, `status: pending` are required. `# optional:` lines may be uncommented if relevant.
    - Systems Architecture is **high-level only**: components, services, data flow, integration points. No function signatures, no pseudocode, no file names. Technical detail belongs to the design stage.
    - The `## Required Design Artifacts` checklist must reflect what the feature actually needs. A pure-backend feature unchecks `ui-design` and `frontend-plan`. A UI tweak with no backend changes unchecks `backend-plan` and `api-contract`.

5. **Write** the file to `.claude/specs/<id>-spec.md`. Do not write to any other location.

6. **Report** the new spec ID and file path to the user, with a note that the spec requires human approval (frontmatter `status: pending` → `status: approved`) before `/design` can run.

## Constraints

- Do not produce technical architecture (function signatures, pseudocode, specific files). That's design-stage work.
- Do not invent ambiguous details. Ask the user.
- Do not write outside `.claude/specs/`.
- Follow context budget: read only the template, this spec's prerequisites (none, since this is stage 1), and `config.yaml`.
