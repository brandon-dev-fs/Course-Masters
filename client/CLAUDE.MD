# CLAUDE.md

## Architecture
- Feature-based organization under `src/features/` — no global state store
- Shared UI primitives in `src/components/` — always use these, never recreate inline patterns
- Context only for cross-cutting concerns (currently: `ThemeContext`)
- Each page fetches its own data via `useState` + `useEffect`

## API Layer
- All calls go through `src/api/client.ts` (`apiClient`) — never call `fetch` directly in components
- Add new calls to the per-resource module (`courses.ts`, `units.ts`, etc.), not inside components
- Interfaces live in `src/api/types.ts`
- Non-2xx responses throw `ApiClientError`; catch and display `error.message`

## Theming
- Light/dark toggled via `.dark` class on `<html>` — managed by `ThemeContext`
- **Do not use `dark:` Tailwind prefix** — CSS variables handle mode switching automatically
- Use semantic tokens: `bg-background`, `bg-surface`, `bg-surface-raised`, `bg-primary`, `bg-accent`, `bg-destructive`, `text-foreground`, `text-muted-foreground`, `border-border`

## Routing
- All routes declared in `App.tsx`, wrapped in `<Layout>`
- Use `useParams()` for route params, `useNavigate()` for programmatic navigation

## Assessment Components
- Reuse `src/features/assessments/` (`AssessmentForm`, `AssessmentTaker`, `AssessmentResults`, `QuestionEditor`) — do not duplicate question UI

## Testing
- Vitest + React Testing Library for interactive components and context state
- Mock API calls at the fetch layer

---

## User Instructions
<!-- Add your personal preferences and workflow notes here -->
