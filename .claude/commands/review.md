---
description: Run code review and security review on the integration branch. Produces review docs with structured issues and severity-gated auto-approval. Agent-approved if zero issues at medium or above.
argument-hint: <spec id>
---

# /review

You are running the **Review stage** of the agentic development workflow. This command runs both code review and security review against the integration branch diff, producing structured review documents.

## Arguments

- Spec ID: $ARGUMENTS (required)

If the spec ID is empty, ask the user for one and stop.

## Procedure

### 1. Verify environment

Confirm the following exist:

- `.claude/config.yaml` — read `default_branch`, `worktree_root`
- `.claude/rules.md`
- `.claude/rules/review.md`
- `.claude/reviews/` directory — create if missing

Derive the repo name from the current working directory.

### 2. Verify prerequisites

- The integration branch `feature/<id>` must exist.
- The integration worktree at `<worktree_root>/<repo>-<id>-integration/` must exist.
- `/implement` must have completed successfully (both coder tracks done, integration merged).

If the integration branch or worktree doesn't exist, stop:

```
Cannot review <id>. Integration branch feature/<id> not found.
Run /implement <id> first.
```

### 3. Load context

Read the following for the reviewer agents:

- `.claude/specs/<id>-spec.md`
- `.claude/plans/<id>-backend-plan.md` (if exists)
- `.claude/plans/<id>-frontend-plan.md` (if exists)
- `.claude/plans/<id>-api-contract.md` (if exists)

### 4. Run code review

Invoke the `code-reviewer` agent with:

- The spec and plans loaded above
- The diff: `git diff <default_branch>..feature/<id>` (run from the integration worktree)
- The `code-review` skill
- Rules to load: `.claude/rules.md`, `.claude/rules/review.md`, `.claude/rules/backend.md`, `.claude/rules/frontend.md`, `.claude/rules/data.md`, `.claude/rules/api.md`

The code-reviewer uses the `code-review` skill to:

- Read `template.md` from the skill directory
- Run the checklist from `review.md` against every changed file
- Produce `.claude/reviews/<id>-code-review.md` with issues classified by severity
- Set `status: approved` (if zero issues at `medium`+) or `status: rejected`

### 5. Run security review

Invoke the `security-reviewer` agent with:

- The spec and plans loaded above
- The same diff
- The `security-review` skill
- Rules to load: `.claude/rules.md`, `.claude/rules/review.md`, `.claude/rules/backend.md`, `.claude/rules/data.md`, `.claude/rules/api.md`

The security-reviewer uses the `security-review` skill to:

- Read `template.md` from the skill directory
- Run the security checklist from `review.md`
- Produce `.claude/reviews/<id>-security-review.md` with issues, each carrying `hand_back_to`
- Set `status: approved` (if zero issues at `medium`+) or `status: rejected` with doc-level `hand_back_to`

### 6. Verify outputs

For each review doc produced, verify:

- File exists at expected path
- Frontmatter contains `id`, `stage: review`, `status` (approved or rejected), `approver: agent`
- If rejected, `## Issues` section is present with at least one issue at `medium`+
- Security review: if rejected, `hand_back_to` is set in frontmatter

### 7. Report to the user

#### Both reviews passed

```
Review complete for <id>: <title>

Code review:     approved (0 blocking issues)
Security review: approved (0 blocking issues)

Low/info issues (advisory):
  - <file>:<line> — <short description> (low)
  - <file>:<line> — <short description> (info)

Files:
  .claude/reviews/<id>-code-review.md
  .claude/reviews/<id>-security-review.md

Next step: /test <id>
```

If there are no low/info issues either, omit that section.

#### One or both reviews rejected

```
Review complete for <id>: <title>

Code review:     rejected (X blocking issues)
Security review: rejected (Y blocking issues) — hand back to: <stage>

Blocking issues:
  [code-review] <file>:<line> — <short description> (severity)
  [security]    <file>:<line> — <short description> (severity)

Files:
  .claude/reviews/<id>-code-review.md
  .claude/reviews/<id>-security-review.md

Next steps:
  Address the issues, then re-run the appropriate command:
    /implement <id> .claude/reviews/<id>-code-review.md       — for code issues
    /design <id> .claude/reviews/<id>-security-review.md      — for design-level security issues
    /implement <id> .claude/reviews/<id>-security-review.md   — for implementation-level security issues
```

Only show the relevant re-run commands based on which reviews rejected and the security review's `hand_back_to` value.

#### Human override note

Always include at the end:

```
Note: You can override agent approval decisions.
  To reject an approved review:  edit frontmatter to status: rejected
  To approve a rejected review:  /approve <file path>
```

## Constraints

- Never modify source code. Reviews produce documents only.
- Never modify spec, design, or plan artifacts.
- Never write outside `.claude/reviews/`.
- Never modify `config.yaml` or `rules.md`.
- Run both reviews even if the first one rejects. The user benefits from seeing all issues at once rather than fixing code review issues only to discover security issues on the next pass.
- Overwrite existing review docs on re-run (e.g., after `/implement` fixes were made and `/review` is re-run). Git preserves history.
