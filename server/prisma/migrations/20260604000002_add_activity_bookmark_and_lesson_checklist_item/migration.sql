-- CreateTable
CREATE TABLE "activity_bookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "note" VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_checklist_item" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "text" VARCHAR(200) NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_checklist_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_bookmark_userId_idx" ON "activity_bookmark"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "activity_bookmark_userId_assignmentId_key" ON "activity_bookmark"("userId", "assignmentId");

-- CreateIndex
CREATE INDEX "lesson_checklist_item_userId_lessonId_idx" ON "lesson_checklist_item"("userId", "lessonId");

-- AddForeignKey
ALTER TABLE "activity_bookmark" ADD CONSTRAINT "activity_bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_bookmark" ADD CONSTRAINT "activity_bookmark_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_checklist_item" ADD CONSTRAINT "lesson_checklist_item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_checklist_item" ADD CONSTRAINT "lesson_checklist_item_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
