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

import { studentNotesApi } from '../../api/student-notes.js';

const mockNote = {
  id: 'sn1',
  userId: 'user-1',
  lessonId: 'lesson-1',
  content: 'My notes here',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('studentNotesApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('get calls GET /lessons/:lessonId/student-notes', async () => {
    apiClientMock.get.mockResolvedValueOnce(mockNote);
    const result = await studentNotesApi.get('lesson-1');
    expect(apiClientMock.get).toHaveBeenCalledWith('/lessons/lesson-1/student-notes');
    expect(result).toEqual(mockNote);
  });

  it('get returns null when no note exists', async () => {
    apiClientMock.get.mockResolvedValueOnce(null);
    const result = await studentNotesApi.get('lesson-1');
    expect(result).toBeNull();
  });

  it('upsert calls POST /lessons/:lessonId/student-notes with content', async () => {
    const payload = { content: 'Updated notes' };
    apiClientMock.post.mockResolvedValueOnce({ ...mockNote, content: 'Updated notes' });
    const result = await studentNotesApi.upsert('lesson-1', payload);
    expect(apiClientMock.post).toHaveBeenCalledWith('/lessons/lesson-1/student-notes', payload);
    expect(result).toMatchObject({ content: 'Updated notes' });
  });

  it('delete calls DELETE /student-notes/:id', async () => {
    apiClientMock.delete.mockResolvedValueOnce(undefined);
    const result = await studentNotesApi.delete('sn1');
    expect(apiClientMock.delete).toHaveBeenCalledWith('/student-notes/sn1');
    expect(result).toBeUndefined();
  });
});
