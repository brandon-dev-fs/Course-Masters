import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { lessonResourcesApi } from '../../../api/lesson-resources.js';
import { resourceCompletionsApi } from '../../../api/resource-completions.js';
import type { CompletionsResponse, LessonResource } from '../../../api/types.js';
import type { AssignmentItem } from '../AssignmentSection.js';
import useFetch from '../../../hooks/useFetch.js';
import useOrderedList from '../../../hooks/useOrderedList.js';

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
  const { data: fetchedResources } = useFetch<LessonResource[]>(
    () => lessonId ? lessonResourcesApi.getAll(lessonId) : Promise.resolve([]),
    [lessonId],
  );

  const { items: resources, setItems: setResources, handleMove: handleMoveResource } = useOrderedList<LessonResource>(
    (fetchedResources ?? []).sort((a, b) => a.order - b.order),
    async (a, b, aNewOrder, bNewOrder) => {
      await Promise.all([
        lessonResourcesApi.update(a.id, { order: aNewOrder }),
        lessonResourcesApi.update(b.id, { order: bNewOrder }),
      ]);
    },
  );

  // Sync items when fetched data arrives
  useEffect(() => {
    if (fetchedResources) {
      setResources(fetchedResources.sort((a, b) => a.order - b.order));
    }
  }, [fetchedResources, setResources]);

  const [completionsData, setCompletionsData] = useState<CompletionsResponse>({ completions: [], requiredItems: [] });
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const newNoteIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!lessonId) return;
    resourceCompletionsApi.get(lessonId)
      .then(comp => setCompletionsData(comp))
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
