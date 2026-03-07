import { Request, Response } from 'express';
import { noteService } from '../services/note.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const noteController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const notes = await noteService.findAllByLesson(req.params['lessonId'] as string);
    res.json(notes);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const note = await noteService.create(req.params['lessonId'] as string, req.body);
    res.status(201).json(note);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const note = await noteService.update(req.params['noteId'] as string, req.body);
    res.json(note);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await noteService.remove(req.params['noteId'] as string);
    res.status(204).send();
  }),
};
