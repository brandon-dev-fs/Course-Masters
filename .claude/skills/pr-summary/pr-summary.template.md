# <prefix>-<n>: <Spec title>

## Summary

<Drawn from the spec's Problem Statement. 2–4 sentences explaining what this PR does and why.>

## Changes

### Backend

- <Bulleted list of notable backend changes drawn from backend plan>
- <New endpoints, new error codes, schema changes, etc.>

### Frontend

- <Bulleted list of notable frontend changes drawn from frontend plan>
- <New features, components, hooks>

### Data

- <Migrations included, schema changes>
- <Note expand-contract phase if applicable: "Phase 1 of 2 — drop column in follow-up PR">

<Remove sections not applicable to this PR.>

## API Changes

<List endpoints added, modified, or deprecated. Pulled from api-contract.>

| Method | Path | Change |
|--------|------|--------|
| `POST` | `/v1/<resource>` | Added |

<Remove section if no API changes.>

## Testing

- Unit tests: <pass/fail count from test report>
- E2E tests: <pass/fail count from test report>
- Coverage: <percentage>

<If test framework not yet bootstrapped: "Test framework not yet configured; manual verification only.">

## Reviews

- Code review: `.claude/reviews/<id>-code-review.md` — <approved | approved with low-severity notes>
- Security review: `.claude/reviews/<id>-security-review.md` — <approved | approved with low-severity notes>

## Artifacts

All design artifacts are committed under `.claude/`:

- Spec: `.claude/specs/<id>-spec.md`
- <List wireframe, plans, contract as applicable>

## Deployment Notes

<Anything special for deploy: feature flags, env vars, follow-up migrations, manual steps. Remove section if none.>

## Checklist

- [x] All required artifacts approved
- [x] Code review passed
- [x] Security review passed
- [x] Tests pass and coverage meets threshold
- [x] Branch up to date with `develop`
