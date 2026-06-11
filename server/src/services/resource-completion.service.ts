import prisma from '../lib/prisma.js';
import { NotFoundError } from '../errors/index.js';

interface CompletionItem {
  assignmentId: string;
  completedAt: Date;
}

interface CompletionResult {
  completions: CompletionItem[];
}

export const resourceCompletionService = {
  async getByLesson(lessonId: string, userId: string): Promise<CompletionResult> {
    const completions = await prisma.assignmentCompletion.findMany({
      where: {
        assignment: { lessonId },
        userId,
      },
      select: { assignmentId: true, completedAt: true },
    });

    return {
      completions: completions.map((c) => ({
        assignmentId: c.assignmentId,
        completedAt: c.completedAt,
      })),
    };
  },

  async toggle(
    lessonId: string,
    userId: string,
    assignmentId: string,
  ): Promise<CompletionResult> {
    // Verify the assignment belongs to this lesson
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment || assignment.lessonId !== lessonId) {
      throw new NotFoundError('Assignment not found in this lesson');
    }

    const existing = await prisma.assignmentCompletion.findUnique({
      where: { userId_assignmentId: { userId, assignmentId } },
    });

    if (existing) {
      await prisma.assignmentCompletion.delete({
        where: { id: existing.id },
      });
    } else {
      await prisma.assignmentCompletion.create({
        data: { userId, assignmentId },
      });
    }

    return this.getByLesson(lessonId, userId);
  },
};
