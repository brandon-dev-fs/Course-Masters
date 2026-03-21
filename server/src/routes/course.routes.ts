import { Router } from 'express';
import { courseController } from '../controllers/course.controller.js';
import { validate } from '../middleware/validate.js';
import { createCourseSchema, updateCourseSchema } from '../schemas/course.schema.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

router.get('/', courseController.getAll);
router.post('/', authorize('teacher', 'admin'), validate(createCourseSchema), courseController.create);
router.get('/:courseId', courseController.getOne);
router.put('/:courseId', authorize('teacher', 'admin'), validate(updateCourseSchema), courseController.update);
router.delete('/:courseId', authorize('teacher', 'admin'), courseController.remove);

export default router;
