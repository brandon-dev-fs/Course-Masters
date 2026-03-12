import { Router } from 'express';
import { quizController } from '../controllers/quiz.controller.js';
import { validate } from '../middleware/validate.js';
import { createAssessmentSchema, submitAttemptSchema } from '../schemas/assessment.schema.js';
import { authorize } from '../middleware/authorize.js';

const lessonQuizRouter = Router({ mergeParams: true });
lessonQuizRouter.get('/', quizController.get);
lessonQuizRouter.post('/', authorize('teacher', 'admin'), validate(createAssessmentSchema), quizController.create);

const quizzesRouter = Router();
quizzesRouter.post('/:quizId/attempts', validate(submitAttemptSchema), quizController.submitAttempt);

export { lessonQuizRouter, quizzesRouter };
