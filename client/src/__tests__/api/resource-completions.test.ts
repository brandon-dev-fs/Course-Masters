import { describe, it, expect, beforeEach, vi } from 'vitest';

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

import { resourceCompletionsApi } from '../../api/resource-completions.js';
import type { CompletionsResponse } from '../../api/types.js';

const mockCompletionsResponse: CompletionsResponse = {
  completions: [
    { assignmentId: 'a1', completedAt: '2024-01-01T00:00:00Z' },
    { assignmentId: 'a2', completedAt: '2024-01-02T00:00:00Z' },
  ],
};

describe('resourceCompletionsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('calls GET /lessons/:lessonId/completions', async () => {
      apiClientMock.get.mockResolvedValueOnce(mockCompletionsResponse);
      const result = await resourceCompletionsApi.get('lesson-1');
      expect(apiClientMock.get).toHaveBeenCalledWith('/lessons/lesson-1/completions');
      expect(result).toEqual(mockCompletionsResponse);
    });

    it('returns completions response with correct shape', async () => {
      apiClientMock.get.mockResolvedValueOnce(mockCompletionsResponse);
      const result = await resourceCompletionsApi.get('lesson-abc');
      expect(result.completions).toHaveLength(2);
      expect(result.completions[0].assignmentId).toBe('a1');
    });

    it('returns empty completions when no completions exist', async () => {
      apiClientMock.get.mockResolvedValueOnce({ completions: [] });
      const result = await resourceCompletionsApi.get('lesson-empty');
      expect(result.completions).toHaveLength(0);
    });
  });

  describe('toggle', () => {
    it('calls POST /lessons/:lessonId/completions with assignmentId', async () => {
      apiClientMock.post.mockResolvedValueOnce(mockCompletionsResponse);
      const result = await resourceCompletionsApi.toggle('lesson-1', 'a1');
      expect(apiClientMock.post).toHaveBeenCalledWith('/lessons/lesson-1/completions', {
        assignmentId: 'a1',
      });
      expect(result).toEqual(mockCompletionsResponse);
    });

    it('uses correct lessonId and assignmentId in the URL and body', async () => {
      apiClientMock.post.mockResolvedValueOnce({ completions: [] });
      await resourceCompletionsApi.toggle('lesson-xyz', 'assign-abc');
      expect(apiClientMock.post).toHaveBeenCalledWith('/lessons/lesson-xyz/completions', {
        assignmentId: 'assign-abc',
      });
    });

    it('returns the updated completions response', async () => {
      const updated: CompletionsResponse = {
        completions: [{ assignmentId: 'a3', completedAt: '2024-02-01T00:00:00Z' }],
      };
      apiClientMock.post.mockResolvedValueOnce(updated);
      const result = await resourceCompletionsApi.toggle('lesson-1', 'a3');
      expect(result).toEqual(updated);
    });
  });
});
