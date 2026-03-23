import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { noteService } from '../services/note.service.js';

export const noteController = {
  get: asyncHandler(async (req: Request, res: Response) => {
    const note = await noteService.findByLesson(req.params['lessonId'] as string);
    res.json(note);
  }),

  upsert: asyncHandler(async (req: Request, res: Response) => {
    const note = await noteService.upsert(req.params['lessonId'] as string, req.body.content);
    res.json(note);
  }),
};
