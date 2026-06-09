const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock('../../api/client.js', () => ({ apiClient: apiClientMock }));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import useResources from '../../features/lessons/hooks/useResources.js';
import type { LessonResource, CompletionsResponse } from '../../api/types.js';

const mockResources: LessonResource[] = [
  { id: 'r1', lessonId: 'l1', type: 'video', title: 'Video 1', order: 1, isRequired: false, content: { url: 'https://youtube.com/watch?v=abc' } },
  { id: 'r2', lessonId: 'l1', type: 'note', title: 'Note 1', order: 2, isRequired: false, content: { body: {} } },
];

const mockCompletions: CompletionsResponse = {
  completions: [{ resourceType: 'video', resourceId: 'r1', isRequired: false }],
  requiredItems: [],
};

describe('useResources', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: GET /lessons/:id/resources and GET /lessons/:id/resource-completions
    apiClientMock.get
      .mockResolvedValueOnce(mockResources)   // resources
      .mockResolvedValueOnce(mockCompletions); // completions
  });

  it('returns empty resources initially', () => {
    const { result } = renderHook(() => useResources('l1'));
    // Initially empty before fetch resolves
    expect(result.current.resources).toEqual([]);
  });

  it('loads resources after fetch resolves', async () => {
    const { result } = renderHook(() => useResources('l1'));
    await waitFor(() => expect(result.current.resources.length).toBe(2));
    expect(result.current.resources[0].id).toBe('r1');
  });

  it('loads completions and sets completedIds', async () => {
    const { result } = renderHook(() => useResources('l1'));
    await waitFor(() => expect(result.current.completedIds.size).toBe(1));
    expect(result.current.completedIds.has('r1')).toBe(true);
  });

  it('sets editingVideoId via setEditingVideoId', async () => {
    const { result } = renderHook(() => useResources('l1'));
    await waitFor(() => expect(result.current.resources.length).toBe(2));

    act(() => {
      result.current.setEditingVideoId('r1');
    });
    expect(result.current.editingVideoId).toBe('r1');
  });

  it('handles toggle completion', async () => {
    const newCompletions: CompletionsResponse = {
      completions: [{ resourceType: 'video', resourceId: 'r1', isRequired: false }, { resourceType: 'note', resourceId: 'r2', isRequired: false }],
      requiredItems: [],
    };
    apiClientMock.post.mockResolvedValue(newCompletions);

    const { result } = renderHook(() => useResources('l1'));
    await waitFor(() => expect(result.current.resources.length).toBe(2));

    await act(async () => {
      await result.current.handleToggleCompletion({ key: 'r2', kind: 'resource', id: 'r2', title: 'Note 1', isRequired: false, order: 2, resourceType: 'note' });
    });

    await waitFor(() => expect(result.current.completedIds.size).toBe(2));
  });

  it('returns empty data when lessonId is undefined', () => {
    apiClientMock.get.mockResolvedValue([]);
    const { result } = renderHook(() => useResources(undefined));
    expect(result.current.resources).toEqual([]);
    expect(result.current.completedIds.size).toBe(0);
  });

  it('returns newNoteIdRef', () => {
    const { result } = renderHook(() => useResources('l1'));
    expect(result.current.newNoteIdRef).toBeDefined();
    expect(result.current.newNoteIdRef.current).toBeNull();
  });
});
