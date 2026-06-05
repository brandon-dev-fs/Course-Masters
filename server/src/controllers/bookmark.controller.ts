import { Request, Response } from 'express';
import { bookmarkService } from '../services/bookmark.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const bookmarkController = {
  getOne: asyncHandler(async (req: Request, res: Response) => {
    const assignmentId = req.params['assignmentId'] as string;
    const result = await bookmarkService.getByAssignment(assignmentId, req.user!.id);
    res.json(result);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const assignmentId = req.params['assignmentId'] as string;
    const result = await bookmarkService.create(assignmentId, req.user!.id, req.body);
    res.status(201).json(result);
  }),

  upsert: asyncHandler(async (req: Request, res: Response) => {
    const assignmentId = req.params['assignmentId'] as string;
    const result = await bookmarkService.upsert(assignmentId, req.user!.id, req.body);
    res.json(result);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const assignmentId = req.params['assignmentId'] as string;
    await bookmarkService.remove(assignmentId, req.user!.id);
    res.status(204).send();
  }),
};
