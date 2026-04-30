-- CreateEnum
CREATE TYPE "AssignmentType" AS ENUM ('note', 'video', 'reading', 'vocab', 'practice_problem');

-- CreateEnum
CREATE TYPE "PracticeQuestionType" AS ENUM ('multiple_choice', 'true_false', 'matching', 'fill_in_blank');

-- CreateTable
CREATE TABLE "assignment" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "objective" TEXT,
    "type" "AssignmentType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note_assignment" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "content" JSONB NOT NULL,

    CONSTRAINT "note_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_assignment" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,

    CONSTRAINT "video_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reading_assignment" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "estimatedMinutes" INTEGER,

    CONSTRAINT "reading_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocab_assignment" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "entries" JSONB NOT NULL,

    CONSTRAINT "vocab_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_problem_assignment" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "passingPercentage" INTEGER,

    CONSTRAINT "practice_problem_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_problem_question" (
    "id" TEXT NOT NULL,
    "practiceProblemAssignmentId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "PracticeQuestionType" NOT NULL,
    "content" JSONB NOT NULL,

    CONSTRAINT "practice_problem_question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_completion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignment_completion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assignment_lessonId_idx" ON "assignment"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_lessonId_order_key" ON "assignment"("lessonId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "note_assignment_assignmentId_key" ON "note_assignment"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "video_assignment_assignmentId_key" ON "video_assignment"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "reading_assignment_assignmentId_key" ON "reading_assignment"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "vocab_assignment_assignmentId_key" ON "vocab_assignment"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "practice_problem_assignment_assignmentId_key" ON "practice_problem_assignment"("assignmentId");

-- CreateIndex
CREATE INDEX "practice_problem_question_practiceProblemAssignmentId_idx" ON "practice_problem_question"("practiceProblemAssignmentId");

-- CreateIndex
CREATE INDEX "assignment_completion_userId_idx" ON "assignment_completion"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_completion_userId_assignmentId_key" ON "assignment_completion"("userId", "assignmentId");

-- AddForeignKey
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_assignment" ADD CONSTRAINT "note_assignment_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_assignment" ADD CONSTRAINT "video_assignment_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_assignment" ADD CONSTRAINT "reading_assignment_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocab_assignment" ADD CONSTRAINT "vocab_assignment_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_problem_assignment" ADD CONSTRAINT "practice_problem_assignment_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_problem_question" ADD CONSTRAINT "practice_problem_question_practiceProblemAssignmentId_fkey" FOREIGN KEY ("practiceProblemAssignmentId") REFERENCES "practice_problem_assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_completion" ADD CONSTRAINT "assignment_completion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_completion" ADD CONSTRAINT "assignment_completion_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
