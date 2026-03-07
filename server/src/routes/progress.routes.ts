import { Router } from 'express';
import { progressController } from '../controllers/progress.controller.js';

const courseProgressRouter = Router({ mergeParams: true });
courseProgressRouter.get('/', progressController.getCourseProgress);

const unitProgressRouter = Router({ mergeParams: true });
unitProgressRouter.get('/', progressController.getUnitProgress);

export { courseProgressRouter, unitProgressRouter };
