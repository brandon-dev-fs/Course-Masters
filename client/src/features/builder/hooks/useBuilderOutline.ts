import { useState, useEffect, useCallback, useRef } from 'react';

import { builderApi } from '../../../api/builder.js';
import { unitsApi } from '../../../api/units.js';
import { lessonsApi } from '../../../api/lessons.js';
import { assignmentsApi } from '../../../api/assignments.js';
import { classifyError, ApiClientError } from '../../../api/client.js';

import type { BuilderOutline, BuilderUnit, BuilderLesson, BuilderActivity, ReorderItem, AssignmentType } from '../../../api/types.js';
import type { CreateAssignmentPayload } from '../../../api/assignments.js';

interface UseBuilderOutlineResult {
  outline: BuilderOutline | null;
  loading: boolean;
  error: string;
  reload: () => void;
  setOutline: React.Dispatch<React.SetStateAction<BuilderOutline | null>>;
  addUnit: (data: { title: string; description: string; order: number }) => Promise<void>;
  editUnit: (courseId: string, unitId: string, data: { title: string; description: string; order: number }) => Promise<void>;
  addLesson: (unitId: string, data: { title: string; description: string; order: number }) => Promise<void>;
  addActivity: (lessonId: string, type: AssignmentType) => Promise<void>;
  renameUnit: (courseId: string, unitId: string, title: string) => Promise<void>;
  renameLesson: (unitId: string, lessonId: string, title: string) => Promise<void>;
  deleteUnit: (courseId: string, unitId: string) => Promise<void>;
  deleteLesson: (unitId: string, lessonId: string) => Promise<void>;
  deleteActivity: (assignmentId: string, lessonId: string) => Promise<void>;
  reorderUnits: (courseId: string, reordered: BuilderUnit[], items: ReorderItem[]) => Promise<void>;
  reorderLessons: (unitId: string, reordered: BuilderLesson[], items: ReorderItem[]) => Promise<void>;
  reorderActivities: (lessonId: string, reordered: BuilderActivity[], assignmentIds: string[]) => Promise<void>;
}

function getDefaultPayload(type: AssignmentType, title: string): CreateAssignmentPayload {
  switch (type) {
    case 'note':
      return { type: 'note', title, content: { type: 'doc', content: [] } };
    case 'video':
      return { type: 'video', title, url: '' };
    case 'reading':
      return { type: 'reading', title, url: '', description: '' };
    case 'vocab':
      return { type: 'vocab', title, entries: [] };
    case 'practice_problem':
      return { type: 'practice_problem', title, questions: [] };
    default:
      return { type: 'note', title, content: { type: 'doc', content: [] } };
  }
}

const TYPE_DEFAULT_TITLE: Record<AssignmentType, string> = {
  note: 'Untitled Note',
  video: 'Untitled Video',
  reading: 'Untitled Reading',
  vocab: 'Untitled Vocab',
  practice_problem: 'Untitled Practice Problem',
  file: 'Untitled File',
};

export function useBuilderOutline(courseId: string): UseBuilderOutlineResult {
  const [outline, setOutline] = useState<BuilderOutline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    setLoading(true);
    setError('');

    builderApi.getOutline(courseId).then((data) => {
      if (!cancelledRef.current) {
        setOutline(data);
        setLoading(false);
      }
    }).catch((err: unknown) => {
      if (!cancelledRef.current) {
        setError(err instanceof ApiClientError ? classifyError(err) : 'Failed to load course outline.');
        setLoading(false);
      }
    });

    return () => {
      cancelledRef.current = true;
    };
  }, [courseId, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  const addUnit = useCallback(async (data: { title: string; description: string; order: number }) => {
    if (!outline) return;
    const newUnit = await unitsApi.create(courseId, data);
    const builderUnit: BuilderUnit = {
      id: newUnit.id,
      title: newUnit.title,
      description: newUnit.description,
      order: newUnit.order,
      lessons: [],
      assessment: null,
    };
    setOutline((prev) => prev ? { ...prev, units: [...prev.units, builderUnit] } : prev);
  }, [outline, courseId]);

  const addLesson = useCallback(async (unitId: string, data: { title: string; description: string; order: number }) => {
    const newLesson = await lessonsApi.create(unitId, data);
    const builderLesson: BuilderLesson = {
      id: newLesson.id,
      title: newLesson.title,
      order: newLesson.order,
      assignments: [],
      assessment: null,
    };
    setOutline((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        units: prev.units.map((u) =>
          u.id === unitId ? { ...u, lessons: [...u.lessons, builderLesson] } : u,
        ),
      };
    });
  }, []);

  const addActivity = useCallback(async (lessonId: string, type: AssignmentType) => {
    if (!outline) return;
    const lesson = outline.units.flatMap((u) => u.lessons).find((l) => l.id === lessonId);
    if (!lesson) return;
    const defaultTitle = TYPE_DEFAULT_TITLE[type];
    const payload = getDefaultPayload(type, defaultTitle);
    const newAssignment = await assignmentsApi.create(lessonId, payload);
    const builderActivity: BuilderActivity = {
      id: newAssignment.id,
      title: newAssignment.title,
      type: newAssignment.type,
      order: newAssignment.order,
    };
    setOutline((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        units: prev.units.map((u) => ({
          ...u,
          lessons: u.lessons.map((l) =>
            l.id === lessonId
              ? { ...l, assignments: [...l.assignments, builderActivity] }
              : l,
          ),
        })),
      };
    });
  }, [outline]);

  const renameUnit = useCallback(async (courseId: string, unitId: string, title: string) => {
    await unitsApi.update(courseId, unitId, { title });
    setOutline((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        units: prev.units.map((u) => u.id === unitId ? { ...u, title } : u),
      };
    });
  }, []);

  const editUnit = useCallback(async (courseId: string, unitId: string, data: { title: string; description: string; order: number }) => {
    await unitsApi.update(courseId, unitId, data);
    setOutline((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        units: prev.units.map((u) => u.id === unitId ? { ...u, ...data } : u),
      };
    });
  }, []);

  const renameLesson = useCallback(async (unitId: string, lessonId: string, title: string) => {
    await lessonsApi.update(unitId, lessonId, { title });
    setOutline((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        units: prev.units.map((u) => ({
          ...u,
          lessons: u.lessons.map((l) => l.id === lessonId ? { ...l, title } : l),
        })),
      };
    });
  }, []);

  const deleteUnit = useCallback(async (courseId: string, unitId: string) => {
    await unitsApi.delete(courseId, unitId);
    setOutline((prev) => {
      if (!prev) return prev;
      return { ...prev, units: prev.units.filter((u) => u.id !== unitId) };
    });
  }, []);

  const deleteLesson = useCallback(async (unitId: string, lessonId: string) => {
    await lessonsApi.delete(unitId, lessonId);
    setOutline((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        units: prev.units.map((u) => ({
          ...u,
          lessons: u.lessons.filter((l) => l.id !== lessonId),
        })),
      };
    });
  }, []);

  const deleteActivity = useCallback(async (assignmentId: string, lessonId: string) => {
    await assignmentsApi.delete(assignmentId);
    setOutline((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        units: prev.units.map((u) => ({
          ...u,
          lessons: u.lessons.map((l) =>
            l.id === lessonId
              ? { ...l, assignments: l.assignments.filter((a) => a.id !== assignmentId) }
              : l,
          ),
        })),
      };
    });
  }, []);

  const reorderUnits = useCallback(async (courseId: string, reordered: BuilderUnit[], items: ReorderItem[]) => {
    setOutline((prev) => prev ? { ...prev, units: reordered } : prev);
    await builderApi.reorderUnits(courseId, items);
  }, []);

  const reorderLessons = useCallback(async (unitId: string, reordered: BuilderLesson[], items: ReorderItem[]) => {
    setOutline((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        units: prev.units.map((u) => u.id === unitId ? { ...u, lessons: reordered } : u),
      };
    });
    await builderApi.reorderLessons(unitId, items);
  }, []);

  const reorderActivities = useCallback(async (lessonId: string, reordered: BuilderActivity[], assignmentIds: string[]) => {
    setOutline((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        units: prev.units.map((u) => ({
          ...u,
          lessons: u.lessons.map((l) =>
            l.id === lessonId ? { ...l, assignments: reordered } : l,
          ),
        })),
      };
    });
    await assignmentsApi.reorder(lessonId, { assignmentIds });
  }, []);

  return {
    outline,
    loading,
    error,
    reload,
    setOutline,
    addUnit,
    editUnit,
    addLesson,
    addActivity,
    renameUnit,
    renameLesson,
    deleteUnit,
    deleteLesson,
    deleteActivity,
    reorderUnits,
    reorderLessons,
    reorderActivities,
  };
}
