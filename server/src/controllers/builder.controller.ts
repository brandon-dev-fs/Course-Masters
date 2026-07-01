import { Request, Response } from 'express';

import { builderService } from '../services/builder.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const builderController = {
  getOutline: asyncHandler(async (req: Request, res: Response) => {
    const courseId = req.params['courseId'] as string;
    const outline = await builderService.getOutline(courseId);
    res.json(outline);
  }),

  reorderUnits: asyncHandler(async (req: Request, res: Response) => {
    const courseId = req.params['courseId'] as string;
    await builderService.reorderUnits(courseId, req.body.items);
    res.status(204).send();
  }),

  reorderLessons: asyncHandler(async (req: Request, res: Response) => {
    const unitId = req.params['unitId'] as string;
    await builderService.reorderLessons(unitId, req.body.items);
    res.status(204).send();
  }),
};
