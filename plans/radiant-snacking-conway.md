# Plan: Increase Client Test Coverage Above 70% Threshold

## Context

CI is failing because client test coverage for **functions (68.98%)** and **branches (68.82%)** both fall below the 70% threshold enforced by `npm run test:coverage`. The goal is to add as many well-scoped tests as possible — not just barely cross the threshold.

Four high-impact, untested areas were identified:
- `api/bookmarks.ts` — 2 thin HTTP wrappers, 0% functions, no test file
- `api/checklist.ts` — 5 thin HTTP wrappers, 0% functions, no test file
- `features/lessons/hooks/useChecklist.ts` — `updateItemText` and `moveItem` are fully untested (57% functions, 25% branches)
- `features/lessons/ChecklistPanel.tsx` — entire component untested (0% everything), 9 functions, 24 branches

---

## Files to Create / Modify

### 1. `client/src/__tests__/api/bookmarks.test.ts` (NEW)

Mock `apiClient` with `vi.hoisted()` (same pattern as `lessons.test.ts`).

Tests:
- `upsert calls PUT /assignments/:id/bookmark with note`
- `upsert returns the bookmark from the response`
- `delete calls DELETE /assignments/:id/bookmark`

Source: `client/src/api/bookmarks.ts`

```ts
// bookmarks.ts signatures
bookmarksApi.upsert(assignmentId: string, note: string): Promise<Bookmark>
bookmarksApi.delete(assignmentId: string): Promise<void>
```

---

### 2. `client/src/__tests__/api/checklist.test.ts` (NEW)

Same mock pattern. One describe block with one test per method plus result assertions.

Tests:
- `getAll calls GET /lessons/:lessonId/checklist`
- `create calls POST /lessons/:lessonId/checklist with { text }`
- `update calls PUT /checklist-items/:itemId with data`
- `delete calls DELETE /checklist-items/:itemId`
- `reorder calls PUT /lessons/:lessonId/checklist/reorder with { itemIds }`

Source: `client/src/api/checklist.ts`

---

### 3. `client/src/__tests__/hooks/useChecklist.test.ts` (EXTEND)

Add two new `describe` blocks after the existing `deleteItem` block (before `return shape`).

**`updateItemText` block** (mirrors `toggleItem` tests):
- calls `checklistApi.update` with `{ text }`
- optimistically updates item text
- updates item with server response
- rolls back optimistic update and sets error on API failure

**`moveItem` block**:
- moves item up: swaps items, calls `checklistApi.reorder` with new id order
- moves item down: swaps items, calls `checklistApi.reorder` with new id order
- does nothing when moving first item up (boundary guard)
- does nothing when moving last item down (boundary guard)
- updates items from server reorder response
- rolls back and sets error on API failure

Source: `client/src/features/lessons/hooks/useChecklist.ts` lines 59–106

---

### 4. `client/src/__tests__/features/lessons/ChecklistPanel.test.tsx` (NEW)

Mock `useChecklist` as a default export with `vi.hoisted()` and provide a `makeHookReturn()` helper to build the default mock return value. Use plain `render()` (no providers needed — component only depends on the mocked hook).

```ts
const { useChecklistMock } = vi.hoisted(() => ({
  useChecklistMock: vi.fn(),
}));
vi.mock('../../../features/lessons/hooks/useChecklist.js', () => ({
  default: useChecklistMock,
}));
```

`makeHookReturn()` baseline:
```ts
{
  items: [],
  loading: false,
  error: null,
  addItem: vi.fn().mockResolvedValue(undefined),
  toggleItem: vi.fn().mockResolvedValue(undefined),
  updateItemText: vi.fn().mockResolvedValue(undefined),
  deleteItem: vi.fn().mockResolvedValue(undefined),
  moveItem: vi.fn().mockResolvedValue(undefined),
  deletingItemId: null,
}
```

`makeItem()` fixture:
```ts
{ id: 'item-1', lessonId: 'l1', text: 'Do thing', checked: false, order: 1, createdAt: '', updatedAt: '' }
```

Tests:

**Loading state:**
- `shows LoadingSpinner while loading`

**Empty state:**
- `shows empty state message when items list is empty`

**Error state:**
- `shows ErrorMessage when hook returns an error`

**Item rendering:**
- `renders each item text and checkbox`
- `first item Move up button is disabled`
- `last item Move down button is disabled`

**Interactions:**
- `checkbox change calls toggleItem with itemId and new checked value`
- `Move up button calls moveItem with "up"`
- `Move down button calls moveItem with "down"`
- `delete button calls deleteItem with itemId`

**Add item form:**
- `typing in input updates character counter`
- `pressing Enter with non-empty input calls addItem with trimmed text`
- `pressing Enter with whitespace-only input does not call addItem`
- `input clears after successful addItem`
- `shows inputError when addItem throws`

Source: `client/src/features/lessons/ChecklistPanel.tsx`

---

## Verification

```bash
npm run test:coverage -w client
```

Expected: functions ≥ 70%, branches ≥ 70%, all tests pass.
