import { Request, Response } from 'express';
import { flashCardService } from '../services/flashcard.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const flashCardController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const cards = await flashCardService.findAllByLesson(req.params['lessonId'] as string);
    res.json(cards);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const card = await flashCardService.create(req.params['lessonId'] as string, req.body);
    res.status(201).json(card);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const card = await flashCardService.update(req.params['id'] as string, req.body);
    res.json(card);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await flashCardService.remove(req.params['id'] as string);
    res.status(204).send();
  }),
};
