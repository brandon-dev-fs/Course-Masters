import prisma from '../lib/prisma.js';
import { createAssessmentService } from './factories/createAssessmentService.js';

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

export const examService = { findByCourse: base.find, create: base.create, submitAttempt: base.submitAttempt };
