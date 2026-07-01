import { Router } from 'express';

import { builderController } from '../controllers/builder.controller.js';
import { authorize } from '../middleware/authorize.js';
import { requireCourseOwnership } from '../middleware/authorize-resource.js';

const router = Router({ mergeParams: true });

router.get(
  '/outline',
  authorize('teacher', 'admin'),
  requireCourseOwnership('course', (req) => req.params['courseId'] as string),
  builderController.getOutline,
);

export default router;
