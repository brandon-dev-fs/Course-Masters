import { Request, Response } from 'express';
import { AssessmentType } from '@prisma/client';
import { assessmentService } from '../services/assessment.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { attemptsQuerySchema } from '../schemas/assessment.schema.js';
import { ValidationError } from '../errors/index.js';

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
    res.json(await assessmentService.update(req.params['assessmentId'] as string, req.body));
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
    const parsed = attemptsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ValidationError('Invalid pagination parameters', parsed.error.flatten().fieldErrors);
    }
    const { page, pageSize } = parsed.data;
    res.json(
      await assessmentService.getAttempts(
        req.params['assessmentId'] as string,
        req.user!.id,
        page,
        pageSize,
      ),
    );
  }),

  bulkUpdateCalculator: asyncHandler(async (req: Request, res: Response) => {
    const assessmentId = req.params['assessmentId'] as string;
    res.json(await assessmentService.bulkUpdateCalculator(assessmentId, req.body));
  }),
};
