import { Router } from 'express';
import { studentNoteController } from '../controllers/student-note.controller.js';
import { validate } from '../middleware/validate.js';
import { upsertStudentNoteSchema } from '../schemas/student-note.schema.js';

// Mounted at /lessons/:lessonId/student-notes and /student-notes
const lessonStudentNotesRouter = Router({ mergeParams: true });
lessonStudentNotesRouter.get('/', studentNoteController.get);
lessonStudentNotesRouter.post('/', validate(upsertStudentNoteSchema), studentNoteController.upsert);

const studentNotesRouter = Router();
studentNotesRouter.delete('/:studentNoteId', studentNoteController.remove);

export { lessonStudentNotesRouter, studentNotesRouter };
