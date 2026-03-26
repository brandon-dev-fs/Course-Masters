import { Request, Response } from 'express';
import { examService } from '../services/exam.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const examController = {
  get: asyncHandler(async (req: Request, res: Response) => {
    const exam = await examService.findByCourse(req.params['courseId'] as string, req.user!.id);
    res.json(exam);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const exam = await examService.create(req.params['courseId'] as string, req.body);
    res.status(201).json(exam);
  }),

  getForEdit: asyncHandler(async (req: Request, res: Response) => {
    const exam = await examService.findForEdit(req.params['courseId'] as string);
    res.json(exam);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const exam = await examService.update(req.params['courseId'] as string, req.body);
    res.json(exam);
  }),

  submitAttempt: asyncHandler(async (req: Request, res: Response) => {
    const result = await examService.submitAttempt(req.params['examId'] as string, req.body, req.user!.id);
    res.status(201).json(result);
  }),
};
