import { Request, Response } from 'express';
import { checklistService } from '../services/checklist.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const checklistController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const lessonId = req.params['lessonId'] as string;
    const result = await checklistService.findAllByLesson(lessonId, req.user!.id);
    res.json(result);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const lessonId = req.params['lessonId'] as string;
    const result = await checklistService.create(lessonId, req.user!.id, req.body);
    res.status(201).json(result);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const itemId = req.params['itemId'] as string;
    const result = await checklistService.update(itemId, req.user!.id, req.body);
    res.json(result);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const itemId = req.params['itemId'] as string;
    await checklistService.remove(itemId, req.user!.id);
    res.status(204).send();
  }),

  reorder: asyncHandler(async (req: Request, res: Response) => {
    const lessonId = req.params['lessonId'] as string;
    const result = await checklistService.reorder(lessonId, req.user!.id, req.body.itemIds);
    res.json(result);
  }),
};
