import { Link } from 'react-router-dom';
import { Plus, ClipboardCheck, X, CheckCircle2, Lock, PanelLeft } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import type { Lesson, Unit } from '../../api/types.js';
import LessonForm from './LessonForm.js';
import Modal from '../../components/Modal.js';

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
  /** Completed lesson IDs for completion state indicators */
  completedLessonIds?: Set<string>;
  /** Called when the collapse toggle is clicked */
  onToggle?: () => void;
}

export default function UnitLessonSidebar({
  lessons, currentLessonId, courseId, unitId,
  canEdit, onAddLesson, onUnitTestClick, unitTestActive, onLessonClick,
  collapsed = false, mobileOpen = false, onMobileClose,
  completedLessonIds, onToggle,
}: UnitLessonSidebarProps) {
  const [showAddLesson, setShowAddLesson] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
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

  // Focus management, focus trap, and Escape key for mobile drawer
  useEffect(() => {
    if (!mobileOpen) return;

    // Move focus to close button when drawer opens
    closeButtonRef.current?.focus();

    function getFocusableElements() {
      return Array.from(
        drawerRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onMobileClose?.();
        return;
      }
      if (e.key === 'Tab') {
        const focusable = getFocusableElements();
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onMobileClose]);

  function buildLessonItem(lesson: Lesson) {
    const isCompleted = completedLessonIds?.has(lesson.id) ?? false;
    const isCurrent = lesson.id === currentLessonId && !unitTestActive;

    if (isCurrent) {
      return (
        <div key={lesson.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-primary-subtle text-primary font-medium">
          <span className="w-4 h-4 rounded-full border border-primary text-[10px] flex items-center justify-center shrink-0 font-bold">
            {lesson.order}
          </span>
          <span className="truncate">{lesson.title}</span>
        </div>
      );
    }

    if (isCompleted) {
      return (
        <Link
          key={lesson.id}
          to={`/courses/${courseId}/units/${unitId}/lessons/${lesson.id}`}
          onClick={handleLessonClick}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
        >
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
          <span className="truncate">{lesson.title}</span>
        </Link>
      );
    }

    return (
      <Link
        key={lesson.id}
        to={`/courses/${courseId}/units/${unitId}/lessons/${lesson.id}`}
        onClick={handleLessonClick}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
      >
        <span className="w-4 h-4 rounded-full text-[10px] flex items-center justify-center shrink-0 text-muted-foreground">
          {lesson.order}
        </span>
        <span className="truncate">{lesson.title}</span>
      </Link>
    );
  }

  const lessonList = (
    <div className="flex flex-col gap-0.5">
      {sorted.map(lesson => buildLessonItem(lesson))}
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
      <Lock className="w-3.5 h-3.5 shrink-0" />
      Unit Test
    </button>
  );

  const desktopHeader = (
    <div className="flex items-center justify-between px-3 py-2 border-b border-border">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lessons</span>
      {onToggle && (
        <button
          onClick={onToggle}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <PanelLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop: collapsible vertical sidebar */}
      <nav
        id="unit-lesson-sidebar"
        aria-label="Unit lessons"
        className={`hidden lg:flex flex-col shrink-0 border-r border-border bg-surface overflow-y-auto transition-all duration-200 ease-in-out ${
          collapsed ? 'w-9' : 'w-44'
        }`}
      >
        {collapsed ? (
          <div className="flex flex-col items-center pt-2">
            {onToggle && (
              <button
                onClick={onToggle}
                className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
                aria-label="Expand sidebar"
              >
                <PanelLeft className="w-4 h-4 rotate-180" />
              </button>
            )}
          </div>
        ) : (
          <>
            {desktopHeader}
            {/* min-w matches parent w-44 = 176px to prevent content reflow during collapse */}
            <div className="py-2 min-w-[176px]">
              <div className="flex flex-col gap-0.5 px-2">
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
          </>
        )}
      </nav>

      {/* Mobile: left-drawer overlay */}
      <div className="lg:hidden">
        {/* Backdrop */}
        {mobileOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 cursor-default"
            onClick={onMobileClose}
            aria-label="Close navigation"
          />
        )}
        {/* Drawer */}
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Lesson navigation"
          className={`fixed left-0 top-0 bottom-0 z-50 w-64 bg-surface shadow-warm-lg overflow-y-auto transition-transform duration-200 ease-in-out ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold text-foreground">Lessons</span>
            <button
              ref={closeButtonRef}
              onClick={onMobileClose}
              aria-label="Close navigation"
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <nav aria-label="Lessons in this unit">
            <div className="p-3 flex flex-col gap-0.5">
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
