import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { lessonResourcesApi } from '../../../api/lesson-resources.js';
import { resourceCompletionsApi } from '../../../api/resource-completions.js';
import type { CompletionsResponse, LessonResource } from '../../../api/types.js';
import type { AssignmentItem } from '../AssignmentSection.js';

interface UseResourcesReturn {
  resources: LessonResource[];
  completionsData: CompletionsResponse;
  completedIds: Set<string>;
  editingVideoId: string | null;
  newNoteIdRef: React.RefObject<string | null>;
  setResources: React.Dispatch<React.SetStateAction<LessonResource[]>>;
  setCompletionsData: React.Dispatch<React.SetStateAction<CompletionsResponse>>;
  setEditingVideoId: React.Dispatch<React.SetStateAction<string | null>>;
  handleToggleCompletion: (item: AssignmentItem) => Promise<void>;
  handleMoveResource: (id: string, direction: 'up' | 'down') => Promise<void>;
}

export default function useResources(lessonId: string | undefined): UseResourcesReturn {
  const [resources, setResources] = useState<LessonResource[]>([]);
  const [completionsData, setCompletionsData] = useState<CompletionsResponse>({ completions: [], requiredItems: [] });
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const newNoteIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!lessonId) return;
    Promise.all([
      lessonResourcesApi.getAll(lessonId),
      resourceCompletionsApi.get(lessonId),
    ])
      .then(([allResources, comp]) => {
        setResources(allResources.sort((a, b) => a.order - b.order));
        setCompletionsData(comp);
      })
      .catch(() => {
        // errors surface at the page level via useLesson
      });
  }, [lessonId]);

  const completedIds = useMemo(
    () => new Set(completionsData.completions.map(c => c.resourceId)),
    [completionsData.completions],
  );

  const handleToggleCompletion = useCallback(async (item: AssignmentItem) => {
    if (!lessonId || !item.id) return;
    let resourceType: string;
    if (item.kind === 'lessonPlan') resourceType = 'lessonPlan';
    else if (item.kind === 'resource') resourceType = item.resourceType ?? 'note';
    else resourceType = item.toolType ?? 'tool';
    const result = await resourceCompletionsApi.toggle(lessonId, resourceType, item.id);
    setCompletionsData(result);
  }, [lessonId]);

  const handleMoveResource = useCallback(async (id: string, direction: 'up' | 'down') => {
    const sorted = [...resources].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(r => r.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapIdx];
    const orderA = a.order;
    const orderB = b.order;
    setResources(prev =>
      prev.map(r =>
        r.id === a.id ? { ...r, order: orderB } :
        r.id === b.id ? { ...r, order: orderA } : r,
      ).sort((x, y) => x.order - y.order),
    );
    try {
      await Promise.all([
        lessonResourcesApi.update(a.id, { order: orderB }),
        lessonResourcesApi.update(b.id, { order: orderA }),
      ]);
    } catch {
      setResources(prev =>
        prev.map(r =>
          r.id === a.id ? { ...r, order: orderA } :
          r.id === b.id ? { ...r, order: orderB } : r,
        ).sort((x, y) => x.order - y.order),
      );
    }
  }, [resources]);

  return {
    resources,
    completionsData,
    completedIds,
    editingVideoId,
    newNoteIdRef,
    setResources,
    setCompletionsData,
    setEditingVideoId,
    handleToggleCompletion,
    handleMoveResource,
  };
}
