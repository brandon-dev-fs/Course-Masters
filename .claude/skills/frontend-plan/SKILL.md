---
name: frontend-plan
description: Generate a technical implementation plan for the frontend portion of a feature. Use when /design runs and the spec's Required Design Artifacts includes frontend-plan. Requires the api-contract to exist first. Produces .claude/plans/<id>-frontend-plan.md.
---

# frontend-plan

## Purpose

Produce a technical plan the frontend developer agent will implement: feature folder structure, component tree with prop interfaces, hooks, API calls referencing the contract, state management approach, and pseudocode for non-obvious logic.

## Inputs

- The approved spec at `.claude/specs/<id>-spec.md`
- The wireframe at `.claude/designs/<id>-wireframe.md` (if produced — required if spec listed `ui-design`)
- The api-contract at `.claude/plans/<id>-api-contract.md` (must exist; wait for backend-plan/api-contract to produce it)

## Output

A single file at `.claude/plans/<id>-frontend-plan.md` matching `template.md` in this skill's directory.

## Procedure

1. **Read** `template.md` in this skill directory.

2. **Verify prerequisites**:
   - Spec is `status: approved`.
   - If spec listed `ui-design`, wireframe exists (any status — it'll be approved by the time `/implement` runs).
   - api-contract exists at `.claude/plans/<id>-api-contract.md`. If not, wait for the backend-architect agent to produce it before continuing.

3. **Fill the template**:
   - **Feature Folder Structure**: list exact files to be created under `client/src/features/<feature-name>/`. Follow the feature folder pattern from `frontend.md`.
   - **Component Tree**: hierarchy with TypeScript prop interfaces.
   - **Hooks**: new hooks (with return shapes) and existing shared hooks used (e.g., `useFormSubmit`, `useResourceList`).
   - **API Calls**: every endpoint called, copied verbatim from the api-contract. Method, path, purpose, calling file.
   - **State Management**: where state lives. Local `useState`, `useReducer` for complex local state, `useContext` for cross-component, server response from API hooks for server state.
   - **Pseudocode**: only for non-obvious logic. Skip if everything is straightforward.
   - **Design Token Additions**: confirm tokens needed are listed in the wireframe's required-additions section.

4. **Contract conformance check**: every API call referenced must exist in the api-contract with matching method and path. If the wireframe needs a capability the contract doesn't provide, **do not invent an endpoint**. Add to `## Open Questions` and flag for the backend architect to extend the contract.

5. **Write** to `.claude/plans/<id>-frontend-plan.md` with `status: pending`.

6. **Report** the file path and note that the plan requires human approval.

## Constraints

- Follow the feature folder pattern. No cross-feature imports.
- API calls go through `ApiClient`, never raw `fetch`. Reflect this in the plan.
- React 19, TypeScript strict, no external state library, Tailwind for styling, WCAG 2.1 AA.
- Do not write outside `.claude/plans/`.
