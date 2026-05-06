import { Router } from 'express';
import { createAssessmentController, assessmentController } from '../controllers/assessment.controller.js';
import { validate } from '../middleware/validate.js';
import { authorize } from '../middleware/authorize.js';
import { bulkUpdateCalculatorSchema, createAssessmentSchema, submitAttemptSchema } from '../schemas/assessment.schema.js';
import { requireCourseOwnership, requireStudentRole } from '../middleware/authorize-resource.js';

const lessonAssessmentController = createAssessmentController('lesson_quiz', 'lessonId');
const unitAssessmentController = createAssessmentController('unit_quiz', 'unitId');
const courseAssessmentController = createAssessmentController('course_exam', 'courseId');

export const lessonAssessmentRouter = Router({ mergeParams: true });
lessonAssessmentRouter.get('/', lessonAssessmentController.get);
lessonAssessmentRouter.post(
  '/',
  authorize('teacher', 'admin'),
  requireCourseOwnership('lesson_assessment', (req) => req.params['lessonId'] as string),
  validate(createAssessmentSchema),
  lessonAssessmentController.create,
);

export const unitAssessmentRouter = Router({ mergeParams: true });
unitAssessmentRouter.get('/', unitAssessmentController.get);
unitAssessmentRouter.post(
  '/',
  authorize('teacher', 'admin'),
  requireCourseOwnership('unit_assessment', (req) => req.params['unitId'] as string),
  validate(createAssessmentSchema),
  unitAssessmentController.create,
);

export const courseAssessmentRouter = Router({ mergeParams: true });
courseAssessmentRouter.get('/', courseAssessmentController.get);
courseAssessmentRouter.post(
  '/',
  authorize('teacher', 'admin'),
  requireCourseOwnership('course_assessment', (req) => req.params['courseId'] as string),
  validate(createAssessmentSchema),
  courseAssessmentController.create,
);

export const assessmentsRouter = Router();
assessmentsRouter.put(
  '/:assessmentId',
  authorize('teacher', 'admin'),
  requireCourseOwnership('assessment', (req) => req.params['assessmentId'] as string),
  validate(createAssessmentSchema),
  assessmentController.update,
);
assessmentsRouter.patch('/:assessmentId/questions/calculator', authorize('teacher', 'admin'), validate(bulkUpdateCalculatorSchema), assessmentController.bulkUpdateCalculator);
assessmentsRouter.get('/:assessmentId/attempts', assessmentController.getAttempts);
assessmentsRouter.post(
  '/:assessmentId/attempts',
  requireStudentRole(),
  validate(submitAttemptSchema),
  assessmentController.submitAttempt,
);
