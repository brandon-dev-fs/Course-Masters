import { Router } from 'express';
import { ZodSchema } from 'zod';
import { validate } from '../../middleware/validate.js';
import { authorize } from '../../middleware/authorize.js';

interface ContentController {
  getAll: any;
  create: any;
  update: any;
  remove: any;
}

export function createLessonContentRoutes(
  controller: ContentController,
  createSchema: ZodSchema,
  updateSchema: ZodSchema,
  idParam: string,
) {
  const lessonRouter = Router({ mergeParams: true });
  lessonRouter.get('/', controller.getAll);
  lessonRouter.post('/', authorize('teacher', 'admin'), validate(createSchema), controller.create);

  const standaloneRouter = Router();
  standaloneRouter.put(`/:${idParam}`, authorize('teacher', 'admin'), validate(updateSchema), controller.update);
  standaloneRouter.delete(`/:${idParam}`, authorize('teacher', 'admin'), controller.remove);

  return { lessonRouter, standaloneRouter };
}
