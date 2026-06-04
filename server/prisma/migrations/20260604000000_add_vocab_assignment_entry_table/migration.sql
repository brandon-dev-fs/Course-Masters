-- CreateTable
CREATE TABLE "vocab_assignment_entry" (
    "id" TEXT NOT NULL,
    "vocabAssignmentId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "example" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vocab_assignment_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_vocab_assignment_flash_card" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_vocab_assignment_flash_card_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vocab_assignment_entry_vocabAssignmentId_idx" ON "vocab_assignment_entry"("vocabAssignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "student_vocab_assignment_flash_card_userId_entryId_key" ON "student_vocab_assignment_flash_card"("userId", "entryId");

-- CreateIndex
CREATE INDEX "student_vocab_assignment_flash_card_userId_idx" ON "student_vocab_assignment_flash_card"("userId");

-- AddForeignKey
ALTER TABLE "vocab_assignment_entry" ADD CONSTRAINT "vocab_assignment_entry_vocabAssignmentId_fkey" FOREIGN KEY ("vocabAssignmentId") REFERENCES "vocab_assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_vocab_assignment_flash_card" ADD CONSTRAINT "student_vocab_assignment_flash_card_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_vocab_assignment_flash_card" ADD CONSTRAINT "student_vocab_assignment_flash_card_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "vocab_assignment_entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Migrate existing JSON entries then drop the column
INSERT INTO "vocab_assignment_entry" ("id", "vocabAssignmentId", "term", "definition", "example", "order", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  va.id,
  entry->>'term',
  entry->>'definition',
  NULLIF(entry->>'example', ''),
  ordinality::int,
  NOW(),
  NOW()
FROM "vocab_assignment" va,
  jsonb_array_elements(va."entries"::jsonb) WITH ORDINALITY AS t(entry, ordinality)
WHERE va."entries" IS NOT NULL
  AND va."entries"::text != 'null'
  AND jsonb_array_length(va."entries"::jsonb) > 0;

ALTER TABLE "vocab_assignment" DROP COLUMN "entries";
