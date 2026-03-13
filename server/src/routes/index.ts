import { Router } from 'express';
import courseRouter from './course.routes.js';
import unitRouter from './unit.routes.js';
import lessonRouter from './lesson.routes.js';
import { lessonNotesRouter, notesRouter } from './note.routes.js';
import { lessonFlashCardsRouter, flashCardsRouter } from './flashcard.routes.js';
import { lessonProblemsRouter, problemsRouter } from './practice-problem.routes.js';
import { lessonVocabRouter, vocabRouter } from './vocab.routes.js';
import { lessonStudentNotesRouter, studentNotesRouter } from './student-note.routes.js';
import { lessonQuizRouter, quizzesRouter } from './quiz.routes.js';
import { unitTestRouter, testsRouter } from './test.routes.js';
import { courseExamRouter, examsRouter } from './exam.routes.js';
import { courseProgressRouter, unitProgressRouter } from './progress.routes.js';
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
router.use('/lessons/:lessonId/notes', lessonNotesRouter);
router.use('/lessons/:lessonId/flashcards', lessonFlashCardsRouter);
router.use('/lessons/:lessonId/practice-problems', lessonProblemsRouter);
router.use('/lessons/:lessonId/vocab', lessonVocabRouter);
router.use('/lessons/:lessonId/student-notes', lessonStudentNotesRouter);
router.use('/notes', notesRouter);
router.use('/flashcards', flashCardsRouter);
router.use('/practice-problems', problemsRouter);
router.use('/vocab', vocabRouter);
router.use('/student-notes', studentNotesRouter);

// Assessments
router.use('/lessons/:lessonId/quiz', lessonQuizRouter);
router.use('/units/:unitId/test', unitTestRouter);
router.use('/courses/:courseId/final-exam', courseExamRouter);
router.use('/quizzes', quizzesRouter);
router.use('/tests', testsRouter);
router.use('/exams', examsRouter);

// Progress
router.use('/courses/:courseId/progress', courseProgressRouter);
router.use('/courses/:courseId/units/:unitId/progress', unitProgressRouter);

export default router;
