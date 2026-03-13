import { Request, Response } from 'express';
import { testService } from '../services/test.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const testController = {
  get: asyncHandler(async (req: Request, res: Response) => {
    const test = await testService.findByUnit(req.params['unitId'] as string);
    res.json(test);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const test = await testService.create(req.params['unitId'] as string, req.body);
    res.status(201).json(test);
  }),

  submitAttempt: asyncHandler(async (req: Request, res: Response) => {
    const result = await testService.submitAttempt(req.params['testId'] as string, req.body, req.user!.id);
    res.status(201).json(result);
  }),
};
