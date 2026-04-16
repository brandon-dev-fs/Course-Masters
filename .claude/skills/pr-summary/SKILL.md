---
name: pr-summary
description: Generate a PR description from the spec, plans, and review docs. Use when /pr runs after gate-check passes. Output is the PR body — used directly if gh CLI is available, otherwise printed for the human to paste.
---

# pr-summary

## Purpose

Produce a PR description that summarizes what was built, what changed across backend/frontend/data, what API surface was touched, how it was tested, and what reviews approved it.

## Inputs

- Spec ID
- All artifacts for the spec under `.claude/`

## Output

PR description markdown matching `template.md` in this skill's directory. Returned as a string for `/pr` to consume.

## Procedure

1. **Read** `template.md` in this skill directory.

2. **Read all artifacts** for the spec ID:
   - `specs/<id>-spec.md` for problem statement, scope, title
   - `plans/<id>-backend-plan.md` for backend changes (if exists)
   - `plans/<id>-frontend-plan.md` for frontend changes (if exists)
   - `plans/<id>-api-contract.md` for API changes (if exists)
   - `reviews/<id>-code-review.md` for review status
   - `reviews/<id>-security-review.md` for review status
   - `tests/<id>-test-report.md` for test results (if exists)

3. **Fill the template**:
   - Title: `<id>: <spec title>`
   - Summary: drawn from spec's Problem Statement.
   - Changes: bulleted highlights from each plan.
   - API Changes table: list endpoints from api-contract with their status (Added, Modified, Deprecated).
   - Testing: pulled from test report, or "Test framework not yet configured; manual verification only" if no report.
   - Reviews: link to review docs and note their status.
   - Artifacts: list paths to all design artifacts under `.claude/`.
   - Deployment notes: include if backend plan or schema changes mention follow-up migrations, env vars, or feature flags.

4. **Remove sections** not applicable to this PR (e.g., no API Changes section if `api-contract` wasn't required).

5. **Return** the rendered markdown string.

## Constraints

- Pull content from artifacts; do not invent.
- Keep the summary high-level. Reviewers can read the spec for detail.
- If an expand-contract migration is in progress, explicitly note "Phase 1 of 2 — drop column in follow-up PR" in the Data section.
- Do not write to `.claude/`. Output is the returned string only.
