import { Router } from 'express';
import { testController } from '../controllers/test.controller.js';
import { validate } from '../middleware/validate.js';
import { createAssessmentSchema, submitAttemptSchema } from '../schemas/assessment.schema.js';
import { authorize } from '../middleware/authorize.js';

const unitTestRouter = Router({ mergeParams: true });
unitTestRouter.get('/', testController.get);
unitTestRouter.get('/edit', authorize('teacher', 'admin'), testController.getForEdit);
unitTestRouter.post('/', authorize('teacher', 'admin'), validate(createAssessmentSchema), testController.create);
unitTestRouter.put('/', authorize('teacher', 'admin'), validate(createAssessmentSchema), testController.update);

const testsRouter = Router();
testsRouter.post('/:testId/attempts', validate(submitAttemptSchema), testController.submitAttempt);

export { unitTestRouter, testsRouter };
