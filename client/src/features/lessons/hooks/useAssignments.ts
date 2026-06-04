import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { assignmentsApi } from '../../../api/assignments.js';
import type { CreateAssignmentPayload, UpdateAssignmentPayload } from '../../../api/assignments.js';
import type { Assignment, Lesson, LessonResource, LessonTool } from '../../../api/types.js';
import type { AssignmentItem } from '../AssignmentSection.js';
import type { StudentToolType } from '../../student-notes/StudentToolsBar.js';
import useFetch from '../../../hooks/useFetch.js';
import useOrderedList from '../../../hooks/useOrderedList.js';
import type { PersistFn } from '../../../hooks/useOrderedList.js';

export const nextOrder = (arr: { order: number }[]) =>
  arr.length === 0 ? 1 : Math.max(...arr.map(r => r.order)) + 1;

export function buildAssignmentItems(
  lesson: Lesson,
  resources: LessonResource[],
  tools: LessonTool[],
  assignments: Assignment[],
): AssignmentItem[] {
  const items: AssignmentItem[] = [];

  items.push({
    key: 'lessonPlan',
    kind: 'lessonPlan',
    id: lesson.id,
    title: 'Lesson Plan',
    isRequired: true,
    order: -1,
  });

  for (const r of [...resources].sort((a, b) => a.order - b.order)) {
    items.push({
      key: `resource:${r.id}`,
      kind: 'resource',
      id: r.id,
      title: r.title,
      isRequired: r.isRequired,
      order: r.order,
      resourceType: r.type,
    });
  }

  for (const t of [...tools].sort((a, b) => a.order - b.order)) {
    items.push({
      key: `tool:${t.id}`,
      kind: 'tool',
      id: t.id,
      title: t.title,
      isRequired: t.isRequired,
      order: t.order,
      toolType: t.type,
    });
  }

  for (const a of [...assignments].sort((x, y) => x.order - y.order)) {
    items.push({
      key: `assignment:${a.id}`,
      kind: 'assignment',
      id: a.id,
      title: a.title,
      isRequired: true,
      order: a.order,
      assignmentType: a.type,
    });
  }

  items.push({
    key: 'quiz',
    kind: 'quiz',
    id: null,
    title: 'Lesson Quiz',
    isRequired: true,
    order: Infinity,
  });

  return items;
}

export function completionKeyOf(item: AssignmentItem, lessonId: string | null | undefined): string | null {
  if (item.kind === 'lessonPlan') return lessonId ?? null;
  if (item.id) return item.id;
  return null;
}

interface UseAssignmentsParams {
  lessonId: string | undefined;
  lesson: Lesson | null;
  resources: LessonResource[];
  tools: LessonTool[];
  completedIds: Set<string>;
  setActiveStepKey: (key: string) => void;
}

interface UseAssignmentsReturn {
  assignments: Assignment[];
  assignmentItems: AssignmentItem[];
  completedAssignmentIds: Set<string>;
  incompleteRequired: AssignmentItem[];
  availableTools: StudentToolType[];
  isAddingAssignment: boolean;
  setIsAddingAssignment: React.Dispatch<React.SetStateAction<boolean>>;
  editingAssignment: Assignment | null;
  setEditingAssignment: React.Dispatch<React.SetStateAction<Assignment | null>>;
  deletingAssignmentId: string | null;
  setDeletingAssignmentId: React.Dispatch<React.SetStateAction<string | null>>;
  handleCreateAssignment: (payload: CreateAssignmentPayload) => Promise<void>;
  handleUpdateAssignment: (assignmentId: string, payload: UpdateAssignmentPayload) => Promise<void>;
  handleDeleteAssignment: (assignmentId: string, assignmentItems: AssignmentItem[], activeIdx: number) => Promise<void>;
  handleMoveAssignment: (id: string, direction: 'up' | 'down') => Promise<void>;
  handleToggleAssignmentCompletion: (assignment: Assignment) => Promise<void>;
}

export default function useAssignments({
  lessonId,
  lesson,
  resources,
  tools,
  completedIds,
  setActiveStepKey,
}: UseAssignmentsParams): UseAssignmentsReturn {
  const { data: fetchedAssignments } = useFetch<Assignment[]>(
    () => lessonId ? assignmentsApi.getAll(lessonId) : Promise.resolve([]),
    [lessonId],
  );

  // Stable refs so the PersistFn closure never goes stale between renders.
  const lessonIdRef = useRef<string | undefined>(lessonId);
  useEffect(() => { lessonIdRef.current = lessonId; }, [lessonId]);

  // assignmentsRef mirrors the current items array so persistReorder can read
  // the post-swap state to derive the full sorted ID array for the reorder API.
  const assignmentsRef = useRef<Assignment[]>([]);

  // PersistFn for useOrderedList: called in the same synchronous frame as the
  // optimistic setItems call, before React commits and before the assignmentsRef
  // useEffect fires. We therefore cannot rely on assignmentsRef.current being at
  // the post-swap state — instead we apply the swap inline using the aNewOrder /
  // bNewOrder arguments that useOrderedList already passes us.
  const persistReorder = useCallback<PersistFn<Assignment>>(
    async (a, b, aNewOrder, bNewOrder) => {
      const currentLessonId = lessonIdRef.current;
      if (!currentLessonId) return;
      const sortedIds = [...assignmentsRef.current]
        .map(item =>
          item.id === a.id ? { ...item, order: aNewOrder } :
          item.id === b.id ? { ...item, order: bNewOrder } : item,
        )
        .sort((x, y) => x.order - y.order)
        .map(item => item.id);
      const updated = await assignmentsApi.reorder(currentLessonId, { assignmentIds: sortedIds });
      setItems(updated);
    },
    // lessonIdRef and assignmentsRef are stable refs; setItems is a stable setter
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const { items: assignments, setItems, handleMove: handleMoveAssignment } = useOrderedList<Assignment>(
    [],
    persistReorder,
  );

  // Keep assignmentsRef in sync so persistReorder always sees the latest state.
  useEffect(() => { assignmentsRef.current = assignments; }, [assignments]);

  // Alias setItems as setAssignments for use in the other handlers below.
  const setAssignments = setItems;

  // Sync assignments when fetched data arrives.
  useEffect(() => {
    if (fetchedAssignments) {
      setAssignments(fetchedAssignments.sort((a, b) => a.order - b.order));
    }
  }, [fetchedAssignments]);

  const [isAddingAssignment, setIsAddingAssignment] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [deletingAssignmentId, setDeletingAssignmentId] = useState<string | null>(null);

  const assignmentItems = useMemo(
    () => lesson ? buildAssignmentItems(lesson, resources, tools, assignments) : [],
    [lesson, resources, tools, assignments],
  );

  const completedAssignmentIds = useMemo(
    () => new Set(assignments.filter(a => a.completed).map(a => a.id)),
    [assignments],
  );

  // All four panels are always available. Teachers need them to add new tools; students
  // always see consistent navigation — panels show their own empty states when empty.
  const availableTools = useMemo((): StudentToolType[] => ['notes', 'flashcards', 'vocab', 'practice'], []);

  const incompleteRequired = useMemo(
    () => assignmentItems.filter(
      item => item.isRequired && item.kind !== 'quiz' && item.id !== null &&
        (item.kind === 'assignment' ? !completedAssignmentIds.has(item.id) : !completedIds.has(item.id))
    ),
    [assignmentItems, completedIds, completedAssignmentIds],
  );

  const handleCreateAssignment = useCallback(async (payload: CreateAssignmentPayload) => {
    if (!lessonId) return;
    const created = await assignmentsApi.create(lessonId, payload);
    setAssignments(prev => [...prev, created].sort((a, b) => a.order - b.order));
    setIsAddingAssignment(false);
    setActiveStepKey(`assignment:${created.id}`);
  }, [lessonId, setActiveStepKey]);

  const handleUpdateAssignment = useCallback(async (assignmentId: string, payload: UpdateAssignmentPayload) => {
    const updated = await assignmentsApi.update(assignmentId, payload);
    setAssignments(prev => prev.map(a => a.id === assignmentId ? updated : a));
    setEditingAssignment(null);
  }, []);

  const handleDeleteAssignment = useCallback(async (assignmentId: string, currentItems: AssignmentItem[], activeIdx: number) => {
    await assignmentsApi.delete(assignmentId);
    setAssignments(prev => prev.filter(a => a.id !== assignmentId));
    setDeletingAssignmentId(null);
    const filteredItems = currentItems.filter(i => i.id !== assignmentId);
    const prevItem = filteredItems[Math.max(0, activeIdx - 1)];
    setActiveStepKey(prevItem?.key ?? 'lessonPlan');
  }, [setActiveStepKey]);

  const handleToggleAssignmentCompletion = useCallback(async (assignment: Assignment) => {
    const wasComplete = assignment.completed;
    setAssignments(prev =>
      prev.map(a => a.id === assignment.id ? { ...a, completed: !wasComplete } : a),
    );
    try {
      if (wasComplete) {
        await assignmentsApi.uncomplete(assignment.id);
      } else {
        await assignmentsApi.complete(assignment.id);
      }
    } catch {
      setAssignments(prev =>
        prev.map(a => a.id === assignment.id ? { ...a, completed: wasComplete } : a),
      );
    }
  }, []);

  return {
    assignments,
    assignmentItems,
    completedAssignmentIds,
    incompleteRequired,
    availableTools,
    isAddingAssignment,
    setIsAddingAssignment,
    editingAssignment,
    setEditingAssignment,
    deletingAssignmentId,
    setDeletingAssignmentId,
    handleCreateAssignment,
    handleUpdateAssignment,
    handleDeleteAssignment,
    handleMoveAssignment,
    handleToggleAssignmentCompletion,
  };
}
