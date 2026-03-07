import { Router } from 'express';
import { courseController } from '../controllers/course.controller.js';
import { validate } from '../middleware/validate.js';
import { createCourseSchema, updateCourseSchema } from '../schemas/course.schema.js';

const router = Router();

router.get('/', courseController.getAll);
router.post('/', validate(createCourseSchema), courseController.create);
router.get('/:courseId', courseController.getOne);
router.put('/:courseId', validate(updateCourseSchema), courseController.update);
router.delete('/:courseId', courseController.remove);

export default router;
