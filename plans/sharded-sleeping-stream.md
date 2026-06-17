# Plan: Vocab Section Updates

## Context

Teachers build lesson content using tools: notes, videos, reading links, vocab, and practice problems. The vocab tool currently stores only a `term` and `definition`. Two improvements were requested:

1. **Example sentence** — vocab entries should support a third field (`example`) so students see *term → definition → example sentence* in one card.
2. **Save to flashcards** — students should be able to bookmark any vocab term into their personal flashcard study set with a single click, rather than relying on teachers to manually duplicate the term as a flash_card tool.

Both changes are additive and backward-compatible. Existing vocab entries without an `example` render identically to before.

---

## Status: Already Implemented

This plan was generated after implementation. The sections below document what was built.

---

## Feature 1 — Example sentence field

### Server
| File | Change |
|---|---|
| `server/src/schemas/lesson-tool.schema.ts` | Add `example: z.string().optional()` to `vocabContentSchema` |

No migration needed — `LessonTool.content` is a freeform `Json` column.

### Client
| File | Change |
|---|---|
| `client/src/api/types.ts` | Add `example?: string` to `VocabContent` |
| `client/src/features/vocab/VocabForm.tsx` | Add "Example sentence (optional)" `<Textarea>` field |
| `client/src/features/vocab/VocabCard.tsx` | Render `example` in an italicised, left-bordered block below the definition (hidden when absent) |
| `client/src/features/vocab/VocabList.tsx` | Pass `example` through create/update payloads |
| `client/src/features/lessons/LessonToolModals.tsx` | Pass `example` through the inline edit modal |

---

## Feature 2 — Save vocab to student flashcards

### Database
New table `student_vocab_flash_card` (created via direct SQL due to a pre-existing shadow-DB migration issue):

```sql
CREATE TABLE student_vocab_flash_card (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"    TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "toolId"    TEXT NOT NULL REFERENCES lesson_tool(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("userId", "toolId")
);
CREATE INDEX "student_vocab_flash_card_userId_idx" ON student_vocab_flash_card("userId");
```

Prisma schema updated with `StudentVocabFlashCard` model and relations on `User` and `LessonTool`. `npx prisma generate` was run to regenerate the client.

### Server — 3 new endpoints
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/lessons/:lessonId/tools/vocab-flashcards` | any authenticated | Returns saved vocab `LessonTool[]` for current user |
| `POST` | `/tools/:toolId/vocab-flashcard` | any authenticated | Saves vocab term to student's flashcard set |
| `DELETE` | `/tools/:toolId/vocab-flashcard` | any authenticated | Removes vocab term from student's flashcard set |

Files changed:
- `server/src/services/lesson-tool.service.ts` — `saveVocabFlashCard`, `removeVocabFlashCard`, `getSavedVocabFlashCards`
- `server/src/controllers/lesson-tool.controller.ts` — 3 new handlers
- `server/src/routes/lesson-tool.routes.ts` — routes added to `lessonToolsRouter` and `toolsRouter`

### Client
| File | Change |
|---|---|
| `client/src/api/types.ts` | Add `StudyCard { id, front, back }` interface |
| `client/src/api/lesson-tools.ts` | Add `getSavedVocabFlashCards`, `saveVocabFlashCard`, `removeVocabFlashCard` |
| `client/src/features/vocab/VocabCard.tsx` | Students see `BookmarkPlus`/`BookmarkCheck` toggle button with instant feedback |
| `client/src/features/vocab/VocabList.tsx` | Loads saved flashcard IDs on mount (students only); passes `saved`/`onSavedChange` to each card |
| `client/src/features/flashcards/FlashCardStudyMode.tsx` | Accepts `StudyCard[]` instead of `LessonTool[]`; renders flip cards inline |
| `client/src/features/flashcards/FlashCardList.tsx` | "Study Mode" fetches saved vocab, converts to `StudyCard`, merges with teacher flash_cards (deduplicated by ID) |
| `client/src/__tests__/features/flashcards/FlashCardStudyMode.test.tsx` | Updated to use `StudyCard` fixture type |

---

## Verification

1. **Server starts** — `npm run dev` — server logs `Server started` with no errors.
2. **TypeScript** — `npx tsc --noEmit` in both `client/` and `server/` — zero errors in source files (pre-existing test-file errors are unrelated).
3. **Example sentence** — Teacher creates/edits a vocab term with an example; student view shows the italicised example beneath the definition.
4. **Save to flashcards** — Student clicks the bookmark icon on a vocab card; icon turns green. Navigate to Flash Cards section → Study Mode includes the saved vocab card (term = front, definition = back). Click again → removed.
5. **Teacher view** — Bookmark button is hidden; edit/delete actions unchanged.
