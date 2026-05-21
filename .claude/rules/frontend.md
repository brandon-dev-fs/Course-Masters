# Frontend Rules

Load on-demand when encountering frontend source files.
Read `CLAUDE.md` for the project's frontend tech stack and conventions.

## Folder Structure

- Feature code lives in `src/features/<domain>/`. Each feature directory contains its components, and optionally a `hooks/` subdirectory for feature-specific hooks.
- Shared, reusable UI primitives live in `src/components/`. If a component is used by more than one feature, it belongs here.
- Shared hooks used across multiple features live in `src/hooks/`. Feature-specific hooks live in `src/features/<domain>/hooks/`.
- All API communication modules live in `src/api/`. One file per resource: `courses.ts`, `units.ts`, `assessments.ts`.
- All shared TypeScript interfaces and types live in `src/api/types.ts` — never duplicate type definitions across files.
- Context providers live in `src/context/`. Only create a new context when state must be shared across unrelated component subtrees.
- Never create barrel `index.ts` files for component directories.

## Components

- One component per file. File names are PascalCase matching the component name.
- Use `function` declarations for components: `export default function MyComponent()`. Default export for all components.
- Named exports only for types/interfaces alongside the component.
- Define props as an inline `interface` at the top of the file. Extend HTML element types when wrapping native elements (e.g., `extends ButtonHTMLAttributes<HTMLButtonElement>`).
- No prop drilling past 2 levels — lift state to context or pass via a domain-specific hook.
- Always use shared components from `src/components/` (`Button`, `Input`, `Modal`, `ErrorMessage`, `LoadingSpinner`, etc.) — never recreate these inline.
- Assessment UI always uses the shared stack: `AssessmentSection` → `AssessmentTaker` → `AssessmentForm` → `QuestionEditor`. Never build separate quiz/test/exam components.

## State Management

- No global state library (no Redux, Zustand, Jotai). This is intentional — do not add one.
- State hierarchy:
  1. **Context** — `AuthContext` (session) and `ThemeContext` (dark/light). Both are read-only from components via hooks.
  2. **Page-level `useState` + `useEffect`** — each page fetches its own data on mount.
  3. **Domain hooks** — `useFetch`, `useResourceList`, `useOrderedList`, `useAssessment` encapsulate reusable state patterns.
- Only create a new context when multiple unrelated component subtrees need the same state. Prefer passing props or lifting state before reaching for context.
- Never store derived state — compute it inline or with `useMemo`. If value A determines value B, only store A.

## Data Fetching and Error Handling

- Always use `apiClient` from `src/api/client.ts` — never call `fetch` directly in components.
- Auth calls go through `authClient` (better-auth), not `apiClient`. Never mix them.
- Use `useFetch<T>` for single-resource fetching with cancellation and `reload()`.
- Use `useResourceList<T, C, U>` for CRUD list patterns with add/edit/delete modals.
- Error display pattern: `{error && <ErrorMessage message={error} />}`. Catch `ApiClientError` in handlers and use `classifyError(err)` to produce user-facing strings.
- Do not add automatic retry or exponential backoff. Show the error and let the user retry via UI action.
- Always check `isLoading` from `useAuth()` before rendering auth-gated content — the session loads asynchronously.
- Always check `loading` from `useFetch` before rendering data — show `<LoadingSpinner />` during load.

## Import Conventions

- All imports use `.js` extension (TypeScript `moduleResolution: bundler` requirement).
- Import order:
  1. React / React ecosystem (`react`, `react-router-dom`)
  2. Third-party libraries (`lucide-react`, `katex`, etc.)
  3. API modules (`../../api/...`)
  4. Type-only imports (`import type { ... }`)
  5. Feature-local hooks and components (`./hooks/...`, `./MyComponent.js`)
  6. Cross-feature imports (`../other-feature/...`)
  7. Shared components (`../../components/...`)
  8. Shared hooks and utilities (`../../hooks/...`, `../../utils/...`)
- Separate each group with a blank line.
- Always use `import type` for type-only imports.

## Styling

- Tailwind CSS v4 via the `@tailwindcss/vite` plugin — there is no `tailwind.config.js`.
- Use design tokens defined in `src/index.css` — never use raw color values (e.g., `bg-green-600`). Use `bg-primary`, `text-accent`, `border-border`, etc.
- **Never use Tailwind's `dark:` prefix** — theming is handled entirely via CSS custom properties that swap on the `.dark` class. Adding `dark:` classes will silently have no effect.
- Use the project's shadow utilities: `shadow-warm-sm`, `shadow-warm-md`, `shadow-warm-lg`.
- Wrap Tiptap-rendered HTML in `className="rich-text"` to inherit prose styles.
- Keep utility class lists readable — if a class string exceeds ~10 utilities, extract common patterns into a local `const` or consider whether the element should be a shared component.
- No inline styles (`style={{ }}`) unless dynamically computed values require it (e.g., calculated widths, transforms).

## Accessibility

- Target: **WCAG 2.1 Level AA** compliance.
- All interactive elements must be keyboard-accessible. Buttons use `<button>`, links use `<a>` — never use `<div onClick>` or `<span onClick>` for interactive elements.
- All images must have meaningful `alt` text, or `alt=""` with `aria-hidden="true"` for decorative images.
- Form inputs must have associated `<label>` elements (via `htmlFor`) or `aria-label`.
- Modals must trap focus, return focus on close, and be dismissible with `Escape`.
- Color contrast must meet AA minimums (4.5:1 for normal text, 3:1 for large text). The design tokens are designed to meet this — do not override them with raw colors.
- Use semantic HTML: `<nav>`, `<main>`, `<section>`, `<article>`, `<header>`, `<footer>` where appropriate.
- Loading states must be announced to screen readers — use `aria-live="polite"` on dynamic content regions.
- Error messages from form validation must be programmatically associated with their input via `aria-describedby`.

## Responsive Design

- Desktop-first approach — design for full-width layouts, then add responsive overrides for smaller screens.
- Use Tailwind responsive prefixes to adjust for smaller viewports: `md:` (768px), `sm:` (640px). Most layouts should work at `md` and above; `sm` is for mobile-specific adjustments.
- Test at three breakpoints: desktop (1280px+), tablet (768px–1024px), mobile (< 640px).
- Navigation collapses to a mobile menu at the `md` breakpoint.
- Avoid fixed pixel widths on content containers — use `max-w-*` utilities with percentage-based or auto margins.
- Cards and grid layouts should stack vertically on mobile. Use `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` patterns.
- Touch targets must be at least 44x44px on mobile (WCAG 2.1 AA requirement).

## TypeScript

- All shared interfaces live in `src/api/types.ts` — never duplicate.
- Use discriminated unions on the `type` field for `LessonResource`, `LessonTool`, `AssessmentQuestion`. Always narrow with `if (item.type === '...')` before accessing type-specific `content`.
- `TiptapJSON` is `Record<string, unknown>` — do not attempt to type it more narrowly.
- Avoid `any` — use `unknown` and narrow with type guards or `instanceof`.
- Use `import type` for type-only imports.

## Forms

- Forms use `useState` per field with an inline async submit handler. No form libraries (no React Hook Form, Formik, etc.).
- Client-side validation is manual — check required fields and formats before calling the API.
- Server validation errors surface as `ApiClientError` — display with `<ErrorMessage>`.
- Submit buttons must show a loading state (disabled + spinner) during submission to prevent double-submits.
- Always clear error state when the user modifies a field after a submission failure.
