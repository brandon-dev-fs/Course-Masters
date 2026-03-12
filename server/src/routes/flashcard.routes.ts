import { Router } from 'express';
import { flashCardController } from '../controllers/flashcard.controller.js';
import { validate } from '../middleware/validate.js';
import { createFlashCardSchema, updateFlashCardSchema } from '../schemas/flashcard.schema.js';
import { authorize } from '../middleware/authorize.js';

const lessonFlashCardsRouter = Router({ mergeParams: true });
lessonFlashCardsRouter.get('/', flashCardController.getAll);
lessonFlashCardsRouter.post('/', authorize('teacher', 'admin'), validate(createFlashCardSchema), flashCardController.create);

const flashCardsRouter = Router();
flashCardsRouter.put('/:id', authorize('teacher', 'admin'), validate(updateFlashCardSchema), flashCardController.update);
flashCardsRouter.delete('/:id', authorize('teacher', 'admin'), flashCardController.remove);

export { lessonFlashCardsRouter, flashCardsRouter };
