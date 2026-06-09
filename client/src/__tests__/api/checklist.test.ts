import { describe, it, expect, vi, beforeEach } from 'vitest';

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

import { checklistApi } from '../../api/checklist.js';

const mockItem = {
  id: 'ci-1',
  lessonId: 'l-1',
  text: 'Do thing',
  checked: false,
  order: 1,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('checklistApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAll calls GET /lessons/:lessonId/checklist', async () => {
    apiClientMock.get.mockResolvedValueOnce([mockItem]);
    const result = await checklistApi.getAll('l-1');
    expect(apiClientMock.get).toHaveBeenCalledWith('/lessons/l-1/checklist');
    expect(result).toEqual([mockItem]);
  });

  it('create calls POST /lessons/:lessonId/checklist with text', async () => {
    apiClientMock.post.mockResolvedValueOnce(mockItem);
    const result = await checklistApi.create('l-1', 'Do thing');
    expect(apiClientMock.post).toHaveBeenCalledWith('/lessons/l-1/checklist', { text: 'Do thing' });
    expect(result).toEqual(mockItem);
  });

  it('update calls PUT /checklist-items/:itemId with data', async () => {
    const updated = { ...mockItem, checked: true };
    apiClientMock.put.mockResolvedValueOnce(updated);
    const result = await checklistApi.update('ci-1', { checked: true });
    expect(apiClientMock.put).toHaveBeenCalledWith('/checklist-items/ci-1', { checked: true });
    expect(result).toEqual(updated);
  });

  it('update accepts partial data (text only)', async () => {
    const updated = { ...mockItem, text: 'Updated text' };
    apiClientMock.put.mockResolvedValueOnce(updated);
    await checklistApi.update('ci-1', { text: 'Updated text' });
    expect(apiClientMock.put).toHaveBeenCalledWith('/checklist-items/ci-1', { text: 'Updated text' });
  });

  it('delete calls DELETE /checklist-items/:itemId', async () => {
    apiClientMock.delete.mockResolvedValueOnce(undefined);
    await checklistApi.delete('ci-1');
    expect(apiClientMock.delete).toHaveBeenCalledWith('/checklist-items/ci-1');
  });

  it('reorder calls PUT /lessons/:lessonId/checklist/reorder with itemIds', async () => {
    const reordered = [mockItem];
    apiClientMock.put.mockResolvedValueOnce(reordered);
    const result = await checklistApi.reorder('l-1', ['ci-1']);
    expect(apiClientMock.put).toHaveBeenCalledWith('/lessons/l-1/checklist/reorder', { itemIds: ['ci-1'] });
    expect(result).toEqual(reordered);
  });
});
