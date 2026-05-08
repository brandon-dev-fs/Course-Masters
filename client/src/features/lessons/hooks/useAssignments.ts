import { useCallback, useEffect, useMemo, useState } from 'react';
import { assignmentsApi } from '../../../api/assignments.js';
import type { CreateAssignmentPayload, UpdateAssignmentPayload } from '../../../api/assignments.js';
import type { Assignment, Lesson, LessonResource, LessonTool } from '../../../api/types.js';
import type { AssignmentItem } from '../AssignmentSection.js';
import type { StudentToolType } from '../../student-notes/StudentToolsBar.js';

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
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    if (!lessonId) return;
    assignmentsApi.getAll(lessonId)
      .then(all => setAssignments(all.sort((a, b) => a.order - b.order)))
      .catch(() => {
        // errors surface at the page level via useLesson
      });
  }, [lessonId]);
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

  const availableTools = useMemo((): StudentToolType[] => {
    const result: StudentToolType[] = ['notes'];
    if (tools.some(t => t.type === 'flash_card')) result.push('flashcards');
    if (tools.some(t => t.type === 'practice_problem')) result.push('practice');
    if (tools.some(t => t.type === 'vocab')) result.push('vocab');
    return result;
  }, [tools]);

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

  const handleMoveAssignment = useCallback(async (id: string, direction: 'up' | 'down') => {
    const sorted = [...assignments].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(a => a.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const newIdOrder = sorted.map(a => a.id);
    [newIdOrder[idx], newIdOrder[swapIdx]] = [newIdOrder[swapIdx], newIdOrder[idx]];

    setAssignments(
      newIdOrder.map((assignId, i) => ({ ...sorted.find(a => a.id === assignId)!, order: i + 1 })),
    );

    try {
      if (!lessonId) return;
      const updated = await assignmentsApi.reorder(lessonId, { assignmentIds: newIdOrder });
      setAssignments(updated);
    } catch {
      setAssignments(sorted);
    }
  }, [assignments, lessonId]);

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
