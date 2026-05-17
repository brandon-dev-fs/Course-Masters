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

import { resourceCompletionsApi } from '../../api/resource-completions.js';

const mockCompletions = {
  completions: [
    { resourceType: 'resource', resourceId: 'r1', isRequired: true },
    { resourceType: 'tool', resourceId: 't1', isRequired: false },
  ],
  requiredItems: [
    { resourceType: 'resource', resourceId: 'r1', isRequired: true },
  ],
};

describe('resourceCompletionsApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('get calls GET /lessons/:lessonId/completions', async () => {
    apiClientMock.get.mockResolvedValueOnce(mockCompletions);
    const result = await resourceCompletionsApi.get('lesson-1');
    expect(apiClientMock.get).toHaveBeenCalledWith('/lessons/lesson-1/completions');
    expect(result).toEqual(mockCompletions);
  });

  it('toggle calls POST /lessons/:lessonId/completions with resourceType and resourceId', async () => {
    const updated = {
      completions: [
        { resourceType: 'resource', resourceId: 'r1', isRequired: true },
        { resourceType: 'tool', resourceId: 't1', isRequired: false },
        { resourceType: 'resource', resourceId: 'r2', isRequired: false },
      ],
      requiredItems: [{ resourceType: 'resource', resourceId: 'r1', isRequired: true }],
    };
    apiClientMock.post.mockResolvedValueOnce(updated);
    const result = await resourceCompletionsApi.toggle('lesson-1', 'resource', 'r2');
    expect(apiClientMock.post).toHaveBeenCalledWith('/lessons/lesson-1/completions', {
      resourceType: 'resource',
      resourceId: 'r2',
    });
    expect(result).toEqual(updated);
  });

  it('toggle passes the correct lessonId in the URL', async () => {
    apiClientMock.post.mockResolvedValueOnce(mockCompletions);
    await resourceCompletionsApi.toggle('lesson-abc', 'tool', 't1');
    expect(apiClientMock.post).toHaveBeenCalledWith('/lessons/lesson-abc/completions', {
      resourceType: 'tool',
      resourceId: 't1',
    });
  });
});
