import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../../mocks/prisma.js';

vi.mock('../../../lib/prisma.js', () => ({ default: prismaMock }));
vi.mock('../../../lib/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

// Let tool() act as an identity so we can call execute() directly in tests.
vi.mock('ai', () => ({
  tool: vi.fn().mockImplementation((config) => config),
}));

import { makeCheckSourceCoverageTool } from '../../../agent/tools/checkSourceCoverage.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeSource(overrides: {
  id?: string;
  name?: string;
  domain?: string;
  categories?: unknown;
  contentTypes?: unknown;
}) {
  return {
    id: overrides.id ?? 'src-1',
    name: overrides.name ?? 'Khan Academy',
    domain: overrides.domain ?? 'khanacademy.org',
    // Use `in` so that explicit null overrides are preserved (null ?? x returns x)
    categories: 'categories' in overrides ? overrides.categories : ['math', 'science'],
    contentTypes: 'contentTypes' in overrides ? overrides.contentTypes : ['video', 'practice'],
  };
}

type ExecuteFn = (args: { topic: string; categories?: string[] }) => Promise<{
  covered: boolean;
  matchedSources: Array<{ name: string; domain: string; categories: string[]; contentTypes: string[] }>;
  uncoveredCategories: string[];
}>;

function getExecute(): ExecuteFn {
  const tool = makeCheckSourceCoverageTool() as unknown as { execute: ExecuteFn };
  return tool.execute;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('makeCheckSourceCoverageTool', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('search term selection', () => {
    it('uses topic as the search term when no categories are provided', async () => {
      prismaMock.trustedSource.findMany.mockResolvedValue([
        makeSource({ categories: ['python', 'programming'] }),
      ]);

      const result = await getExecute()({ topic: 'python' });

      expect(result.covered).toBe(true);
      expect(result.matchedSources).toHaveLength(1);
    });

    it('uses categories as search terms when provided, ignoring topic for matching', async () => {
      prismaMock.trustedSource.findMany.mockResolvedValue([
        makeSource({ categories: ['data_science'] }),
      ]);

      // topic would not match, but category 'data_science' would
      const result = await getExecute()({
        topic: 'machine learning',
        categories: ['data_science'],
      });

      expect(result.covered).toBe(true);
    });
  });

  describe('substring matching', () => {
    it('matches when source category contains the search term', async () => {
      prismaMock.trustedSource.findMany.mockResolvedValue([
        makeSource({ categories: ['python_programming'] }),
      ]);

      const result = await getExecute()({ topic: 'python' });

      expect(result.covered).toBe(true);
      expect(result.matchedSources[0].name).toBe('Khan Academy');
    });

    it('matches when search term contains the source category', async () => {
      prismaMock.trustedSource.findMany.mockResolvedValue([
        makeSource({ categories: ['python'] }),
      ]);

      const result = await getExecute()({ topic: 'python_programming' });

      expect(result.covered).toBe(true);
    });

    it('is case-insensitive', async () => {
      prismaMock.trustedSource.findMany.mockResolvedValue([
        makeSource({ categories: ['Python'] }),
      ]);

      const result = await getExecute()({ topic: 'PYTHON' });

      expect(result.covered).toBe(true);
    });

    it('does not match unrelated categories', async () => {
      prismaMock.trustedSource.findMany.mockResolvedValue([
        makeSource({ categories: ['history', 'geography'] }),
      ]);

      const result = await getExecute()({ topic: 'python' });

      expect(result.covered).toBe(false);
      expect(result.matchedSources).toHaveLength(0);
    });
  });

  describe('covered flag', () => {
    it('returns covered: true when all search terms have at least one matching source', async () => {
      prismaMock.trustedSource.findMany.mockResolvedValue([
        makeSource({ name: 'Source A', domain: 'a.com', categories: ['math'] }),
        makeSource({ name: 'Source B', domain: 'b.com', categories: ['science'] }),
      ]);

      const result = await getExecute()({
        topic: 'math and science',
        categories: ['math', 'science'],
      });

      expect(result.covered).toBe(true);
      expect(result.uncoveredCategories).toHaveLength(0);
    });

    it('returns covered: false when no sources match', async () => {
      prismaMock.trustedSource.findMany.mockResolvedValue([
        makeSource({ categories: ['history'] }),
      ]);

      const result = await getExecute()({ topic: 'quantum_physics' });

      expect(result.covered).toBe(false);
      expect(result.uncoveredCategories).toEqual(['quantum_physics']);
    });

    it('returns covered: false when only some categories are covered', async () => {
      prismaMock.trustedSource.findMany.mockResolvedValue([
        makeSource({ categories: ['math'] }),
      ]);

      const result = await getExecute()({
        topic: 'math and philosophy',
        categories: ['math', 'philosophy'],
      });

      expect(result.covered).toBe(false);
      expect(result.uncoveredCategories).toEqual(['philosophy']);
    });

    it('returns covered: false when the trusted source table is empty', async () => {
      prismaMock.trustedSource.findMany.mockResolvedValue([]);

      const result = await getExecute()({ topic: 'python' });

      expect(result.covered).toBe(false);
      expect(result.matchedSources).toHaveLength(0);
    });
  });

  describe('uncoveredCategories', () => {
    it('lists every search term with no matching source', async () => {
      prismaMock.trustedSource.findMany.mockResolvedValue([
        makeSource({ categories: ['math'] }),
      ]);

      const result = await getExecute()({
        topic: 'mixed',
        categories: ['math', 'philosophy', 'art'],
      });

      expect(result.uncoveredCategories).toEqual(
        expect.arrayContaining(['philosophy', 'art']),
      );
      expect(result.uncoveredCategories).not.toContain('math');
    });
  });

  describe('return shape', () => {
    it('returns matched source fields correctly', async () => {
      prismaMock.trustedSource.findMany.mockResolvedValue([
        makeSource({
          name: 'MDN',
          domain: 'developer.mozilla.org',
          categories: ['web', 'javascript'],
          contentTypes: ['reading'],
        }),
      ]);

      const result = await getExecute()({ topic: 'web' });

      expect(result.matchedSources[0]).toEqual({
        name: 'MDN',
        domain: 'developer.mozilla.org',
        categories: ['web', 'javascript'],
        contentTypes: ['reading'],
      });
    });

    it('only queries active sources', async () => {
      prismaMock.trustedSource.findMany.mockResolvedValue([]);

      await getExecute()({ topic: 'anything' });

      expect(prismaMock.trustedSource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { active: true } }),
      );
    });
  });

  describe('malformed JSON column safety', () => {
    it('treats a non-array categories column as empty — no match', async () => {
      prismaMock.trustedSource.findMany.mockResolvedValue([
        makeSource({ categories: null }),
      ]);

      const result = await getExecute()({ topic: 'python' });

      expect(result.covered).toBe(false);
      expect(result.matchedSources).toHaveLength(0);
    });

    it('treats a non-array contentTypes column as empty array in output', async () => {
      prismaMock.trustedSource.findMany.mockResolvedValue([
        makeSource({ categories: ['python'], contentTypes: null }),
      ]);

      const result = await getExecute()({ topic: 'python' });

      expect(result.matchedSources[0].contentTypes).toEqual([]);
    });

    it('does not throw when categories is an object instead of array', async () => {
      prismaMock.trustedSource.findMany.mockResolvedValue([
        makeSource({ categories: { key: 'value' } }),
      ]);

      await expect(getExecute()({ topic: 'python' })).resolves.toBeDefined();
    });
  });
});
