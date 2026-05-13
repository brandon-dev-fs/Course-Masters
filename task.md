# Refactor Backlog — Spec Prompts

Run each prompt with `/spec <prompt>` to generate a spec for that item.
Items are ordered by recommended priority within each section.

---

## Backend

### B-1 through B-5 — Security & Ownership

~~ /spec Add ownership and authorization enforcement to all content mutation endpoints. Currently, lesson, unit, resource, tool, and assessment update/delete endpoints do not verify the requesting user owns the parent course — any teacher can modify another teacher's content. Assignment completion endpoints do not verify the completing user is the record owner. Student note upsert does not scope to the requesting user. Assessment update has no teacher/admin role check. Progress endpoints do not scope results to the requesting user. Each of these endpoints needs an ownership or role check before allowing the operation. Additionally, design the authorization checks to be extensible for a future enrollment model that will restrict course/lesson access per enrollment, without breaking current open-access behavior used during development. ~~

### B-7 through B-9 — Layering, DRY & Error Handling

~~/spec Refactor the backend service layer to enforce clean separation between data access and business logic. Currently Progress.service combines database queries and computation logic in a single method, and parent-existence checks (asserting that a lesson, unit, or course exists before a child operation) are repeated identically across 11+ service methods. Extract a shared assertExists utility for parent validation. Additionally, centralize Prisma error mapping in the global error handler so that constraint violations, invalid enum values, and other Prisma error codes are mapped to structured API errors instead of propagating as unhandled 500s.~~

### B-10 — Response Envelope Standardization

~~/spec Standardize the API response envelope format across all endpoints. Currently, endpoints return a mix of raw Prisma models, custom-shaped objects, and progress DTOs with no shared structure. Define a consistent success response shape and apply it uniformly across all routes, including list endpoints, single-resource endpoints, and action endpoints (e.g., marking complete, submitting attempts).~~

### B-11 — Per-Type Content Validation

~~/spec Replace z.record(z.any()) validation on all content JSON fields with per-type discriminated union Zod schemas. Affected models include AssessmentQuestion (multiple_choice, true_false, matching, fill_in_blank), LessonResource (note, video, lecture), and LessonTool (flash_card, practice_problem, vocab). Each type has a known structure — for example, matching questions must have a pairs array, fill_in_blank must have an acceptedAnswers array, multiple_choice must have options and a correctIndex. The schemas should enforce these shapes at the API boundary so structurally invalid data cannot be persisted.~~

### B-12 — Query Parameter Validation

~~/spec Add route-layer validation for query parameters on resource and tool list endpoints. Currently, the type filter on GET /lessons/:lessonId/resources and GET /lessons/:lessonId/tools casts req.query.type directly to the enum type without runtime validation. Invalid enum values pass silently to the service layer. Add Zod validation at the route layer to reject invalid type values with a clear 400 error before they reach the service.~~

### B-13 through B-15 — Observability & Middleware Consistency

~~/spec Add structured request logging middleware and extend rate limiting beyond auth endpoints. Currently there is no middleware logging incoming requests, response times, or status codes, making production debugging very difficult. Add structured logging middleware that captures method, path, authenticated user ID, status code, and response time for every request. Additionally, apply rate limiting to compute-heavy endpoints such as progress calculation and assessment submission, not just auth routes. Finally, standardize auth (401) and authorization (403) error responses to use the AppError pattern consistently — currently they use hardcoded structures that differ from the rest of the error handling system.~~

### B-16 & B-17 — Data Access & Pagination

~~/spec Fix two data access issues: (1) assignment.reorder() currently updates each record individually in a loop, which is vulnerable to race conditions under concurrent requests — replace with a batched Prisma transaction. (2) Add cursor-based or offset pagination to the admin users list endpoint and the assessment attempts endpoint, which are the only two endpoints with unbounded growth in practice. All other list endpoints are naturally bounded and do not need pagination.~~

---

## Frontend

### F-1 through F-3 — Component Decomposition

~~/spec Decompose three oversized components into focused, single-responsibility sub-components. (1) LessonDetailPage is 855 lines with 20+ useState declarations handling resources, tools, assignments, modals, and assessments all in one component — split into focused sub-components (ResourcesSection, ToolsSection, AssignmentsSection, AssessmentSection) each managing their own state. (2) QuizSection, TestSection, and ExamSection are nearly identical in structure — extract into a shared AssessmentSection component parameterized by assessment type. (3) PracticeProblemAssignmentForm inlines four separate question type editors (MultipleChoiceEditor, TrueFalseEditor, MatchingEditor, FillInBlankEditor) with duplicated state and validation — extract into a shared QuestionEditor component driven by question type.~~

### F-4 through F-7 — DRY & Shared Hooks

~~/spec Extract duplicated logic into shared hooks and utilities across the frontend. (1) YouTube URL regex and title-fetch logic are duplicated in VideoForm and VideoAssignmentForm — extract to a useYouTubeTitle hook and utils/youtube.ts. (2) Role checks (user?.role === 'teacher' || user?.role === 'admin') are scattered across components — extract to a useCanEdit() hook or role utility. (3) The existing useResourceList hook is not used consistently — several pages implement duplicate fetch/add/update/delete logic manually instead of extending the hook. (4) LessonDetailPage has 20+ separate state slices — consolidate into domain hooks (useLessonResources, useLessonTools, useLessonAssessments).~~

### F-8 through F-10 & F-12 — Error Handling & Type Safety

~~/spec Address error handling gaps and unsafe typing on the frontend. (1) Add an ErrorBoundary component at the app root and at key feature boundaries — currently any component error crashes the full page with no recovery. (2) Remove silent .catch(() => {}) patterns, particularly in useAssessment attempt loading, and surface failures to the user with appropriate messaging. (3) Distinguish between client errors (400), server errors (500), and network failures in user-facing error messages — all currently show a generic string. (4) Replace content: Record<string, unknown> API response types with discriminated union types per content variant to eliminate the unsafe casts scattered throughout the codebase (content.options as string[], content.body as TiptapJSON, etc.).~~

### F-11 — Form Standardization with react-hook-form

~~/spec Migrate all forms in the client to react-hook-form with consistent field-level error display. Currently forms use a mix of ad-hoc inline validation, blur handlers, manual setError/try/catch/finally patterns, and the useFormSubmit hook with no consistent approach. Adopt react-hook-form as the standard across all forms. Standardize field-level error display using a single ErrorMessage component pattern. Remove redundant manual validation logic (e.g., passing percentage 0–100 range checks duplicated across multiple components).~~

### F-13 through F-15 — Accessibility

~~/spec Fix three accessibility issues across the client. (1) Pass/fail status in QuizSection and TestSection is conveyed by color alone — add text labels alongside color indicators. (2) Modal focus management is incomplete — focus should move into the modal on open and return to the trigger element on close. (3) AssignmentStepper is missing aria-current="step" on the active step for screen reader users.~~

---

## Database

### D-1 through D-4 — Integrity & Constraints

```
/spec Fix four data integrity issues in the database schema. (1) LessonResourceCompletion uses polymorphic string fields (resourceType, resourceId) with no foreign key enforcement — replace with two explicit tables: LessonResourceCompletion with a FK to LessonResource, and LessonToolCompletion with a FK to LessonTool. (2) Assessment has no CHECK constraint ensuring exactly one of lessonId, unitId, courseId is non-null — a record can have two populated. (3) Assignment.type enum has no constraint verifying the corresponding sub-table (NoteAssignment, VideoAssignment, etc.) is populated for the given type. (4) QuestionType (on AssessmentQuestion) and PracticeQuestionType (on PracticeProblemQuestion) are identical enums — merge into a single shared enum to prevent future divergence.
```

### D-5 & D-6 — Indexes & Timestamps

```
/spec Add missing database indexes and audit timestamps. Add standalone indexes on LessonCompletion.lessonId, UnitCompletion.unitId, StudentNote.lessonId, AssignmentCompletion.assignmentId, and the assignmentId foreign keys on all assignment sub-tables (NoteAssignment, VideoAssignment, ReadingAssignment, VocabAssignment, PracticeProblemQuestion). Add createdAt and updatedAt timestamp fields to Unit, Lesson, LessonResource, LessonTool, and AssessmentQuestion — these are core content entities currently lacking any audit trail.
```

### D-7 — Soft Deletes

```
/spec Implement soft delete support for key models. Add an optional deletedAt timestamp field to User, Course, Lesson, Assessment, and Assignment. Update delete operations on these models to set deletedAt rather than hard-deleting the record. Update queries that read these models to filter out soft-deleted records by default. Cascade soft deletes appropriately — soft-deleting a Course should soft-delete its Units and Lessons. Preserve existing hard-delete cascade behavior for child records that do not need audit trails (e.g., AssessmentQuestion, LessonResource).
```

### D-8 — Naming Convention

```
/spec Add a @@map("student_note") directive to the StudentNote model in the Prisma schema. All other models use explicit snake_case @@map directives; StudentNote is the only model missing one, causing it to default to the PascalCase table name. Generate and apply the corresponding migration.
```
