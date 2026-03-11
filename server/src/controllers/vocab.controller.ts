import { Request, Response } from 'express';
import { vocabService } from '../services/vocab.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const vocabController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const vocabs = await vocabService.findAllByLesson(req.params['lessonId'] as string);
    res.json(vocabs);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const vocab = await vocabService.create(req.params['lessonId'] as string, req.body);
    res.status(201).json(vocab);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const vocab = await vocabService.update(req.params['vocabId'] as string, req.body);
    res.json(vocab);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await vocabService.remove(req.params['vocabId'] as string);
    res.status(204).send();
  }),
};
