import { Router } from 'express';
import { practiceProblemController } from '../controllers/practice-problem.controller.js';
import { validate } from '../middleware/validate.js';
import { createPracticeProblemSchema, updatePracticeProblemSchema } from '../schemas/practice-problem.schema.js';
import { authorize } from '../middleware/authorize.js';

const lessonProblemsRouter = Router({ mergeParams: true });
lessonProblemsRouter.get('/', practiceProblemController.getAll);
lessonProblemsRouter.post('/', authorize('teacher', 'admin'), validate(createPracticeProblemSchema), practiceProblemController.create);

const problemsRouter = Router();
problemsRouter.put('/:id', authorize('teacher', 'admin'), validate(updatePracticeProblemSchema), practiceProblemController.update);
problemsRouter.delete('/:id', authorize('teacher', 'admin'), practiceProblemController.remove);

export { lessonProblemsRouter, problemsRouter };
