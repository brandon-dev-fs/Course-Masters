import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { resourceCompletionService } from '../services/resource-completion.service.js';
import { type ToggleCompletionInput } from '../schemas/resource-completion.schema.js';

export const resourceCompletionController = {
  getCompletions: asyncHandler(async (req: Request, res: Response) => {
    const lessonId = req.params['lessonId'] as string;
    const userId = req.user!.id;
    const data = await resourceCompletionService.getByLesson(lessonId, userId);
    res.json(data);
  }),

  toggleCompletion: asyncHandler(async (req: Request, res: Response) => {
    const lessonId = req.params['lessonId'] as string;
    const userId = req.user!.id;
    const { type, targetId } = req.body as ToggleCompletionInput;
    const data = await resourceCompletionService.toggle(lessonId, userId, type, targetId);
    res.json(data);
  }),
};
