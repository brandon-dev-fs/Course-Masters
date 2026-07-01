import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';

import { useBuilderOutline } from './hooks/useBuilderOutline.js';
import OutlineTree from './OutlineTree.js';
import BuilderTopBar from './BuilderTopBar.js';
import BuilderSidebar from './BuilderSidebar.js';
import ScreenReaderAnnouncer from './ScreenReaderAnnouncer.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import ConfirmDialog from '../../components/ConfirmDialog.js';
import Modal from '../../components/Modal.js';
import Button from '../../components/Button.js';
import UnitForm from '../units/UnitForm.js';
import LessonForm from '../lessons/LessonForm.js';
import AssignmentFormModal from '../assignments/AssignmentFormModal.js';

import type { Assignment, ReorderItem, BuilderUnit, BuilderLesson, BuilderActivity } from '../../api/types.js';
import type { CreateAssignmentPayload, UpdateAssignmentPayload } from '../../api/assignments.js';

interface DeleteTarget {
  id: string;
  name: string;
  type: 'unit' | 'lesson' | 'activity';
  /** Parent unit ID — required for lesson deletes */
  parentUnitId?: string;
  /** Parent lesson ID — required for activity deletes */
  parentLessonId?: string;
}

export default function CourseBuilderPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const resolvedCourseId = courseId ?? '';

  const {
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
  } = useBuilderOutline(resolvedCourseId);

  // ── Expand / collapse state ───────────────────────────────────────────────
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());

  // ── Rename state ──────────────────────────────────────────────────────────
  const [renamingId, setRenamingId] = useState<string | null>(null);

  // ── Screen reader announcements ───────────────────────────────────────────
  const [announcement, setAnnouncement] = useState('');

  // ── Delete confirmation state ─────────────────────────────────────────────
  const [deletingItem, setDeletingItem] = useState<DeleteTarget | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  // ── Add unit modal state ──────────────────────────────────────────────────
  const [addUnitModalOpen, setAddUnitModalOpen] = useState(false);

  // ── Edit unit modal state ─────────────────────────────────────────────────
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);

  // ── Add lesson modal state ────────────────────────────────────────────────
  const [addLessonUnitId, setAddLessonUnitId] = useState<string | null>(null);

  // ── Add activity modal state ──────────────────────────────────────────────
  const [addActivityLessonId, setAddActivityLessonId] = useState<string | null>(null);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleToggleUnit = useCallback((unitId: string) => {
    setExpandedUnits((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) {
        next.delete(unitId);
      } else {
        next.add(unitId);
      }
      return next;
    });
  }, []);

  const handleToggleLesson = useCallback((lessonId: string) => {
    setExpandedLessons((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) {
        next.delete(lessonId);
      } else {
        next.add(lessonId);
      }
      return next;
    });
  }, []);

  const handleStartRename = useCallback((id: string) => {
    setRenamingId(id);
  }, []);

  const handleCancelRename = useCallback(() => {
    setRenamingId(null);
  }, []);

  const handleRenameUnit = useCallback(async (cId: string, unitId: string, title: string) => {
    await renameUnit(cId, unitId, title);
    setRenamingId(null);
    setAnnouncement(`Renamed to ${title}`);
  }, [renameUnit]);

  const handleRenameLesson = useCallback(async (unitId: string, lessonId: string, title: string) => {
    await renameLesson(unitId, lessonId, title);
    setRenamingId(null);
    setAnnouncement(`Renamed to ${title}`);
  }, [renameLesson]);

  const handleAddUnit = useCallback(() => {
    setAddUnitModalOpen(true);
  }, []);

  const handleSubmitNewUnit = useCallback(async (data: { title: string; description: string; order: number }) => {
    await addUnit(data);
    setAddUnitModalOpen(false);
    setAnnouncement('Unit created');
  }, [addUnit]);

  const handleEditUnit = useCallback((unitId: string) => {
    setEditingUnitId(unitId);
  }, []);

  const handleSubmitEditUnit = useCallback(async (data: { title: string; description: string; order: number }) => {
    if (!editingUnitId) return;
    await editUnit(resolvedCourseId, editingUnitId, data);
    setEditingUnitId(null);
    setAnnouncement('Unit updated');
  }, [editUnit, editingUnitId, resolvedCourseId]);

  const handleAddLesson = useCallback((unitId: string) => {
    setAddLessonUnitId(unitId);
  }, []);

  const handleSubmitNewLesson = useCallback(async (data: { title: string; description: string; order: number }) => {
    if (!addLessonUnitId) return;
    await addLesson(addLessonUnitId, data);
    setAddLessonUnitId(null);
    setAnnouncement('Lesson created');
  }, [addLesson, addLessonUnitId]);

  const handleAddActivity = useCallback((lessonId: string) => {
    setAddActivityLessonId(lessonId);
  }, []);

  const handleSubmitNewActivity = useCallback(async (payload: CreateAssignmentPayload | UpdateAssignmentPayload) => {
    if (!addActivityLessonId) return;
    await addActivity(addActivityLessonId, payload as CreateAssignmentPayload);
    setAddActivityLessonId(null);
    setAnnouncement('Activity created');
  }, [addActivity, addActivityLessonId]);

  const handleFileCreate = useCallback((assignment: Assignment) => {
    if (!addActivityLessonId) return;
    const lessonId = addActivityLessonId;
    setOutline((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        units: prev.units.map((u) => ({
          ...u,
          lessons: u.lessons.map((l) =>
            l.id === lessonId
              ? { ...l, assignments: [...l.assignments, { id: assignment.id, title: assignment.title, type: assignment.type, order: assignment.order }] }
              : l,
          ),
        })),
      };
    });
    setAddActivityLessonId(null);
    setAnnouncement('Activity created');
  }, [addActivityLessonId, setOutline]);

  // ── Confirm delete ────────────────────────────────────────────────────────

  const handleConfirmDeleteUnit = useCallback((unitId: string) => {
    if (!outline) return;
    const unit = outline.units.find((u) => u.id === unitId);
    if (!unit) return;
    setDeleteError('');
    setDeletingItem({ id: unitId, name: unit.title, type: 'unit' });
  }, [outline]);

  const handleConfirmDeleteLesson = useCallback((unitId: string, lessonId: string) => {
    if (!outline) return;
    const unit = outline.units.find((u) => u.id === unitId);
    const lesson = unit?.lessons.find((l) => l.id === lessonId);
    if (!lesson) return;
    setDeleteError('');
    setDeletingItem({ id: lessonId, name: lesson.title, type: 'lesson', parentUnitId: unitId });
  }, [outline]);

  const handleConfirmDeleteActivity = useCallback((lessonId: string, assignmentId: string) => {
    if (!outline) return;
    const activity = outline.units
      .flatMap((u) => u.lessons)
      .find((l) => l.id === lessonId)
      ?.assignments.find((a) => a.id === assignmentId);
    if (!activity) return;
    setDeleteError('');
    setDeletingItem({ id: assignmentId, name: activity.title, type: 'activity', parentLessonId: lessonId });
  }, [outline]);

  async function handleConfirmDelete() {
    if (!deletingItem) return;
    setDeleting(true);
    setDeleteError('');
    try {
      if (deletingItem.type === 'unit') {
        await deleteUnit(resolvedCourseId, deletingItem.id);
      } else if (deletingItem.type === 'lesson' && deletingItem.parentUnitId) {
        await deleteLesson(deletingItem.parentUnitId, deletingItem.id);
      } else if (deletingItem.type === 'activity' && deletingItem.parentLessonId) {
        await deleteActivity(deletingItem.id, deletingItem.parentLessonId);
      }
      setAnnouncement(`${deletingItem.name} deleted`);
      setDeletingItem(null);
    } catch {
      setDeleteError('Failed to delete. Please try again.');
    } finally {
      setDeleting(false);
    }
  }

  // ── Reorder ───────────────────────────────────────────────────────────────

  const handleReorderUnits = useCallback(async (reordered: BuilderUnit[], items: ReorderItem[]) => {
    await reorderUnits(resolvedCourseId, reordered, items);
  }, [reorderUnits, resolvedCourseId]);

  const handleReorderLessons = useCallback(async (unitId: string, reordered: BuilderLesson[], items: ReorderItem[]) => {
    await reorderLessons(unitId, reordered, items);
  }, [reorderLessons]);

  const handleReorderActivities = useCallback(async (lessonId: string, reordered: BuilderActivity[], assignmentIds: string[]) => {
    await reorderActivities(lessonId, reordered, assignmentIds);
  }, [reorderActivities]);

  // ── Mobile move up/down ───────────────────────────────────────────────────

  const handleMoveUnit = useCallback((unitId: string, direction: 'up' | 'down') => {
    if (!outline) return;
    const sorted = [...outline.units].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((u) => u.id === unitId);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const reordered = [...sorted];
    const tmp = reordered[idx];
    reordered[idx] = reordered[swapIdx];
    reordered[swapIdx] = tmp;
    const withOrder = reordered.map((u, i) => ({ ...u, order: i + 1 }));
    const items: ReorderItem[] = withOrder.map((u) => ({ id: u.id, order: u.order }));
    reorderUnits(resolvedCourseId, withOrder, items).catch(() => {});
    setAnnouncement(`Unit moved ${direction}`);
  }, [outline, reorderUnits, resolvedCourseId]);

  const handleMoveLesson = useCallback((unitId: string, lessonId: string, direction: 'up' | 'down') => {
    if (!outline) return;
    const unit = outline.units.find((u) => u.id === unitId);
    if (!unit) return;
    const sorted = [...unit.lessons].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((l) => l.id === lessonId);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const reordered = [...sorted];
    const tmp = reordered[idx];
    reordered[idx] = reordered[swapIdx];
    reordered[swapIdx] = tmp;
    const withOrder = reordered.map((l, i) => ({ ...l, order: i + 1 }));
    const items: ReorderItem[] = withOrder.map((l) => ({ id: l.id, order: l.order }));
    reorderLessons(unitId, withOrder, items).catch(() => {});
    setAnnouncement(`Lesson moved ${direction}`);
  }, [outline, reorderLessons]);

  const handleMoveActivity = useCallback((lessonId: string, assignmentId: string, _direction: 'up' | 'down') => {
    // Mobile move is handled within LessonRow; this is just for announcement
    setAnnouncement(`Activity moved`);
    void lessonId;
    void assignmentId;
  }, []);

  // ── Derived sidebar content ───────────────────────────────────────────────

  const sidebarContent = outline ? <BuilderSidebar outline={outline} /> : null;

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
        <LoadingSpinner fullPage />
      </div>
    );
  }

  if (error || !outline) {
    return (
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
        <ErrorMessage message={error || 'Failed to load course outline.'} />
        <Button variant="secondary" className="mt-4" onClick={reload}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
      <ScreenReaderAnnouncer message={announcement} />

      <BuilderTopBar
        courseId={resolvedCourseId}
        courseTitle={outline.course.title}
        sidebarContent={sidebarContent}
      />

      <div className="flex gap-8">
        {/* Main outline column */}
        <main className="flex-1 min-w-0">
          <OutlineTree
            units={outline.units}
            courseAssessment={outline.courseAssessment}
            courseId={resolvedCourseId}
            expandedUnits={expandedUnits}
            expandedLessons={expandedLessons}
            renamingId={renamingId}
            onToggleUnit={handleToggleUnit}
            onToggleLesson={handleToggleLesson}
            onRenameUnit={handleRenameUnit}
            onRenameLesson={handleRenameLesson}
            onStartRename={handleStartRename}
            onCancelRename={handleCancelRename}
            onDeleteUnit={handleConfirmDeleteUnit}
            onDeleteLesson={handleConfirmDeleteLesson}
            onDeleteActivity={handleConfirmDeleteActivity}
            onAddUnit={handleAddUnit}
            onAddLesson={handleAddLesson}
            onAddActivity={handleAddActivity}
            onReorderUnits={handleReorderUnits}
            onReorderLessons={handleReorderLessons}
            onReorderActivities={handleReorderActivities}
            onMoveUnit={handleMoveUnit}
            onMoveLesson={handleMoveLesson}
            onMoveActivity={handleMoveActivity}
            onEditUnit={handleEditUnit}
            announce={setAnnouncement}
            onConfirmDeleteUnit={handleConfirmDeleteUnit}
            onConfirmDeleteLesson={handleConfirmDeleteLesson}
            onConfirmDeleteActivity={handleConfirmDeleteActivity}
          />
        </main>

        {/* Sidebar — desktop only */}
        <BuilderSidebar outline={outline} />
      </div>

      {/* Delete confirmation dialog */}
      {deletingItem && (
        <ConfirmDialog
          title={`Delete ${deletingItem.type}`}
          message={
            deletingItem.type === 'unit'
              ? `Are you sure you want to delete "${deletingItem.name}" and all its lessons and activities? This cannot be undone.`
              : deletingItem.type === 'lesson'
              ? `Are you sure you want to delete "${deletingItem.name}" and all its activities? This cannot be undone.`
              : `Are you sure you want to delete "${deletingItem.name}"? This cannot be undone.`
          }
          confirmLabel={deleting ? 'Deleting...' : 'Delete'}
          onConfirm={handleConfirmDelete}
          onClose={() => {
            if (!deleting) setDeletingItem(null);
          }}
        />
      )}

      {/* Inline delete error (shown below dialog if it stays open) */}
      {deleteError && (
        <div className="fixed bottom-4 right-4 z-50">
          <ErrorMessage message={deleteError} />
        </div>
      )}

      {/* Add unit modal */}
      {addUnitModalOpen && (
        <Modal title="Add Unit" onClose={() => setAddUnitModalOpen(false)}>
          <UnitForm
            nextOrder={(outline.units.length) + 1}
            onSubmit={handleSubmitNewUnit}
            onCancel={() => setAddUnitModalOpen(false)}
          />
        </Modal>
      )}

      {/* Add lesson modal */}
      {addLessonUnitId && (() => {
        const unit = outline.units.find((u) => u.id === addLessonUnitId);
        if (!unit) return null;
        return (
          <Modal title="Add Lesson" onClose={() => setAddLessonUnitId(null)}>
            <LessonForm
              nextOrder={unit.lessons.length + 1}
              onSubmit={handleSubmitNewLesson}
              onCancel={() => setAddLessonUnitId(null)}
            />
          </Modal>
        );
      })()}

      {/* Edit unit modal */}
      {editingUnitId && (() => {
        const editingUnit = outline.units.find((u) => u.id === editingUnitId);
        if (!editingUnit) return null;
        return (
          <Modal title="Edit Unit" onClose={() => setEditingUnitId(null)}>
            <UnitForm
              initial={{ id: editingUnit.id, title: editingUnit.title, description: editingUnit.description, order: editingUnit.order }}
              onSubmit={handleSubmitEditUnit}
              onCancel={() => setEditingUnitId(null)}
            />
          </Modal>
        );
      })()}

      {/* Add activity modal */}
      {addActivityLessonId && (
        <AssignmentFormModal
          lessonId={addActivityLessonId}
          onSubmit={handleSubmitNewActivity}
          onFileCreate={handleFileCreate}
          onClose={() => setAddActivityLessonId(null)}
        />
      )}
    </div>
  );
}
