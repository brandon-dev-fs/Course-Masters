import { AssessmentType } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { AppError, NotFoundError } from '../errors/index.js';
import { assertExists } from '../utils/assertExists.js';
import type { BulkUpdateCalculatorInput, CreateAssessmentInput, SubmitAttemptInput } from '../schemas/assessment.schema.js';

const PASS_THRESHOLD = 0.8;

function parentWhere(type: AssessmentType, parentId: string) {
  if (type === 'lesson_quiz') return { lessonId: parentId };
  if (type === 'unit_quiz') return { unitId: parentId };
  return { courseId: parentId };
}

async function assertParentExists(type: AssessmentType, parentId: string) {
  if (type === 'lesson_quiz') {
    await assertExists(prisma.lesson, parentId, 'Lesson');
  } else if (type === 'unit_quiz') {
    await assertExists(prisma.unit, parentId, 'Unit');
  } else {
    await assertExists(prisma.course, parentId, 'Course');
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
    await assertExists(prisma.assessment, assessmentId, 'Assessment');

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

    if (assessment.type === 'lesson_quiz' && assessment.lessonId) {
      const lessonId = assessment.lessonId;
      const [requiredResources, requiredTools] = await Promise.all([
        prisma.lessonResource.findMany({ where: { lessonId, isRequired: true }, select: { id: true } }),
        prisma.lessonTool.findMany({ where: { lessonId, isRequired: true }, select: { id: true } }),
      ]);

      const allRequiredIds = [
        ...requiredResources.map(r => r.id),
        ...requiredTools.map(t => t.id),
      ];

      if (allRequiredIds.length > 0) {
        const [resourceCompletions, toolCompletions] = await Promise.all([
          prisma.lessonResourceCompletion.findMany({
            where: { resource: { lessonId }, userId },
            select: { resourceId: true },
          }),
          prisma.lessonToolCompletion.findMany({
            where: { tool: { lessonId }, userId },
            select: { toolId: true },
          }),
        ]);
        const completedIds = new Set([
          ...resourceCompletions.map(c => c.resourceId),
          ...toolCompletions.map(c => c.toolId),
        ]);
        const allComplete = allRequiredIds.every(id => completedIds.has(id));
        if (!allComplete) {
          throw new AppError(
            'REQUIRED_ASSIGNMENTS_INCOMPLETE',
            'All required assignments must be completed before taking the quiz',
            400,
          );
        }
      }
    }

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

  async getAttempts(assessmentId: string, userId: string, page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;

    const [total, data] = await Promise.all([
      prisma.assessmentAttempt.count({
        where: { assessmentId, userId },
      }),
      prisma.assessmentAttempt.findMany({
        where: { assessmentId, userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, score: true, passed: true, createdAt: true },
        skip,
        take: pageSize,
      }),
    ]);

    return { data, total, page, pageSize };
  },

  async bulkUpdateCalculator(assessmentId: string, data: BulkUpdateCalculatorInput) {
    await assertExists(prisma.assessment, assessmentId, 'Assessment');

    const found = await prisma.assessmentQuestion.findMany({
      where: { id: { in: data.questionIds }, assessmentId },
      select: { id: true },
    });
    if (found.length !== data.questionIds.length) {
      throw new AppError(
        'QUESTION_NOT_IN_ASSESSMENT',
        'One or more question IDs do not belong to this assessment',
        422,
      );
    }

    await prisma.assessmentQuestion.updateMany({
      where: { id: { in: data.questionIds }, assessmentId },
      data: { calculatorEnabled: data.calculatorEnabled },
    });

    const result = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (!result) throw new NotFoundError('Assessment not found');
    return result;
  },
};
