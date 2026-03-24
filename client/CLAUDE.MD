# Client CLAUDE.md

## Architecture
- Feature-based organization under `src/features/` (17 feature dirs) — no global state store
- Shared UI primitives in `src/components/` (14 components) — always use these, never recreate inline
- Contexts: `ThemeContext` (light/dark), `AuthContext` (session, login/register/logout)
- Each page fetches its own data via `useState` + `useEffect`

## Features
| Feature | Key Components |
|---|---|
| assessments | AssessmentForm, AssessmentTaker, AssessmentResults, QuestionEditor |
| auth | LoginPage, RegisterPage, ProfilePage, AdminUsersPage, RequireAuth, RequireRole |
| courses | CourseListPage, CourseDetailPage, CourseCard, CourseForm |
| exams / quizzes / tests | ExamSection, QuizSection, TestSection (use shared assessment components) |
| flashcards | FlashCard, FlashCardList, FlashCardForm, FlashCardStudyMode |
| lessons | LessonDetailPage, LessonForm, LessonList |
| notes | NoteEditor (rich text, teacher-created) |
| student-notes | StudentNotePanel (plain text, per-student) |
| practice-problems | PracticeProblemCard, PracticeProblemForm, PracticeProblemList |
| progress | CourseProgressCard, LessonStatusBadge, ProgressBar, UnitProgressCard |
| units | UnitAccordion, UnitAccordionItem, UnitForm, UnitList |
| videos | VideoCard, VideoList, VideoForm (YouTube embed) |
| vocab | VocabCard, VocabForm, VocabList |
| landing | LandingPage (unauthenticated) |

## Shared Components
Button (polymorphic, variants: primary/secondary/danger/ghost/accent), CardActions, ConfirmDialog, EmptyState, ErrorMessage, Footer, Input, Layout, LoadingSpinner, Modal, RichTextEditor (Tiptap + KaTeX), Tabs, Textarea, Tooltip

## API Layer
- All calls go through `src/api/client.ts` (`apiClient`) — never call `fetch` directly in components
- Add new calls to per-resource modules (`courses.ts`, `units.ts`, `videos.ts`, etc.)
- Interfaces live in `src/api/types.ts`
- Non-2xx responses throw `ApiClientError`; catch and display via `<ErrorMessage>`
- Auth uses `better-auth` client directly (not apiClient) — see `src/api/auth.ts`
- Credentials (cookies) included automatically in all requests

## Custom Hooks
| Hook | Purpose |
|---|---|
| `useResourceList` | Generic CRUD list (fetch, add, update, delete, sort) with loading/error/modal state |
| `useFormSubmit` | Form submission with error/loading state |
| `useAssessment` | Assessment lifecycle (get, create, take, submit, view results) |

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
- Content stored as JSON (Tiptap format) in Note model

## Key Conventions
- Assessment abstraction: shared `AssessmentTaker`/`AssessmentForm`/`QuestionEditor` reused for quiz, test, exam — never duplicate question UI
- YouTube embeds use `youtube-nocookie.com` for privacy
- Forms use `useState` for field values, `useFormSubmit` for async submission
- Optimistic UI updates via `useResourceList`

---

## User Instructions
<!-- Add your personal preferences and workflow notes here -->
