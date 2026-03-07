import { Router } from 'express';
import { lessonController } from '../controllers/lesson.controller.js';
import { validate } from '../middleware/validate.js';
import { createLessonSchema, updateLessonSchema } from '../schemas/lesson.schema.js';

const router = Router({ mergeParams: true });

router.get('/', lessonController.getAll);
router.post('/', validate(createLessonSchema), lessonController.create);
router.get('/:lessonId', lessonController.getOne);
router.put('/:lessonId', validate(updateLessonSchema), lessonController.update);
router.delete('/:lessonId', lessonController.remove);

export default router;
