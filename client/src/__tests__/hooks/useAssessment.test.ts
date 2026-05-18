import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiClientError } from '../../api/client.js';
import useAssessment from '../../hooks/useAssessment.js';

const mockAssessment = {
  id: 'a1',
  type: 'lesson_quiz' as const,
  questions: [],
  lastAttempt: null,
};

const mockAttemptResult = {
  score: 0.9,
  passed: true,
  totalQuestions: 5,
  correctCount: 4,
};

const mockPaginatedAttempts = {
  data: [{ id: 'attempt-1', score: 0.9, passed: true, createdAt: '2024-01-01' }],
  total: 1,
  page: 1,
  pageSize: 20,
};

function makeApi(overrides: Partial<Parameters<typeof useAssessment>[0]> = {}) {
  return {
    get: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(mockAssessment),
    update: vi.fn().mockResolvedValue(mockAssessment),
    submitAttempt: vi.fn().mockResolvedValue(mockAttemptResult),
    getAttempts: vi.fn().mockResolvedValue(mockPaginatedAttempts),
    ...overrides,
  };
}

describe('useAssessment', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('initial load', () => {
    it('starts with loading=true', () => {
      const api = makeApi();
      const { result } = renderHook(() => useAssessment(api, 'parent-1'));
      expect(result.current.loading).toBe(true);
    });

    it('fetches assessment on mount', async () => {
      const api = makeApi({ get: vi.fn().mockResolvedValue(mockAssessment) });
      const { result } = renderHook(() => useAssessment(api, 'parent-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(api.get).toHaveBeenCalledWith('parent-1');
      expect(result.current.assessment).toEqual(mockAssessment);
    });

    it('sets assessment to null when none exists', async () => {
      const api = makeApi({ get: vi.fn().mockResolvedValue(null) });
      const { result } = renderHook(() => useAssessment(api, 'parent-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.assessment).toBeNull();
    });

    it('sets error when fetch fails with ApiClientError', async () => {
      const api = makeApi({
        get: vi.fn().mockRejectedValue(
          new ApiClientError('SERVER_ERROR', 'Failed', undefined, 'server'),
        ),
      });
      const { result } = renderHook(() => useAssessment(api, 'parent-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.error).not.toBe('');
    });

    it('sets fallback error when fetch fails with plain Error', async () => {
      const api = makeApi({ get: vi.fn().mockRejectedValue(new Error('Network')) });
      const { result } = renderHook(() => useAssessment(api, 'parent-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.error).toBe('Failed to load');
    });

    it('fetches attempts when assessment is loaded and getAttempts is provided', async () => {
      const api = makeApi({ get: vi.fn().mockResolvedValue(mockAssessment) });
      renderHook(() => useAssessment(api, 'parent-1'));
      await waitFor(() => expect(api.getAttempts).toHaveBeenCalledWith('a1'));
    });

    it('populates attempts from getAttempts result', async () => {
      const api = makeApi({ get: vi.fn().mockResolvedValue(mockAssessment) });
      const { result } = renderHook(() => useAssessment(api, 'parent-1'));
      await waitFor(() => expect(result.current.attempts).toHaveLength(1));
    });
  });

  describe('initial view state', () => {
    it('starts with view=idle', async () => {
      const api = makeApi();
      const { result } = renderHook(() => useAssessment(api, 'parent-1'));
      expect(result.current.view).toBe('idle');
    });

    it('setView changes the view', async () => {
      const api = makeApi();
      const { result } = renderHook(() => useAssessment(api, 'parent-1'));
      act(() => { result.current.setView('creating'); });
      expect(result.current.view).toBe('creating');
    });
  });

  describe('handleCreate', () => {
    it('calls api.create with parentId and questions', async () => {
      const api = makeApi({ get: vi.fn().mockResolvedValue(null) });
      const { result } = renderHook(() => useAssessment(api, 'parent-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.handleCreate([]);
      });

      expect(api.create).toHaveBeenCalledWith('parent-1', { questions: [] });
    });

    it('sets assessment after create', async () => {
      const api = makeApi({ get: vi.fn().mockResolvedValue(null) });
      const { result } = renderHook(() => useAssessment(api, 'parent-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.handleCreate([]);
      });

      expect(result.current.assessment).toEqual(mockAssessment);
    });

    it('resets view to idle after create', async () => {
      const api = makeApi({ get: vi.fn().mockResolvedValue(null) });
      const { result } = renderHook(() => useAssessment(api, 'parent-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => { result.current.setView('creating'); });

      await act(async () => {
        await result.current.handleCreate([]);
      });

      expect(result.current.view).toBe('idle');
    });
  });

  describe('handleUpdate', () => {
    it('calls api.update with assessmentId and questions', async () => {
      const api = makeApi({ get: vi.fn().mockResolvedValue(mockAssessment) });
      const { result } = renderHook(() => useAssessment(api, 'parent-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.handleUpdate([]);
      });

      expect(api.update).toHaveBeenCalledWith('a1', { questions: [] });
    });

    it('does nothing when assessment is null', async () => {
      const api = makeApi({ get: vi.fn().mockResolvedValue(null) });
      const { result } = renderHook(() => useAssessment(api, 'parent-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.handleUpdate([]);
      });

      expect(api.update).not.toHaveBeenCalled();
    });
  });

  describe('handleSubmit', () => {
    it('calls api.submitAttempt with assessmentId and answers', async () => {
      const api = makeApi({ get: vi.fn().mockResolvedValue(mockAssessment) });
      const { result } = renderHook(() => useAssessment(api, 'parent-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      const answers = [{ questionId: 'q1', value: 'A' }];
      await act(async () => {
        await result.current.handleSubmit(answers);
      });

      expect(api.submitAttempt).toHaveBeenCalledWith('a1', answers);
    });

    it('sets view to results after submit', async () => {
      const api = makeApi({ get: vi.fn().mockResolvedValue(mockAssessment) });
      const { result } = renderHook(() => useAssessment(api, 'parent-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.handleSubmit([]);
      });

      expect(result.current.view).toBe('results');
    });

    it('sets result after submit', async () => {
      const api = makeApi({ get: vi.fn().mockResolvedValue(mockAssessment) });
      const { result } = renderHook(() => useAssessment(api, 'parent-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.handleSubmit([]);
      });

      expect(result.current.result).toEqual(mockAttemptResult);
    });

    it('does nothing when assessment is null', async () => {
      const api = makeApi({ get: vi.fn().mockResolvedValue(null) });
      const { result } = renderHook(() => useAssessment(api, 'parent-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.handleSubmit([]);
      });

      expect(api.submitAttempt).not.toHaveBeenCalled();
    });
  });

  describe('lastAttempt', () => {
    it('returns null when no result and no lastAttempt on assessment', async () => {
      const api = makeApi({ get: vi.fn().mockResolvedValue(mockAssessment) });
      const { result } = renderHook(() => useAssessment(api, 'parent-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.lastAttempt).toBeNull();
    });

    it('returns result score and passed after submit', async () => {
      const api = makeApi({ get: vi.fn().mockResolvedValue(mockAssessment) });
      const { result } = renderHook(() => useAssessment(api, 'parent-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.handleSubmit([]);
      });

      expect(result.current.lastAttempt).toEqual({ score: 0.9, passed: true });
    });

    it('returns assessment.lastAttempt when result is null', async () => {
      const assessmentWithAttempt = {
        ...mockAssessment,
        lastAttempt: { score: 0.6, passed: false },
      };
      const api = makeApi({ get: vi.fn().mockResolvedValue(assessmentWithAttempt) });
      const { result } = renderHook(() => useAssessment(api, 'parent-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.lastAttempt).toEqual({ score: 0.6, passed: false });
    });
  });
});
