import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { coursesApi } from '../../api/courses.js';
import { unitsApi } from '../../api/units.js';
import type { Course, Unit } from '../../api/types.js';
import UnitList from '../units/UnitList.js';
import UnitForm from '../units/UnitForm.js';
import CourseForm from './CourseForm.js';
import ExamSection from '../exams/ExamSection.js';
import CourseProgressCard from '../progress/CourseProgressCard.js';
import Modal from '../../components/Modal.js';
import ConfirmDialog from '../../components/ConfirmDialog.js';
import Button from '../../components/Button.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);

  async function load() {
    if (!courseId) return;
    try {
      const data = await coursesApi.getOne(courseId);
      setCourse(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load course');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [courseId]);

  async function handleCourseUpdate(data: { title: string; description?: string }) {
    if (!courseId) return;
    const updated = await coursesApi.update(courseId, data);
    setCourse(prev => prev ? { ...prev, ...updated } : null);
    setShowEdit(false);
  }

  async function handleCourseDelete() {
    if (!courseId) return;
    await coursesApi.delete(courseId);
    navigate('/');
  }

  async function handleAddUnit(data: { title: string; order: number }) {
    if (!courseId || !course) return;
    const unit = await unitsApi.create(courseId, data);
    setCourse(prev => prev ? { ...prev, units: [...(prev.units ?? []), { ...unit, _count: { lessons: 0 } }] } : null);
    setShowAddUnit(false);
  }

  async function handleUpdateUnit(data: { title: string; order: number }) {
    if (!courseId || !editingUnit) return;
    const updated = await unitsApi.update(courseId, editingUnit.id, data);
    setCourse(prev => prev ? {
      ...prev,
      units: prev.units?.map(u => u.id === updated.id ? { ...u, ...updated } : u),
    } : null);
    setEditingUnit(null);
  }

  async function handleDeleteUnit() {
    if (!courseId || !deletingUnit) return;
    await unitsApi.delete(courseId, deletingUnit.id);
    setCourse(prev => prev ? {
      ...prev,
      units: prev.units?.filter(u => u.id !== deletingUnit.id),
    } : null);
    setDeletingUnit(null);
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!course) return null;

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link to="/" className="hover:text-foreground">Courses</Link>
        <span>/</span>
        <span className="text-foreground">{course.title}</span>
      </div>

      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
          {course.description && (
            <p className="text-muted-foreground mt-1">{course.description}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" size="sm" onClick={() => setShowEdit(true)}>Edit</Button>
          <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>Delete</Button>
        </div>
      </div>

      <CourseProgressCard courseId={courseId!} />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Units</h2>
        <Button size="sm" onClick={() => setShowAddUnit(true)}>+ Add Unit</Button>
      </div>

      <UnitList
        courseId={courseId!}
        units={course.units ?? []}
        onEdit={setEditingUnit}
        onDelete={setDeletingUnit}
      />

      <ExamSection courseId={courseId!} />

      {showEdit && (
        <Modal title="Edit Course" onClose={() => setShowEdit(false)}>
          <CourseForm initial={course} onSubmit={handleCourseUpdate} onCancel={() => setShowEdit(false)} />
        </Modal>
      )}
      {showDelete && (
        <ConfirmDialog
          title="Delete Course"
          message={`Delete "${course.title}"? This will also delete all units and lessons.`}
          onConfirm={handleCourseDelete}
          onClose={() => setShowDelete(false)}
        />
      )}
      {showAddUnit && (
        <Modal title="Add Unit" onClose={() => setShowAddUnit(false)}>
          <UnitForm
            nextOrder={(course.units?.length ?? 0) + 1}
            onSubmit={handleAddUnit}
            onCancel={() => setShowAddUnit(false)}
          />
        </Modal>
      )}
      {editingUnit && (
        <Modal title="Edit Unit" onClose={() => setEditingUnit(null)}>
          <UnitForm initial={editingUnit} onSubmit={handleUpdateUnit} onCancel={() => setEditingUnit(null)} />
        </Modal>
      )}
      {deletingUnit && (
        <ConfirmDialog
          title="Delete Unit"
          message={`Delete "${deletingUnit.title}"? All lessons inside will also be deleted.`}
          onConfirm={handleDeleteUnit}
          onClose={() => setDeletingUnit(null)}
        />
      )}
    </div>
  );
}
