---
id: cm-0028
title: Lesson Activities — Overhaul Reading, Student Tools, and Persistence
stage: spec
status: approved
approver: human
approved_at: 2026-06-04T00:00:00Z
---

# Lesson Activities — Overhaul Reading, Student Tools, and Persistence

## Problem Statement

The current lesson activity and student tool system has several overlapping issues that collectively degrade the student and teacher experience:

1. **"Reading" assignments are misleadingly named.** A "reading" in the `Assignment` model is actually an external link. Students and teachers alike expect a page they can read inline; instead they are redirected to a browser tab. The label should be "External Link" throughout the UI and in new API payloads.

2. **The external link view is bare-bones.** There is no iframe attempt, no fallback, and no contextual label. Students receive only an anchor tag; there is no in-lesson experience for embeddable content.

3. **`LessonResource` objects may be legacy/unused.** The `LessonResource` model (`ResourceType`: `note | video | lecture`) predates the `Assignment` model. It is unknown whether any live UI depends on these objects or whether they can be deprecated. This needs investigation and reporting.

4. **Student tool panels lack persistence.** "Activity bookmarks" (saved positions within an activity) and the student checklist inside each lesson are stateless — they reset on every page load. Students cannot resume work or track their own in-lesson progress across sessions.

5. **Practice problems appear in both lesson activities and the student tools panel.** `practice_problem` assignments serve as teacher-created activities. Having practice also appear in the student tools panel creates confusion about when and how students use this feature. The student tools panel should surface only Notes, Flash Cards, and Vocab.

6. **Vocab data model inconsistency.** The `StudentVocabFlashCard` model points to `LessonTool` (the old vocab system). The new `StudentVocabAssignmentFlashCard` model is correct. The old `StudentVocabFlashCard` records should be deleted and the old model removed to avoid confusion.

## Scope

### In Scope

- Renaming "reading" to "external link" across all UI labels, form labels, and API type display strings (the database enum value `reading` and the `AssignmentType` string stay unchanged to avoid a migration).
- Replacing the bare `ReadingAssignmentView` with a best-effort iframe embed; falling back to an "Open in new tab" link when the iframe fails or is blocked.
- Investigating `LessonResource` usage and reporting findings within this spec's architecture section.
- Adding server-side persistence for **activity bookmarks** — a per-student, per-assignment record storing the student's last-visited position or state within a specific assignment activity.
- Adding server-side persistence for the **student lesson checklist** — a per-student, per-lesson ordered list of custom checklist items the student creates for themselves.
- Removing the "Practice" tool type from the student tools panel (`StudentToolsBar` and `StudentMaterialsModal`) so that only Notes, Flash Cards, Vocab, and the new Checklist are displayed.
- Deleting all existing `StudentVocabFlashCard` records via a database migration and removing the `StudentVocabFlashCard` model from the Prisma schema.
- Providing a **deferred/future-consideration section** for text highlighting with options outlined but not committed to implementation in this spec.

### Out of Scope

- Document upload or file embedding (deferred pending Docker setup).
- Converting practice problems into quizzes or unit tests (separate spec).
- Removing the `practice_problem` `AssignmentType` from the database or teacher-facing lesson management UI — practice problem assignments continue to exist and work for teachers.
- Changing the `reading` enum value in `AssignmentType` or the DB column (UI rename only, no migration).
- Any changes to the `AssessmentSection`, `AssessmentTaker`, or quiz/exam flow.
- Changes to the `CourseDetailPage` or `ProfilePage`.

## Requirements

### Functional Requirements

#### FR-01 — External Link Rename (UI Only)

All user-visible labels that currently say "Reading" when referring to an `AssignmentType` of `reading` must be changed to "External Link". This includes:

- The `AssignmentTypePicker` option label.
- The `ReadingAssignmentForm` field labels and placeholder text.
- The assignment step label in the stepper/sidebar.
- The `AssignmentSection` item label.
- Any `title` attribute, `aria-label`, or tooltip text referencing "Reading".

The database enum value `reading`, the `AssignmentType` TypeScript union type string `'reading'`, and all `type === 'reading'` checks in business logic remain unchanged.

#### FR-02 — External Link Iframe Embed with Fallback

The `ReadingAssignmentView` (to be renamed `ExternalLinkAssignmentView`) must be replaced with an iframe-first embed component:

- Render a sandboxed `<iframe>` attempting to embed the URL.
- The iframe must have `sandbox="allow-scripts allow-same-origin allow-forms allow-popups"` and `loading="lazy"`.
- An `onerror`/`onload` handler detects load failure (blocked by X-Frame-Options or CSP). On failure, display an "Open in new tab" fallback link with the `ExternalLink` icon.
- Always show an "Open in new tab" escape-hatch button in the header row of the component regardless of iframe success.
- The iframe container must have a minimum height of 400px on desktop and fill available horizontal space.
- A loading spinner must show while the iframe is loading.
- On mobile (below the `lg` breakpoint), default to the fallback link view rather than attempting iframe embed. A "Try to embed" toggle button may be offered.

#### FR-03 — Activity Bookmarks

Students can save one bookmark per assignment activity (a short free-text note). The feature must:

- Allow a student to create, update, and delete one bookmark per assignment — one record per `(userId, assignmentId)`.
- A bookmark has a `note` field (max 500 characters) and auto-updated `updatedAt` timestamp.
- The bookmark UI is accessible from within the assignment's content view (a bookmark icon in the header of the content area). Clicking opens an inline editor or small popover.
- Bookmark state must load with the assignment list on page load (included in the assignment service response, not fetched separately per item).
- Only the student who owns the bookmark may read, update, or delete it. Teachers see no bookmark UI.

#### FR-04 — Student Lesson Checklist

Each student can maintain a personal checklist for any lesson. The feature must:

- Allow creating, updating (text edit), toggling `checked`, reordering, and deleting checklist items.
- Each item has a `text` field (max 200 characters), a boolean `checked` state, and an `order` integer.
- The checklist is accessed from the student tools panel as a new "Checklist" tool type, displayed alongside Notes, Flash Cards, and Vocab.
- Checklist state persists server-side per `(userId, lessonId)`.
- Only the owning student may read or modify their checklist. Teachers do not see student checklists.

#### FR-05 — Remove Practice from Student Tools Panel

The `practice` tool type must be removed from `StudentToolsBar` and `StudentMaterialsModal`:

- `StudentToolType` removes `'practice'` from the union.
- `TOOL_META` removes the practice entry.
- `availableTools` in `useAssignments` stops including `'practice'`.
- The `PracticeProblemList` panel is removed from `StudentMaterialsModal`.
- The student tools panel now shows: Notes, Flash Cards, Vocab, Checklist.

#### FR-06 — Delete StudentVocabFlashCard Model

- All existing `student_vocab_flash_card` rows must be deleted via migration.
- The `StudentVocabFlashCard` Prisma model must be removed from `schema.prisma`.
- The `vocabFlashCards` relation on `LessonTool` and `User` must be removed.
- All server-side code referencing `StudentVocabFlashCard` must be deleted.
- All client-side code referencing the old vocab flash card API must be removed.

### Non-Functional Requirements

- NFR-01: All new API endpoints must follow existing REST conventions (envelope response, Zod validation, `asyncHandler`, proper status codes).
- NFR-02: All new database models must use UUID primary keys and `@@map("snake_case_plural")` convention.
- NFR-03: Bookmark data must load with the assignment list in a single round-trip via `include` in the assignment service.
- NFR-04: Iframe `sandbox` must not include `allow-top-navigation`.
- NFR-05: All new UI must use design tokens from `src/index.css`. No raw color values. No `dark:` Tailwind prefix.
- NFR-06: The bookmark popover/editor must be keyboard-accessible and closeable with `Escape`.
- NFR-07: The checklist panel must meet WCAG 2.1 AA for all interactive controls.

## Systems-Level Architecture

### LessonResource Investigation

The `LessonResource` model (`ResourceType`: `note | video | lecture`) exists alongside the newer `Assignment` model. Based on codebase review:

- `LessonResource` objects are fetched and displayed in `LessonDetailPage` via `useResources`. They appear as items in the assignment step sidebar via `buildAssignmentItems`.
- `LessonResourceContent` renders them inline (Tiptap JSON for `note`, YouTube embed for `video`).
- `LessonResource` and `Assignment` objects coexist in the lesson stepper — they are distinct, both active.
- **Finding**: `LessonResource` is **not** legacy or unused. It is an active model for teacher-authored notes and videos attached to a lesson, separate from the sequential assignment flow. No changes to `LessonResource` are required in this spec.

### New Database Models

#### `ActivityBookmark`

```prisma
model ActivityBookmark {
  id           String   @id @default(uuid())
  userId       String
  assignmentId String
  note         String   @db.VarChar(500)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  assignment Assignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)

  @@unique([userId, assignmentId])
  @@index([userId])
  @@map("activity_bookmark")
}
```

`User` gains `activityBookmarks ActivityBookmark[]`. `Assignment` gains `bookmark ActivityBookmark?`.

#### `LessonChecklistItem`

```prisma
model LessonChecklistItem {
  id        String   @id @default(uuid())
  userId    String
  lessonId  String
  text      String   @db.VarChar(200)
  checked   Boolean  @default(false)
  order     Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  lesson Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@index([userId, lessonId])
  @@map("lesson_checklist_item")
}
```

`User` gains `checklistItems LessonChecklistItem[]`. `Lesson` gains `checklistItems LessonChecklistItem[]`.

### Model Changes Summary

| Action          | Model                   | Detail                                         |
| --------------- | ----------------------- | ---------------------------------------------- |
| Remove          | `StudentVocabFlashCard` | Full table and model deletion                  |
| Remove relation | `LessonTool`            | Drop `vocabFlashCards StudentVocabFlashCard[]` |
| Remove relation | `User`                  | Drop `vocabFlashCards StudentVocabFlashCard[]` |
| Add             | `ActivityBookmark`      | New model                                      |
| Add relation    | `User`                  | `activityBookmarks ActivityBookmark[]`         |
| Add relation    | `Assignment`            | `bookmark ActivityBookmark?`                   |
| Add             | `LessonChecklistItem`   | New model                                      |
| Add relation    | `User`                  | `checklistItems LessonChecklistItem[]`         |
| Add relation    | `Lesson`                | `checklistItems LessonChecklistItem[]`         |

### Migration Plan

Two migrations, applied in order:

1. **`remove_student_vocab_flash_card`** — Deletes all rows from `student_vocab_flash_card`, then drops the table. Destructive and irreversible (confirmed acceptable).
2. **`add_activity_bookmark_and_lesson_checklist_item`** — Creates `activity_bookmark` and `lesson_checklist_item` tables; adds new relations on `user`, `assignment`, and `lesson`.

### New API Endpoints

#### Activity Bookmarks (prefix: `/api`)

```
GET    /assignments/:assignmentId/bookmark
POST   /assignments/:assignmentId/bookmark
PUT    /assignments/:assignmentId/bookmark
DELETE /assignments/:assignmentId/bookmark
```

- `GET`: returns the student's bookmark for this assignment, or 404 if none exists.
- `POST`: creates a bookmark. Returns 409 if one already exists (use PUT to update).
- `PUT`: upserts the note text. Returns the updated bookmark.
- `DELETE`: removes the bookmark. Returns 204.
- Authorization: `authenticate()` only. Students read/write only their own records (enforced by `where: { userId: req.user!.id }` in service). Teachers have no access.

**Request body (POST/PUT)**:

```json
{ "note": "string (max 500 chars, required)" }
```

**Response (GET/POST/PUT)**:

```json
{
	"id": "uuid",
	"assignmentId": "uuid",
	"note": "...",
	"createdAt": "ISO8601",
	"updatedAt": "ISO8601"
}
```

#### Lesson Checklist Items (prefix: `/api`)

```
GET    /lessons/:lessonId/checklist
POST   /lessons/:lessonId/checklist
PUT    /checklist-items/:itemId
DELETE /checklist-items/:itemId
PUT    /lessons/:lessonId/checklist/reorder
```

- `GET`: returns all checklist items for the requesting student in this lesson, sorted by `order asc`.
- `POST`: creates a new item. `order` defaults to `max(existing order) + 1`.
- `PUT /checklist-items/:itemId`: updates `text` and/or `checked` for one item. Returns 403 if the item does not belong to the requesting student.
- `DELETE /checklist-items/:itemId`: hard-deletes one item. Returns 204.
- `PUT /lessons/:lessonId/checklist/reorder`: accepts `{ itemIds: string[] }` (ordered array of all the student's item IDs for this lesson). Updates `order` on each record in a `$transaction`. Rejects with 400 if any ID does not belong to the requesting student.
- Authorization: `authenticate()` on all routes. Ownership enforced in service layer via `userId: req.user!.id`.

**POST request body**:

```json
{ "text": "string (max 200 chars, required)" }
```

**PUT (item) request body**:

```json
{ "text": "string (max 200 chars, optional)", "checked": "boolean (optional)" }
```

**GET response**:

```json
[
	{
		"id": "uuid",
		"text": "...",
		"checked": false,
		"order": 1,
		"createdAt": "...",
		"updatedAt": "..."
	}
]
```

**Reorder request body**:

```json
{ "itemIds": ["uuid", "uuid", "..."] }
```

#### Assignment List Change — Bookmark Inclusion

The existing `GET /lessons/:lessonId/assignments` endpoint (or equivalent service method) must be updated to `include` the bookmark for the requesting student:

```ts
include: {
  bookmark: {
    where: { userId: requestingUserId },
  },
}
```

The `Assignment` response type gains:

```ts
bookmark: { id: string; note: string; updatedAt: string } | null
```

### New Server Files

| Path                                             | Purpose                                                                                         |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `server/src/routes/bookmark.routes.ts`           | Mount bookmark endpoints on `assignment.routes.ts`                                              |
| `server/src/controllers/bookmark.controller.ts`  | Thin HTTP layer for bookmarks                                                                   |
| `server/src/services/bookmark.service.ts`        | Business logic + Prisma for bookmarks                                                           |
| `server/src/schemas/bookmark.schema.ts`          | Zod schemas: `createBookmarkSchema`, `updateBookmarkSchema`                                     |
| `server/src/routes/checklist.routes.ts`          | Mount checklist endpoints on root router and flat item routes                                   |
| `server/src/controllers/checklist.controller.ts` | Thin HTTP layer for checklist                                                                   |
| `server/src/services/checklist.service.ts`       | Business logic + Prisma for checklist                                                           |
| `server/src/schemas/checklist.schema.ts`         | Zod schemas: `createChecklistItemSchema`, `updateChecklistItemSchema`, `reorderChecklistSchema` |

### New and Modified Client Files

**New components**:

- `client/src/features/assignments/ExternalLinkAssignmentView.tsx` — iframe embed with fallback (replaces `ReadingAssignmentView.tsx`).
- `client/src/features/assignments/ExternalLinkAssignmentForm.tsx` — renamed/relabeled form (replaces `ReadingAssignmentForm.tsx`).
- `client/src/features/lessons/BookmarkButton.tsx` — bookmark icon + inline popover editor.
- `client/src/features/lessons/ChecklistPanel.tsx` — checklist tool panel for `StudentMaterialsModal`.

**New API modules**:

- `client/src/api/bookmarks.ts` — CRUD for `ActivityBookmark`.
- `client/src/api/checklist.ts` — CRUD + reorder for `LessonChecklistItem`.

**Modified files**:

| File                                                          | Change                                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `client/src/features/assignments/ReadingAssignmentView.tsx`   | Delete (replaced by `ExternalLinkAssignmentView.tsx`)                    |
| `client/src/features/assignments/ReadingAssignmentForm.tsx`   | Delete (replaced by `ExternalLinkAssignmentForm.tsx`)                    |
| `client/src/features/assignments/AssignmentTypePicker.tsx`    | Rename `reading` label to "External Link"                                |
| `client/src/features/lessons/LessonAssignmentContent.tsx`     | Update import: `ReadingAssignmentView` → `ExternalLinkAssignmentView`    |
| `client/src/features/student-notes/StudentToolsBar.tsx`       | Remove `'practice'` from `StudentToolType`; add `'checklist'`            |
| `client/src/features/student-notes/StudentMaterialsModal.tsx` | Remove `PracticeProblemList`; add `ChecklistPanel`                       |
| `client/src/features/lessons/hooks/useAssignments.ts`         | Update `availableTools`: remove `'practice'`, add `'checklist'`          |
| `client/src/api/types.ts`                                     | Add `bookmark` field to `Assignment` interface; update `StudentToolType` |
| `server/src/services/assignment.service.ts`                   | Include bookmark in assignment list query                                |

### Integration Points

- **Assignment service**: Must accept `userId` to scope the bookmark `include`. The `userId` flows from `req.user!.id` in the controller.
- **Lesson service**: May need to propagate `userId` if assignments are fetched as part of a lesson query. Prefer passing `userId` explicitly rather than fetching bookmarks in a second round-trip.
- **`StudentToolType`**: Loses `'practice'`, gains `'checklist'`. Both `StudentToolsBar` and `StudentMaterialsModal` must stay in sync.
- **Route registration**: Bookmark routes register on `assignment.routes.ts` as sub-paths. Checklist lesson-scoped routes register on `lesson.routes.ts`; flat item routes (`/checklist-items/:itemId`) register on the root router.

## Text Highlighting — Deferred Feature Consideration

Text highlighting within note and reading assignments is a desired student feature but is **not implemented in this spec** due to implementation complexity and scope. Below are options for future consideration:

### Option A — Client-Only Highlight with localStorage

Store highlight ranges (DOM text offset pairs) per `(userId, assignmentId)` in `localStorage`. Simple, zero backend cost, but lost on device switch and not backed by server state.

**Technical lift**: Low (~100–150 lines of utility code).  
**Drawback**: Not durable. Lost on private browsing, device change, or cache clear.

### Option B — Server-Persisted Highlight Ranges

Store highlight ranges in a new `TextHighlight` model: `(userId, assignmentId, startOffset, endOffset, color, note?)`. Reconstruct on mount by walking the DOM.

**Technical lift**: Medium-high. DOM offset fragility is a known hard problem — minor content edits break offsets. Requires careful offset canonicalization (e.g., XPath-based or text-fraction-based anchors per the W3C Web Annotation model).  
**Drawback**: Brittle if note/reading content is ever edited after highlights are saved.

### Option C — Third-Party Annotation Library

Use `hypothesis` (open-source, self-hostable) or `annotator.js` for DOM-based annotation with built-in anchor schemes.

**Technical lift**: Medium (integration work). External dependency. `hypothesis` in particular requires Docker/separate deployment — not viable until Docker is configured.

**Recommendation**: Defer until Docker is available (consistent with the project's Docker-first infrastructure priority). Option B is the target once Docker infrastructure is in place. Option A is acceptable as a short-lived prototype if needed sooner.

## Required Design Artifacts

- [x] Backend plan (`backend-plan.md`)
- [x] API contract (`api-contract.md`)
- [x] Frontend plan (`frontend-plan.md`)
- [x] UI wireframe (`wireframe.md`)
