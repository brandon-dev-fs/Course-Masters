import { Link } from 'react-router-dom';
import { ChevronRight, Plus, ClipboardCheck, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import type { Lesson, Unit } from '../../api/types.js';
import LessonForm from './LessonForm.js';
import Modal from '../../components/Modal.js';
import UnitDropdown from './UnitDropdown.js';

interface UnitLessonSidebarProps {
  lessons: Lesson[];
  currentLessonId: string;
  courseId: string;
  unitId: string;
  courseTitle: string;
  unitTitle: string;
  units?: Unit[];
  canEdit?: boolean;
  onAddLesson?: (data: { title: string; description: string; order: number }) => Promise<void>;
  onUnitTestClick?: () => void;
  unitTestActive?: boolean;
  onLessonClick?: () => void;
  /** Desktop sidebar collapsed state — controlled by LessonDetailPage */
  collapsed?: boolean;
  /** Whether the mobile drawer is open — controlled by LessonDetailPage */
  mobileOpen?: boolean;
  /** Called when the mobile drawer should close */
  onMobileClose?: () => void;
}

export default function UnitLessonSidebar({
  lessons, currentLessonId, courseId, unitId, courseTitle, unitTitle, units = [],
  canEdit, onAddLesson, onUnitTestClick, unitTestActive, onLessonClick,
  collapsed = false, mobileOpen = false, onMobileClose,
}: UnitLessonSidebarProps) {
  const [showAddLesson, setShowAddLesson] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const sorted = [...lessons].sort((a, b) => a.order - b.order);

  async function handleAddLesson(data: { title: string; description: string; order: number }) {
    await onAddLesson?.(data);
    setShowAddLesson(false);
  }

  function handleUnitTestClick() {
    onMobileClose?.();
    onUnitTestClick?.();
  }

  function handleLessonClick() {
    onMobileClose?.();
    onLessonClick?.();
  }

  // Focus management and Escape key for mobile drawer
  useEffect(() => {
    if (!mobileOpen) return;

    // Move focus to close button when drawer opens
    closeButtonRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onMobileClose?.();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onMobileClose]);

  const lessonList = (
    <div className="flex flex-col gap-0.5">
      {sorted.map(lesson => {
        const isCurrent = lesson.id === currentLessonId && !unitTestActive;
        return isCurrent ? (
          <div key={lesson.id} className="px-3 py-1.5 rounded-lg text-sm bg-primary-subtle text-primary font-medium">
            {lesson.order}. {lesson.title}
          </div>
        ) : (
          <Link
            key={lesson.id}
            to={`/courses/${courseId}/units/${unitId}/lessons/${lesson.id}`}
            onClick={handleLessonClick}
            className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
          >
            {lesson.order}. {lesson.title}
          </Link>
        );
      })}
    </div>
  );

  const unitTestItem = onUnitTestClick && (
    <button
      onClick={handleUnitTestClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
        unitTestActive
          ? 'bg-primary-subtle text-primary font-medium'
          : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
      }`}
    >
      <ClipboardCheck className="w-3.5 h-3.5 shrink-0" />
      Unit Test
    </button>
  );

  return (
    <>
      {/* Desktop: collapsible vertical sidebar */}
      <nav
        id="unit-lesson-sidebar"
        aria-label="Unit lessons"
        aria-hidden={collapsed}
        tabIndex={collapsed ? -1 : undefined}
        className={`hidden lg:flex flex-col shrink-0 border-r border-border bg-surface overflow-y-auto transition-all duration-200 ease-in-out ${
          collapsed ? 'w-0 overflow-hidden' : 'w-44'
        }`}
      >
        <div className="py-3 min-w-[176px]">
          <div className="px-4 pb-3 mb-1 border-b border-border flex flex-col gap-2">
            <Link to={`/courses/${courseId}`} className="text-xs font-semibold text-primary hover:underline truncate">
              {courseTitle}
            </Link>
            {units.length > 0 ? (
              <UnitDropdown units={units} currentUnitId={unitId} courseId={courseId} />
            ) : (
              <div className="flex items-center gap-1 min-w-0">
                <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-xs font-medium text-muted-foreground truncate">{unitTitle}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-0.5 px-2 pt-1">
            {lessonList}
            {unitTestItem && (
              <>
                <div className="my-1 border-t border-border" />
                {unitTestItem}
              </>
            )}
            {canEdit && (
              <button
                onClick={() => setShowAddLesson(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-primary hover:bg-surface-raised transition-colors font-medium mt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Lesson
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile: left-drawer overlay */}
      <div className="lg:hidden">
        {/* Backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={onMobileClose}
            role="button"
            aria-label="Close navigation"
          />
        )}
        {/* Drawer */}
        <nav
          role="dialog"
          aria-modal="true"
          aria-label="Lesson navigation"
          className={`fixed left-0 top-0 bottom-0 z-50 w-64 bg-surface shadow-warm-lg overflow-y-auto transition-transform duration-200 ease-in-out ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold text-foreground truncate">{courseTitle}</span>
            <button
              ref={closeButtonRef}
              onClick={onMobileClose}
              aria-label="Close navigation"
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-3 flex flex-col gap-0.5">
            <div className="px-1 pb-2 mb-1 border-b border-border">
              {units.length > 0 ? (
                <UnitDropdown units={units} currentUnitId={unitId} courseId={courseId} />
              ) : (
                <div className="flex items-center gap-1 min-w-0 py-1">
                  <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                  <span className="text-xs font-medium text-muted-foreground truncate">{unitTitle}</span>
                </div>
              )}
            </div>
            {lessonList}
            {unitTestItem && (
              <>
                <div className="my-1 border-t border-border" />
                {unitTestItem}
              </>
            )}
            {canEdit && (
              <button
                onClick={() => { onMobileClose?.(); setShowAddLesson(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-primary hover:bg-surface-raised transition-colors font-medium mt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Lesson
              </button>
            )}
          </div>
        </nav>
      </div>

      {showAddLesson && (
        <Modal title="Add Lesson" onClose={() => setShowAddLesson(false)}>
          <LessonForm
            nextOrder={lessons.length + 1}
            onSubmit={handleAddLesson}
            onCancel={() => setShowAddLesson(false)}
          />
        </Modal>
      )}
    </>
  );
}
