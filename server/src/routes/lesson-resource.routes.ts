import { Router } from 'express';
import { lessonResourceController } from '../controllers/lesson-resource.controller.js';
import { validate } from '../middleware/validate.js';
import { authorize } from '../middleware/authorize.js';
import { createLessonResourceSchema, updateLessonResourceSchema } from '../schemas/lesson-resource.schema.js';
import { requireCourseOwnership } from '../middleware/authorize-resource.js';

export const lessonResourcesRouter = Router({ mergeParams: true });
lessonResourcesRouter.get('/', lessonResourceController.getAll);
lessonResourcesRouter.post(
  '/',
  authorize('teacher', 'admin'),
  requireCourseOwnership('lesson', (req) => req.params['lessonId'] as string),
  validate(createLessonResourceSchema),
  lessonResourceController.create,
);

export const resourcesRouter = Router();
resourcesRouter.put(
  '/:resourceId',
  authorize('teacher', 'admin'),
  requireCourseOwnership('resource', (req) => req.params['resourceId'] as string),
  validate(updateLessonResourceSchema),
  lessonResourceController.update,
);
resourcesRouter.delete(
  '/:resourceId',
  authorize('teacher', 'admin'),
  requireCourseOwnership('resource', (req) => req.params['resourceId'] as string),
  lessonResourceController.remove,
);
