# Frontend Rules

Loaded by: `frontend-architect`, `frontend-developer`, `code-reviewer`, `designer` (for context).

## Stack

- Framework: React 19
- Language: TypeScript (strict mode)
- Styling: Tailwind CSS
- State: no external state management library — use React built-ins (`useState`, `useReducer`, `useContext`)
- HTTP: typed `ApiClient` returning data or throwing `ApiClientError`

## Folder structure

All frontend code lives under `client/src/`. Organize by **feature folder** pattern:

```
client/src/
├── features/
│   ├── <feature-name>/
│   │   ├── components/      # feature-scoped components
│   │   ├── hooks/           # feature-scoped hooks
│   │   ├── api.ts           # API calls for this feature
│   │   ├── types.ts         # types for this feature
│   │   └── index.ts         # public surface
├── components/              # shared components used across features
├── hooks/                   # shared hooks (e.g., useFormSubmit, useResourceList)
├── lib/                     # shared utilities (ApiClient, ApiClientError, etc.)
└── styles/                  # global styles, Tailwind config extensions
```

- Code that belongs to one feature stays inside that feature folder.
- A component used by two or more features moves to `client/src/components/`.
- Features do not import from each other directly. Cross-feature use goes through shared `components/`, `hooks/`, or `lib/`.

## Components

- Function components only. No class components.
- One component per file. File name matches component name in PascalCase.
- Props are explicitly typed with an exported `<Component>Props` interface.
- Default exports for components; named exports for everything else.

## State

- Local UI state: `useState`.
- Complex local state: `useReducer`.
- Cross-component state: `useContext` with a provider colocated to the feature.
- Server state is not "state" — it lives in the response of API hooks. Do not mirror server data into local state except for in-flight form drafts.

## Data fetching and error handling

- All API calls go through the typed `ApiClient`.
- `ApiClient` deserializes server `{ error: { code, message, details } }` into `ApiClientError` instances and throws them.
- Hooks like `useFormSubmit` and `useResourceList` catch `ApiClientError` and expose it as local error string state.
- The `<ErrorMessage>` component is the standard renderer for these errors.
- **Never call `fetch` directly.** Always go through `ApiClient`.
- **Never display raw error objects to the user.** Use `<ErrorMessage>`.

## Styling

- Tailwind utility classes only. No CSS modules, no styled-components, no inline `style` props except for dynamic values that cannot be expressed as Tailwind classes.
- Use design tokens defined in `tailwind.config.js`. Never hardcode color hex, spacing pixel values, or font sizes — reference Tailwind tokens.
- See `design.md` for design system tokens (colors, typography, spacing).

## Accessibility

- Target WCAG 2.1 Level AA.
- All interactive elements must be keyboard accessible.
- All form inputs must have associated labels.
- All images must have `alt` text (empty `alt=""` for decorative).
- Use semantic HTML (`<button>`, `<nav>`, `<main>`, etc.) before reaching for `<div>` with ARIA.

## Responsive design

- Desktop-first. Default styles target desktop; use Tailwind's `max-*` breakpoints to adapt down.
- Minimum supported viewport: 360px width.

## Dependencies

- New runtime dependencies require justification in the implementation plan.
- Prefer React built-ins and existing dependencies before adding new ones.

## TypeScript

- `strict: true` in `tsconfig.json`.
- Avoid `any`. If unavoidable, comment why.
- Avoid type assertions (`as`) except at boundaries where the type cannot be inferred (e.g., parsing JSON).
