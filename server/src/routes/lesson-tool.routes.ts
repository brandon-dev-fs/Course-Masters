import { Router } from 'express';
import { lessonToolController } from '../controllers/lesson-tool.controller.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { authorize } from '../middleware/authorize.js';
import { createLessonToolSchema, updateLessonToolSchema, lessonToolQuerySchema } from '../schemas/lesson-tool.schema.js';
import { requireCourseOwnership } from '../middleware/authorize-resource.js';

export const lessonToolsRouter = Router({ mergeParams: true });
lessonToolsRouter.get('/', validateQuery(lessonToolQuerySchema), lessonToolController.getAll);
lessonToolsRouter.get('/vocab-flashcards', lessonToolController.getSavedVocabFlashCards);
lessonToolsRouter.post(
  '/',
  authorize('teacher', 'admin'),
  requireCourseOwnership('lesson', (req) => req.params['lessonId'] as string),
  validate(createLessonToolSchema),
  lessonToolController.create,
);

export const toolsRouter = Router();
toolsRouter.put(
  '/:toolId',
  authorize('teacher', 'admin'),
  requireCourseOwnership('tool', (req) => req.params['toolId'] as string),
  validate(updateLessonToolSchema),
  lessonToolController.update,
);
toolsRouter.delete(
  '/:toolId',
  authorize('teacher', 'admin'),
  requireCourseOwnership('tool', (req) => req.params['toolId'] as string),
  lessonToolController.remove,
);
toolsRouter.post('/:toolId/vocab-flashcard', lessonToolController.saveVocabFlashCard);
toolsRouter.delete('/:toolId/vocab-flashcard', lessonToolController.removeVocabFlashCard);
