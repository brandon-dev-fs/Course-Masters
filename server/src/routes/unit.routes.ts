import { Router } from 'express';
import { unitController } from '../controllers/unit.controller.js';
import { validate } from '../middleware/validate.js';
import { createUnitSchema, updateUnitSchema } from '../schemas/unit.schema.js';
import { authorize } from '../middleware/authorize.js';
import { requireCourseOwnership } from '../middleware/authorize-resource.js';

const router = Router({ mergeParams: true });

router.get('/', unitController.getAll);
router.post(
  '/',
  authorize('teacher', 'admin'),
  requireCourseOwnership('course', (req) => req.params['courseId'] as string),
  validate(createUnitSchema),
  unitController.create,
);
router.get('/:unitId', unitController.getOne);
router.put(
  '/:unitId',
  authorize('teacher', 'admin'),
  requireCourseOwnership('unit', (req) => req.params['unitId'] as string),
  validate(updateUnitSchema),
  unitController.update,
);
router.delete(
  '/:unitId',
  authorize('teacher', 'admin'),
  requireCourseOwnership('unit', (req) => req.params['unitId'] as string),
  unitController.remove,
);

export default router;
