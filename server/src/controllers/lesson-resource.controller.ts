import { Request, Response } from 'express';
import { ResourceType } from '@prisma/client';
import { LessonResourceQuery } from '../schemas/lesson-resource.schema.js';
import { lessonResourceService } from '../services/lesson-resource.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const lessonResourceController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const lessonId = req.params['lessonId'] as string;
    const { type } = res.locals['validatedQuery'] as LessonResourceQuery;
    res.json(await lessonResourceService.findAllByLesson(lessonId, type));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await lessonResourceService.create(req.params['lessonId'] as string, req.body));
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    res.json(await lessonResourceService.update(req.params['resourceId'] as string, req.body));
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await lessonResourceService.remove(req.params['resourceId'] as string);
    res.status(204).send();
  }),
};
