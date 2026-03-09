import { useState } from 'react';
import type { Course, Unit } from '../../api/types.js';
import Modal from '../../components/Modal.js';
import ConfirmDialog from '../../components/ConfirmDialog.js';
import Button from '../../components/Button.js';
import CourseForm from './CourseForm.js';
import UnitForm from '../units/UnitForm.js';
import LessonForm from '../lessons/LessonForm.js';

interface CourseSettingsModalProps {
  course: Course;
  onClose: () => void;
  onUpdateCourse: (data: { title: string; description?: string }) => Promise<void>;
  onDeleteCourse: () => Promise<void>;
  onUpdateUnit: (unit: Unit, data: { title: string; order: number }) => Promise<void>;
  onDeleteUnit: (unit: Unit) => Promise<void>;
  onAddLesson: (unitId: string, data: { title: string; description?: string; order: number }) => Promise<void>;
}

export default function CourseSettingsModal({
  course,
  onClose,
  onUpdateCourse,
  onDeleteCourse,
  onUpdateUnit,
  onDeleteUnit,
  onAddLesson,
}: CourseSettingsModalProps) {
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);
  const [addingLessonUnit, setAddingLessonUnit] = useState<string | null>(null);
  const [showDeleteCourse, setShowDeleteCourse] = useState(false);

  const sorted = [...(course.units ?? [])].sort((a, b) => a.order - b.order);

  return (
    <Modal title="Course Settings" size="lg" onClose={onClose}>
      <div className="flex flex-col gap-6">
        {/* Course Info */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Course Info</p>
          <CourseForm
            initial={course}
            onSubmit={onUpdateCourse}
            onCancel={onClose}
          />
        </div>

        {/* Units */}
        <div className="border-t border-border pt-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Units</p>
          {sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground">No units yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {sorted.map(unit => (
                <div key={unit.id}>
                  <div className="flex items-center gap-3 rounded-lg bg-surface border border-border px-3 py-2">
                    <span className="w-6 h-6 flex items-center justify-center rounded bg-primary-subtle text-primary text-xs font-bold shrink-0">
                      {unit.order}
                    </span>
                    <span className="flex-1 font-medium text-foreground text-sm truncate">{unit.title}</span>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setAddingLessonUnit(prev => prev === unit.id ? null : unit.id);
                          setEditingUnit(null);
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-surface-raised transition-colors"
                      >
                        + Lesson
                      </button>
                      <button
                        onClick={() => {
                          setEditingUnit(prev => prev?.id === unit.id ? null : unit);
                          setAddingLessonUnit(null);
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-surface-raised transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingUnit(unit)}
                        className="text-xs text-muted-foreground hover:text-destructive px-2 py-1 rounded hover:bg-surface-raised transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {addingLessonUnit === unit.id && (
                    <div className="mt-2 px-3 py-3 rounded-lg bg-surface-raised border border-border">
                      <LessonForm
                        nextOrder={(unit._count?.lessons ?? 0) + 1}
                        onSubmit={async data => {
                          await onAddLesson(unit.id, data);
                          setAddingLessonUnit(null);
                        }}
                        onCancel={() => setAddingLessonUnit(null)}
                      />
                    </div>
                  )}

                  {editingUnit?.id === unit.id && (
                    <div className="mt-2 px-3 py-3 rounded-lg bg-surface-raised border border-border">
                      <UnitForm
                        initial={unit}
                        onSubmit={data => onUpdateUnit(unit, data)}
                        onCancel={() => setEditingUnit(null)}
                      />
                    </div>
                  )}

                  {deletingUnit?.id === unit.id && (
                    <ConfirmDialog
                      title="Delete Unit"
                      message={`Delete "${unit.title}"? All lessons inside will also be deleted.`}
                      onConfirm={async () => {
                        await onDeleteUnit(unit);
                        setDeletingUnit(null);
                      }}
                      onClose={() => setDeletingUnit(null)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="border-t border-border pt-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Danger Zone</p>
          {showDeleteCourse ? (
            <ConfirmDialog
              title="Delete Course"
              message={`Delete "${course.title}"? This will also delete all units and lessons.`}
              onConfirm={onDeleteCourse}
              onClose={() => setShowDeleteCourse(false)}
            />
          ) : (
            <Button variant="danger" size="sm" onClick={() => setShowDeleteCourse(true)}>
              Delete Course
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
