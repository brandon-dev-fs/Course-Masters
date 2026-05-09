import { useEffect, useState } from 'react';
import { lessonToolsApi } from '../../../api/lesson-tools.js';
import type { LessonTool } from '../../../api/types.js';
import useFetch from '../../../hooks/useFetch.js';
import useOrderedList from '../../../hooks/useOrderedList.js';

interface UseToolsReturn {
  tools: LessonTool[];
  editingTool: LessonTool | null;
  setTools: React.Dispatch<React.SetStateAction<LessonTool[]>>;
  setEditingTool: React.Dispatch<React.SetStateAction<LessonTool | null>>;
  handleMoveTool: (id: string, direction: 'up' | 'down') => Promise<void>;
}

export default function useTools(lessonId: string | undefined): UseToolsReturn {
  const { data: fetchedTools } = useFetch<LessonTool[]>(
    () => lessonId ? lessonToolsApi.getAll(lessonId) : Promise.resolve([]),
    [lessonId],
  );

  const { items: tools, setItems: setTools, handleMove: handleMoveTool } = useOrderedList<LessonTool>(
    (fetchedTools ?? []).sort((a, b) => a.order - b.order),
    async (a, b, aNewOrder, bNewOrder) => {
      await Promise.all([
        lessonToolsApi.update(a.id, { order: aNewOrder }),
        lessonToolsApi.update(b.id, { order: bNewOrder }),
      ]);
    },
  );

  // Sync items when fetched data arrives
  useEffect(() => {
    if (fetchedTools) {
      setTools(fetchedTools.sort((a, b) => a.order - b.order));
    }
  }, [fetchedTools, setTools]);

  const [editingTool, setEditingTool] = useState<LessonTool | null>(null);

  return {
    tools,
    editingTool,
    setTools,
    setEditingTool,
    handleMoveTool,
  };
}
