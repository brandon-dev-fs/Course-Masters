---
id: cm-0028
title: Lesson Activities — Overhaul Reading, Student Tools, and Persistence
stage: design
status: approved
approver: human
approved_at: 2026-06-04T00:00:00Z
---

# Frontend Implementation Plan — cm-0028

## 1. Overview

This plan covers the frontend work for cm-0028, which touches four concerns inside `LessonDetailPage`:

1. **External Link rename + iframe view (FR-01, FR-02)**: Replace `ReadingAssignmentView` and `ReadingAssignmentForm` with new components that use "External Link" labels throughout and attempt an iframe embed with graceful fallback. The `TYPE_CONFIG` label in `AssignmentFormModal` is also updated.
2. **Activity Bookmark UI (FR-03)**: New `BookmarkButton` component in the assignment content header; new `bookmarks.ts` API module; `Assignment` type gains a `bookmark` field.
3. **Student Lesson Checklist (FR-04)**: New `ChecklistPanel` component and `useChecklist` hook backed by a new `checklist.ts` API module.
4. **Student tools panel update (FR-05)**: Remove `'practice'` from `StudentToolType`; add `'checklist'`; update `StudentMaterialsModal` and `useAssignments`.
5. **Remove old vocab flash card client code (FR-06)**: Delete `getSavedVocabFlashCards`, `saveVocabFlashCard`, `removeVocabFlashCard` from `lesson-tools.ts`; delete `getSavedVocabEntryFlashCards`, `saveVocabEntryFlashCard`, `removeVocabEntryFlashCard` from `assignments.ts`; fix any components that reference them.

All API calls map exactly to the approved api-contract. No new routes are added to the client router. Auth scope: bookmark UI and checklist tab render only when `user?.role === 'student'`.

Acceptance criteria traceability:
- FR-01: `AssignmentFormModal.TYPE_CONFIG`, `AssignmentTypePicker`, `AssignmentSection` label for `reading` type, `ExternalLinkAssignmentForm` labels.
- FR-02: `ExternalLinkAssignmentView` iframe embed, fallback, loading state, mobile default.
- FR-03: `BookmarkButton`, `BookmarkPopover`, `bookmarks.ts`, `Assignment.bookmark` type field.
- FR-04: `ChecklistPanel`, `useChecklist`, `checklist.ts`.
- FR-05: `StudentToolType`, `TOOL_META`, `availableTools` in `useAssignments`, `StudentMaterialsModal`.
- FR-06: Remove old vocab flash card API methods; remove consumer references.

---

## 2. Folder Structure

New files to create:

```
client/src/
├── api/
│   ├── bookmarks.ts                                      (new)
│   └── checklist.ts                                      (new)
├── features/
│   ├── assignments/
│   │   ├── ExternalLinkAssignmentView.tsx               (new — replaces ReadingAssignmentView.tsx)
│   │   └── ExternalLinkAssignmentForm.tsx               (new — replaces ReadingAssignmentForm.tsx)
│   └── lessons/
│       ├── BookmarkButton.tsx                            (new)
│       └── ChecklistPanel.tsx                           (new)
```

Files to delete:

```
client/src/features/assignments/ReadingAssignmentView.tsx
client/src/features/assignments/ReadingAssignmentForm.tsx
```

Files to modify (no new files):

```
client/src/api/types.ts
client/src/api/assignments.ts
client/src/api/lesson-tools.ts
client/src/features/assignments/AssignmentFormModal.tsx
client/src/features/lessons/LessonAssignmentContent.tsx
client/src/features/lessons/hooks/useAssignments.ts
client/src/features/student-notes/StudentToolsBar.tsx
client/src/features/student-notes/StudentMaterialsModal.tsx
```

---

## 3. Component Tree

### New Components

---

#### `ExternalLinkAssignmentView`

- **File**: `client/src/features/assignments/ExternalLinkAssignmentView.tsx`
- **Type**: UI component (content view)
- **Replaces**: `ReadingAssignmentView.tsx` (delete the old file)

```ts
interface ExternalLinkAssignmentViewProps {
  url: string;
  description?: string | null;
  estimatedMinutes?: number | null;
  /** Optional bookmark for BookmarkButton — only passed when user is a student */
  bookmark?: Bookmark | null;
  assignmentId: string;
}
```

**Responsibilities**:
- On desktop (`>= lg` breakpoint): render a sandboxed `<iframe>` with a loading spinner overlay; on iframe load failure hide the iframe and show the orange fallback block.
- On mobile (`< lg` breakpoint): default to the fallback link view; show a "Try to embed" toggle that, when clicked, renders the iframe below the link card.
- Always render an "Open in new tab" button in the header regardless of iframe state.
- Render `<BookmarkButton>` in the header when `assignmentId` and `bookmark` prop are provided.
- Display optional `description` below the embed area.
- Manage `iframeStatus: 'loading' | 'loaded' | 'failed'` in local state.
- Use `window.matchMedia('(min-width: 1024px)')` (or a CSS approach) to determine initial mode.

**Iframe detection note**: True X-Frame-Options detection via `onload`/`onerror` is unreliable because browsers suppress the error for cross-origin frames. The practical approach is:
1. Set `iframeStatus = 'loading'` on render.
2. On `onLoad`: transition to `'loaded'` (the page loaded — may still be a blank frame if blocked, but this is the best available signal without a server-side probe).
3. Add a 5-second timeout: if no `onLoad` fires within 5 seconds, transition to `'failed'`.
4. On `onError`: transition to `'failed'`.
This matches the spec's intent without requiring a server-side proxy.

---

#### `ExternalLinkAssignmentForm`

- **File**: `client/src/features/assignments/ExternalLinkAssignmentForm.tsx`
- **Type**: UI component (sub-form)
- **Replaces**: `ReadingAssignmentForm.tsx` (delete the old file)

```ts
// Uses the existing SubFormProps type from AssignmentFormModal.tsx — no new props interface needed
// This component is a drop-in replacement for ReadingAssignmentForm with label changes only
```

**Responsibilities**:
- Identical logic to `ReadingAssignmentForm` but with updated labels: "URL" stays "URL", the component label displayed in `TYPE_CONFIG` changes to "External Link".
- Field labels and placeholders remain the same (URL, Description, Estimated reading time) — only the top-level type label shown in the picker changes.

---

#### `BookmarkButton`

- **File**: `client/src/features/lessons/BookmarkButton.tsx`
- **Type**: UI component (interactive widget)

```ts
interface Bookmark {
  id: string;
  note: string;
  updatedAt: string;
}

interface BookmarkButtonProps {
  assignmentId: string;
  /** Current bookmark state — null means no bookmark exists yet */
  bookmark: Bookmark | null;
  /** Called after successful save or delete to update parent state */
  onBookmarkChange: (bookmark: Bookmark | null) => void;
}
```

**Responsibilities**:
- Render a `<button>` with `Bookmark` icon (outline, `lucide-react`) when no bookmark exists; `BookmarkCheck` icon when bookmarked.
- Apply `aria-pressed={!!bookmark}`, `aria-label="Add bookmark"` / `"Edit bookmark"`, `aria-expanded={isOpen}`.
- On click: open the bookmark popover (inline panel; not a `Modal`).
- Manage `isOpen: boolean` and `note: string` (textarea value) in local state.
- On open: focus the textarea. On close (Escape or X button): return focus to the trigger button.
- Render popover in a `document.body` portal via `createPortal`.
- On desktop: position as an anchored dropdown below-right of the button (`position: absolute` relative to a positioned wrapper, or use a `useRef` + `getBoundingClientRect` calculation).
- On mobile (`< lg`): render as a bottom sheet with `fixed bottom-0 left-0 right-0` and a backdrop overlay.
- Save action: call `PUT /assignments/:assignmentId/bookmark` (upsert) — use PUT for both create and update to keep the UI simple; the api-contract confirms PUT is a safe upsert.
- Delete action (only shown when `bookmark !== null`): call `DELETE /assignments/:assignmentId/bookmark`.
- Show `<LoadingSpinner />` in the save/delete button during async operations; disable both buttons while loading.
- Show `<ErrorMessage>` inside the popover on API error.
- Character counter `{note.length}/500`; counter text turns `text-destructive` at 500 chars.

---

#### `ChecklistPanel`

- **File**: `client/src/features/lessons/ChecklistPanel.tsx`
- **Type**: UI component (tool panel)

```ts
interface ChecklistPanelProps {
  lessonId: string;
}
```

**Responsibilities**:
- Call `useChecklist(lessonId)` to get all state and handlers.
- Render a `<ul role="list">` of checklist item rows; each row contains: drag handle (visual only, `aria-hidden`), checkbox, text label, delete button.
- Show `<EmptyState>` with message "No checklist items yet" when the list is empty (not loading).
- Show `<LoadingSpinner />` while `loading` is true.
- Show `<ErrorMessage>` when `error` is set.
- Render an add-item `<Input>` at the bottom with `aria-label="New checklist item"` and `maxLength={200}`; submit on Enter keypress or a "+" icon button.
- Checked items display `line-through text-muted-foreground` text; checkbox has `aria-checked` set correctly.
- Delete button: `aria-label={"Delete: " + item.text}`, hidden by default (`opacity-0`), visible on row hover (`group-hover:opacity-100`).
- Drag handle: `GripVertical` icon from `lucide-react`, `aria-hidden="true"`.
- Keyboard reorder: "Move up" / "Move down" buttons as accessible alternative to drag — `aria-label="Move up"` / `"Move down"`.
- Character counter below add-input: `{inputValue.length}/200`, turns `text-destructive` at limit.

---

### Modified Components

#### `LessonAssignmentContent`

- **File**: `client/src/features/lessons/LessonAssignmentContent.tsx`

Props interface change:
```ts
interface LessonAssignmentContentProps {
  assignment: Assignment;            // Assignment now includes bookmark field
  onToggleAssignmentCompletion: (assignment: Assignment) => Promise<void>;
  onBookmarkChange: (assignmentId: string, bookmark: Bookmark | null) => void;
  isStudent: boolean;
}
```

Changes:
- Import `ExternalLinkAssignmentView` instead of `ReadingAssignmentView`.
- In the `reading` branch: pass `bookmark={assignment.bookmark ?? null}`, `assignmentId={assignment.id}`, and `onBookmarkChange` down to `ExternalLinkAssignmentView`, which then passes them to `BookmarkButton`. Conditionally pass these only when `isStudent` is true.
- Thread `isStudent` as a prop derived from `user?.role === 'student'` in the parent.

#### `AssignmentFormModal`

- **File**: `client/src/features/assignments/AssignmentFormModal.tsx`

Changes:
- In `TYPE_CONFIG`: change `reading` label from `'Reading'` to `'External Link'`.
- Change import from `ReadingAssignmentForm` to `ExternalLinkAssignmentForm`.
- Update the `MetaFields` reference for `reading` type to use `ExternalLinkAssignmentForm`.

#### `StudentToolsBar`

- **File**: `client/src/features/student-notes/StudentToolsBar.tsx`

Changes:
- `StudentToolType` union: remove `'practice'`, add `'checklist'`.
- `TOOL_META`: remove `practice` entry; add `checklist` entry with `CheckSquare` icon from `lucide-react`, label `'List'`, longLabel `'Checklist'`.

```ts
// Before
export type StudentToolType = 'notes' | 'flashcards' | 'practice' | 'vocab';

// After
export type StudentToolType = 'notes' | 'flashcards' | 'vocab' | 'checklist';
```

```ts
// TOOL_META checklist entry
checklist: { label: 'List', longLabel: 'Checklist', Icon: CheckSquare },
```

#### `StudentMaterialsModal`

- **File**: `client/src/features/student-notes/StudentMaterialsModal.tsx`

Changes:
- Remove import of `PracticeProblemList`.
- Add import of `ChecklistPanel`.
- In the content section: remove `{activeTool === 'practice' && ...}` branch; add `{activeTool === 'checklist' && <div className="p-3"><ChecklistPanel lessonId={lessonId} /></div>}`.

#### `useAssignments` hook

- **File**: `client/src/features/lessons/hooks/useAssignments.ts`

Changes:
- In `availableTools` memo: change `['notes', 'flashcards', 'vocab', 'practice']` to `['notes', 'flashcards', 'vocab', 'checklist']`.
- Add local state `assignments` mutation handler `handleBookmarkChange` that updates the `bookmark` field on a specific assignment in the local state array without a refetch:
  ```ts
  handleBookmarkChange: (assignmentId: string, bookmark: Bookmark | null) => void;
  ```
  This is added to the return shape so the page can thread it to `LessonAssignmentContent`.

---

## 4. Client Routes

No new routes are introduced. All work occurs within the existing `LessonDetailPage` at `/courses/:courseId/units/:unitId/lessons/:lessonId`. No changes to `App.tsx` or route registration.

---

## 5. Hooks and Data Fetching

### `useChecklist` (new)

- **File**: `client/src/features/lessons/hooks/useChecklist.ts`
- **Purpose**: Manages the full checklist lifecycle for a single lesson.

**API endpoints (from api-contract)**:
- `GET /lessons/:lessonId/checklist` → `ChecklistItem[]`
- `POST /lessons/:lessonId/checklist` → `ChecklistItem` (201)
- `PUT /checklist-items/:itemId` → `ChecklistItem` (200)
- `DELETE /checklist-items/:itemId` → 204
- `PUT /lessons/:lessonId/checklist/reorder` → `ChecklistItem[]` (200)

**Return shape**:
```ts
interface UseChecklistReturn {
  items: ChecklistItem[];
  loading: boolean;
  error: string | null;
  addItem: (text: string) => Promise<void>;
  toggleItem: (itemId: string, checked: boolean) => Promise<void>;
  updateItemText: (itemId: string, text: string) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  moveItem: (itemId: string, direction: 'up' | 'down') => Promise<void>;
}
```

**State**:
- `items: ChecklistItem[]` — sorted by `order asc`.
- `loading: boolean` — true during initial fetch.
- `error: string | null` — from `classifyError`.
- `addingItem: boolean` — tracks POST in flight (for add-input loading state in `ChecklistPanel`).
- `deletingItemId: string | null` — tracks which item is being deleted (for per-row loading state).

**Loading/error/success handling**:
- Initial load via `useFetch<ChecklistItem[]>(() => checklistApi.getAll(lessonId), [lessonId])`.
- Mutations use optimistic updates: update local state immediately, rollback on error, show `error` via `classifyError`.
- `moveItem` uses swap-based reorder: find current index, swap adjacent item, call `PUT /lessons/:lessonId/checklist/reorder` with the full new `itemIds` array.

**Cache/refetch**: No automatic refetch beyond mount. Mutations update local state directly. `useFetch`'s `reload()` is not exposed — the panel is always rendered fresh when the modal opens.

---

### `BookmarkButton` internal data fetching

`BookmarkButton` does not use a custom hook — all bookmark mutations are handled inline within the component using local `useState` + `async` handlers. The initial `bookmark` value is passed as a prop from the parent (`Assignment.bookmark`) which is loaded with the assignment list on page mount (per NFR-03).

**API calls inside BookmarkButton**:
- Save (upsert): `PUT /assignments/:assignmentId/bookmark` with `{ note }` → `Bookmark`
- Delete: `DELETE /assignments/:assignmentId/bookmark` → 204
- No GET is needed — bookmark state is loaded as part of the assignment list.

---

## 6. API Integration

### New API Module: `src/api/bookmarks.ts`

```ts
interface Bookmark {
  id: string;
  assignmentId: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export const bookmarksApi = {
  upsert: (assignmentId: string, note: string): Promise<Bookmark> =>
    apiClient.put<Bookmark>(`/assignments/${assignmentId}/bookmark`, { note }),

  delete: (assignmentId: string): Promise<void> =>
    apiClient.delete<void>(`/assignments/${assignmentId}/bookmark`),
};
```

Note: `POST /assignments/:assignmentId/bookmark` (create) is available in the contract but the `BookmarkButton` UI always calls PUT (upsert) to avoid the 409 conflict case. The POST endpoint is in the contract for completeness but is not used by this component.

### New API Module: `src/api/checklist.ts`

```ts
export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export const checklistApi = {
  getAll: (lessonId: string): Promise<ChecklistItem[]> =>
    apiClient.get<ChecklistItem[]>(`/lessons/${lessonId}/checklist`),

  create: (lessonId: string, text: string): Promise<ChecklistItem> =>
    apiClient.post<ChecklistItem>(`/lessons/${lessonId}/checklist`, { text }),

  update: (itemId: string, data: { text?: string; checked?: boolean }): Promise<ChecklistItem> =>
    apiClient.put<ChecklistItem>(`/checklist-items/${itemId}`, data),

  delete: (itemId: string): Promise<void> =>
    apiClient.delete<void>(`/checklist-items/${itemId}`),

  reorder: (lessonId: string, itemIds: string[]): Promise<ChecklistItem[]> =>
    apiClient.put<ChecklistItem[]>(`/lessons/${lessonId}/checklist/reorder`, { itemIds }),
};
```

### UI Action → API Mapping

| UI Action | Method + Path | Request Body | Response |
|-----------|---------------|--------------|----------|
| Page load — assignments fetch | `GET /lessons/:lessonId/assignments` | none | `Assignment[]` (each with `bookmark` field) |
| Bookmark: click Save (upsert) | `PUT /assignments/:assignmentId/bookmark` | `{ note: string }` | `Bookmark` (200) |
| Bookmark: click Delete | `DELETE /assignments/:assignmentId/bookmark` | none | 204 |
| Checklist: panel opens | `GET /lessons/:lessonId/checklist` | none | `ChecklistItem[]` |
| Checklist: add item | `POST /lessons/:lessonId/checklist` | `{ text: string }` | `ChecklistItem` (201) |
| Checklist: toggle checkbox | `PUT /checklist-items/:itemId` | `{ checked: boolean }` | `ChecklistItem` |
| Checklist: edit text (blur) | `PUT /checklist-items/:itemId` | `{ text: string }` | `ChecklistItem` |
| Checklist: delete item | `DELETE /checklist-items/:itemId` | none | 204 |
| Checklist: move up/down | `PUT /lessons/:lessonId/checklist/reorder` | `{ itemIds: string[] }` | `ChecklistItem[]` |

---

## 7. State Management

### Local state (component-level)

| Component | State | Purpose |
|-----------|-------|---------|
| `ExternalLinkAssignmentView` | `iframeStatus: 'loading' \| 'loaded' \| 'failed'` | Controls which view renders |
| `ExternalLinkAssignmentView` | `showEmbed: boolean` | Mobile "Try to embed" toggle |
| `BookmarkButton` | `isOpen: boolean` | Popover open/closed |
| `BookmarkButton` | `note: string` | Textarea value (initialized from `bookmark.note` on open) |
| `BookmarkButton` | `saving: boolean` | In-flight save |
| `BookmarkButton` | `deleting: boolean` | In-flight delete |
| `BookmarkButton` | `error: string \| null` | API error display |
| `ChecklistPanel` | `inputValue: string` | Add-item text input |
| `ChecklistPanel` | `submitting: boolean` | Add-item in flight |
| `ChecklistPanel` | `inputError: string \| null` | Add-item validation error |

### Hook-level state (`useChecklist`)

| State | Type | Lives in |
|-------|------|---------|
| `items` | `ChecklistItem[]` | `useChecklist` |
| `loading` | `boolean` | `useChecklist` (from `useFetch`) |
| `error` | `string \| null` | `useChecklist` |
| `deletingItemId` | `string \| null` | `useChecklist` |

### Page-level state (`useAssignments`)

The `assignments` array in `useAssignments` now includes `bookmark` on each `Assignment`. The `handleBookmarkChange` handler mutates the local `assignments` array state to keep bookmark state in sync after a save/delete without a full refetch.

```ts
// Derived state (computed inline — not stored):
const completedAssignmentIds = useMemo(...);  // already exists
const incompleteRequired = useMemo(...);       // already exists
const availableTools = useMemo(() => ['notes', 'flashcards', 'vocab', 'checklist'], []);
```

No new context. No shared state library.

---

## 8. Authentication and Authorization

All affected routes (`LessonDetailPage`) already require authentication via `<RequireAuth>` in `App.tsx`. No changes to route guards.

**Role-specific rendering**:
- `BookmarkButton` and the `bookmark` prop chain are only passed when `user?.role === 'student'`. Derive this in `LessonDetailPage` or in `LessonAssignmentContent`:
  ```ts
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  ```
- The `'checklist'` tool type in `availableTools` is always included (teachers can see it but teachers never see the `StudentMaterialsModal` in current UI). The spec says teachers see no checklist UI — verify with existing `canEdit` / `isStudent` gating in `LessonDetailPage`. If teachers do not see `StudentToolsBar` at all (current behavior), no additional gating is needed.
- `ChecklistPanel` makes authenticated calls — no additional auth logic needed since `apiClient` sends the session cookie automatically.

Auth hooks used:
- `useAuth()` from `context/AuthContext.tsx` — provides `user`, `isLoading`.
- `useCanEdit()` from `hooks/useCanEdit.ts` — existing hook, no changes needed.

---

## 9. Pseudocode for Complex Logic

### 9a. `ExternalLinkAssignmentView` — iframe load detection

```
const [iframeStatus, setIframeStatus] = useState<'loading' | 'loaded' | 'failed'>('loading')
const [showEmbed, setShowEmbed] = useState(false)
const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
const isMobile = useMediaQuery('(max-width: 1023px)')  // or CSS-only approach

on mount:
  if isMobile:
    iframeStatus = 'failed'  // skip iframe attempt, show fallback immediately
  else:
    start 5-second timeout:
      timeoutRef.current = setTimeout(() => setIframeStatus('failed'), 5000)

iframe onLoad handler:
  clearTimeout(timeoutRef.current)
  setIframeStatus('loaded')

iframe onError handler:
  clearTimeout(timeoutRef.current)
  setIframeStatus('failed')

on unmount:
  clearTimeout(timeoutRef.current)

render:
  <header row>
    [ExternalLink icon] "External Link"
    {isStudent && <BookmarkButton ... />}
    <Button href={url} target="_blank">Open in new tab</Button>
  </header>

  if isMobile or iframeStatus === 'failed':
    <FallbackBlock url={url} />
    if isMobile:
      <Button onClick={() => { setShowEmbed(!showEmbed) }}>
        {showEmbed ? 'Hide embed' : 'Try to embed'}
      </Button>
      {showEmbed && <iframe ... style={{ minHeight: '300px' }} />}
  else:
    <div role="region" aria-label="External link content" aria-busy={iframeStatus === 'loading'}>
      {iframeStatus === 'loading' && <LoadingSpinner centered />}
      <iframe
        src={url}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        loading="lazy"
        title="External Link content"
        onLoad={handleLoad}
        onError={handleError}
        className="w-full border-0"
        style={{ minHeight: '400px', display: iframeStatus === 'loading' ? 'none' : 'block' }}
      />
    </div>
```

### 9b. `BookmarkButton` — popover lifecycle

```
state: isOpen, note, saving, deleting, error
ref: buttonRef (the trigger button)
ref: textareaRef (popover textarea)

open():
  setNote(bookmark?.note ?? '')
  setError(null)
  setIsOpen(true)
  // after render:
  textareaRef.current?.focus()

close():
  setIsOpen(false)
  buttonRef.current?.focus()  // return focus to trigger

handleKeyDown(e):
  if e.key === 'Escape' and isOpen:
    e.stopPropagation()
    close()

handleSave():
  if note.trim().length === 0: return
  setSaving(true)
  setError(null)
  try:
    const updated = await bookmarksApi.upsert(assignmentId, note.trim())
    onBookmarkChange(updated)  // notify parent to update Assignment.bookmark in state
    close()
  catch err:
    setError(classifyError(err))
  finally:
    setSaving(false)

handleDelete():
  setDeleting(true)
  setError(null)
  try:
    await bookmarksApi.delete(assignmentId)
    onBookmarkChange(null)
    close()
  catch err:
    setError(classifyError(err))
  finally:
    setDeleting(false)

render:
  <button
    ref={buttonRef}
    aria-pressed={!!bookmark}
    aria-expanded={isOpen}
    aria-label={bookmark ? 'Edit bookmark' : 'Add bookmark'}
    onClick={open}
    onKeyDown={handleKeyDown}
  >
    {bookmark ? <BookmarkCheck /> : <Bookmark />}
  </button>

  {isOpen && createPortal(
    <BookmarkPopoverContent
      note={note}
      onNoteChange={setNote}
      onSave={handleSave}
      onDelete={handleDelete}
      onClose={close}
      hasExisting={!!bookmark}
      saving={saving}
      deleting={deleting}
      error={error}
      textareaRef={textareaRef}
      onKeyDown={handleKeyDown}
    />,
    document.body
  )}
```

### 9c. `useChecklist` — moveItem (swap-based reorder)

```
moveItem(itemId, direction):
  const idx = items.findIndex(i => i.id === itemId)
  if direction === 'up' and idx === 0: return
  if direction === 'down' and idx === items.length - 1: return

  const swapIdx = direction === 'up' ? idx - 1 : idx + 1
  const newItems = [...items]
  // swap positions
  [newItems[idx], newItems[swapIdx]] = [newItems[swapIdx], newItems[idx]]

  // optimistic update
  setItems(newItems)

  try:
    const itemIds = newItems.map(i => i.id)
    const updated = await checklistApi.reorder(lessonId, itemIds)
    setItems(updated)  // apply server-confirmed order
  catch err:
    setItems(items)    // rollback to pre-swap state
    setError(classifyError(err))
```

### 9d. `useAssignments` — `handleBookmarkChange` integration

```
// Added to useAssignments return and local state
const handleBookmarkChange = useCallback(
  (assignmentId: string, bookmark: Bookmark | null) => {
    setAssignments(prev =>
      prev.map(a =>
        a.id === assignmentId
          ? { ...a, bookmark: bookmark ?? null }
          : a
      )
    )
  },
  []
)
```

---

## 10. Styling Notes

All styles use design tokens defined in `client/src/index.css`. No raw color values. No `dark:` prefix.

### `ExternalLinkAssignmentView`

- Outer card: `rounded-xl border border-border bg-surface shadow-warm-md p-4`
- Header row: `flex items-center gap-2`
- Header icon: `w-4 h-4 text-accent`
- Header label: `text-sm font-semibold text-foreground`
- "Open in new tab" button: `Button` component, `variant="ghost"` `size="sm"`, icon `ExternalLink`
- Iframe wrapper: `bg-surface-raised rounded-lg overflow-hidden w-full` + inline `minHeight: '400px'`
- Loading spinner: absolute centered within the iframe wrapper
- Fallback block (error): `bg-orange-surface rounded-lg p-4 flex flex-col gap-3`
- Fallback alert icon: `w-5 h-5 text-orange-accent`
- Fallback message: `text-sm text-orange-surface-text`
- Fallback URL preview: `text-xs text-muted-foreground truncate`
- Fallback CTA: `Button variant="accent" size="sm"` with `ExternalLink` icon
- Description: `text-sm text-muted-foreground mt-2`
- Mobile link card: `bg-accent-subtle rounded-lg p-3 flex flex-col gap-2`

### `BookmarkButton`

- Trigger button: `p-1.5 rounded-md transition-colors`
- Unbookmarked: `text-muted-foreground hover:bg-surface-raised hover:text-foreground`
- Bookmarked: `text-primary bg-primary-subtle hover:bg-primary-subtle/80`
- Focus: `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`
- Popover container (desktop): `absolute bg-surface-raised border border-border rounded-xl shadow-warm-lg p-3 w-72 z-50`
- Popover container (mobile): `fixed bottom-0 left-0 right-0 bg-surface-raised rounded-t-2xl p-4 pb-[env(safe-area-inset-bottom)] z-50`
- Backdrop (mobile only): `fixed inset-0 bg-black/50 z-40`
- Textarea: `w-full text-sm bg-surface rounded-lg border border-border p-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary`
- Char counter: `text-xs text-muted-foreground text-right` → `text-destructive` at max
- Save button: `Button variant="primary" size="sm"`
- Delete button: `Button variant="danger" size="sm"`

### `ChecklistPanel`

- Panel container: `flex flex-col gap-3 p-3 h-full`
- Item row: `group flex items-center gap-2 py-1.5 px-2 rounded-lg bg-surface hover:bg-surface-raised transition-colors`
- Drag handle: `text-muted-foreground/40 group-hover:text-muted-foreground cursor-grab` (`GripVertical` icon)
- Checkbox: `w-4 h-4 rounded border-border accent-primary`
- Item text (unchecked): `text-sm text-foreground flex-1`
- Item text (checked): `text-sm text-muted-foreground line-through flex-1`
- Delete button: `opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-muted-foreground hover:text-destructive`
- Add-input wrapper: `mt-auto pt-3 border-t border-border`
- Add input: uses `<Input>` shared component with `placeholder="Add a checklist item…"`
- Char counter: `text-xs text-muted-foreground text-right` → `text-destructive` at 200

---

## 11. Edge Cases and Error Handling

### External Link / Iframe (`ExternalLinkAssignmentView`)

| Scenario | Handling |
|----------|----------|
| Iframe blocked by X-Frame-Options | 5s timeout fires → `iframeStatus = 'failed'` → show orange fallback block |
| Iframe `onError` fires immediately | `iframeStatus = 'failed'` immediately |
| Mobile viewport | `iframeStatus` defaults to `'failed'`; fallback link shown immediately |
| URL is invalid / empty | Component renders whatever URL string is passed; `<a>` with bad URL is a browser concern |
| No description provided | `description` block hidden with `{description && ...}` |
| No estimatedMinutes | estimatedMinutes display hidden |

### Bookmark (`BookmarkButton`)

| Scenario | Handling |
|----------|----------|
| Save with empty textarea | Disable Save button when `note.trim().length === 0` |
| Note at 500 char limit | Character counter text turns `text-destructive`; `maxLength={500}` on textarea prevents further input |
| API error on save | `setError(classifyError(err))`, popover stays open, `<ErrorMessage>` shown inside popover |
| API error on delete | Same: error inside popover, popover stays open |
| Double-submit (save) | Save button disabled during `saving === true`; both buttons disabled |
| Escape before saving | Popover closes; local `note` state is discarded; `bookmark` prop unchanged |
| First bookmark (POST vs PUT) | Always use PUT (upsert); no 409 risk |
| Teacher viewing assignment | `BookmarkButton` not rendered; `isStudent` check gates rendering in parent |

### Checklist (`ChecklistPanel` / `useChecklist`)

| Scenario | Handling |
|----------|----------|
| Empty list on load | `<EmptyState>` with "No checklist items yet" message |
| Load error | `<ErrorMessage message={error} />` replaces list |
| Add empty text | Submit button disabled when `inputValue.trim() === ''` |
| Text at 200 char limit | Char counter turns `text-destructive`; `maxLength={200}` on input |
| API error on add | `setInputError(classifyError(err))`; input stays populated |
| API error on toggle/edit/delete | Optimistic update rolled back; `setError(classifyError(err))` on hook |
| Delete while deleting | Delete button disabled when `deletingItemId` matches item id |
| Reorder with single item | Move up / Move down buttons both disabled |
| Move to top (no move-up) | Move up button disabled when `idx === 0` |
| Move to bottom (no move-down) | Move down button disabled when `idx === items.length - 1` |
| Reorder API error | Items rolled back to pre-swap state |

### Type / Label Updates

| Scenario | Handling |
|----------|----------|
| `TYPE_CONFIG['reading'].label` still used in other places | Only `AssignmentFormModal.tsx` defines `TYPE_CONFIG`; after change to "External Link", the label propagates to `AssignmentTypePicker` automatically |
| `StudentToolType` removal of `'practice'` | TypeScript will produce type errors on any remaining reference to `'practice'` in the union — these must be resolved as part of Task 1 (cleanup) |

### Vocab Flash Card Removal (`FR-06`)

| Scenario | Handling |
|----------|----------|
| `getSavedVocabFlashCards` / `saveVocabFlashCard` / `removeVocabFlashCard` removed from `lesson-tools.ts` | Any component importing these will produce TypeScript compile errors — locate and remove those call sites |
| `getSavedVocabEntryFlashCards` / `saveVocabEntryFlashCard` / `removeVocabEntryFlashCard` removed from `assignments.ts` | Same: compile errors surface all usages |
| Test file `VocabCard.test.tsx` references old vocab flash card API | Update or delete the test as appropriate |

---

## Implementation Task Order

Tasks are ordered so each is independently implementable by a coder agent with minimal merge conflicts.

### Group 1 — Cleanup and Removals

**Task 1.1 — Remove vocab flash card client code (FR-06)**

Files:
- `client/src/api/lesson-tools.ts` — delete `getSavedVocabFlashCards`, `saveVocabFlashCard`, `removeVocabFlashCard` methods.
- `client/src/api/assignments.ts` — delete `getSavedVocabEntryFlashCards`, `saveVocabEntryFlashCard`, `removeVocabEntryFlashCard` methods.
- Locate any component that imports these methods (search for `vocabFlashCard`, `vocab-flashcard`, `vocab-flash` in `client/src`) and remove those call sites. Based on current grep, the consuming components are in `features/vocab/` — remove the bookmark/save behavior from `VocabCard.tsx` or `VocabAssignmentView.tsx` as needed.
- Update or delete `client/src/__tests__/features/vocab/VocabCard.test.tsx` to remove references to the old API.

---

### Group 2 — Type Updates

**Task 2.1 — Update `Assignment` interface in `src/api/types.ts`**

Files:
- `client/src/api/types.ts`

Changes:
- Add `Bookmark` interface (inline, or import from `bookmarks.ts` — prefer inline in `types.ts` to keep all shared types co-located):

```ts
export interface Bookmark {
  id: string;
  note: string;
  updatedAt: string;
}
```

- Add `bookmark: Bookmark | null` field to the `Assignment` interface (after `practiceProblemAssignment`).

**Task 2.2 — Update `StudentToolType` in `StudentToolsBar.tsx`**

Files:
- `client/src/features/student-notes/StudentToolsBar.tsx`

Changes:
- Remove `'practice'` from the `StudentToolType` union.
- Add `'checklist'` to the union.
- Remove the `practice` entry from `TOOL_META`.
- Add the `checklist` entry to `TOOL_META` with `CheckSquare` icon from `lucide-react`.

---

### Group 3 — New API Modules

**Task 3.1 — Create `src/api/bookmarks.ts`**

File: `client/src/api/bookmarks.ts` (new)

Implement `bookmarksApi.upsert` (`PUT /assignments/:assignmentId/bookmark`) and `bookmarksApi.delete` (`DELETE /assignments/:assignmentId/bookmark`) using `apiClient`. See Section 6 for the exact module shape.

**Task 3.2 — Create `src/api/checklist.ts`**

File: `client/src/api/checklist.ts` (new)

Implement `checklistApi` with `getAll`, `create`, `update`, `delete`, `reorder` methods using `apiClient`. Includes the `ChecklistItem` interface export. See Section 6 for the exact module shape.

---

### Group 4 — New Components and Hooks

**Task 4.1 — Create `ExternalLinkAssignmentForm.tsx`**

File: `client/src/features/assignments/ExternalLinkAssignmentForm.tsx` (new)

Copy `ReadingAssignmentForm.tsx` and update:
- Component name: `ExternalLinkAssignmentForm`.
- No logic changes — the field labels in this file stay the same (URL, Description, Estimated reading time). The "External Link" label change happens in `AssignmentFormModal.TYPE_CONFIG`.

Then delete `client/src/features/assignments/ReadingAssignmentForm.tsx`.

**Task 4.2 — Create `ExternalLinkAssignmentView.tsx`**

File: `client/src/features/assignments/ExternalLinkAssignmentView.tsx` (new)

Implement per Section 9a pseudocode. Key implementation notes:
- Use `useRef<ReturnType<typeof setTimeout>>` for the 5s timeout.
- Clean up timeout in a `useEffect` return.
- For mobile detection: use a `useState` initialized by `() => !window.matchMedia('(min-width: 1024px)').matches` — this is a one-time read on mount (not a reactive listener), which is acceptable for SSR-free Vite apps.
- The `<BookmarkButton>` is rendered in the header row when `isStudent && assignmentId` is truthy.
- Import `BookmarkButton` from `../lessons/BookmarkButton.js`.

Then delete `client/src/features/assignments/ReadingAssignmentView.tsx`.

**Task 4.3 — Create `BookmarkButton.tsx`**

File: `client/src/features/lessons/BookmarkButton.tsx` (new)

Implement per Section 9b pseudocode. Key implementation notes:
- Use `createPortal(popoverContent, document.body)` for the popover.
- Desktop popover: position using `useRef` on the trigger button + `getBoundingClientRect()` in an `useEffect` when `isOpen` changes. Store `{ top, left }` in state and apply via `style` prop.
- Mobile detection: same pattern as `ExternalLinkAssignmentView` — `!window.matchMedia('(min-width: 1024px)').matches` on mount.
- The `Bookmark` type is imported from `../../api/types.js`.
- `bookmarksApi` is imported from `../../api/bookmarks.js`.

**Task 4.4 — Create `useChecklist.ts` hook**

File: `client/src/features/lessons/hooks/useChecklist.ts` (new)

Implement per Section 5 and Section 9c. Key implementation notes:
- Use `useFetch<ChecklistItem[]>(() => checklistApi.getAll(lessonId), [lessonId])` for initial load.
- Sync fetched data into local `items` state in a `useEffect` (same pattern as `useAssignments` does for assignments).
- Each mutation (add, toggle, update, delete, reorder) modifies `items` optimistically and calls the API.
- On error, roll back `items` to the pre-mutation snapshot and call `setError(classifyError(err))`.
- Export both the hook and the return type interface.

**Task 4.5 — Create `ChecklistPanel.tsx`**

File: `client/src/features/lessons/ChecklistPanel.tsx` (new)

Implement per Section 3. Key implementation notes:
- Import `useChecklist` from `./hooks/useChecklist.js`.
- Keyboard reorder uses "Move up" / "Move down" icon buttons (`ChevronUp`, `ChevronDown` from `lucide-react`) with `aria-label`.
- Drag handle (`GripVertical` icon) is visual only — `aria-hidden="true"`.
- Add-item: submits on Enter keydown in the `<Input>` component.
- Use `<EmptyState>` shared component for the empty state.
- Use `<LoadingSpinner>` while `loading`.
- Use `<ErrorMessage>` for list-level and add-item errors.

---

### Group 5 — Integration and Wiring

**Task 5.1 — Update `AssignmentFormModal.tsx` (TYPE_CONFIG label)**

File: `client/src/features/assignments/AssignmentFormModal.tsx`

Changes:
- Import `ExternalLinkAssignmentForm` instead of `ReadingAssignmentForm`.
- In `TYPE_CONFIG['reading']`: change `label: 'Reading'` → `label: 'External Link'`.
- Change `MetaFields: ReadingAssignmentForm` → `MetaFields: ExternalLinkAssignmentForm`.

**Task 5.2 — Update `LessonAssignmentContent.tsx`**

File: `client/src/features/lessons/LessonAssignmentContent.tsx`

Changes:
- Import `ExternalLinkAssignmentView` instead of `ReadingAssignmentView`.
- Add `onBookmarkChange` and `isStudent` to props interface.
- In the `reading` branch: pass `bookmark={assignment.bookmark ?? null}`, `assignmentId={assignment.id}`, `onBookmarkChange={onBookmarkChange}` to `ExternalLinkAssignmentView`. Wrap the bookmark-related props in `isStudent &&` guards so teachers never receive them.

**Task 5.3 — Update `useAssignments.ts` (availableTools + handleBookmarkChange)**

File: `client/src/features/lessons/hooks/useAssignments.ts`

Changes:
- Change `availableTools` memo from `['notes', 'flashcards', 'vocab', 'practice']` to `['notes', 'flashcards', 'vocab', 'checklist']`.
- Add `handleBookmarkChange` callback (see Section 9d pseudocode) to the hook's return value and the `UseAssignmentsReturn` interface.

**Task 5.4 — Update `StudentMaterialsModal.tsx`**

File: `client/src/features/student-notes/StudentMaterialsModal.tsx`

Changes:
- Remove `import PracticeProblemList`.
- Add `import ChecklistPanel from '../lessons/ChecklistPanel.js'`.
- Remove `{activeTool === 'practice' && ...}` render branch.
- Add `{activeTool === 'checklist' && <div className="p-3"><ChecklistPanel lessonId={lessonId} /></div>}`.

**Task 5.5 — Wire `handleBookmarkChange` in `LessonDetailPage` (or parent that renders `LessonAssignmentContent`)**

File: The component that renders `LessonAssignmentContent` — likely `LessonDetailPage.tsx` or `ActiveItemContent.tsx`.

Changes:
- Pass `handleBookmarkChange` (from `useAssignments`) down to `LessonAssignmentContent`.
- Pass `isStudent={user?.role === 'student'}` to `LessonAssignmentContent`.
- Ensure `useAuth()` is already called in the parent (it is, per existing code).
