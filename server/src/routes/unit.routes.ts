import { Router } from 'express';

import { unitController } from '../controllers/unit.controller.js';
import { builderController } from '../controllers/builder.controller.js';
import { validate } from '../middleware/validate.js';
import { createUnitSchema, updateUnitSchema } from '../schemas/unit.schema.js';
import { reorderItemsSchema } from '../schemas/builder.schema.js';
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

// Must be registered before /:unitId to avoid conflict
router.put(
  '/reorder',
  authorize('teacher', 'admin'),
  requireCourseOwnership('course', (req) => req.params['courseId'] as string),
  validate(reorderItemsSchema),
  builderController.reorderUnits,
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
