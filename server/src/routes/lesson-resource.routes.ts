import { Router } from 'express';
import { lessonResourceController } from '../controllers/lesson-resource.controller.js';
import { validate } from '../middleware/validate.js';
import { authorize } from '../middleware/authorize.js';
import { createLessonResourceSchema, updateLessonResourceSchema } from '../schemas/lesson-resource.schema.js';

export const lessonResourcesRouter = Router({ mergeParams: true });
lessonResourcesRouter.get('/', lessonResourceController.getAll);
lessonResourcesRouter.post('/', authorize('teacher', 'admin'), validate(createLessonResourceSchema), lessonResourceController.create);

export const resourcesRouter = Router();
resourcesRouter.put('/:resourceId', authorize('teacher', 'admin'), validate(updateLessonResourceSchema), lessonResourceController.update);
resourcesRouter.delete('/:resourceId', authorize('teacher', 'admin'), lessonResourceController.remove);
