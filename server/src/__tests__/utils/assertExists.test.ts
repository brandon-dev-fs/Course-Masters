import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assertExists } from '../../utils/assertExists.js';
import { NotFoundError } from '../../errors/NotFoundError.js';

describe('assertExists', () => {
  const mockDelegate = {
    findUnique: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the record when findUnique resolves a value', async () => {
    const record = { id: 'test-id', name: 'Test' };
    mockDelegate.findUnique.mockResolvedValue(record);

    const result = await assertExists(mockDelegate, 'test-id', 'TestEntity');

    expect(result).toBe(record);
  });

  it('calls findUnique with the correct where clause', async () => {
    const record = { id: 'abc-123' };
    mockDelegate.findUnique.mockResolvedValue(record);

    await assertExists(mockDelegate, 'abc-123', 'TestEntity');

    expect(mockDelegate.findUnique).toHaveBeenCalledWith({ where: { id: 'abc-123' } });
  });

  it('throws NotFoundError when findUnique returns null', async () => {
    mockDelegate.findUnique.mockResolvedValue(null);

    await expect(assertExists(mockDelegate, 'missing-id', 'Course')).rejects.toThrow(NotFoundError);
  });

  it('error message includes the entity name', async () => {
    mockDelegate.findUnique.mockResolvedValue(null);

    await expect(assertExists(mockDelegate, 'missing-id', 'Course')).rejects.toMatchObject({
      message: 'Course not found',
      code: 'NOT_FOUND',
      statusCode: 404,
    });
  });

  it('error message includes a different entity name when specified', async () => {
    mockDelegate.findUnique.mockResolvedValue(null);

    await expect(assertExists(mockDelegate, 'missing-id', 'Student note')).rejects.toMatchObject({
      message: 'Student note not found',
    });
  });
});
