---
name: spec-writing
description: Generate a spec document from a feature description. Produces .claude/specs/<id>/spec.md.
---

# spec-writing

## Purpose

Turn a feature description into a structured spec with scope, requirements, systems-level architecture, and a required design artifacts checklist.

## Inputs

- User-provided feature description
- `project_prefix` from `.claude/config.yaml`
- `CLAUDE.md` for project context and tech stack
- Existing specs in `.claude/specs/` for ID generation

## Output

`.claude/specs/<id>/spec.md` matching `template.md` in this skill directory.

## Procedure

1. Read `template.md`. Output must match its headings exactly.
2. Read `CLAUDE.md` to understand the project's tech stack and architecture.
3. Generate spec ID: read `project_prefix`, scan `.claude/specs/` for highest `<####>`, increment. Zero-pad to 4 digits. First spec: `0001`. Create `.claude/specs/<id>/`.
4. **Ask questions in the terminal** if unclear: who the user/actor is, what problem is solved, what success looks like, whether frontend/backend/both. Wait for answers.
5. Fill the template. Systems Architecture is high-level only — no function signatures, no pseudocode.
6. Write to `.claude/specs/<id>/spec.md`.
7. Verify mechanically: `grep` for required headings and frontmatter.
8. Report the ID, file path, and that human approval is needed.

## Constraints

- No technical architecture (function signatures, pseudocode, file paths).
- Ask the user, never guess.
- Write only to `.claude/specs/<id>/`.
