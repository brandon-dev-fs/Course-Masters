import { Request, Response } from 'express';
import { studentNoteService } from '../services/student-note.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const studentNoteController = {
  get: asyncHandler(async (req: Request, res: Response) => {
    const note = await studentNoteService.findByLesson(req.params['lessonId'] as string);
    res.json(note);
  }),

  upsert: asyncHandler(async (req: Request, res: Response) => {
    const note = await studentNoteService.upsert(req.params['lessonId'] as string, req.body);
    res.json(note);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await studentNoteService.remove(req.params['studentNoteId'] as string);
    res.status(204).send();
  }),
};
