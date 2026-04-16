---
name: frontend-code
description: Implement frontend code per the approved frontend plan, in an isolated worktree, with passing unit tests. Use when /implement runs in the frontend worktree. Reads spec, frontend plan, and api-contract; writes code following the feature folder pattern.
---

# frontend-code

## Purpose

Implement the frontend code described in the approved frontend plan. Code lives in the assigned worktree on branch `feature/<id>-frontend`. Includes unit tests for new code (when test framework exists). Commits with `<id>: <imperative summary>` format.

## Inputs

- The approved spec at `.claude/specs/<id>-spec.md`
- The approved frontend plan at `.claude/plans/<id>-frontend-plan.md`
- The approved api-contract at `.claude/plans/<id>-api-contract.md`
- Optionally a rejected review doc at `.claude/reviews/<id>-code-review.md` or `.claude/reviews/<id>-security-review.md` when re-running after a failed review
- The worktree path and branch name (passed by `/implement`)

## Output

- Source files committed to the worktree under `client/src/features/<feature-name>/` and shared paths as needed
- Unit test files (when test framework exists)
- Tailwind config additions for new tokens listed in the wireframe
- Git commits in format `<id>: <imperative summary>`

## Procedure

1. **Verify prerequisites**: spec, frontend plan, and api-contract all `status: approved`.

2. **Check for review feedback**: if a review doc was passed, read its `## Issues` section. Address each issue at severity `medium` or above. Do not skip issues.

3. **Add Tailwind tokens**: read the wireframe's `## Required Token Additions` (if present). Add these to `tailwind.config.js` before using them. Never use arbitrary values like `text-[13px]`.

4. **Implement** code following the plan exactly:
   - Folder structure per the plan, under `client/src/features/<feature-name>/`.
   - Components match the prop interfaces in the plan.
   - All API calls go through `ApiClient`. Endpoint paths and request shapes match the api-contract verbatim.
   - Errors from `ApiClient` (typed `ApiClientError`) are caught by hooks and rendered via `<ErrorMessage>`.
   - State per the plan: `useState`, `useReducer`, `useContext`. No external state library.
   - Tailwind utility classes for styling. Reference design tokens, no hex colors or arbitrary pixel values.

5. **Contract immutability**: if you discover the api-contract is missing a needed capability, **stop**. Do not invent endpoints. Report the gap; this is a stop-and-escalate event back to `/design`.

6. **Write unit tests** for new components, hooks, and utilities (when test framework exists in the project). If no test framework is configured, note this and proceed.

7. **Run tests** (if framework exists). Do not commit if tests fail.

8. **Commit** with `<id>: <imperative summary>` messages. Multiple commits are fine; logical grouping preferred.

9. **Report success** only when all tests pass (or no test framework exists).

## Constraints

- Stay within the assigned worktree. Do not modify backend code, `.claude/` artifacts, or `config.yaml`/`rules.md`.
- Never call `fetch` directly. Always `ApiClient`.
- Never display raw error objects to users. Always `<ErrorMessage>`.
- Never use arbitrary Tailwind values. Add tokens to config first.
- TypeScript strict mode. Avoid `any`; if unavoidable, comment why.
- WCAG 2.1 AA. Keyboard accessible, visible focus, semantic HTML.
- Cross-feature imports forbidden. If two features need to share, refactor through `client/src/components/` or `client/src/hooks/`.
- Never check out, merge to, or push to any branch in `protected_branches` from `config.yaml`.
- Never force-push or rewrite shared history.
