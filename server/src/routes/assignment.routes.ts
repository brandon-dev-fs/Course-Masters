import { Router } from 'express';
import { assignmentController } from '../controllers/assignment.controller.js';
import { validate } from '../middleware/validate.js';
import { authorize } from '../middleware/authorize.js';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  reorderAssignmentsSchema,
} from '../schemas/assignment.schema.js';

// ── /lessons/:lessonId/assignments ───────────────────────────────────────────

export const lessonAssignmentsRouter = Router({ mergeParams: true });

lessonAssignmentsRouter.get('/', assignmentController.getAll);

// vocab flashcards must be registered before /:assignmentId to avoid conflict
lessonAssignmentsRouter.get('/vocab-flashcards', assignmentController.getSavedVocabEntryFlashCards);

// reorder must be registered before /:assignmentId to avoid conflict
lessonAssignmentsRouter.put(
  '/reorder',
  authorize('teacher', 'admin'),
  validate(reorderAssignmentsSchema),
  assignmentController.reorder,
);

lessonAssignmentsRouter.post(
  '/',
  authorize('teacher', 'admin'),
  validate(createAssignmentSchema),
  assignmentController.create,
);

// ── /assignments ─────────────────────────────────────────────────────────────

export const assignmentsRouter = Router();

assignmentsRouter.get('/:assignmentId', assignmentController.getOne);

assignmentsRouter.put(
  '/:assignmentId',
  authorize('teacher', 'admin'),
  validate(updateAssignmentSchema),
  assignmentController.update,
);

assignmentsRouter.delete(
  '/:assignmentId',
  authorize('teacher', 'admin'),
  assignmentController.remove,
);

assignmentsRouter.post('/:assignmentId/complete', assignmentController.complete);

assignmentsRouter.delete('/:assignmentId/complete', assignmentController.uncomplete);

// ── /vocab-entries ────────────────────────────────────────────────────────────

export const vocabEntriesRouter = Router();

vocabEntriesRouter.post('/:entryId/flashcard', assignmentController.saveVocabEntryFlashCard);

vocabEntriesRouter.delete('/:entryId/flashcard', assignmentController.removeVocabEntryFlashCard);
