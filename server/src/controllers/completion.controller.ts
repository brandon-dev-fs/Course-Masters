import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { completionService } from '../services/completion.service.js';

export const completionController = {
  markLessonComplete: asyncHandler(async (req: Request, res: Response) => {
    const lessonId = req.params['lessonId'] as string;
    // userId always comes from the authenticated session — no body field for override.
    const userId = req.user!.id;
    const data = await completionService.markLessonComplete(lessonId, userId);
    res.status(201).json(data);
  }),

  removeLessonComplete: asyncHandler(async (req: Request, res: Response) => {
    const lessonId = req.params['lessonId'] as string;
    const userId = req.user!.id;
    await completionService.removeLessonComplete(lessonId, userId);
    res.status(204).send();
  }),

  markUnitComplete: asyncHandler(async (req: Request, res: Response) => {
    const unitId = req.params['unitId'] as string;
    const userId = req.user!.id;
    const data = await completionService.markUnitComplete(unitId, userId);
    res.status(201).json(data);
  }),

  removeUnitComplete: asyncHandler(async (req: Request, res: Response) => {
    const unitId = req.params['unitId'] as string;
    const userId = req.user!.id;
    await completionService.removeUnitComplete(unitId, userId);
    res.status(204).send();
  }),
};
