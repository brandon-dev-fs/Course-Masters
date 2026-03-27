import { AssessmentType } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { NotFoundError } from '../errors/index.js';
import type { CreateAssessmentInput, SubmitAttemptInput } from '../schemas/assessment.schema.js';

const PASS_THRESHOLD = 0.8;

function parentWhere(type: AssessmentType, parentId: string) {
  if (type === 'lesson_quiz') return { lessonId: parentId };
  if (type === 'unit_quiz') return { unitId: parentId };
  return { courseId: parentId };
}

async function assertParentExists(type: AssessmentType, parentId: string) {
  if (type === 'lesson_quiz') {
    const lesson = await prisma.lesson.findUnique({ where: { id: parentId } });
    if (!lesson) throw new NotFoundError('Lesson not found');
  } else if (type === 'unit_quiz') {
    const unit = await prisma.unit.findUnique({ where: { id: parentId } });
    if (!unit) throw new NotFoundError('Unit not found');
  } else {
    const course = await prisma.course.findUnique({ where: { id: parentId } });
    if (!course) throw new NotFoundError('Course not found');
  }
}

export const assessmentService = {
  async findByParent(type: AssessmentType, parentId: string, userId?: string) {
    const assessment = await prisma.assessment.findUnique({
      where: parentWhere(type, parentId),
      include: {
        questions: { orderBy: { order: 'asc' } },
        attempts: userId
          ? { where: { userId }, orderBy: { createdAt: 'desc' }, take: 1 }
          : { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!assessment) return null;

    const { attempts, ...rest } = assessment;
    const lastAttempt = attempts[0] ?? null;
    return {
      ...rest,
      lastAttempt: lastAttempt ? { score: lastAttempt.score, passed: lastAttempt.passed } : null,
    };
  },

  async create(type: AssessmentType, parentId: string, data: CreateAssessmentInput) {
    await assertParentExists(type, parentId);
    return prisma.assessment.create({
      data: {
        type,
        ...parentWhere(type, parentId),
        questions: { create: data.questions },
      },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
  },

  async update(assessmentId: string, data: CreateAssessmentInput) {
    const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) throw new NotFoundError('Assessment not found');

    await prisma.assessmentQuestion.deleteMany({ where: { assessmentId } });
    return prisma.assessment.update({
      where: { id: assessmentId },
      data: { questions: { create: data.questions } },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
  },

  async submitAttempt(assessmentId: string, data: SubmitAttemptInput, userId: string) {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (!assessment) throw new NotFoundError('Assessment not found');

    const { answers } = data;
    let correct = 0;
    assessment.questions.forEach((q, i) => {
      const content = q.content as Record<string, unknown>;
      const answer = answers[i];
      if (q.type === 'multiple_choice' || q.type === 'true_false') {
        if (answer === content['correctIndex'] || answer === content['correctAnswer']) correct++;
      } else if (q.type === 'fill_in_blank') {
        const accepted = content['acceptedAnswers'] as string[];
        if (Array.isArray(accepted) && accepted.some(a => a.toLowerCase() === String(answer).toLowerCase())) correct++;
      } else if (q.type === 'matching') {
        if (JSON.stringify(answer) === JSON.stringify(content['pairs'])) correct++;
      }
    });

    const total = assessment.questions.length;
    const score = total > 0 ? correct / total : 0;
    const passed = score >= PASS_THRESHOLD;

    const attempt = await prisma.assessmentAttempt.create({
      data: { assessmentId, userId, score, passed },
    });

    return { ...attempt, totalQuestions: total, correctCount: correct };
  },

  async getAttempts(assessmentId: string, userId: string) {
    return prisma.assessmentAttempt.findMany({
      where: { assessmentId, userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, score: true, passed: true, createdAt: true },
    });
  },
};
