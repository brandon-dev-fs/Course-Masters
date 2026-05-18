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

import { assignmentsApi } from '../../api/assignments.js';

const mockAssignment = {
  id: 'a1',
  lessonId: 'lesson-1',
  order: 1,
  title: 'Note Assignment',
  type: 'note',
  objective: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  completed: false,
  noteAssignment: null,
  videoAssignment: null,
  readingAssignment: null,
  vocabAssignment: null,
  practiceProblemAssignment: null,
};

describe('assignmentsApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getAll calls GET /lessons/:lessonId/assignments', async () => {
    apiClientMock.get.mockResolvedValueOnce([mockAssignment]);
    const result = await assignmentsApi.getAll('lesson-1');
    expect(apiClientMock.get).toHaveBeenCalledWith('/lessons/lesson-1/assignments');
    expect(result).toEqual([mockAssignment]);
  });

  it('create calls POST /lessons/:lessonId/assignments with payload', async () => {
    const payload = { title: 'New Note', type: 'note' as const, content: { body: {} } };
    apiClientMock.post.mockResolvedValueOnce(mockAssignment);
    const result = await assignmentsApi.create('lesson-1', payload);
    expect(apiClientMock.post).toHaveBeenCalledWith('/lessons/lesson-1/assignments', payload);
    expect(result).toEqual(mockAssignment);
  });

  it('update calls PUT /assignments/:assignmentId with payload', async () => {
    const payload = { title: 'Updated Title' };
    const updated = { ...mockAssignment, title: 'Updated Title' };
    apiClientMock.put.mockResolvedValueOnce(updated);
    const result = await assignmentsApi.update('a1', payload);
    expect(apiClientMock.put).toHaveBeenCalledWith('/assignments/a1', payload);
    expect(result).toEqual(updated);
  });

  it('delete calls DELETE /assignments/:assignmentId', async () => {
    apiClientMock.delete.mockResolvedValueOnce(undefined);
    const result = await assignmentsApi.delete('a1');
    expect(apiClientMock.delete).toHaveBeenCalledWith('/assignments/a1');
    expect(result).toBeUndefined();
  });

  it('reorder calls PUT /lessons/:lessonId/assignments/reorder with payload', async () => {
    const payload = { assignmentIds: ['a2', 'a1'] };
    apiClientMock.put.mockResolvedValueOnce([mockAssignment]);
    const result = await assignmentsApi.reorder('lesson-1', payload);
    expect(apiClientMock.put).toHaveBeenCalledWith('/lessons/lesson-1/assignments/reorder', payload);
    expect(result).toEqual([mockAssignment]);
  });

  it('complete calls POST /assignments/:assignmentId/complete', async () => {
    const completion = { id: 'c1', userId: 'u1', assignmentId: 'a1', completedAt: '2024-01-01' };
    apiClientMock.post.mockResolvedValueOnce(completion);
    const result = await assignmentsApi.complete('a1');
    expect(apiClientMock.post).toHaveBeenCalledWith('/assignments/a1/complete', {});
    expect(result).toEqual(completion);
  });

  it('uncomplete calls DELETE /assignments/:assignmentId/complete', async () => {
    apiClientMock.delete.mockResolvedValueOnce(undefined);
    const result = await assignmentsApi.uncomplete('a1');
    expect(apiClientMock.delete).toHaveBeenCalledWith('/assignments/a1/complete');
    expect(result).toBeUndefined();
  });
});
