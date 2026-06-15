-- AlterEnum
ALTER TYPE "AssignmentType" ADD VALUE 'file';

-- CreateTable
CREATE TABLE "file_assignment" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,

    CONSTRAINT "file_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "file_assignment_assignmentId_key" ON "file_assignment"("assignmentId");

-- AddForeignKey
ALTER TABLE "file_assignment" ADD CONSTRAINT "file_assignment_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
