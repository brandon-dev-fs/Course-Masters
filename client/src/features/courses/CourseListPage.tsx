import { useEffect, useState } from 'react';
import { coursesApi } from '../../api/courses.js';
import type { Course } from '../../api/types.js';
import CourseCard from './CourseCard.js';
import CourseForm from './CourseForm.js';
import HeroSection from './HeroSection.js';
import Modal from '../../components/Modal.js';
import ConfirmDialog from '../../components/ConfirmDialog.js';
import Button from '../../components/Button.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import EmptyState from '../../components/EmptyState.js';

export default function CourseListPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState<Course | null>(null);

  async function load() {
    try {
      const data = await coursesApi.getAll();
      setCourses(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function handleCreate(data: { title: string; description?: string }) {
    const course = await coursesApi.create(data);
    setCourses(prev => [course, ...prev]);
    setShowCreate(false);
  }

  async function handleUpdate(data: { title: string; description?: string }) {
    if (!editing) return;
    const updated = await coursesApi.update(editing.id, data);
    setCourses(prev => prev.map(c => c.id === updated.id ? updated : c));
    setEditing(null);
  }

  async function handleDelete() {
    if (!deleting) return;
    await coursesApi.delete(deleting.id);
    setCourses(prev => prev.filter(c => c.id !== deleting.id));
    setDeleting(null);
  }

  if (loading) return <LoadingSpinner fullPage />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <HeroSection hasCourses={courses.length > 0} onCreateCourse={() => setShowCreate(true)} />

      <div id="courses" className="scroll-mt-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">My Courses</h2>
          <Button onClick={() => setShowCreate(true)}>+ New Course</Button>
        </div>

        {courses.length === 0 ? (
          <EmptyState
            icon="📚"
            title="No courses yet"
            description="Create your first course to get started."
            action={{ label: '+ New Course', onClick: () => setShowCreate(true) }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                onEdit={() => setEditing(course)}
                onDelete={() => setDeleting(course)}
              />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <Modal title="New Course" onClose={() => setShowCreate(false)}>
          <CourseForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
        </Modal>
      )}

      {editing && (
        <Modal title="Edit Course" onClose={() => setEditing(null)}>
          <CourseForm initial={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete Course"
          message={`Delete "${deleting.title}"? This will also delete all its units and lessons.`}
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
