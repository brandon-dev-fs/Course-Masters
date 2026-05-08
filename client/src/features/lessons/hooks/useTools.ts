import { useCallback, useEffect, useState } from 'react';
import { lessonToolsApi } from '../../../api/lesson-tools.js';
import type { LessonTool } from '../../../api/types.js';

interface UseToolsReturn {
  tools: LessonTool[];
  editingTool: LessonTool | null;
  setTools: React.Dispatch<React.SetStateAction<LessonTool[]>>;
  setEditingTool: React.Dispatch<React.SetStateAction<LessonTool | null>>;
  handleMoveTool: (id: string, direction: 'up' | 'down') => Promise<void>;
}

export default function useTools(lessonId: string | undefined): UseToolsReturn {
  const [tools, setTools] = useState<LessonTool[]>([]);
  const [editingTool, setEditingTool] = useState<LessonTool | null>(null);

  useEffect(() => {
    if (!lessonId) return;
    lessonToolsApi.getAll(lessonId)
      .then(allTools => setTools(allTools.sort((a, b) => a.order - b.order)))
      .catch(() => {
        // errors surface at the page level via useLesson
      });
  }, [lessonId]);

  const handleMoveTool = useCallback(async (id: string, direction: 'up' | 'down') => {
    const sorted = [...tools].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(t => t.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapIdx];
    const orderA = a.order;
    const orderB = b.order;
    setTools(prev =>
      prev.map(t =>
        t.id === a.id ? { ...t, order: orderB } :
        t.id === b.id ? { ...t, order: orderA } : t,
      ).sort((x, y) => x.order - y.order),
    );
    try {
      await Promise.all([
        lessonToolsApi.update(a.id, { order: orderB }),
        lessonToolsApi.update(b.id, { order: orderA }),
      ]);
    } catch {
      setTools(prev =>
        prev.map(t =>
          t.id === a.id ? { ...t, order: orderA } :
          t.id === b.id ? { ...t, order: orderB } : t,
        ).sort((x, y) => x.order - y.order),
      );
    }
  }, [tools]);

  return {
    tools,
    editingTool,
    setTools,
    setEditingTool,
    handleMoveTool,
  };
}
