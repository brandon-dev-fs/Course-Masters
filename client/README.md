# Course Masters — Client

React 19 + Vite + TypeScript frontend for the Course Masters self-directed learning platform. Communicates with the Express API server via a Vite dev proxy.

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI rendering |
| React Router | 7 | Client-side routing |
| TypeScript | 5 | Static typing |
| Tailwind CSS | 4 | Utility-first styling via `@tailwindcss/vite` plugin |
| Vite | 6 | Dev server and bundler |
| better-auth | 1.5 | Session-based authentication |
| Tiptap | 3 | Rich text editor with KaTeX math support |
| lucide-react | — | SVG icons |

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server on port 5000 |
| `npm run build` | Type-check and produce a production build |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run tests once (Vitest + jsdom) |
| `npm run test:watch` | Watch mode |
| `npm run test:coverage` | Run with V8 coverage (70% threshold) |

## Dev Server

Runs on **port 5000**. All `/api` requests are proxied to `http://localhost:5002` (the Express backend) — no CORS configuration needed during development.

## Project Structure

```
src/
  api/                  # All server communication
    client.ts           # Core fetch wrapper (apiClient), ApiClientError, classifyError
    types.ts            # All shared TypeScript interfaces and discriminated unions
    auth.ts             # better-auth client instance (authClient)
    assessments.ts, assignments.ts, bookmarks.ts, checklist.ts
    courses.ts, lesson-resources.ts, lesson-tools.ts, lessons.ts
    progress.ts, resource-completions.ts, student-notes.ts, units.ts

  components/           # Shared UI primitives (never recreate inline)
    Button, Input, Textarea, Modal, ConfirmDialog, ErrorMessage, LoadingSpinner,
    EmptyState, CardActions, RichTextEditor, Tabs, Tooltip, LessonStatusIcon,
    ResourceCompletionCheckbox, ErrorBoundary, Layout, Footer, MobileDrawer

  context/
    AuthContext.tsx      # useAuth() — user, isLoading, login, register, logout, refreshUser
    ThemeContext.tsx     # useTheme() — theme, toggleTheme

  features/             # Feature modules with pages, forms, and components
    assessments/        # Shared quiz/test/exam UI (AssessmentSection → AssessmentTaker → AssessmentForm)
    assignments/        # Assignment forms and views
    auth/               # LoginPage, RegisterPage, ProfilePage, AdminUsersPage
    courses/            # CourseDetailPage, CourseCard, CourseForm
    exams/              # ExamCard
    flashcards/         # FlashCard CRUD and study mode
    home/               # HomePage, HeroSection, LandingPage
    lessons/            # LessonDetailPage, LessonForm, sidebars
    notes/              # NoteEditor (Tiptap-based)
    practice-problems/  # PracticeProblemCard, form, list
    progress/           # ProgressBar, UnitProgressCard, LessonStatusBadge, ResumeBar
    student-notes/      # StudentNotePanel, StudentToolsBar, StudentMaterialsModal
    tests/              # UnitTestCard
    units/              # UnitCard, UnitForm, UnitList
    videos/             # VideoCard, VideoForm, VideoList (YouTube embeds)
    vocab/              # VocabCard, VocabForm, VocabList

  hooks/                # Shared hooks across features
    useFetch, useResourceList, useOrderedList, useAssessment
    useCanEdit, useCalculator, useDisclosure, useMediaQuery, useYouTubeTitle
```

## Routing

Defined in `App.tsx` using React Router v7. Authenticated routes are wrapped with `<RequireAuth>`. The `<Layout>` component renders the sticky nav and `<Outlet>`.

| Path | Component | Auth |
|---|---|---|
| `/` | HomePage (LandingPage or CourseListPage) | None |
| `/login` | LoginPage | None |
| `/register` | RegisterPage | None |
| `/courses/:courseId` | CourseDetailPage | Required |
| `/courses/:courseId/units/:unitId/lessons/:lessonId` | LessonDetailPage | Required |
| `/profile` | ProfilePage | Required |
| `/admin/users` | AdminUsersPage | Required + admin role |

## State Management

No global store (no Redux, Zustand, etc.):

1. **App-wide context**: `AuthContext` (session + auth operations) and `ThemeContext` (light/dark mode). Read via `useAuth()` / `useTheme()`.
2. **Page-level**: Each page uses `useState` + `useEffect` to fetch and manage its own data.
3. **Domain hooks**: `useFetch` (single fetch with cancellation), `useResourceList` (CRUD list pattern), `useOrderedList` (drag-to-reorder with optimistic updates), `useAssessment` (unified assessment flow).

## API Layer

All HTTP requests go through `src/api/client.ts` (`apiClient`). It includes `credentials: 'include'` automatically, unwraps the `{ data: T }` envelope, and throws typed `ApiClientError` on non-2xx responses. On 401, dispatches `auth:unauthorized` to clear the session in `AuthContext`.

Auth operations (login, register, session) go through `authClient` from `better-auth/react`. Never use `apiClient` for auth routes.

## Theming

Tailwind v4 with CSS custom properties. **Never use `dark:` prefixes** — all mode switching is CSS variable-based.

- Tokens defined in `src/index.css` via `@theme inline` block.
- `:root` defines light-mode values; `.dark` (applied to `<html>` by `ThemeContext`) overrides them.
- Key tokens: `bg-background`, `bg-surface`, `bg-surface-raised`, `bg-primary` (#047857 light / #10B981 dark), `bg-accent` (#2563EB light / #60A5FA dark), `bg-destructive`, `text-foreground`, `text-muted-foreground`, `border-border`.
- Shadow utilities: `shadow-warm-sm`, `shadow-warm-md`, `shadow-warm-lg`.
- Fonts: Nunito (body) and Nunito Sans — applied globally, no utility classes needed.

## Testing

Vitest with `jsdom` environment and React Testing Library. Test files in `src/__tests__/<layer>/` (hooks, components, context, api, utils).

Key test utilities:
- `setup/renderWithProviders.tsx` — full provider tree wrapper (AuthProvider + MemoryRouter)
- `mocks/apiClient.mock.ts`, `mocks/authClient.mock.ts` — mock factories
- `mocks/authContext.mock.ts` — `makeAuthContext()`, `makeStudentUser()`, `makeTeacherUser()`, `makeAdminUser()`

Use `renderWithProviders` for component tests needing the full provider tree. For hooks that only need synchronous auth state, use `AuthContext.Provider` directly with `makeAuthContext()`.

Coverage threshold: 70%, enforced only by `npm run test:coverage`.
