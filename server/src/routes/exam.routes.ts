import { Router } from 'express';
import { examController } from '../controllers/exam.controller.js';
import { validate } from '../middleware/validate.js';
import { createAssessmentSchema, submitAttemptSchema } from '../schemas/assessment.schema.js';

const courseExamRouter = Router({ mergeParams: true });
courseExamRouter.get('/', examController.get);
courseExamRouter.post('/', validate(createAssessmentSchema), examController.create);

const examsRouter = Router();
examsRouter.post('/:examId/attempts', validate(submitAttemptSchema), examController.submitAttempt);

export { courseExamRouter, examsRouter };
