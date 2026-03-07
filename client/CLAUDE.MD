# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Guidelines
- Keep React Context scoped and modular — avoid a single global store
- Organize by feature (e.g., `features/courses/`, `features/lessons/`) rather than by file type
- frontend should be primarily presentational and handle UI state

## Error Handling Conventions

Consistent error handling across the backend and frontend. The goal is predictable error shapes so the client can always parse and display errors reliably.

### Frontend

- Create a shared API client (e.g., `client/src/api/client.ts`) that wraps `fetch`. It should automatically parse error responses into the standard shape and throw typed errors the UI can catch.
- Components should handle errors via try/catch or error boundaries. Display user-friendly messages based on the `error.code` — never show raw error objects or stack traces.
- Use a toast or notification system for transient errors (network failures, validation errors). Use inline error states for form-level issues.

## Testing Strategy

Testing should be pragmatic — focus coverage on the areas most likely to break and provide the most value.

### Vitest
- **Component unit tests** for interactive elements — forms, quiz/test taking UI, flash card interactions.
- **Context/state tests** to verify state updates (e.g., adding a lesson updates the unit's lesson list).
- Use React Testing Library for DOM-based assertions. Avoid testing implementation details.
- Mock API calls at the fetch/axios layer.

## Project Structure

```
src/
  main.tsx                        # Entry point — mounts <App> inside <BrowserRouter>
  App.tsx                         # Route definitions and top-level providers
  index.css                       # Tailwind v4 import, @theme inline tokens, light/dark CSS vars

  api/
    client.ts                     # Typed fetch wrapper (apiClient) + ApiClientError class
    types.ts                      # Shared TypeScript interfaces for all API resources
    courses.ts                    # Course CRUD calls
    units.ts                      # Unit CRUD calls
    lessons.ts                    # Lesson CRUD calls
    notes.ts                      # Note CRUD calls
    flashcards.ts                 # FlashCard CRUD calls
    practice-problems.ts          # PracticeProblem CRUD calls
    quizzes.ts                    # Quiz fetch + attempt submission
    tests.ts                      # Test fetch + attempt submission
    exams.ts                      # FinalExam fetch + attempt submission
    progress.ts                   # Course and unit progress fetch

  components/                     # Shared UI primitives (no feature logic)
    Layout.tsx                    # App shell — top nav, Outlet
    Button.tsx
    Input.tsx
    Textarea.tsx
    Modal.tsx
    ConfirmDialog.tsx
    Tabs.tsx
    LoadingSpinner.tsx
    ErrorMessage.tsx
    EmptyState.tsx

  context/
    ThemeContext.tsx               # Theme state (light/dark) + useTheme hook

  features/
    courses/
      CourseListPage.tsx           # "/" — list all courses
      CourseDetailPage.tsx         # "/courses/:courseId" — units + progress
      CourseCard.tsx
      CourseForm.tsx
    units/
      UnitDetailPage.tsx           # "/courses/:courseId/units/:unitId" — lessons + test
      UnitList.tsx
      UnitForm.tsx
    lessons/
      LessonDetailPage.tsx         # "/courses/:courseId/units/:unitId/lessons/:lessonId"
      LessonList.tsx
      LessonForm.tsx
    notes/
      NoteList.tsx
      NoteCard.tsx
      NoteForm.tsx
    flashcards/
      FlashCardList.tsx
      FlashCard.tsx
      FlashCardStudyMode.tsx
      FlashCardForm.tsx
    practice-problems/
      PracticeProblemList.tsx
      PracticeProblemCard.tsx
      PracticeProblemForm.tsx
    assessments/                   # Shared assessment building blocks
      AssessmentForm.tsx           # Question authoring form (used by quiz, test, exam)
      AssessmentTaker.tsx          # Interactive question-taking UI
      AssessmentResults.tsx        # Score/pass display after submission
      QuestionEditor.tsx           # Individual question editor
    quizzes/
      QuizSection.tsx              # Lesson-level quiz (composes assessment components)
    tests/
      TestSection.tsx              # Unit-level test
    exams/
      ExamSection.tsx              # Course-level final exam
    progress/
      ProgressBar.tsx
      CourseProgressCard.tsx
      UnitProgressCard.tsx
      LessonStatusBadge.tsx
```

## Routing

React Router v7 (`react-router-dom`). The router is provided in `main.tsx` (`<BrowserRouter>`), and all routes are declared in `App.tsx`.

Route hierarchy mirrors the backend's nested resource structure:

```
/                                                          CourseListPage
/courses/:courseId                                         CourseDetailPage
/courses/:courseId/units/:unitId                           UnitDetailPage
/courses/:courseId/units/:unitId/lessons/:lessonId         LessonDetailPage
```

All four page routes render inside the shared `<Layout>` component via a wrapping `<Route element={<Layout />}>`. There are no lazily loaded routes — all pages are statically imported in App.tsx.

Use `useParams()` to access `:courseId`, `:unitId`, and `:lessonId` within page components. Use `useNavigate()` for programmatic navigation after create/delete actions.

## API Layer

All network calls go through `src/api/client.ts`, which wraps `fetch` and provides a consistent interface:

```ts
import { apiClient } from '../api/client.js';

// GET
const courses = await apiClient.get<Course[]>('/courses');

// POST
const course = await apiClient.post<Course>('/courses', { title, description });

// PUT
const updated = await apiClient.put<Course>(`/courses/${id}`, { title });

// DELETE
await apiClient.delete(`/courses/${id}`);
```

On non-2xx responses the client parses the server's `{ error: { code, message, details } }` shape and throws an `ApiClientError`. Components catch this in try/catch blocks and display the `error.message`.

Per-resource modules (`courses.ts`, `units.ts`, `lessons.ts`, etc.) compose `apiClient` calls and export named functions (e.g., `getCourses`, `createUnit`, `deleteLesson`). Always add new API calls to the appropriate module rather than calling `apiClient` directly inside components.

All TypeScript interfaces for API request/response shapes live in `src/api/types.ts` and are imported by both the API modules and the feature components.

The Vite dev server proxies all `/api/*` requests to `http://localhost:3001`, so no CORS configuration or absolute URLs are needed during development.

## Theming

The app supports light and dark modes. The active theme is controlled by toggling the `.dark` class on `<html>` (the `documentElement`).

**CSS custom properties** for both modes are defined in `src/index.css`. The `@theme inline` block maps Tailwind utility color tokens to these custom properties so that utilities like `bg-background` or `text-muted-foreground` automatically reflect the active theme without any extra class variants.

Do not use the `dark:` Tailwind prefix. The CSS variable indirection already handles mode switching — adding `dark:` overrides would conflict with this approach.

**ThemeContext** (`src/context/ThemeContext.tsx`) stores the active theme in React state, syncs it to `localStorage` (key: `"theme"`), and exposes a `useTheme()` hook that returns `{ theme, toggleTheme }`. The default theme is `"dark"`.

```ts
import { useTheme } from '../../context/ThemeContext.js';

const { theme, toggleTheme } = useTheme();
```

**Semantic color token reference** — use these Tailwind utilities rather than raw color values:

| Token class              | Purpose                                  |
|--------------------------|------------------------------------------|
| `bg-background`          | Page background                          |
| `bg-surface`             | Cards, sidebars, panels                  |
| `bg-surface-raised`      | Elevated cards, modals, dropdowns        |
| `bg-primary`             | Primary brand color (India green)        |
| `bg-accent`              | Accent brand color (ocean blue)          |
| `bg-destructive`         | Destructive/error backgrounds            |
| `text-foreground`        | Primary body text                        |
| `text-muted-foreground`  | Secondary/subdued text                   |
| `border-border`          | Standard border color                    |

## Component Conventions

Shared, stateless UI primitives live in `src/components/`. These are the building blocks for all feature UIs:

- `Button` — standard button with variant/size props
- `Input` — labeled text input
- `Textarea` — labeled textarea
- `Modal` — overlay dialog wrapper
- `ConfirmDialog` — pre-built modal for destructive confirmations
- `Tabs` — tab bar + panel switcher
- `LoadingSpinner` — full or inline loading indicator
- `ErrorMessage` — styled error display
- `EmptyState` — placeholder for empty lists

Always use these primitives. Do not recreate inline `<button>`, `<input>`, or modal patterns inside feature components.

Feature-specific components (forms, cards, section wrappers) belong inside their feature folder under `src/features/`. They should not be placed in `src/components/`.

The shared assessment components in `src/features/assessments/` (`AssessmentForm`, `AssessmentTaker`, `AssessmentResults`, `QuestionEditor`) are designed to be composed by the quiz, test, and exam feature sections. Reuse them rather than duplicating question-editing or question-taking UI.

## State Management

There is no global state store. Each page component fetches its own data with `useState` + `useEffect` + the relevant API module functions. State is local to the component that owns it, and passed down as props or lifted to the nearest common ancestor when sharing is needed.

Context is reserved for genuinely cross-cutting concerns. Currently the only Context is `ThemeContext`. Do not introduce new contexts for data that belongs to a single feature or page.