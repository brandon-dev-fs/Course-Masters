import { Router } from 'express';
import { lessonController } from '../controllers/lesson.controller.js';
import { validate } from '../middleware/validate.js';
import { createLessonSchema, updateLessonSchema } from '../schemas/lesson.schema.js';
import { authorize } from '../middleware/authorize.js';
import { requireCourseOwnership } from '../middleware/authorize-resource.js';

const router = Router({ mergeParams: true });

router.get('/', lessonController.getAll);
router.post(
  '/',
  authorize('teacher', 'admin'),
  requireCourseOwnership('unit', (req) => req.params['unitId'] as string),
  validate(createLessonSchema),
  lessonController.create,
);
router.get('/:lessonId', lessonController.getOne);
router.put(
  '/:lessonId',
  authorize('teacher', 'admin'),
  requireCourseOwnership('lesson', (req) => req.params['lessonId'] as string),
  validate(updateLessonSchema),
  lessonController.update,
);
router.delete(
  '/:lessonId',
  authorize('teacher', 'admin'),
  requireCourseOwnership('lesson', (req) => req.params['lessonId'] as string),
  lessonController.remove,
);

export default router;
