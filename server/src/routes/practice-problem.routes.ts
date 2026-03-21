import { practiceProblemController } from '../controllers/practice-problem.controller.js';
import { createPracticeProblemSchema, updatePracticeProblemSchema } from '../schemas/practice-problem.schema.js';
import { createLessonContentRoutes } from './factories/createLessonContentRoutes.js';

const { lessonRouter: lessonProblemsRouter, standaloneRouter: problemsRouter } =
  createLessonContentRoutes(practiceProblemController, createPracticeProblemSchema, updatePracticeProblemSchema, 'id');

export { lessonProblemsRouter, problemsRouter };
