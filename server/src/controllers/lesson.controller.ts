import { Request, Response } from 'express';
import { lessonService } from '../services/lesson.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const lessonController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const lessons = await lessonService.findAllByUnit(req.params['unitId'] as string);
    res.json(lessons);
  }),

  getOne: asyncHandler(async (req: Request, res: Response) => {
    const lesson = await lessonService.findById(req.params['lessonId'] as string);
    res.json(lesson);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const lesson = await lessonService.create(req.params['unitId'] as string, req.body);
    res.status(201).json(lesson);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const lesson = await lessonService.update(req.params['lessonId'] as string, req.body);
    res.json(lesson);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await lessonService.remove(req.params['lessonId'] as string);
    res.status(204).send();
  }),
};
