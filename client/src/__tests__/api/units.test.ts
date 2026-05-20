import { describe, it, expect, beforeEach } from 'vitest';
import { vi } from 'vitest';

const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../api/client.js', () => ({ apiClient: apiClientMock }));

import { unitsApi } from '../../api/units.js';

const mockUnit = { id: 'u1', title: 'Unit 1', order: 1, courseId: 'c1' };

describe('unitsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAll calls GET /courses/:courseId/units', async () => {
    apiClientMock.get.mockResolvedValueOnce([mockUnit]);
    const result = await unitsApi.getAll('c1');
    expect(apiClientMock.get).toHaveBeenCalledWith('/courses/c1/units');
    expect(result).toEqual([mockUnit]);
  });

  it('getOne calls GET /courses/:courseId/units/:unitId', async () => {
    apiClientMock.get.mockResolvedValueOnce(mockUnit);
    const result = await unitsApi.getOne('c1', 'u1');
    expect(apiClientMock.get).toHaveBeenCalledWith('/courses/c1/units/u1');
    expect(result).toEqual(mockUnit);
  });

  it('create calls POST /courses/:courseId/units with data', async () => {
    const payload = { title: 'New Unit', order: 1 };
    apiClientMock.post.mockResolvedValueOnce(mockUnit);
    const result = await unitsApi.create('c1', payload);
    expect(apiClientMock.post).toHaveBeenCalledWith('/courses/c1/units', payload);
    expect(result).toEqual(mockUnit);
  });

  it('update calls PUT /courses/:courseId/units/:unitId with data', async () => {
    const updates = { title: 'Updated Unit' };
    apiClientMock.put.mockResolvedValueOnce({ ...mockUnit, ...updates });
    const result = await unitsApi.update('c1', 'u1', updates);
    expect(apiClientMock.put).toHaveBeenCalledWith('/courses/c1/units/u1', updates);
    expect(result).toMatchObject({ title: 'Updated Unit' });
  });

  it('update can change order', async () => {
    const updates = { order: 3 };
    apiClientMock.put.mockResolvedValueOnce({ ...mockUnit, order: 3 });
    await unitsApi.update('c1', 'u1', updates);
    expect(apiClientMock.put).toHaveBeenCalledWith('/courses/c1/units/u1', { order: 3 });
  });

  it('delete calls DELETE /courses/:courseId/units/:unitId', async () => {
    apiClientMock.delete.mockResolvedValueOnce(undefined);
    const result = await unitsApi.delete('c1', 'u1');
    expect(apiClientMock.delete).toHaveBeenCalledWith('/courses/c1/units/u1');
    expect(result).toBeUndefined();
  });
});
