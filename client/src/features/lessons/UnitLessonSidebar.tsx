import { Link } from 'react-router-dom';
import { BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { Lesson } from '../../api/types.js';

interface UnitLessonSidebarProps {
  lessons: Lesson[];
  currentLessonId: string;
  courseId: string;
  unitId: string;
  courseTitle: string;
  unitTitle: string;
}

export default function UnitLessonSidebar({ lessons, currentLessonId, courseId, unitId, courseTitle, unitTitle }: UnitLessonSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentLesson = lessons.find(l => l.id === currentLessonId);
  const sorted = [...lessons].sort((a, b) => a.order - b.order);

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
              {currentLesson ? `${currentLesson.order}. ${currentLesson.title}` : 'Select Lesson'}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${mobileOpen ? 'rotate-180' : ''}`} />
        </button>
        {mobileOpen && (
          <div className="mt-2 flex flex-col gap-0.5">
            {sorted.map(lesson => {
              const isCurrent = lesson.id === currentLessonId;
              return isCurrent ? (
                <div
                  key={lesson.id}
                  className="px-3 py-1.5 rounded-lg text-sm bg-primary-subtle text-primary font-medium"
                >
                  {lesson.order}. {lesson.title}
                </div>
              ) : (
                <Link
                  key={lesson.id}
                  to={`/courses/${courseId}/units/${unitId}/lessons/${lesson.id}`}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
                >
                  {lesson.order}. {lesson.title}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop: vertical sidebar */}
      <nav
        aria-label="Unit lessons"
        className="hidden lg:flex lg:flex-col lg:w-56 shrink-0 border-r border-border bg-surface py-3 overflow-y-auto"
      >
        <div className="px-4 pb-3 mb-1 border-b border-border flex flex-col gap-1">
          <Link
            to={`/courses/${courseId}`}
            className="text-xs font-semibold text-primary hover:underline truncate"
          >
            {courseTitle}
          </Link>
          <div className="flex items-center gap-1 min-w-0">
            <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
            <span className="text-xs font-medium text-muted-foreground truncate">{unitTitle}</span>
          </div>
        </div>
        <div className="flex flex-col gap-0.5 px-2 pt-1">
          {sorted.map(lesson => {
            const isCurrent = lesson.id === currentLessonId;
            return isCurrent ? (
              <div
                key={lesson.id}
                className="px-3 py-1.5 rounded-lg text-sm bg-primary-subtle text-primary font-medium"
              >
                {lesson.order}. {lesson.title}
              </div>
            ) : (
              <Link
                key={lesson.id}
                to={`/courses/${courseId}/units/${unitId}/lessons/${lesson.id}`}
                className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
              >
                {lesson.order}. {lesson.title}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
