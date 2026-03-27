import { Router } from 'express';
import courseRouter from './course.routes.js';
import unitRouter from './unit.routes.js';
import lessonRouter from './lesson.routes.js';
import { lessonResourcesRouter, resourcesRouter } from './lesson-resource.routes.js';
import { lessonToolsRouter, toolsRouter } from './lesson-tool.routes.js';
import { lessonStudentNotesRouter, studentNotesRouter } from './student-note.routes.js';
import { lessonAssessmentRouter, unitAssessmentRouter, courseAssessmentRouter, assessmentsRouter } from './assessment.routes.js';
import { courseProgressRouter, unitProgressRouter } from './progress.routes.js';
import { lessonCompletionsRouter } from './resource-completion.routes.js';
import youtubeRouter from './youtube.routes.js';
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

// Lesson content
router.use('/lessons/:lessonId/resources', lessonResourcesRouter);
router.use('/lessons/:lessonId/tools', lessonToolsRouter);
router.use('/lessons/:lessonId/student-notes', lessonStudentNotesRouter);
router.use('/lessons/:lessonId/completions', lessonCompletionsRouter);
router.use('/resources', resourcesRouter);
router.use('/tools', toolsRouter);
router.use('/student-notes', studentNotesRouter);

// Assessments
router.use('/lessons/:lessonId/assessment', lessonAssessmentRouter);
router.use('/units/:unitId/assessment', unitAssessmentRouter);
router.use('/courses/:courseId/assessment', courseAssessmentRouter);
router.use('/assessments', assessmentsRouter);

// Utilities
router.use('/youtube', youtubeRouter);

// Progress
router.use('/courses/:courseId/progress', courseProgressRouter);
router.use('/courses/:courseId/units/:unitId/progress', unitProgressRouter);

export default router;
