import prisma from '../lib/prisma.js';
import { createAssessmentService } from './factories/createAssessmentService.js';
import { NotFoundError } from '../errors/index.js';
import type { CreateAssessmentInput } from '../schemas/assessment.schema.js';

const base = createAssessmentService({
  parentDelegate: prisma.course,
  parentIdField: 'courseId',
  parentName: 'Course',
  assessmentDelegate: prisma.finalExam,
  assessmentName: 'Exam',
  attemptDelegate: prisma.examAttempt,
  attemptFkField: 'examId',
  includeLastAttempt: true,
});

async function update(courseId: string, data: CreateAssessmentInput) {
  const exam = await prisma.finalExam.findUnique({ where: { courseId } });
  if (!exam) throw new NotFoundError('Exam not found');
  return prisma.finalExam.update({
    where: { courseId },
    data: {
      questions: {
        deleteMany: {},
        create: data.questions,
      },
    },
    include: { questions: { orderBy: { order: 'asc' } } },
  });
}

async function findForEdit(courseId: string) {
  const exam = await prisma.finalExam.findUnique({
    where: { courseId },
    include: { questions: { orderBy: { order: 'asc' } } },
  });
  return exam;
}

export const examService = { findByCourse: base.find, findForEdit, create: base.create, update, submitAttempt: base.submitAttempt };
