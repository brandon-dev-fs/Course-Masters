import { Router } from 'express';

import courseRouter from './course.routes.js';
import unitRouter from './unit.routes.js';
import lessonRouter from './lesson.routes.js';
import builderRouter from './builder.routes.js';
import { lessonStudentNotesRouter, studentNotesRouter } from './student-note.routes.js';
import { lessonAssessmentRouter, unitAssessmentRouter, courseAssessmentRouter, assessmentsRouter } from './assessment.routes.js';
import { courseProgressRouter, unitProgressRouter } from './progress.routes.js';
import { lessonCompletionsRouter } from './resource-completion.routes.js';
import { lessonCompleteRouter, unitCompleteRouter } from './completion.routes.js';
import youtubeRouter from './youtube.routes.js';
import linkRouter from './link.routes.js';
import { lessonAssignmentsRouter, assignmentsRouter, vocabEntriesRouter } from './assignment.routes.js';
import { lessonChecklistRouter, checklistItemsRouter } from './checklist.routes.js';
import userRouter from './user.routes.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// All routes below require a valid session
router.use(authenticate());

// Core CRUD
router.use('/courses', courseRouter);
router.use('/courses/:courseId/units', unitRouter);
router.use('/units/:unitId/lessons', lessonRouter);

// Builder
router.use('/courses/:courseId/builder', builderRouter);

// Lesson content
router.use('/lessons/:lessonId/student-notes', lessonStudentNotesRouter);
router.use('/lessons/:lessonId/completions', lessonCompletionsRouter);
router.use('/lessons/:lessonId/complete', lessonCompleteRouter);
router.use('/units/:unitId/complete', unitCompleteRouter);
router.use('/student-notes', studentNotesRouter);

// Assessments
router.use('/lessons/:lessonId/assessment', lessonAssessmentRouter);
router.use('/units/:unitId/assessment', unitAssessmentRouter);
router.use('/courses/:courseId/assessment', courseAssessmentRouter);
router.use('/assessments', assessmentsRouter);

// Assignments
router.use('/lessons/:lessonId/assignments', lessonAssignmentsRouter);
router.use('/assignments', assignmentsRouter);
router.use('/vocab-entries', vocabEntriesRouter);

// Checklist
router.use('/lessons/:lessonId/checklist', lessonChecklistRouter);
router.use('/checklist-items', checklistItemsRouter);

// Users (admin-only soft-delete)
router.use('/users', userRouter);

// Utilities
router.use('/youtube', youtubeRouter);
router.use('/link', linkRouter);

// Progress
router.use('/courses/:courseId/progress', courseProgressRouter);
router.use('/courses/:courseId/units/:unitId/progress', unitProgressRouter);

export default router;
