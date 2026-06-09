import { Router } from 'express';
import { checklistController } from '../controllers/checklist.controller.js';
import { validate } from '../middleware/validate.js';
import {
  createChecklistItemSchema,
  updateChecklistItemSchema,
  reorderChecklistSchema,
} from '../schemas/checklist.schema.js';

// Lesson-scoped router — inherits :lessonId via mergeParams: true
export const lessonChecklistRouter = Router({ mergeParams: true });

lessonChecklistRouter.get('/', checklistController.getAll);
lessonChecklistRouter.post('/', validate(createChecklistItemSchema), checklistController.create);
// reorder must be registered before /:itemId to avoid route conflict
lessonChecklistRouter.put('/reorder', validate(reorderChecklistSchema), checklistController.reorder);

// Flat item-level router
export const checklistItemsRouter = Router();

checklistItemsRouter.put('/:itemId', validate(updateChecklistItemSchema), checklistController.update);
checklistItemsRouter.delete('/:itemId', checklistController.remove);
