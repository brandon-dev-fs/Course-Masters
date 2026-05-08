import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { lessonsApi } from '../../../api/lessons.js';
import { unitsApi } from '../../../api/units.js';
import { coursesApi } from '../../../api/courses.js';
import { progressApi } from '../../../api/progress.js';
import type { Lesson, Unit, UnitProgress } from '../../../api/types.js';
import { useAuth } from '../../../context/AuthContext.js';

interface UseLessonParams {
  courseId: string | undefined;
  unitId: string | undefined;
  lessonId: string | undefined;
}

interface UseLessonReturn {
  lesson: Lesson | null;
  courseTitle: string;
  units: Unit[];
  unitLessons: Lesson[];
  unitProgress: UnitProgress | null;
  loading: boolean;
  error: string;
  canEdit: boolean;
  setLesson: React.Dispatch<React.SetStateAction<Lesson | null>>;
  setUnitLessons: React.Dispatch<React.SetStateAction<Lesson[]>>;
  handleAddLesson: (data: { title: string; description: string; order: number }) => Promise<void>;
  handleUpdate: (data: { title: string; description?: string; order: number; objective?: string; planContent?: Record<string, unknown> }) => Promise<void>;
  handleDelete: () => Promise<void>;
}

export default function useLesson(
  { courseId, unitId, lessonId }: UseLessonParams,
  onUpdateClose?: () => void,
): UseLessonReturn {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = user?.role === 'teacher' || user?.role === 'admin';

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitLessons, setUnitLessons] = useState<Lesson[]>([]);
  const [unitProgress, setUnitProgress] = useState<UnitProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!unitId || !lessonId || !courseId) return;
    setLoading(true);
    setError('');
    Promise.all([
      lessonsApi.getOne(unitId, lessonId),
      unitsApi.getAll(courseId),
      coursesApi.getOne(courseId),
      lessonsApi.getAll(unitId),
      progressApi.getUnit(courseId, unitId),
    ])
      .then(([lessonData, allUnits, courseData, lessons, unitProg]) => {
        setLesson(lessonData);
        setCourseTitle(courseData.title);
        setUnits(allUnits);
        setUnitLessons(lessons);
        setUnitProgress(unitProg);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load lesson'))
      .finally(() => setLoading(false));
  }, [unitId, lessonId, courseId]);

  const handleAddLesson = useCallback(async (data: { title: string; description: string; order: number }) => {
    if (!unitId || !courseId) return;
    const newLesson = await lessonsApi.create(unitId, data);
    setUnitLessons(prev => [...prev, newLesson]);
    navigate(`/courses/${courseId}/units/${unitId}/lessons/${newLesson.id}`);
  }, [unitId, courseId, navigate]);

  const handleUpdate = useCallback(async (data: { title: string; description?: string; order: number; objective?: string; planContent?: Record<string, unknown> }) => {
    if (!unitId || !lessonId) return;
    const updated = await lessonsApi.update(unitId, lessonId, data);
    setLesson(updated);
    onUpdateClose?.();
  }, [unitId, lessonId, onUpdateClose]);

  const handleDelete = useCallback(async () => {
    if (!unitId || !lessonId) return;
    await lessonsApi.delete(unitId, lessonId);
    navigate(`/courses/${courseId}`);
  }, [unitId, lessonId, courseId, navigate]);

  return {
    lesson,
    courseTitle,
    units,
    unitLessons,
    unitProgress,
    loading,
    error,
    canEdit,
    setLesson,
    setUnitLessons,
    handleAddLesson,
    handleUpdate,
    handleDelete,
  };
}
