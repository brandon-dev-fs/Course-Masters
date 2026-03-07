import { Request, Response } from 'express';
import { progressService } from '../services/progress.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const progressController = {
  getCourseProgress: asyncHandler(async (req: Request, res: Response) => {
    const progress = await progressService.getCourseProgress(req.params['courseId'] as string);
    res.json(progress);
  }),

  getUnitProgress: asyncHandler(async (req: Request, res: Response) => {
    const progress = await progressService.getUnitProgress(req.params['unitId'] as string);
    res.json(progress);
  }),
};
