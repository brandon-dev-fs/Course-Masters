import { CreditCard, List } from 'lucide-react';

import type { CourseProgress } from '../../api/types.js';

import ProgressBar from '../progress/ProgressBar.js';

interface MobileProgressBarProps {
  progress: CourseProgress | null;
  onOpenSyllabus: () => void;
  onReviewFlashCards: () => void;
}

export default function MobileProgressBar({
  progress,
  onOpenSyllabus,
  onReviewFlashCards,
}: MobileProgressBarProps) {
  const percent = progress?.percentComplete ?? 0;

  return (
    <div
      role="region"
      aria-label="Course progress summary"
      className="flex flex-col gap-2 p-3 bg-surface border border-border-subtle rounded-xl md:hidden mb-4"
    >
      {/* Progress row: percentage + slim progress bar */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-text-primary w-10 shrink-0">
          {percent}%
        </span>
        <ProgressBar
          percent={percent}
          className="flex-1"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Course completion"
        />
      </div>

      {/* Action buttons row */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onReviewFlashCards}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-medium bg-surface-raised text-text-primary border border-border-subtle hover:border-blue-accent hover:text-blue-accent transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-accent"
        >
          <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
          Flash cards
        </button>
        <button
          type="button"
          onClick={onOpenSyllabus}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-medium bg-surface-raised text-text-primary border border-border-subtle hover:border-blue-accent hover:text-blue-accent transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-accent"
        >
          <List className="w-3.5 h-3.5" aria-hidden="true" />
          Syllabus
        </button>
      </div>
    </div>
  );
}
