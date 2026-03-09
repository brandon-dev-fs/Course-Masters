import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { unitsApi } from '../../api/units.js';
import { lessonsApi } from '../../api/lessons.js';
import { progressApi } from '../../api/progress.js';
import type { Unit, Lesson, UnitProgress } from '../../api/types.js';
import LessonList from '../lessons/LessonList.js';
import LessonForm from '../lessons/LessonForm.js';
import ProgressBar from '../progress/ProgressBar.js';
import Modal from '../../components/Modal.js';
import ConfirmDialog from '../../components/ConfirmDialog.js';
import Button from '../../components/Button.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';

interface UnitAccordionItemProps {
  courseId: string;
  unit: Unit;
  isExpanded: boolean;
  onToggle: () => void;
  onEditUnit: (unit: Unit) => void;
  onDeleteUnit: (unit: Unit) => void;
}

export default function UnitAccordionItem({
  courseId,
  unit,
  isExpanded,
  onToggle,
  onEditUnit,
  onDeleteUnit,
}: UnitAccordionItemProps) {
  const [loaded, setLoaded] = useState(false);
  const [loadingBody, setLoadingBody] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonCount, setLessonCount] = useState(unit._count?.lessons ?? 0);
  const [progress, setProgress] = useState<UnitProgress | null>(null);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    if (isExpanded && !loaded) {
      setLoadingBody(true);
      Promise.all([
        unitsApi.getOne(courseId, unit.id),
        progressApi.getUnit(courseId, unit.id),
      ])
        .then(([unitData, progressData]) => {
          setLessons(unitData.lessons ?? []);
          setProgress(progressData);
          setLoaded(true);
        })
        .catch(() => {})
        .finally(() => setLoadingBody(false));
    }
  }, [isExpanded, courseId, unit.id, loaded]);

  async function handleAddLesson(data: { title: string; order: number }) {
    const lesson = await lessonsApi.create(unit.id, data);
    setLessons(prev => [...prev, lesson]);
    setLessonCount(prev => prev + 1);
    setShowAddLesson(false);
  }

  async function handleUpdateLesson(data: { title: string; order: number }) {
    if (!editingLesson) return;
    const updated = await lessonsApi.update(unit.id, editingLesson.id, data);
    setLessons(prev => prev.map(l => l.id === updated.id ? updated : l));
    setEditingLesson(null);
  }

  async function handleDeleteLesson() {
    if (!deletingLesson) return;
    await lessonsApi.delete(unit.id, deletingLesson.id);
    setLessons(prev => prev.filter(l => l.id !== deletingLesson.id));
    setLessonCount(prev => prev - 1);
    setDeletingLesson(null);
  }

  return (
    <div className={`rounded-xl bg-surface border transition-all ${isExpanded ? 'border-primary/40 shadow-warm-md' : 'border-border shadow-warm-sm'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onToggle}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
        >
          <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary-subtle text-primary text-xs font-bold shrink-0">
            {unit.order}
          </span>
          <span className="font-medium text-foreground truncate">{unit.title}</span>
        </button>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-muted-foreground">{lessonCount} lessons</span>
          <div className="flex gap-1">
            <button
              onClick={e => { e.stopPropagation(); onEditUnit(unit); }}
              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-surface-raised transition-colors"
            >
              Edit
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDeleteUnit(unit); }}
              className="text-xs text-muted-foreground hover:text-destructive px-2 py-1 rounded hover:bg-surface-raised transition-colors"
            >
              Delete
            </button>
          </div>
          <button onClick={onToggle} className="text-muted-foreground hover:text-foreground transition-colors">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Accordion body with grid animation */}
      <div
        className="grid transition-[grid-template-rows] duration-300"
        style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden min-h-0">
          <div className="border-t border-border px-4 py-4 flex flex-col gap-4">
            {loadingBody ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner />
              </div>
            ) : (
              <>
                {/* Compact progress summary */}
                {progress && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{progress.completedLessons}/{progress.totalLessons} lessons complete</span>
                      <span className={progress.testPassed ? 'text-accent font-medium' : ''}>
                        Test: {progress.testPassed ? '✓ Passed' : '— Pending'}
                      </span>
                    </div>
                    <ProgressBar percent={progress.percentComplete} />
                  </div>
                )}

                {/* Lessons */}
                <LessonList
                  courseId={courseId}
                  unitId={unit.id}
                  lessons={lessons}
                  onEdit={setEditingLesson}
                  onDelete={setDeletingLesson}
                  lessonProgress={progress?.lessons}
                />

                <div className="flex justify-end">
                  <Button size="sm" onClick={() => setShowAddLesson(true)}>+ Add Lesson</Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lesson CRUD modals */}
      {showAddLesson && (
        <Modal title="Add Lesson" onClose={() => setShowAddLesson(false)}>
          <LessonForm
            nextOrder={lessons.length + 1}
            onSubmit={handleAddLesson}
            onCancel={() => setShowAddLesson(false)}
          />
        </Modal>
      )}
      {editingLesson && (
        <Modal title="Edit Lesson" onClose={() => setEditingLesson(null)}>
          <LessonForm
            initial={editingLesson}
            onSubmit={handleUpdateLesson}
            onCancel={() => setEditingLesson(null)}
          />
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
