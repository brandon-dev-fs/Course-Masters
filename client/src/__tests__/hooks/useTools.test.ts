import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { LessonTool, FlashCardTool, VocabTool } from '../../api/types.js';

// vi.mock is hoisted — use vi.hoisted() so variables are available when factories run
const { lessonToolsApiMock } = vi.hoisted(() => ({
  lessonToolsApiMock: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../api/lesson-tools.js', () => ({ lessonToolsApi: lessonToolsApiMock }));

import useTools from '../../features/lessons/hooks/useTools.js';

function makeFlashCardTool(overrides: Partial<FlashCardTool> = {}): FlashCardTool {
  return {
    id: 'tool-1',
    type: 'flash_card',
    title: 'Flash Card 1',
    content: { front: 'Q', back: 'A' },
    order: 1,
    lessonId: 'lesson-1',
    isRequired: false,
    ...overrides,
  };
}

function makeVocabTool(overrides: Partial<VocabTool> = {}): VocabTool {
  return {
    id: 'tool-2',
    type: 'vocab',
    title: 'Vocab 1',
    content: { term: 'word', definition: 'meaning' },
    order: 2,
    lessonId: 'lesson-1',
    isRequired: false,
    ...overrides,
  };
}

describe('useTools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lessonToolsApiMock.getAll.mockResolvedValue([]);
  });

  describe('initial fetch', () => {
    it('fetches tools on mount with correct lesson ID', async () => {
      lessonToolsApiMock.getAll.mockResolvedValueOnce([makeFlashCardTool()]);

      const { result } = renderHook(() => useTools('lesson-1'));

      await waitFor(() => expect(lessonToolsApiMock.getAll).toHaveBeenCalledWith('lesson-1'));
    });

    it('returns fetched tools in state', async () => {
      const tool = makeFlashCardTool();
      lessonToolsApiMock.getAll.mockResolvedValueOnce([tool]);

      const { result } = renderHook(() => useTools('lesson-1'));

      await waitFor(() => expect(result.current.tools).toHaveLength(1));
      expect(result.current.tools[0]).toEqual(tool);
    });

    it('returns empty tools when no lessonId provided', async () => {
      const { result } = renderHook(() => useTools(undefined));

      // useFetch with undefined lessonId resolves immediately to []
      await waitFor(() => expect(result.current.tools).toEqual([]));
      expect(lessonToolsApiMock.getAll).not.toHaveBeenCalled();
    });

    it('returns tools sorted by order', async () => {
      const tool1 = makeFlashCardTool({ id: 'a', order: 3 });
      const tool2 = makeVocabTool({ id: 'b', order: 1 });
      lessonToolsApiMock.getAll.mockResolvedValueOnce([tool1, tool2]);

      const { result } = renderHook(() => useTools('lesson-1'));

      await waitFor(() => expect(result.current.tools).toHaveLength(2));
      expect(result.current.tools[0].id).toBe('b');
      expect(result.current.tools[1].id).toBe('a');
    });
  });

  describe('setTools', () => {
    it('can replace tools list via setTools', async () => {
      lessonToolsApiMock.getAll.mockResolvedValueOnce([makeFlashCardTool()]);

      const { result } = renderHook(() => useTools('lesson-1'));
      await waitFor(() => expect(result.current.tools).toHaveLength(1));

      const newTools: LessonTool[] = [makeVocabTool()];
      act(() => { result.current.setTools(newTools); });

      expect(result.current.tools).toEqual(newTools);
    });
  });

  describe('editingTool', () => {
    it('editingTool is null initially', async () => {
      const { result } = renderHook(() => useTools('lesson-1'));
      expect(result.current.editingTool).toBeNull();
    });

    it('setEditingTool updates editingTool', async () => {
      const { result } = renderHook(() => useTools('lesson-1'));
      const tool = makeFlashCardTool();

      act(() => { result.current.setEditingTool(tool); });
      expect(result.current.editingTool).toEqual(tool);
    });
  });

  describe('handleMoveTool', () => {
    it('calls lessonToolsApi.update for both swapped tools', async () => {
      const tool1 = makeFlashCardTool({ id: 'a', order: 1 });
      const tool2 = makeVocabTool({ id: 'b', order: 2 });
      lessonToolsApiMock.getAll.mockResolvedValueOnce([tool1, tool2]);
      lessonToolsApiMock.update.mockResolvedValue(undefined);

      const { result } = renderHook(() => useTools('lesson-1'));
      await waitFor(() => expect(result.current.tools).toHaveLength(2));

      await act(async () => {
        await result.current.handleMoveTool('b', 'up');
      });

      expect(lessonToolsApiMock.update).toHaveBeenCalledTimes(2);
    });

    it('reorders tools optimistically', async () => {
      const tool1 = makeFlashCardTool({ id: 'a', order: 1 });
      const tool2 = makeVocabTool({ id: 'b', order: 2 });
      lessonToolsApiMock.getAll.mockResolvedValueOnce([tool1, tool2]);
      lessonToolsApiMock.update.mockResolvedValue(undefined);

      const { result } = renderHook(() => useTools('lesson-1'));
      await waitFor(() => expect(result.current.tools).toHaveLength(2));

      await act(async () => {
        await result.current.handleMoveTool('b', 'up');
      });

      expect(result.current.tools[0].id).toBe('b');
      expect(result.current.tools[1].id).toBe('a');
    });
  });
});
