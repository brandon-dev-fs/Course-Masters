import prisma from '../lib/prisma.js';
import { createAssessmentService } from './factories/createAssessmentService.js';

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

export const testService = { findByUnit: base.find, create: base.create, submitAttempt: base.submitAttempt };
