import { Request, Response } from 'express';
import { LessonToolQuery } from '../schemas/lesson-tool.schema.js';
import { lessonToolService } from '../services/lesson-tool.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const lessonToolController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const lessonId = req.params['lessonId'] as string;
    const { type } = res.locals['validatedQuery'] as LessonToolQuery;
    res.json(await lessonToolService.findAllByLesson(lessonId, type));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await lessonToolService.create(req.params['lessonId'] as string, req.body));
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    res.json(await lessonToolService.update(req.params['toolId'] as string, req.body));
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await lessonToolService.remove(req.params['toolId'] as string);
    res.status(204).send();
  }),
};
