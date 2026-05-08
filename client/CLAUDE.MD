# Client CLAUDE.md

## Architecture
- Feature-based organization under `src/features/` (17 feature dirs) — no global state store
- Shared UI primitives in `src/components/` (14 components) — always use these, never recreate inline
- Contexts: `ThemeContext` (light/dark), `AuthContext` (session, login/register/logout)
- Each page fetches its own data via `useState` + `useEffect`

## Features
| Feature | Key Components |
|---|---|
| assessments | AssessmentSection (unified for quiz/test/exam), AssessmentForm, AssessmentTaker, AssessmentResults, QuestionEditor |
| auth | LoginPage, RegisterPage, ProfilePage, AdminUsersPage, RequireAuth, RequireRole |
| courses | CourseListPage, CourseDetailPage, CourseCard, CourseForm |
| flashcards | FlashCard, FlashCardList, FlashCardForm, FlashCardStudyMode |
| lessons | LessonDetailPage, LessonForm, LessonList |
| notes | NoteEditor (rich text, teacher-created, backed by LessonResource type='note'/'lecture') |
| student-notes | StudentNotePanel (plain text, per-student) |
| practice-problems | PracticeProblemCard, PracticeProblemForm, PracticeProblemList |
| progress | CourseProgressCard, LessonStatusBadge, ProgressBar, UnitProgressCard |
| units | UnitAccordion, UnitAccordionItem, UnitForm, UnitList |
| videos | VideoCard, VideoList, VideoForm (YouTube embed, backed by LessonResource type='video') |
| vocab | VocabCard, VocabForm, VocabList |
| landing | LandingPage (unauthenticated) |

## Shared Components
Button (polymorphic, variants: primary/secondary/danger/ghost/accent), CardActions, ConfirmDialog, EmptyState, ErrorMessage, Footer, Input, Layout, LoadingSpinner, Modal, RichTextEditor (Tiptap + KaTeX), Tabs, Textarea, Tooltip

## API Layer
- All calls go through `src/api/client.ts` (`apiClient`) — never call `fetch` directly in components
- Add new calls to per-resource modules (`courses.ts`, `units.ts`, `lesson-resources.ts`, etc.)
- Interfaces live in `src/api/types.ts`
- Non-2xx responses throw `ApiClientError`; catch and display via `<ErrorMessage>`
- Auth uses `better-auth` client directly (not apiClient) — see `src/api/auth.ts`
- Credentials (cookies) included automatically in all requests

### Key API modules
| Module | Covers |
|---|---|
| `lesson-resources.ts` | LessonResource CRUD (`note`, `video`, `lecture`) — replaces old notes/videos APIs |
| `lesson-tools.ts` | LessonTool CRUD (`flash_card`, `practice_problem`, `vocab`) — replaces old flashcards/vocab/practice APIs |
| `assessments.ts` | Unified assessment API for quiz/test/exam — `getLessonQuiz`, `getUnitQuiz`, `getCourseExam`, `createLessonQuiz`, `createUnitQuiz`, `createCourseExam`, `update`, `submitAttempt`, `getAttempts` |

### Content shape conventions
- **LessonResource** `content` field:
  - `note` / `lecture`: `{ body: <Tiptap JSON> }`
  - `video`: `{ url: string }`
- **LessonTool** `content` field:
  - `flash_card`: `{ front: string, back: string }`
  - `practice_problem`: `{ question: string, options: string[], correctIndex: number }`
  - `vocab`: `{ term: string, definition: string }`
- **AssessmentQuestion** `content` field:
  - `multiple_choice`: `{ options: string[], correctIndex: number }`
  - `true_false`: `{ correctAnswer: boolean }`

## Custom Hooks

**Convention:** Feature-specific hooks live in `features/<domain>/hooks/` (e.g., `features/lessons/hooks/useAssignments.ts`). Shared hooks used across multiple features live in `src/hooks/`.

| Hook | Purpose |
|---|---|
| `useResourceList` | Generic CRUD list (fetch, add, update, delete, sort) with loading/error/modal state |
| `useFormSubmit` | Form submission with error/loading state |
| `useAssessment` | Assessment lifecycle (get, create, take, submit, view results) |

### useAssessment API interface
```ts
interface AssessmentApi {
  get: (parentId: string) => Promise<Assessment | null>;
  create: (parentId: string, data: { questions: QuestionDraft[] }) => Promise<Assessment>;
  update?: (assessmentId: string, data: { questions: QuestionDraft[] }) => Promise<Assessment>;
  submitAttempt: (id: string, answers: unknown[]) => Promise<AttemptResult>;
  getAttempts?: (id: string) => Promise<AttemptSummary[]>;
}
```
Pass an adapter object built from `assessmentsApi` methods — see `AssessmentSection` usage in `LessonDetailPage`, `UnitAccordionItem`, and `CourseDetailPage` for examples.

## Theming & Styling
- Light/dark toggled via `.dark` class on `<html>` — managed by `ThemeContext`
- **Do not use `dark:` Tailwind prefix** — CSS variables handle mode switching automatically
- Semantic tokens: `bg-background`, `bg-surface`, `bg-surface-raised`, `bg-primary`, `bg-accent`, `bg-destructive`, `text-foreground`, `text-muted-foreground`, `border-border`
- Shadow utilities: `shadow-warm-sm`, `shadow-warm-md`, `shadow-warm-lg`

## Authorization Pattern
- `RequireAuth` wrapper for logged-in routes, `RequireRole` for role-specific access
- Components check `user?.role` to conditionally show edit/delete actions (teacher/admin only)
- 401 responses dispatch global `auth:unauthorized` event → triggers logout

## Rich Text Editor
- Tiptap-based (`src/components/RichTextEditor.tsx`) with headings, bold, italic, code, lists, blockquotes, tables
- LaTeX math support via KaTeX — inline math with live preview editing panel
- Content stored as JSON (Tiptap format) in `LessonResource.content.body`

## Key Conventions
- Assessment abstraction: shared `AssessmentTaker`/`AssessmentForm`/`QuestionEditor` reused for quiz, test, exam — never duplicate question UI
- `QuestionDraft` shape: `{ type?, question, content: { options: string[], correctIndex: number }, order }` — mirrors `AssessmentQuestion.content`
- YouTube embeds use `youtube-nocookie.com` for privacy
- Forms use `useState` for field values, `useFormSubmit` for async submission
- Optimistic UI updates via `useResourceList`

---

## User Instructions
<!-- Add your personal preferences and workflow notes here -->
