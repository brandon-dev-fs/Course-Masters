# Course Masters — Client

React 19 + Vite + TypeScript frontend for the Course Masters self-directed learning platform. Communicates with the Express API server via a Vite dev proxy and presents a full course management and study interface.

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI rendering |
| React Router | v7 | Client-side routing |
| Tailwind CSS | v4 | Utility-first styling via `@tailwindcss/vite` plugin |
| TypeScript | 5.x | Static typing |
| Vite | 6.x | Dev server and bundler |

## Scripts

```bash
npm run dev       # Start the Vite dev server on port 5173
npm run build     # Type-check with tsc, then produce a production build
npm run preview   # Serve the production build locally for inspection
```

These scripts should be run from the client workspace directory, or from the monorepo root via `npm run dev --workspace=client`.

## Project Structure

```
src/
  api/              # API layer — typed fetch wrapper and per-resource modules
    client.ts       # Core fetch wrapper; parses errors into typed ApiError shapes
    types.ts        # Shared TypeScript interfaces for all API resources
    courses.ts
    units.ts
    lessons.ts
    notes.ts
    flashcards.ts
    practice-problems.ts
    quizzes.ts
    tests.ts
    exams.ts
    progress.ts

  components/       # Shared, reusable UI primitives
    Layout.tsx      # App shell — nav bar and <Outlet />
    Button.tsx
    Input.tsx
    Textarea.tsx
    Modal.tsx
    ConfirmDialog.tsx
    ErrorMessage.tsx
    EmptyState.tsx
    LoadingSpinner.tsx
    Tabs.tsx

  context/
    ThemeContext.tsx # Light/dark mode state; persists choice to localStorage

  features/         # Feature-based modules, each owning its own pages, forms, and components
    courses/        # Course list page, detail page, course card, course form
    units/          # Unit detail page, unit list, unit form
    lessons/        # Lesson detail page, lesson list, lesson form
    notes/          # Note card, note list, note form
    flashcards/     # Flash card, flash card list, flash card form, study mode
    practice-problems/  # Practice problem card, list, and form
    assessments/    # Shared assessment components — form, taker, results, question editor
    quizzes/        # Lesson-level quiz section
    tests/          # Unit-level test section
    exams/          # Course-level final exam section
    progress/       # Progress bar, course/unit progress cards, lesson status badge

  App.tsx           # Route definitions
  main.tsx          # React DOM entry point
  index.css         # Tailwind import, @theme tokens, light/dark CSS custom properties
```

## Key Features

- **Course / Unit / Lesson CRUD** — Create, edit, and delete courses, units within courses, and lessons within units. Each level has its own detail page and inline forms.
- **Study materials** — Each lesson supports notes, flash cards, and practice problems, all manageable from the lesson detail page.
- **Flash card study mode** — `FlashCardStudyMode` presents cards one at a time with a flip interaction, allowing focused review of a lesson's flash card set.
- **Assessments** — Three tiers of multiple-choice assessment: lesson-level quizzes, unit-level tests, and a course-level final exam. A shared `AssessmentTaker` component handles question flow and answer selection; `AssessmentResults` displays score and pass/fail outcome.
- **Progress tracking** — `CourseProgressCard` and `UnitProgressCard` display completion percentages, lesson quiz status, and whether unit tests and the final exam have been passed.
- **Light / dark theme** — Toggle persists to `localStorage`. No page reload required.

## API Layer

All HTTP communication goes through `src/api/client.ts`, a thin wrapper around the native `fetch` API. It:

- Prefixes every request with `/api` (resolved to `http://localhost:3001` by the Vite proxy during development).
- Attaches `Content-Type: application/json` on requests with a body.
- Parses non-OK responses and throws a typed `ApiError` (`{ code, message, details? }`) so components can branch on `error.code` rather than inspecting raw HTTP status codes.

Individual resource modules (`courses.ts`, `units.ts`, etc.) import the client and export typed functions such as `getCourses()`, `createUnit()`, and `deleteLesson()`. All response payloads are typed against the interfaces in `src/api/types.ts`.

## Theming

Tailwind v4's `@theme inline` block in `src/index.css` maps semantic design tokens (e.g., `--color-background`, `--color-primary`) to CSS custom properties. The actual values of those custom properties are defined in two rulesets:

- `:root` — light theme defaults.
- `.dark` — dark theme overrides, applied to the `<html>` element by `ThemeContext`.

Because the Tailwind tokens reference CSS custom properties at runtime rather than at build time, toggling the `.dark` class on `<html>` automatically re-resolves every utility that uses a semantic token. There is no need for `dark:` variant prefixes in component markup.

### Color Tokens

| Token | Light | Dark |
|---|---|---|
| `--color-primary` | `#138808` (India green) | `#17a009` |
| `--color-accent` | `#085287` (Ocean blue) | `#0a6db5` |
| `--color-background` | `#ffffff` | `#1e1e24` |
| `--color-surface` | `#ebebef` | `#27272e` |
| `--color-surface-raised` | `#ffffff` | `#2f2f38` |
| `--color-foreground` | `#1e1e24` | `#f0f0f3` |
| `--color-border` | `#dddde2` | `#3a3a46` |
| `--color-destructive` | `#dc2626` | `#ef4444` |

## Dev Server and Proxy

The Vite dev server runs on **port 5173**. Any request beginning with `/api` is proxied to `http://localhost:3001` (the Express server), so no CORS configuration is required during development. The proxy is defined in `vite.config.ts`:

```ts
server: {
  proxy: {
    '/api': 'http://localhost:3001',
  },
},
```

## Error Handling

- Components catch errors from API calls via `try/catch` and display user-friendly messages using `ErrorMessage` or inline state.
- Errors are always parsed into the standard `ApiError` shape before being surfaced to the UI — raw error objects and stack traces are never displayed.
- Transient errors (network failures, validation rejections) are intended for a toast/notification system; form-level validation errors are shown inline.

## Architecture Notes

- React Context is kept scoped and modular — there is no single global store. `ThemeContext` is the only app-wide context; feature state is managed locally within pages or passed as props.
- Components are primarily presentational. Data fetching and mutations live in page-level components and are passed down.
- The monorepo root runs both workspaces concurrently with `npm run dev`. Start there rather than running the client in isolation unless you are working on purely UI concerns with mocked data.
