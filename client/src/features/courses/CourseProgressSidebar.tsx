import { Calendar, ChevronRight, CreditCard, List, Plus } from 'lucide-react';

import type { Course, CourseProgress } from '../../api/types.js';

import ProgressBar from '../progress/ProgressBar.js';

interface CourseProgressSidebarProps {
  progress: CourseProgress | null;
  course: Course;
  canEdit: boolean;
  onOpenSyllabus: () => void;
  onOpenCalendar: () => void;
  onReviewFlashCards: () => void;
  onAddUnit: () => void;
}

const actionRowClasses =
  'flex items-center gap-2 w-full text-sm text-text-primary hover:text-blue-accent transition-colors py-1.5 rounded-lg hover:bg-surface-raised px-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-accent';

export default function CourseProgressSidebar({
  progress,
  course: _course,
  canEdit,
  onOpenSyllabus,
  onOpenCalendar,
  onReviewFlashCards,
  onAddUnit,
}: CourseProgressSidebarProps) {
  const percentComplete = progress?.percentComplete ?? 0;

  return (
    <aside aria-label="Course progress" className="flex flex-col gap-4">
      {/* Progress Card */}
      <div className="bg-surface border border-border-subtle rounded-xl p-4 shadow-warm-sm">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Course progress</h2>
        <p>
          <span className="text-3xl font-bold text-text-primary">{percentComplete}%</span>
          <span className="text-sm text-text-secondary ml-2">complete</span>
        </p>
        <ProgressBar
          percent={percentComplete}
          className="mt-2 mb-3"
          role="progressbar"
          aria-valuenow={percentComplete}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Course completion"
        />
        <dl className="flex flex-col gap-1.5">
          <div className="flex justify-between text-sm">
            <dt className="text-text-secondary">Lessons</dt>
            <dd className="font-medium text-text-primary">
              {progress?.completedLessons ?? 0}/{progress?.totalLessons ?? 0}
            </dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-text-secondary">Unit tests</dt>
            <dd className="font-medium text-text-primary">
              {progress?.completedUnits ?? 0}/{progress?.totalUnits ?? 0}
            </dd>
          </div>
        </dl>
      </div>

      {/* Quick Actions Card */}
      <div className="bg-surface border border-border-subtle rounded-xl p-4 shadow-warm-sm">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Quick actions</h2>
        <nav aria-label="Quick actions">
          <ul className="flex flex-col gap-1">
            <li>
              <button onClick={onReviewFlashCards} className={actionRowClasses}>
                <CreditCard className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="flex-1 text-left">Review flash cards</span>
                <ChevronRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </button>
            </li>
            <li>
              <button onClick={onOpenSyllabus} className={actionRowClasses}>
                <List className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="flex-1 text-left">View syllabus</span>
                <ChevronRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </button>
            </li>
            <li>
              <button onClick={onOpenCalendar} className={actionRowClasses}>
                <Calendar className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="flex-1 text-left">Calendar</span>
                <ChevronRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Add Unit button — teachers/admins only */}
      {canEdit && (
        <button
          onClick={onAddUnit}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-border-subtle rounded-lg text-sm text-text-secondary hover:text-text-primary hover:border-blue-accent transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-accent"
        >
          <Plus className="w-4 h-4" aria-hidden="true" /> Add unit
        </button>
      )}
    </aside>
  );
}
