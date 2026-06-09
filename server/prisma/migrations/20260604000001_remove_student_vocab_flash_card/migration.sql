-- DropForeignKey
ALTER TABLE "student_vocab_flash_card" DROP CONSTRAINT "student_vocab_flash_card_toolId_fkey";

-- DropForeignKey
ALTER TABLE "student_vocab_flash_card" DROP CONSTRAINT "student_vocab_flash_card_userId_fkey";

-- DropTable
DROP TABLE "student_vocab_flash_card";
