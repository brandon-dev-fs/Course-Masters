import { Router } from 'express';
import { flashCardController } from '../controllers/flashcard.controller.js';
import { validate } from '../middleware/validate.js';
import { createFlashCardSchema, updateFlashCardSchema } from '../schemas/flashcard.schema.js';

const lessonFlashCardsRouter = Router({ mergeParams: true });
lessonFlashCardsRouter.get('/', flashCardController.getAll);
lessonFlashCardsRouter.post('/', validate(createFlashCardSchema), flashCardController.create);

const flashCardsRouter = Router();
flashCardsRouter.put('/:id', validate(updateFlashCardSchema), flashCardController.update);
flashCardsRouter.delete('/:id', flashCardController.remove);

export { lessonFlashCardsRouter, flashCardsRouter };
