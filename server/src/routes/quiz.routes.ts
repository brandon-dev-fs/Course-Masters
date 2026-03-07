import { Router } from 'express';
import { quizController } from '../controllers/quiz.controller.js';
import { validate } from '../middleware/validate.js';
import { createAssessmentSchema, submitAttemptSchema } from '../schemas/assessment.schema.js';

const lessonQuizRouter = Router({ mergeParams: true });
lessonQuizRouter.get('/', quizController.get);
lessonQuizRouter.post('/', validate(createAssessmentSchema), quizController.create);

const quizzesRouter = Router();
quizzesRouter.post('/:quizId/attempts', validate(submitAttemptSchema), quizController.submitAttempt);

export { lessonQuizRouter, quizzesRouter };
