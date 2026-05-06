import { Request, Response } from 'express';
import { studentNoteService } from '../services/student-note.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const studentNoteController = {
  get: asyncHandler(async (req: Request, res: Response) => {
    // Role is passed so the service can scope results to the requesting student
    // or return all notes for teachers/admins (FR-07).
    const notes = await studentNoteService.findByLesson(
      req.params['lessonId'] as string,
      req.user!.id,
      req.user!.role,
    );
    res.json(notes);
  }),

  upsert: asyncHandler(async (req: Request, res: Response) => {
    const note = await studentNoteService.upsert(req.params['lessonId'] as string, req.body, req.user!.id);
    res.json(note);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    // Pass role so the service can apply admin bypass (FR-09, FR-15).
    await studentNoteService.remove(
      req.params['studentNoteId'] as string,
      req.user!.id,
      req.user!.role,
    );
    res.status(204).send();
  }),
};
