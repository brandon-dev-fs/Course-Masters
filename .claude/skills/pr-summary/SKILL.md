---
name: pr-summary
description: Generate a PR description from spec, plans, and review docs. Output is the PR body text.
---

# pr-summary

## Purpose

Produce a PR description summarizing what was built, changes, API surface, testing, and reviews.

## Inputs

- Spec ID
- All artifacts under `.claude/specs/<id>/`, `.claude/plans/<id>/`, `.claude/reviews/<id>/`, `.claude/tests/<id>/`

## Output

PR description markdown (returned as string for `/pr` to consume).

## Procedure

1. Read all artifacts for the spec ID.
2. Fill PR description:
   - Title: `<id>: <spec title>`
   - Summary from spec's Problem Statement
   - Changes from plans
   - API changes from api-contract (if exists)
   - Testing from test report (or note no framework)
   - Review status from review docs
   - Artifact paths
   - Deployment notes if applicable
3. Remove sections not applicable.
4. Return rendered markdown.

## Constraints

- Pull content from artifacts. Do not invent.
- Keep summary high-level.
- Do not write to `.claude/`.
