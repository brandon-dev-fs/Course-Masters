import { Request, Response } from 'express';
import { unitService } from '../services/unit.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const unitController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const units = await unitService.findAllByCourse(req.params['courseId'] as string);
    res.json(units);
  }),

  getOne: asyncHandler(async (req: Request, res: Response) => {
    const unit = await unitService.findById(req.params['unitId'] as string);
    res.json(unit);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const unit = await unitService.create(req.params['courseId'] as string, req.body);
    res.status(201).json(unit);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const unit = await unitService.update(req.params['unitId'] as string, req.body);
    res.json(unit);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await unitService.remove(req.params['unitId'] as string);
    res.status(204).send();
  }),
};
