import prisma from '../lib/prisma.js';
import { createAssessmentService } from './factories/createAssessmentService.js';
import { NotFoundError } from '../errors/index.js';
import type { CreateAssessmentInput } from '../schemas/assessment.schema.js';

const base = createAssessmentService({
  parentDelegate: prisma.unit,
  parentIdField: 'unitId',
  parentName: 'Unit',
  assessmentDelegate: prisma.test,
  assessmentName: 'Test',
  attemptDelegate: prisma.testAttempt,
  attemptFkField: 'testId',
  includeLastAttempt: true,
});

async function update(unitId: string, data: CreateAssessmentInput) {
  const test = await prisma.test.findUnique({ where: { unitId } });
  if (!test) throw new NotFoundError('Test not found');
  return prisma.test.update({
    where: { unitId },
    data: {
      questions: {
        deleteMany: {},
        create: data.questions,
      },
    },
    include: { questions: { orderBy: { order: 'asc' } } },
  });
}

async function findForEdit(unitId: string) {
  return prisma.test.findUnique({
    where: { unitId },
    include: { questions: { orderBy: { order: 'asc' } } },
  });
}

export const testService = { findByUnit: base.find, findForEdit, create: base.create, update, submitAttempt: base.submitAttempt };
