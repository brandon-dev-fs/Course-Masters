import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { lessonsApi } from '../../../api/lessons.js';
import { unitsApi } from '../../../api/units.js';
import { coursesApi } from '../../../api/courses.js';
import { progressApi } from '../../../api/progress.js';
import type { Lesson, Unit, UnitProgress } from '../../../api/types.js';
import useFetch from '../../../hooks/useFetch.js';
import useCanEdit from '../../../hooks/useCanEdit.js';

interface UseLessonParams {
  courseId: string | undefined;
  unitId: string | undefined;
  lessonId: string | undefined;
}

interface LessonFetchResult {
  lesson: Lesson;
  courseTitle: string;
  units: Unit[];
  unitLessons: Lesson[];
  unitProgress: UnitProgress;
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
  const canEdit = useCanEdit();

  const { data, loading, error } = useFetch<LessonFetchResult>(
    () => {
      if (!unitId || !lessonId || !courseId) return Promise.reject(new Error('Missing route params'));
      return Promise.all([
        lessonsApi.getOne(unitId, lessonId),
        unitsApi.getAll(courseId),
        coursesApi.getOne(courseId),
        lessonsApi.getAll(unitId),
        progressApi.getUnit(courseId, unitId),
      ]).then(([lessonData, allUnits, courseData, lessons, unitProg]) => ({
        lesson: lessonData,
        courseTitle: courseData.title,
        units: allUnits,
        unitLessons: lessons,
        unitProgress: unitProg,
      }));
    },
    [unitId, lessonId, courseId],
  );

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitLessons, setUnitLessons] = useState<Lesson[]>([]);
  const [unitProgress, setUnitProgress] = useState<UnitProgress | null>(null);

  useEffect(() => {
    if (data) {
      setLesson(data.lesson);
      setCourseTitle(data.courseTitle);
      setUnits(data.units);
      setUnitLessons(data.unitLessons);
      setUnitProgress(data.unitProgress);
    }
  }, [data]);

  const handleAddLesson = useCallback(async (lessonData: { title: string; description: string; order: number }) => {
    if (!unitId || !courseId) return;
    const newLesson = await lessonsApi.create(unitId, lessonData);
    setUnitLessons(prev => [...prev, newLesson]);
    navigate(`/courses/${courseId}/units/${unitId}/lessons/${newLesson.id}`);
  }, [unitId, courseId, navigate]);

  const handleUpdate = useCallback(async (updateData: { title: string; description?: string; order: number; objective?: string; planContent?: Record<string, unknown> }) => {
    if (!unitId || !lessonId) return;
    const updated = await lessonsApi.update(unitId, lessonId, updateData);
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
