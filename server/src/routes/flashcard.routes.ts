import { flashCardController } from '../controllers/flashcard.controller.js';
import { createFlashCardSchema, updateFlashCardSchema } from '../schemas/flashcard.schema.js';
import { createLessonContentRoutes } from './factories/createLessonContentRoutes.js';

const { lessonRouter: lessonFlashCardsRouter, standaloneRouter: flashCardsRouter } =
  createLessonContentRoutes(flashCardController, createFlashCardSchema, updateFlashCardSchema, 'id');

export { lessonFlashCardsRouter, flashCardsRouter };
