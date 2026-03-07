import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { unitsApi } from '../../api/units.js';
import { lessonsApi } from '../../api/lessons.js';
import type { Unit, Lesson } from '../../api/types.js';
import LessonList from '../lessons/LessonList.js';
import LessonForm from '../lessons/LessonForm.js';
import TestSection from '../tests/TestSection.js';
import UnitProgressCard from '../progress/UnitProgressCard.js';
import Modal from '../../components/Modal.js';
import ConfirmDialog from '../../components/ConfirmDialog.js';
import Button from '../../components/Button.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';

export default function UnitDetailPage() {
  const { courseId, unitId } = useParams<{ courseId: string; unitId: string }>();
  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null);

  async function load() {
    if (!courseId || !unitId) return;
    try {
      const data = await unitsApi.getOne(courseId, unitId);
      setUnit(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load unit');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [courseId, unitId]);

  async function handleAddLesson(data: { title: string; order: number }) {
    if (!unitId) return;
    const lesson = await lessonsApi.create(unitId, data);
    setUnit(prev => prev ? { ...prev, lessons: [...(prev.lessons ?? []), lesson] } : null);
    setShowAddLesson(false);
  }

  async function handleUpdateLesson(data: { title: string; order: number }) {
    if (!unitId || !editingLesson) return;
    const updated = await lessonsApi.update(unitId, editingLesson.id, data);
    setUnit(prev => prev ? { ...prev, lessons: prev.lessons?.map(l => l.id === updated.id ? updated : l) } : null);
    setEditingLesson(null);
  }

  async function handleDeleteLesson() {
    if (!unitId || !deletingLesson) return;
    await lessonsApi.delete(unitId, deletingLesson.id);
    setUnit(prev => prev ? { ...prev, lessons: prev.lessons?.filter(l => l.id !== deletingLesson.id) } : null);
    setDeletingLesson(null);
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!unit) return null;

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link to="/" className="hover:text-foreground">Courses</Link>
        <span>/</span>
        <Link to={`/courses/${courseId}`} className="hover:text-foreground">Course</Link>
        <span>/</span>
        <span className="text-foreground">{unit.title}</span>
      </div>

      <div className="flex items-start justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-foreground">{unit.order}. {unit.title}</h1>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Lessons</h2>
        <Button size="sm" onClick={() => setShowAddLesson(true)}>+ Add Lesson</Button>
      </div>

      <UnitProgressCard courseId={courseId!} unitId={unitId!} />

      <LessonList
        courseId={courseId!}
        unitId={unitId!}
        lessons={unit.lessons ?? []}
        onEdit={setEditingLesson}
        onDelete={setDeletingLesson}
      />

      <TestSection unitId={unitId!} />

      {showAddLesson && (
        <Modal title="Add Lesson" onClose={() => setShowAddLesson(false)}>
          <LessonForm
            nextOrder={(unit.lessons?.length ?? 0) + 1}
            onSubmit={handleAddLesson}
            onCancel={() => setShowAddLesson(false)}
          />
        </Modal>
      )}
      {editingLesson && (
        <Modal title="Edit Lesson" onClose={() => setEditingLesson(null)}>
          <LessonForm initial={editingLesson} onSubmit={handleUpdateLesson} onCancel={() => setEditingLesson(null)} />
        </Modal>
      )}
      {deletingLesson && (
        <ConfirmDialog
          title="Delete Lesson"
          message={`Delete "${deletingLesson.title}"? All content inside will also be deleted.`}
          onConfirm={handleDeleteLesson}
          onClose={() => setDeletingLesson(null)}
        />
      )}
    </div>
  );
}
