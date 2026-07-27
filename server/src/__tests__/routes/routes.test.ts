/**
 * Route smoke tests.
 *
 * Importing the root router causes every route file to execute its
 * registration code (router.get/post/put/delete calls), covering those
 * statements without needing a running server.
 *
 * All controllers, middleware, and external dependencies are mocked so
 * importing routes never hits real services, Prisma, or auth.
 */
import { describe, it, expect, vi } from 'vitest';

// makeController must be defined via vi.hoisted so it is available inside
// vi.mock factory functions (which are hoisted to the top of the file).
const { makeController } = vi.hoisted(() => {
  const makeController = (methods: string[]) =>
    Object.fromEntries(methods.map((m) => [m, vi.fn()]));
  return { makeController };
});

// ── Controllers ────────────────────────────────────────────────────────────

vi.mock('../../controllers/course.controller.js', () => ({
  courseController: makeController(['getAll', 'getOne', 'create', 'update', 'remove']),
}));
vi.mock('../../controllers/unit.controller.js', () => ({
  unitController: makeController(['getAll', 'getOne', 'create', 'update', 'remove']),
}));
vi.mock('../../controllers/lesson.controller.js', () => ({
  lessonController: makeController(['getAll', 'getOne', 'create', 'update', 'remove']),
}));
vi.mock('../../controllers/lesson-resource.controller.js', () => ({
  lessonResourceController: makeController(['getAll', 'create', 'update', 'remove']),
}));
vi.mock('../../controllers/lesson-tool.controller.js', () => ({
  lessonToolController: makeController(['getAll', 'create', 'update', 'remove']),
}));
vi.mock('../../controllers/student-note.controller.js', () => ({
  studentNoteController: makeController(['get', 'upsert', 'remove']),
}));
vi.mock('../../controllers/assessment.controller.js', () => ({
  createAssessmentController: () => makeController(['get', 'create']),
  assessmentController: makeController(['update', 'bulkUpdateCalculator', 'getAttempts', 'submitAttempt', 'importQuestions']),
}));
vi.mock('../../controllers/completion.controller.js', () => ({
  completionController: makeController(['markLessonComplete', 'removeLessonComplete', 'markUnitComplete', 'removeUnitComplete']),
}));
vi.mock('../../controllers/progress.controller.js', () => ({
  progressController: makeController(['getCourseProgress', 'getUnitProgress']),
}));
vi.mock('../../controllers/resource-completion.controller.js', () => ({
  resourceCompletionController: makeController(['getCompletions', 'toggleCompletion']),
}));
vi.mock('../../controllers/user.controller.js', () => ({
  userController: makeController(['getMe', 'updatePreferences', 'remove']),
}));
vi.mock('../../controllers/assignment.controller.js', () => ({
  assignmentController: makeController([
    'getAll', 'getOne', 'create', 'update', 'remove', 'reorder', 'complete', 'uncomplete',
    'getSavedVocabEntryFlashCards', 'saveVocabEntryFlashCard', 'removeVocabEntryFlashCard',
    'uploadFile', 'downloadFile',
  ]),
}));
vi.mock('../../middleware/upload.js', () => ({
  uploadSingle: vi.fn(),
  ALLOWED_MIME_TYPES: [],
}));
vi.mock('../../controllers/bookmark.controller.js', () => ({
  bookmarkController: makeController(['getOne', 'create', 'upsert', 'remove']),
}));
vi.mock('../../controllers/checklist.controller.js', () => ({
  checklistController: makeController(['getAll', 'create', 'update', 'remove', 'reorder']),
}));
vi.mock('../../controllers/agent-session.controller.js', () => ({
  agentSessionController: makeController(['create', 'list', 'getById', 'abandon', 'sendMessage', 'approvePhase']),
}));

// ── Middleware ─────────────────────────────────────────────────────────────

vi.mock('../../middleware/authenticate.js', () => ({
  authenticate: () => vi.fn(),
}));
vi.mock('../../middleware/authorize.js', () => ({
  authorize: () => vi.fn(),
}));
vi.mock('../../middleware/validate.js', () => ({
  validate: () => vi.fn(),
  validateQuery: () => vi.fn(),
}));
vi.mock('../../middleware/authorize-resource.js', () => ({
  requireCourseOwnership: () => vi.fn(),
  requireStudentRole: () => vi.fn(),
  requireSelf: () => vi.fn(),
  logAuthFailure: vi.fn(),
}));

// ── Auth / Prisma / Logger (pulled in transitively) ────────────────────────

vi.mock('../../lib/prisma.js', () => ({ default: {} }));
vi.mock('../../lib/auth.js', () => ({ auth: { api: { getSession: vi.fn() } } }));
vi.mock('../../lib/logger.js', () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() } }));

// ── Import router after all mocks are registered ──────────────────────────

import router from '../../routes/index.js';

describe('root router', () => {
  it('exports an Express router', () => {
    expect(router).toBeDefined();
    expect(typeof router).toBe('function');
  });

  it('has a stack of registered routes', () => {
    // Express Router instances expose their middleware stack
    const stack = (router as unknown as { stack: unknown[] }).stack;
    expect(Array.isArray(stack)).toBe(true);
    expect(stack.length).toBeGreaterThan(0);
  });
});
