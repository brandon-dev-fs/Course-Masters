-- Consolidate multiple notes per lesson into a single rich-text note with JSON content.

-- Step 1: Remove duplicates — keep only the note with the lowest order per lesson.
DELETE FROM "Note" a
USING "Note" b
WHERE a."lessonId" = b."lessonId"
  AND a."order" > b."order";

-- Handle any remaining duplicates (same order) by keeping the one with the smallest id.
DELETE FROM "Note" a
USING "Note" b
WHERE a."lessonId" = b."lessonId"
  AND a."id" > b."id";

-- Step 2: Convert content from plain text to Tiptap JSON document.
UPDATE "Note"
SET "content" = jsonb_build_object(
  'type', 'doc',
  'content', jsonb_build_array(
    jsonb_build_object(
      'type', 'paragraph',
      'content', jsonb_build_array(
        jsonb_build_object('type', 'text', 'text', "content")
      )
    )
  )
)::text;

-- Step 3: Change column type from text to jsonb.
ALTER TABLE "Note" ALTER COLUMN "content" TYPE JSONB USING "content"::jsonb;

-- Step 4: Drop the order column.
ALTER TABLE "Note" DROP COLUMN "order";

-- Step 5: Drop the old index and add unique constraint on lessonId.
DROP INDEX IF EXISTS "Note_lessonId_idx";
ALTER TABLE "Note" ADD CONSTRAINT "Note_lessonId_key" UNIQUE ("lessonId");
