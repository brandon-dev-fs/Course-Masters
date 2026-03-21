import prisma from '../lib/prisma.js';
import { createAssessmentService } from './factories/createAssessmentService.js';

const base = createAssessmentService({
  parentDelegate: prisma.lesson,
  parentIdField: 'lessonId',
  parentName: 'Lesson',
  assessmentDelegate: prisma.quiz,
  assessmentName: 'Quiz',
  attemptDelegate: prisma.quizAttempt,
  attemptFkField: 'quizId',
});

export const quizService = {
  findByLesson: base.find,
  create: base.create,
  submitAttempt: base.submitAttempt,

  async getAttempts(quizId: string, userId: string) {
    return prisma.quizAttempt.findMany({
      where: { quizId, userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, score: true, passed: true, createdAt: true },
    });
  },

  async getLastAttempt(quizId: string) {
    return prisma.quizAttempt.findFirst({
      where: { quizId },
      orderBy: { createdAt: 'desc' },
    });
  },
};
