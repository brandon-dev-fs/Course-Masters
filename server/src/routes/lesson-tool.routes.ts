import { Router } from 'express';
import { lessonToolController } from '../controllers/lesson-tool.controller.js';
import { validate } from '../middleware/validate.js';
import { authorize } from '../middleware/authorize.js';
import { createLessonToolSchema, updateLessonToolSchema } from '../schemas/lesson-tool.schema.js';

export const lessonToolsRouter = Router({ mergeParams: true });
lessonToolsRouter.get('/', lessonToolController.getAll);
lessonToolsRouter.post('/', authorize('teacher', 'admin'), validate(createLessonToolSchema), lessonToolController.create);

export const toolsRouter = Router();
toolsRouter.put('/:toolId', authorize('teacher', 'admin'), validate(updateLessonToolSchema), lessonToolController.update);
toolsRouter.delete('/:toolId', authorize('teacher', 'admin'), lessonToolController.remove);
