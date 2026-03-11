import prisma from '../lib/prisma.js';
import { NotFoundError } from '../errors/index.js';
import type { CreateAssessmentInput, SubmitAttemptInput } from '../schemas/assessment.schema.js';

const PASS_THRESHOLD = 0.8;

async function getDefaultUserId(): Promise<string> {
  const user = await prisma.user.findFirst();
  if (!user) throw new NotFoundError('No users found — run seed first');
  return user.id;
}

export const testService = {
  async findByUnit(unitId: string) {
    const unit = await prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) throw new NotFoundError('Unit not found');
    const test = await prisma.test.findUnique({
      where: { unitId },
      include: {
        questions: { orderBy: { order: 'asc' } },
        attempts: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!test) return null;
    const lastAttempt = test.attempts[0] ?? null;
    return {
      ...test,
      questions: test.questions.map(({ correctIndex: _ci, ...q }) => q),
      lastAttempt: lastAttempt
        ? { score: lastAttempt.score, passed: lastAttempt.passed }
        : null,
    };
  },

  async create(unitId: string, data: CreateAssessmentInput) {
    const unit = await prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) throw new NotFoundError('Unit not found');
    return prisma.test.create({
      data: { unitId, questions: { create: data.questions } },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
  },

  async submitAttempt(testId: string, data: SubmitAttemptInput) {
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (!test) throw new NotFoundError('Test not found');

    const { answers } = data;
    let correct = 0;
    test.questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) correct++;
    });

    const score = test.questions.length > 0 ? correct / test.questions.length : 0;
    const passed = score >= PASS_THRESHOLD;
    const userId = await getDefaultUserId();

    const attempt = await prisma.testAttempt.create({
      data: { testId, userId, score, passed },
    });

    return { ...attempt, totalQuestions: test.questions.length, correctCount: correct };
  },
};
