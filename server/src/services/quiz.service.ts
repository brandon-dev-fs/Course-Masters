import prisma from '../lib/prisma.js';
import { NotFoundError } from '../errors/index.js';
import type { CreateAssessmentInput, SubmitAttemptInput } from '../schemas/assessment.schema.js';

const PASS_THRESHOLD = 0.8;

async function getDefaultUserId(): Promise<string> {
  const user = await prisma.user.findFirst();
  if (!user) throw new NotFoundError('No users found — run seed first');
  return user.id;
}

export const quizService = {
  async findByLesson(lessonId: string) {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundError('Lesson not found');
    const quiz = await prisma.quiz.findUnique({
      where: { lessonId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (!quiz) return null;
    // Omit correctIndex from questions returned to client
    return {
      ...quiz,
      questions: quiz.questions.map(({ correctIndex: _ci, ...q }) => q),
    };
  },

  async create(lessonId: string, data: CreateAssessmentInput) {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundError('Lesson not found');
    return prisma.quiz.create({
      data: {
        lessonId,
        questions: { create: data.questions },
      },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
  },

  async submitAttempt(quizId: string, data: SubmitAttemptInput) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (!quiz) throw new NotFoundError('Quiz not found');

    const { answers } = data;
    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) correct++;
    });

    const score = quiz.questions.length > 0 ? correct / quiz.questions.length : 0;
    const passed = score >= PASS_THRESHOLD;
    const userId = await getDefaultUserId();

    const attempt = await prisma.quizAttempt.create({
      data: { quizId, userId, score, passed },
    });

    return { ...attempt, totalQuestions: quiz.questions.length, correctCount: correct };
  },

  async getLastAttempt(quizId: string) {
    return prisma.quizAttempt.findFirst({
      where: { quizId },
      orderBy: { createdAt: 'desc' },
    });
  },
};
