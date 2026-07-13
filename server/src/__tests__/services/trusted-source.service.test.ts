import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../mocks/prisma.js';

vi.mock('../../lib/prisma.js', () => ({ default: prismaMock }));

import { trustedSourceService } from '../../services/trusted-source.service.js';
import { NotFoundError } from '../../errors/index.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SOURCE_ID = 'ts-1';

function makeSource(overrides: Record<string, unknown> = {}) {
  return {
    id: SOURCE_ID,
    name: 'Khan Academy',
    domain: 'khanacademy.org',
    contentTypes: ['video', 'reading'],
    categories: ['math', 'science'],
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// list
// ---------------------------------------------------------------------------

describe('trustedSourceService.list', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns all sources when no active filter provided', async () => {
    const sources = [makeSource()];
    prismaMock.trustedSource.findMany.mockResolvedValue(sources);

    const result = await trustedSourceService.list({});

    expect(prismaMock.trustedSource.findMany).toHaveBeenCalledWith({
      where: undefined,
      orderBy: { name: 'asc' },
    });
    expect(result).toEqual(sources);
  });

  it('filters by active=true when query active is "true"', async () => {
    const sources = [makeSource({ active: true })];
    prismaMock.trustedSource.findMany.mockResolvedValue(sources);

    await trustedSourceService.list({ active: 'true' });

    expect(prismaMock.trustedSource.findMany).toHaveBeenCalledWith({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  });

  it('filters by active=false when query active is "false"', async () => {
    prismaMock.trustedSource.findMany.mockResolvedValue([]);

    await trustedSourceService.list({ active: 'false' });

    expect(prismaMock.trustedSource.findMany).toHaveBeenCalledWith({
      where: { active: false },
      orderBy: { name: 'asc' },
    });
  });

  it('returns empty array when no sources exist', async () => {
    prismaMock.trustedSource.findMany.mockResolvedValue([]);
    const result = await trustedSourceService.list({});
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// create
// ---------------------------------------------------------------------------

describe('trustedSourceService.create', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a trusted source with all fields', async () => {
    const source = makeSource();
    prismaMock.trustedSource.create.mockResolvedValue(source);

    const input = {
      name: 'Khan Academy',
      domain: 'khanacademy.org',
      contentTypes: ['video', 'reading'],
      categories: ['math', 'science'],
    };

    const result = await trustedSourceService.create(input);

    expect(prismaMock.trustedSource.create).toHaveBeenCalledWith({
      data: {
        name: input.name,
        domain: input.domain,
        contentTypes: input.contentTypes,
        categories: input.categories,
        active: undefined,
      },
    });
    expect(result).toEqual(source);
  });

  it('creates a source with active flag set explicitly', async () => {
    const source = makeSource({ active: false });
    prismaMock.trustedSource.create.mockResolvedValue(source);

    await trustedSourceService.create({
      name: 'Inactive Source',
      domain: 'example.com',
      contentTypes: [],
      categories: [],
      active: false,
    });

    expect(prismaMock.trustedSource.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ active: false }),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// update
// ---------------------------------------------------------------------------

describe('trustedSourceService.update', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates an existing source', async () => {
    const existing = makeSource();
    const updated = makeSource({ name: 'Khan Academy Updated' });
    prismaMock.trustedSource.findUnique.mockResolvedValue(existing);
    prismaMock.trustedSource.update.mockResolvedValue(updated);

    const result = await trustedSourceService.update(SOURCE_ID, { name: 'Khan Academy Updated' });

    expect(prismaMock.trustedSource.findUnique).toHaveBeenCalledWith({ where: { id: SOURCE_ID } });
    expect(prismaMock.trustedSource.update).toHaveBeenCalledWith({
      where: { id: SOURCE_ID },
      data: { name: 'Khan Academy Updated' },
    });
    expect(result).toEqual(updated);
  });

  it('throws NotFoundError when source does not exist', async () => {
    prismaMock.trustedSource.findUnique.mockResolvedValue(null);

    await expect(trustedSourceService.update(SOURCE_ID, { name: 'X' })).rejects.toThrow(
      NotFoundError,
    );
    expect(prismaMock.trustedSource.update).not.toHaveBeenCalled();
  });

  it('can update active flag to true', async () => {
    prismaMock.trustedSource.findUnique.mockResolvedValue(makeSource({ active: false }));
    prismaMock.trustedSource.update.mockResolvedValue(makeSource({ active: true }));

    const result = await trustedSourceService.update(SOURCE_ID, { active: true });

    expect(prismaMock.trustedSource.update).toHaveBeenCalledWith({
      where: { id: SOURCE_ID },
      data: { active: true },
    });
    expect((result as { active: boolean }).active).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// deactivate
// ---------------------------------------------------------------------------

describe('trustedSourceService.deactivate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sets active=false on an existing source', async () => {
    const existing = makeSource();
    prismaMock.trustedSource.findUnique.mockResolvedValue(existing);
    prismaMock.trustedSource.update.mockResolvedValue(makeSource({ active: false }));

    await trustedSourceService.deactivate(SOURCE_ID);

    expect(prismaMock.trustedSource.findUnique).toHaveBeenCalledWith({ where: { id: SOURCE_ID } });
    expect(prismaMock.trustedSource.update).toHaveBeenCalledWith({
      where: { id: SOURCE_ID },
      data: { active: false },
    });
  });

  it('throws NotFoundError when source does not exist', async () => {
    prismaMock.trustedSource.findUnique.mockResolvedValue(null);

    await expect(trustedSourceService.deactivate(SOURCE_ID)).rejects.toThrow(NotFoundError);
    expect(prismaMock.trustedSource.update).not.toHaveBeenCalled();
  });

  it('returns void on success', async () => {
    prismaMock.trustedSource.findUnique.mockResolvedValue(makeSource());
    prismaMock.trustedSource.update.mockResolvedValue(makeSource({ active: false }));

    const result = await trustedSourceService.deactivate(SOURCE_ID);

    expect(result).toBeUndefined();
  });
});
