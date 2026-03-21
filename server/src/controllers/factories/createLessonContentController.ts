import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';

interface LessonContentService {
  findAllByLesson(lessonId: string): Promise<any>;
  create(lessonId: string, data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  remove(id: string): Promise<void>;
}

export function createLessonContentController(service: LessonContentService, idParam: string) {
  return {
    getAll: asyncHandler(async (req: Request, res: Response) => {
      res.json(await service.findAllByLesson(req.params['lessonId'] as string));
    }),

    create: asyncHandler(async (req: Request, res: Response) => {
      res.status(201).json(await service.create(req.params['lessonId'] as string, req.body));
    }),

    update: asyncHandler(async (req: Request, res: Response) => {
      res.json(await service.update(req.params[idParam] as string, req.body));
    }),

    remove: asyncHandler(async (req: Request, res: Response) => {
      await service.remove(req.params[idParam] as string);
      res.status(204).send();
    }),
  };
}
