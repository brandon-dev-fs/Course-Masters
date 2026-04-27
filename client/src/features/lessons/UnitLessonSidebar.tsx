import { Link } from 'react-router-dom';
import { BookOpen, ChevronDown, ChevronRight, Plus, ClipboardCheck } from 'lucide-react';
import { useState } from 'react';
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
}

export default function UnitLessonSidebar({
  lessons, currentLessonId, courseId, unitId, courseTitle, unitTitle, units = [],
  canEdit, onAddLesson, onUnitTestClick, unitTestActive, onLessonClick,
}: UnitLessonSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const currentLesson = lessons.find(l => l.id === currentLessonId);
  const sorted = [...lessons].sort((a, b) => a.order - b.order);

  async function handleAddLesson(data: { title: string; description: string; order: number }) {
    await onAddLesson?.(data);
    setShowAddLesson(false);
  }

  const unitTestItem = onUnitTestClick && (
    <button
      onClick={() => { setMobileOpen(false); onUnitTestClick(); }}
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
      {/* Mobile: dropdown at top */}
      <div className="lg:hidden border-b border-border bg-surface px-4 py-2">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-full flex items-center justify-between gap-2 text-left"
        >
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium text-foreground truncate">
              {unitTestActive ? 'Unit Test' : currentLesson ? `${currentLesson.order}. ${currentLesson.title}` : 'Select Lesson'}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${mobileOpen ? 'rotate-180' : ''}`} />
        </button>
        {mobileOpen && (
          <div className="mt-2 flex flex-col gap-0.5">
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
                  onClick={() => { setMobileOpen(false); onLessonClick?.(); }}
                  className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
                >
                  {lesson.order}. {lesson.title}
                </Link>
              );
            })}
            {unitTestItem}
            {canEdit && (
              <button
                onClick={() => { setMobileOpen(false); setShowAddLesson(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-primary hover:bg-surface-raised transition-colors font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Lesson
              </button>
            )}
          </div>
        )}
      </div>

      {/* Desktop: vertical sidebar */}
      <nav
        aria-label="Unit lessons"
        className="hidden lg:flex lg:flex-col lg:w-56 shrink-0 border-r border-border bg-surface py-3 overflow-y-auto"
      >
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
                onClick={onLessonClick}
                className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
              >
                {lesson.order}. {lesson.title}
              </Link>
            );
          })}
          {unitTestItem}
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
      </nav>

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
