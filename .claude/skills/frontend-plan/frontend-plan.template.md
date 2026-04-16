---
id: <prefix>-<n>
title: <Feature name> — frontend plan
stage: design
status: pending
# optional: approver: human
# optional: approved_at: 2026-04-15T10:30:00Z
depends_on:
  - <prefix>-<n>-spec
  - <prefix>-<n>-wireframe       # if UI artifact exists
  - <prefix>-<n>-api-contract
---

# <Title> — Frontend Plan

## Summary

<One paragraph describing what's being built on the frontend.>

## Feature Folder Structure

Files to be created or modified under `client/src/features/<feature-name>/`.

```
client/src/features/<feature-name>/
├── components/
│   ├── <ComponentName>.tsx
│   └── <ComponentName>.tsx
├── hooks/
│   └── use<HookName>.ts
├── api.ts
├── types.ts
└── index.ts
```

## Component Tree

<Hierarchy of components, with prop interfaces.>

### `<ComponentName>`

```ts
interface <ComponentName>Props {
  // ...
}
```

- **Renders**: <what it renders>
- **Children**: <other components used>
- **State**: <local state, if any>
- **Hooks used**: <hooks called>

## Hooks

### New hooks

- `use<Name>` — <purpose, return shape>

### Existing hooks used

- `useFormSubmit` — <how>
- `useResourceList` — <how>

## API Calls

Every endpoint called, referencing the api-contract verbatim. If a needed capability is missing from the contract, do not invent it — flag in Open Questions.

| Method | Path | Called from | Purpose |
|--------|------|-------------|---------|
| GET | /v1/<resource> | `<feature>/api.ts` | <purpose> |

## State Management

- **Local state**: <what lives in `useState` per component>
- **Cross-component state**: <`useContext` providers, if any>
- **Server state**: <which hook owns each piece of server data>

## Pseudocode

For non-obvious logic only. Skip if everything is straightforward.

### <Logic name>

```
<pseudocode>
```

## Design Token Additions

Tokens this plan requires that the wireframe flagged. Confirm they're listed in the wireframe's `## Required Token Additions`.

- <token>

## Open Questions

<Anything blocking implementation. Remove section if none.>
