import { Router } from 'express';
import { practiceProblemController } from '../controllers/practice-problem.controller.js';
import { validate } from '../middleware/validate.js';
import { createPracticeProblemSchema, updatePracticeProblemSchema } from '../schemas/practice-problem.schema.js';

const lessonProblemsRouter = Router({ mergeParams: true });
lessonProblemsRouter.get('/', practiceProblemController.getAll);
lessonProblemsRouter.post('/', validate(createPracticeProblemSchema), practiceProblemController.create);

const problemsRouter = Router();
problemsRouter.put('/:id', validate(updatePracticeProblemSchema), practiceProblemController.update);
problemsRouter.delete('/:id', practiceProblemController.remove);

export { lessonProblemsRouter, problemsRouter };
