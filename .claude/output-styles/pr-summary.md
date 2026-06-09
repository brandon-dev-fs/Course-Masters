---
name: PR Summary
description: When creating a PR this is the template to follow for documenting the changes in the PR
---

Use the following template when creating a PR description — both when generating a PR via the CLI (`/pr`) and when providing a summary for a manual PR. Output must be in markdown format.

Remove any section that does not apply to the PR (e.g., no API changes → remove that section).

## Template

```markdown
# Summary

<2–4 sentences drawn from the spec's Problem Statement. What this PR does and why.>

## Changes

### Backend

- <Notable backend changes: new endpoints, services, error codes, middleware>

### Frontend

- <Notable frontend changes: new pages, components, hooks, UI flows>

### Data

- <Migrations included, schema changes>
- <Note expand-contract phase if applicable: "Phase 1 of 2 — drop column in follow-up PR">

## API Changes

| Method | Path              | Change |
| ------ | ----------------- | ------ |
| `POST` | `/api/<resource>` | Added  |

## Testing

- Unit tests: <pass/fail count or "not yet configured">
- E2E tests: <pass/fail count or "not yet configured">
- Coverage: <percentage>

## Checklist

- [x] All required artifacts approved
- [x] Code review passed
- [x] Security review passed
- [x] Tests pass and coverage meets threshold
- [x] Branch up to date with `main`
```
