import { Request, Response } from 'express';
import { practiceProblemService } from '../services/practice-problem.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const practiceProblemController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const problems = await practiceProblemService.findAllByLesson(req.params['lessonId'] as string);
    res.json(problems);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const problem = await practiceProblemService.create(req.params['lessonId'] as string, req.body);
    res.status(201).json(problem);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const problem = await practiceProblemService.update(req.params['id'] as string, req.body);
    res.json(problem);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await practiceProblemService.remove(req.params['id'] as string);
    res.status(204).send();
  }),
};
