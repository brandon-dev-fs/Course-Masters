import { Router } from 'express';
import { examController } from '../controllers/exam.controller.js';
import { validate } from '../middleware/validate.js';
import { createAssessmentSchema, submitAttemptSchema } from '../schemas/assessment.schema.js';
import { authorize } from '../middleware/authorize.js';

const courseExamRouter = Router({ mergeParams: true });
courseExamRouter.get('/', examController.get);
courseExamRouter.post('/', authorize('teacher', 'admin'), validate(createAssessmentSchema), examController.create);

const examsRouter = Router();
examsRouter.post('/:examId/attempts', validate(submitAttemptSchema), examController.submitAttempt);

export { courseExamRouter, examsRouter };
