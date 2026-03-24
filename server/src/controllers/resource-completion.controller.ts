import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { resourceCompletionService } from '../services/resource-completion.service.js';

export const resourceCompletionController = {
  getCompletions: asyncHandler(async (req: Request, res: Response) => {
    const lessonId = req.params['lessonId'] as string;
    const userId = req.user!.id;
    const completions = await resourceCompletionService.getByLesson(lessonId, userId);
    res.json({ completions });
  }),

  toggleCompletion: asyncHandler(async (req: Request, res: Response) => {
    const lessonId = req.params['lessonId'] as string;
    const userId = req.user!.id;
    const { resourceType, resourceId } = req.body;
    const completions = await resourceCompletionService.toggle(lessonId, userId, resourceType, resourceId);
    res.json({ completions });
  }),
};
