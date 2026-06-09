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

import { bookmarksApi } from '../../api/bookmarks.js';

const mockBookmark = { id: 'bm-1', assignmentId: 'a-1', userId: 'u-1', note: 'My note' };

describe('bookmarksApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('upsert calls PUT /assignments/:id/bookmark with note', async () => {
    apiClientMock.put.mockResolvedValueOnce(mockBookmark);
    await bookmarksApi.upsert('a-1', 'My note');
    expect(apiClientMock.put).toHaveBeenCalledWith('/assignments/a-1/bookmark', { note: 'My note' });
  });

  it('upsert returns the bookmark from the response', async () => {
    apiClientMock.put.mockResolvedValueOnce(mockBookmark);
    const result = await bookmarksApi.upsert('a-1', 'My note');
    expect(result).toEqual(mockBookmark);
  });

  it('delete calls DELETE /assignments/:id/bookmark', async () => {
    apiClientMock.delete.mockResolvedValueOnce(undefined);
    await bookmarksApi.delete('a-1');
    expect(apiClientMock.delete).toHaveBeenCalledWith('/assignments/a-1/bookmark');
  });
});
