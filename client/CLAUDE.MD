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