import { Router } from 'express';
import { assignmentController } from '../controllers/assignment.controller.js';
import { validate } from '../middleware/validate.js';
import { authorize } from '../middleware/authorize.js';
import { requireCourseOwnership } from '../middleware/authorize-resource.js';
import { uploadSingle } from '../middleware/upload.js';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  reorderAssignmentsSchema,
} from '../schemas/assignment.schema.js';
import { bookmarkRouter } from './bookmark.routes.js';

// ── /lessons/:lessonId/assignments ───────────────────────────────────────────

export const lessonAssignmentsRouter = Router({ mergeParams: true });

lessonAssignmentsRouter.get('/', assignmentController.getAll);

// vocab flashcards must be registered before /:assignmentId to avoid conflict
lessonAssignmentsRouter.get('/vocab-flashcards', assignmentController.getSavedVocabEntryFlashCards);

// file upload must be registered before /:assignmentId to avoid conflict
lessonAssignmentsRouter.post(
  '/upload',
  authorize('teacher', 'admin'),
  requireCourseOwnership('lesson', req => req.params['lessonId'] as string),
  uploadSingle,
  assignmentController.uploadFile,
);

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

assignmentsRouter.get(
  '/:assignmentId/file',
  requireCourseOwnership('assignment', req => req.params['assignmentId'] as string),
  assignmentController.downloadFile,
);

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

// Bookmark sub-router — must be registered before /:assignmentId catch-all routes
assignmentsRouter.use('/:assignmentId/bookmark', bookmarkRouter);

// ── /vocab-entries ────────────────────────────────────────────────────────────

export const vocabEntriesRouter = Router();

vocabEntriesRouter.post('/:entryId/flashcard', assignmentController.saveVocabEntryFlashCard);

vocabEntriesRouter.delete('/:entryId/flashcard', assignmentController.removeVocabEntryFlashCard);
