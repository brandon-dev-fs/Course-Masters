import { noteController } from '../controllers/note.controller.js';
import { createNoteSchema, updateNoteSchema } from '../schemas/note.schema.js';
import { createLessonContentRoutes } from './factories/createLessonContentRoutes.js';

const { lessonRouter: lessonNotesRouter, standaloneRouter: notesRouter } =
  createLessonContentRoutes(noteController, createNoteSchema, updateNoteSchema, 'noteId');

export { lessonNotesRouter, notesRouter };
