import { Router } from 'express';
import { createAssessmentController, assessmentController } from '../controllers/assessment.controller.js';
import { validate } from '../middleware/validate.js';
import { authorize } from '../middleware/authorize.js';
import { createAssessmentSchema, submitAttemptSchema } from '../schemas/assessment.schema.js';

const lessonAssessmentController = createAssessmentController('lesson_quiz', 'lessonId');
const unitAssessmentController = createAssessmentController('unit_quiz', 'unitId');
const courseAssessmentController = createAssessmentController('course_exam', 'courseId');

export const lessonAssessmentRouter = Router({ mergeParams: true });
lessonAssessmentRouter.get('/', lessonAssessmentController.get);
lessonAssessmentRouter.post('/', authorize('teacher', 'admin'), validate(createAssessmentSchema), lessonAssessmentController.create);

export const unitAssessmentRouter = Router({ mergeParams: true });
unitAssessmentRouter.get('/', unitAssessmentController.get);
unitAssessmentRouter.post('/', authorize('teacher', 'admin'), validate(createAssessmentSchema), unitAssessmentController.create);

export const courseAssessmentRouter = Router({ mergeParams: true });
courseAssessmentRouter.get('/', courseAssessmentController.get);
courseAssessmentRouter.post('/', authorize('teacher', 'admin'), validate(createAssessmentSchema), courseAssessmentController.create);

export const assessmentsRouter = Router();
assessmentsRouter.put('/:assessmentId', authorize('teacher', 'admin'), validate(createAssessmentSchema), assessmentController.update);
assessmentsRouter.get('/:assessmentId/attempts', assessmentController.getAttempts);
assessmentsRouter.post('/:assessmentId/attempts', validate(submitAttemptSchema), assessmentController.submitAttempt);
