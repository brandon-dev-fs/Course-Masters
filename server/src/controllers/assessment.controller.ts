import { Request, Response } from 'express';
import { AssessmentType } from '@prisma/client';
import { assessmentService } from '../services/assessment.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export function createAssessmentController(type: AssessmentType, parentParam: string) {
  return {
    get: asyncHandler(async (req: Request, res: Response) => {
      const parentId = req.params[parentParam] as string;
      res.json(await assessmentService.findByParent(type, parentId, req.user!.id));
    }),

    create: asyncHandler(async (req: Request, res: Response) => {
      const parentId = req.params[parentParam] as string;
      res.status(201).json(await assessmentService.create(type, parentId, req.body));
    }),
  };
}

export const assessmentController = {
  update: asyncHandler(async (req: Request, res: Response) => {
    res.json(
      await assessmentService.update(
        req.params['assessmentId'] as string,
        req.body,
        req.user!.id,
        req.user!.role,
      ),
    );
  }),

  submitAttempt: asyncHandler(async (req: Request, res: Response) => {
    const result = await assessmentService.submitAttempt(
      req.params['assessmentId'] as string,
      req.body,
      req.user!.id,
    );
    res.status(201).json(result);
  }),

  getAttempts: asyncHandler(async (req: Request, res: Response) => {
    res.json(await assessmentService.getAttempts(req.params['assessmentId'] as string, req.user!.id));
  }),
};
