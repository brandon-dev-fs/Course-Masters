import { Router } from 'express';
import { noteController } from '../controllers/note.controller.js';
import { upsertNoteSchema } from '../schemas/note.schema.js';
import { validate } from '../middleware/validate.js';
import { authorize } from '../middleware/authorize.js';

const lessonNotesRouter = Router({ mergeParams: true });
lessonNotesRouter.get('/', noteController.get);
lessonNotesRouter.put('/', authorize('teacher', 'admin'), validate(upsertNoteSchema), noteController.upsert);

export { lessonNotesRouter };
