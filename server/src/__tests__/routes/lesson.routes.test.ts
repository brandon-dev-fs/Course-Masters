/**
 * Smoke tests for lesson.routes.ts.
 *
 * Importing the router executes all route registration statements, covering
 * those branches without needing a running server.
 */
import { describe, it, expect, vi } from 'vitest';

const { makeController } = vi.hoisted(() => {
  const makeController = (methods: string[]) =>
    Object.fromEntries(methods.map((m) => [m, vi.fn()]));
  return { makeController };
});

vi.mock('../../controllers/lesson.controller.js', () => ({
  lessonController: makeController(['getAll', 'getOne', 'create', 'update', 'remove']),
}));
vi.mock('../../controllers/builder.controller.js', () => ({
  builderController: makeController(['reorderLessons', 'reorderUnits', 'getOutline']),
}));
vi.mock('../../middleware/validate.js', () => ({
  validate: () => vi.fn(),
}));
vi.mock('../../middleware/authorize.js', () => ({
  authorize: () => vi.fn(),
}));
vi.mock('../../middleware/authorize-resource.js', () => ({
  requireCourseOwnership: () => vi.fn(),
}));
vi.mock('../../lib/prisma.js', () => ({ default: {} }));
vi.mock('../../lib/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import lessonRouter from '../../routes/lesson.routes.js';

describe('lessonRouter', () => {
  it('exports an Express router', () => {
    expect(lessonRouter).toBeDefined();
    expect(typeof lessonRouter).toBe('function');
  });

  it('has a non-empty route stack', () => {
    const stack = (lessonRouter as unknown as { stack: unknown[] }).stack;
    expect(Array.isArray(stack)).toBe(true);
    expect(stack.length).toBeGreaterThan(0);
  });

  it('registers GET / for listing lessons', () => {
    const stack = (lessonRouter as unknown as { stack: Array<{ route?: { path: string; methods: Record<string, boolean> } }> }).stack;
    const getAll = stack.find((l) => l.route?.path === '/' && l.route.methods['get']);
    expect(getAll).toBeDefined();
  });

  it('registers POST / for creating a lesson', () => {
    const stack = (lessonRouter as unknown as { stack: Array<{ route?: { path: string; methods: Record<string, boolean> } }> }).stack;
    const post = stack.find((l) => l.route?.path === '/' && l.route.methods['post']);
    expect(post).toBeDefined();
  });

  it('registers GET /:lessonId for retrieving one lesson', () => {
    const stack = (lessonRouter as unknown as { stack: Array<{ route?: { path: string; methods: Record<string, boolean> } }> }).stack;
    const getOne = stack.find((l) => l.route?.path === '/:lessonId' && l.route.methods['get']);
    expect(getOne).toBeDefined();
  });

  it('registers PUT /:lessonId for updating a lesson', () => {
    const stack = (lessonRouter as unknown as { stack: Array<{ route?: { path: string; methods: Record<string, boolean> } }> }).stack;
    const put = stack.find((l) => l.route?.path === '/:lessonId' && l.route.methods['put']);
    expect(put).toBeDefined();
  });

  it('registers DELETE /:lessonId for removing a lesson', () => {
    const stack = (lessonRouter as unknown as { stack: Array<{ route?: { path: string; methods: Record<string, boolean> } }> }).stack;
    const del = stack.find((l) => l.route?.path === '/:lessonId' && l.route.methods['delete']);
    expect(del).toBeDefined();
  });

  it('registers PUT /reorder for reordering lessons', () => {
    const stack = (lessonRouter as unknown as { stack: Array<{ route?: { path: string; methods: Record<string, boolean> } }> }).stack;
    const reorder = stack.find((l) => l.route?.path === '/reorder' && l.route.methods['put']);
    expect(reorder).toBeDefined();
  });
});
