import { Request, Response } from 'express';
import { quizService } from '../services/quiz.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const quizController = {
  get: asyncHandler(async (req: Request, res: Response) => {
    const quiz = await quizService.findByLesson(req.params['lessonId'] as string);
    res.json(quiz);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const quiz = await quizService.create(req.params['lessonId'] as string, req.body);
    res.status(201).json(quiz);
  }),

  submitAttempt: asyncHandler(async (req: Request, res: Response) => {
    const result = await quizService.submitAttempt(req.params['quizId'] as string, req.body);
    res.status(201).json(result);
  }),
};
