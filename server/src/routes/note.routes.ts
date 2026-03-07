import { Router } from 'express';
import { noteController } from '../controllers/note.controller.js';
import { validate } from '../middleware/validate.js';
import { createNoteSchema, updateNoteSchema } from '../schemas/note.schema.js';

// Mounted at /lessons/:lessonId/notes and /notes
const lessonNotesRouter = Router({ mergeParams: true });
lessonNotesRouter.get('/', noteController.getAll);
lessonNotesRouter.post('/', validate(createNoteSchema), noteController.create);

const notesRouter = Router();
notesRouter.put('/:noteId', validate(updateNoteSchema), noteController.update);
notesRouter.delete('/:noteId', noteController.remove);

export { lessonNotesRouter, notesRouter };
