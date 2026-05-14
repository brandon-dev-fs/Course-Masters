# Client CLAUDE.md

## Tech Stack
- React 19, React Router 7 (BrowserRouter + `<Routes>`), TypeScript 5
- Tailwind CSS 4 (via `@tailwindcss/vite` plugin — no `tailwind.config.js`)
- Tiptap 3 + KaTeX for rich text editing with LaTeX math
- better-auth 1.5 (`better-auth/react` client) for session-based auth
- Vite 6 dev server on port 5000; proxies `/api` → `http://localhost:5002`
- Icons: `lucide-react`; no other icon libraries

## Folder Structure

```
client/src/
├── api/              # All server communication
│   ├── client.ts     # Core fetch wrapper (apiClient), ApiClientError, classifyError
│   ├── types.ts      # All shared TypeScript interfaces and discriminated unions
│   ├── auth.ts       # better-auth client instance (authClient)
│   └── *.ts          # Per-resource modules (courses, units, lessons, assessments, etc.)
├── components/       # Shared, reusable UI primitives (never recreate inline)
├── context/
│   ├── AuthContext.tsx   # useAuth() hook — user, login, register, logout, refreshUser
│   └── ThemeContext.tsx  # useTheme() hook — theme, toggleTheme
├── features/         # Feature-scoped components and pages
│   ├── assessments/  # AssessmentSection, AssessmentForm, AssessmentTaker, QuestionEditor
│   ├── assignments/  # Assignment form/view components and per-type question editors
│   ├── auth/         # LoginPage, RegisterPage, ProfilePage, AdminUsersPage, RequireAuth, RequireRole
│   ├── courses/      # CourseCard, CourseDetailPage, CourseForm, CourseHero, syllabus modals
│   ├── exams/        # ExamCard
│   ├── flashcards/   # FlashCard, FlashCardList, FlashCardForm, FlashCardStudyMode
│   ├── home/         # HomePage, HeroSection
│   ├── lessons/      # LessonDetailPage, LessonForm, LessonList, sidebars, hooks/
│   ├── notes/        # NoteEditor (Tiptap-based, teacher-created content)
│   ├── practice-problems/ # PracticeProblemCard, PracticeProblemForm, PracticeProblemList
│   ├── progress/     # ProgressBar, UnitProgressCard, LessonStatusBadge, ResumeBar
│   ├── student-notes/ # StudentNotePanel, StudentToolsBar, StudentMaterialsModal
│   ├── tests/        # UnitTestCard
│   ├── units/        # UnitCard, UnitCardStrip, UnitForm, UnitList, UnitSettingsModal
│   ├── videos/       # VideoCard, VideoList, VideoForm (YouTube embeds)
│   └── vocab/        # VocabCard, VocabForm, VocabList
└── hooks/            # Shared hooks used across multiple features
```

**Rule:** Feature-specific hooks live in `features/<domain>/hooks/`. Shared hooks live in `src/hooks/`.

## Routing

Routes are defined in `App.tsx` using React Router `<Routes>`. All authenticated routes are wrapped with `<RequireAuth>`. The `<Layout>` component renders the sticky nav and `<Outlet>`.

```
/                         HomePage (LandingPage or CourseListPage based on auth)
/login                    LoginPage      (no Layout)
/register                 RegisterPage   (no Layout)
/courses/:courseId        CourseDetailPage
/courses/:courseId/units/:unitId/lessons/:lessonId  LessonDetailPage
/profile                  ProfilePage
/admin/users              AdminUsersPage  (RequireAuth + RequireRole roles=['admin'])
```

- `RequireAuth` — redirects to `/login` (with `state.from`) if not authenticated; shows `<LoadingSpinner />` while session loads.
- `RequireRole` — renders "Access Denied" UI inline (not a redirect) if role check fails.
- Login/Register pages intentionally render outside `<Layout>` (no nav/footer).

## Component Conventions

- **File naming:** PascalCase, one component per file, no barrel `index.ts` for components.
- **Default exports** for all components. Named exports only for types/interfaces.
- **Props pattern:** Inline interface at top of file; extend HTML element types when wrapping native elements (e.g., `extends ButtonHTMLAttributes<HTMLButtonElement>`).
- **No prop drilling past 2 levels** — lift to context or pass via a domain-specific hook.
- **Import paths** use `.js` extension (TypeScript `moduleResolution: bundler` with ESNext modules).

### Shared Components (`src/components/`)
Always use these — never recreate inline:

`Button` (variant: primary/secondary/danger/ghost/accent; size: sm/md/lg), `Input`, `Textarea`, `Modal` (isOpen+onClose), `ConfirmDialog` (item+onConfirm+onCancel), `ErrorMessage`, `LoadingSpinner`, `EmptyState`, `CardActions` (edit/delete), `RichTextEditor` (Tiptap+KaTeX, Tiptap JSON), `Tabs`, `Tooltip`, `LessonStatusIcon`, `ResourceCompletionCheckbox`, `ErrorBoundary` (fallback render prop).

## State Management

No global state store (no Redux, Zustand, etc.). State lives in:
1. **Context** — `AuthContext` (session) and `ThemeContext` (dark/light). Read-only from components via `useAuth()` / `useTheme()`.
2. **Page-level `useState` + `useEffect`** — each page fetches its own data.
3. **Domain hooks** — `useResourceList`, `useFetch`, `useOrderedList`, `useAssessment` encapsulate local state for specific patterns.

## Data Fetching

### `apiClient` (`src/api/client.ts`)
Always use `apiClient` for API calls — never call `fetch` directly in components.

```ts
apiClient.get<T>(url)
apiClient.post<T>(url, body)
apiClient.put<T>(url, body)
apiClient.patch<T>(url, body)
apiClient.delete<T>(url)
```

- Automatically includes `credentials: 'include'` and `Content-Type: application/json`.
- Responses are unwrapped from `{ data: T }` envelope.
- 204 responses return `undefined`.
- Non-2xx throws `ApiClientError(code, message, details, errorClass)`.
- On 401, dispatches `window.CustomEvent('auth:unauthorized')` — caught by `AuthContext` to clear user.
- Use `classifyError(err)` to get a user-facing string from an `ApiClientError`.

### `useFetch<T>` (`src/hooks/useFetch.ts`)
General-purpose single-fetch hook with cancellation and `reload()`:
```ts
const { data, loading, error, reload } = useFetch(() => api.getAll(id), [id]);
```
Re-fetches when any dep changes. `error` is a user-friendly string (via `classifyError`).

### `useResourceList<T, C, U>` (`src/hooks/useResourceList.ts`)
CRUD list pattern — use for any list with add/edit/delete modals. Returns `items`, `loading`, `error`, `showAdd`/`setShowAdd`, `editing`/`setEditing`, `deleting`/`setDeleting`, `handleAdd`, `handleUpdate`, `handleDelete`. Accepts `fetchFn`, `{ create, update, delete }` API adapter, a `key` string (change to refetch), and optional `sortFn`.

### `useOrderedList<T>` (`src/hooks/useOrderedList.ts`)
Swap-based reordering with optimistic updates and rollback. `persistFn: (a, b, aNewOrder, bNewOrder) => Promise<void>`.

### Error handling pattern
```tsx
{error && <ErrorMessage message={error} />}
```
Catch `ApiClientError` in async handlers; set local `error` string via `classifyError(err)`.

## Auth Integration

```ts
import { useAuth } from '../../context/AuthContext.js';
const { user, isLoading, login, register, logout, refreshUser } = useAuth();
```

- `user` is `AuthUser | null` (`id`, `name`, `email`, `role`, `image`, `emailVerified`).
- `isLoading` is `true` until the session check resolves — gate rendering behind it.
- Auth operations (login/register) call `authClient` from `better-auth/react` directly; `apiClient` is not used for auth routes.
- `authClient` is configured at `src/api/auth.ts` with `baseURL: 'http://localhost:5002'` and `basePath: '/api/auth'`.
- The `adminClient()` plugin is included for admin user management.

### Authorization pattern
```ts
import useCanEdit from '../../hooks/useCanEdit.js';
const canEdit = useCanEdit(); // true if role is 'teacher' or 'admin'
```
Use `canEdit` to conditionally show edit/delete UI. Use `user?.role === 'admin'` for admin-only UI.

## Styling

### Tailwind v4
- Configured via `@tailwindcss/vite` plugin — no `tailwind.config.js` file.
- Tokens defined in `src/index.css` using `@theme inline {}` block mapping CSS custom properties.
- Themed via `.dark` class on `<html>` (toggled by `ThemeContext`) — custom properties swap values.
- **Never use `dark:` Tailwind prefix** — all mode switching is done via CSS variables.

### Design tokens (use these, not raw colors)
| Token | Use |
|---|---|
| `bg-background` / `text-foreground` | Page background and primary text |
| `bg-surface` | Cards, sidebars, panels |
| `bg-surface-raised` | Modals, dropdowns, elevated elements |
| `bg-primary` / `text-primary` | Brand green (#138808 light) |
| `bg-accent` / `text-accent` | Brand blue (#085287 light) |
| `bg-charcoal` | Third brand color |
| `bg-destructive` / `text-destructive` | Error/delete states |
| `text-muted-foreground` | Secondary/helper text |
| `border-border` | All borders |
| `bg-primary-subtle` / `bg-accent-subtle` | Washes for badges/active tabs |
| `text-success` / `text-warning` | Status text |

### Shadow utilities
Use `shadow-warm-sm`, `shadow-warm-md`, `shadow-warm-lg` (defined in `index.css`).

### Typography
Fonts: `Nunito` (body) and `Nunito Sans` (loaded via Google Fonts in `index.css`). No font utility classes needed — applied globally on `html`.

### Rich text display
Wrap Tiptap-rendered HTML in `className="rich-text"` to apply all prose styles.

## Forms and Validation

- Forms use `useState` per field with an inline async submit handler.
- Loading and error state are managed locally in each form component (no form library).
- Client-side validation is done manually before calling the API (check required fields, email format, etc.).
- Server validation errors surface as `ApiClientError` — display via `<ErrorMessage>`.

## Key Third-Party Integrations

### Tiptap + KaTeX (`src/components/RichTextEditor.tsx`)
- Extensions: headings, bold, italic, code, lists, blockquotes, tables.
- KaTeX math via inline math node with live preview panel.
- Output/input is Tiptap JSON stored in `LessonResource.content.body` (typed as `TiptapJSON = Record<string, unknown>`).
- Render Tiptap JSON with `EditorContent` (read-only editor); wrap output in `className="rich-text"`.

### YouTube embeds (`src/utils/youtube.ts`)
- Always use `youtube-nocookie.com` domain for embeds (privacy-enhanced mode).
- `useYouTubeTitle` hook fetches video title from `/api/youtube/title?url=...`.

### CalculatorPanel (`src/features/assessments/CalculatorPanel.tsx`)
Floating calculator shown during assessments when `calculatorEnabled` is set on a question. Managed by `useCalculator` hook.

## TypeScript Conventions

- All shared interfaces and type aliases live in `src/api/types.ts` — do not duplicate elsewhere.
- API types use **discriminated unions** on the `type` field: `LessonResource`, `LessonTool`, `AssessmentQuestion`, `Assignment`.
- Narrow discriminated unions with `if (resource.type === 'note')` before accessing type-specific `content`.
- `TiptapJSON` is `Record<string, unknown>` — do not type it more narrowly.
- Use `import type` for type-only imports. All imports use `.js` extension suffix.
- Avoid `any` — use `unknown` and narrow with `instanceof` or type guards.
- `tsconfig.json` extends `../tsconfig.base.json`; `noEmit: true`; `moduleResolution: bundler`.

## Vite Config Notes

- Dev server: port 5000, proxy `/api` → `http://localhost:5002`.
- No path aliases configured (no `@/` — use relative imports).
- Tailwind is a Vite plugin, not a PostCSS plugin.

## Assessment Abstraction

`AssessmentSection` is the unified entry point for all assessment types (lesson quiz, unit test, course exam). It accepts an `api` adapter built from `assessmentsApi` methods:

```ts
const quizApi = {
  get: assessmentsApi.getLessonQuiz,
  create: assessmentsApi.createLessonQuiz,
  update: assessmentsApi.update,
  submitAttempt: assessmentsApi.submitAttempt,
  getAttempts: assessmentsApi.getAttempts,
};
<AssessmentSection parentId={lessonId} api={quizApi} label="Lesson Quiz" />
```

Never build separate quiz/test/exam UI — always use the shared `AssessmentSection` / `AssessmentTaker` / `AssessmentForm` / `QuestionEditor` stack.

## Common Gotchas

- **`.js` imports in TypeScript** — all local imports end in `.js` (bundler resolution). Do not use `.ts` or omit the extension.
- **No `dark:` prefix** — the project does not use Tailwind's `dark:` variant. All theming is CSS variable-based. Adding `dark:` classes will silently have no effect.
- **`apiClient` only for REST** — auth calls go through `authClient` (better-auth), not `apiClient`.
- **`useResourceList` `key` param** — must change to trigger a refetch (e.g., pass `lessonId` as the key).
- **`useFetch` cancellation** — the hook sets a `cancelled` flag on cleanup; always prefer this hook over manual `useEffect` + fetch to avoid state updates on unmounted components.
- **Ordered items** — `LessonResource`, `LessonTool`, and `Assignment` all have an `order` field. Always sort by `order` before rendering. Use `useOrderedList` to manage reordering.
- **`ErrorBoundary` fallback** — `LessonDetailPage` uses per-section error boundaries with a custom `fallback(error, reset)` render prop for graceful degradation.
- **Content discriminated unions** — always narrow `LessonResource`, `LessonTool`, and `AssessmentQuestion` by `type` before reading `.content` to get correct TypeScript narrowing.
- **`AuthContext` loads async** — always check `isLoading` before rendering auth-gated content or making authorization decisions based on `user`.

---

## User Instructions
<!-- Add your personal preferences and workflow notes here -->
