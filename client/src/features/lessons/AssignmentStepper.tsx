import { Lock, CheckCircle2, BookOpen, FileText, Video, Brain, BookMarked, ClipboardCheck, ExternalLink, FileUp, Plus } from 'lucide-react';
import type React from 'react';
import type { AssignmentType } from '../../api/types.js';

export interface StepperItem {
  key: string;
  title: string;
  kind: 'lessonPlan' | 'quiz' | 'assignment';
  completionId: string | null;
  assignmentType?: AssignmentType;
}

interface AssignmentStepperProps {
  items: StepperItem[];
  activeStepKey: string;
  completedAssignmentIds: Set<string>;
  quizUnlocked: boolean;
  quizPassed: boolean;
  onStepClick: (key: string) => void;
  onAdd?: () => void;
}

function getStepIcon(item: StepperItem): React.ComponentType<{ className?: string }> {
  if (item.kind === 'quiz') return ClipboardCheck;
  if (item.kind === 'lessonPlan') return BookOpen;
  if (item.kind === 'assignment') {
    if (item.assignmentType === 'note') return FileText;
    if (item.assignmentType === 'video') return Video;
    if (item.assignmentType === 'reading') return ExternalLink;
    if (item.assignmentType === 'vocab') return BookMarked;
    if (item.assignmentType === 'practice_problem') return Brain;
    if (item.assignmentType === 'file') return FileUp;
  }
  return FileText;
}

export function getStepLabel(item: StepperItem): string {
  if (item.kind === 'lessonPlan') return 'Plan';
  if (item.kind === 'quiz') return 'Quiz';
  if (item.kind === 'assignment') {
    if (item.assignmentType === 'note') return 'Read';
    if (item.assignmentType === 'video') return 'Video';
    if (item.assignmentType === 'reading') return 'Link';
    if (item.assignmentType === 'vocab') return 'Vocab';
    if (item.assignmentType === 'practice_problem') return 'Practice';
    if (item.assignmentType === 'file') return 'File';
    return 'Read';
  }
  return 'Step';
}

const focusRing = 'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none';

export default function AssignmentStepper({
  items, activeStepKey, completedAssignmentIds, quizUnlocked, quizPassed, onStepClick, onAdd,
}: AssignmentStepperProps) {
  if (items.length === 0) return null;

  const activeIndex = items.findIndex(i => i.key === activeStepKey);
  const activeItem = items[activeIndex];

  function isItemComplete(item: StepperItem): boolean {
    return item.kind === 'quiz'
      ? quizPassed
      : item.completionId ? completedAssignmentIds.has(item.completionId) : false;
  }

  return (
    <>
      {/* Desktop: horizontal activity bar */}
      <div className="hidden md:block border-b border-border bg-surface">
        {/* Header row */}
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lesson activities</span>
          <span className="text-xs text-muted-foreground">Step {activeIndex + 1} of {items.length}</span>
        </div>
        {/* Circles row */}
        <nav aria-label="Lesson steps" className="flex items-center px-4 pb-2 gap-0">
          {items.map((item, idx) => {
            const isComplete = isItemComplete(item);
            const isActive = item.key === activeStepKey;
            const isLocked = item.kind === 'quiz' && !quizUnlocked;
            const prevComplete = idx > 0 ? isItemComplete(items[idx - 1]) : false;
            const Icon = getStepIcon(item);
            const label = getStepLabel(item);

            const isLessonPlan = item.kind === 'lessonPlan';
            let circleClass = `flex items-center justify-center w-7 h-7 shrink-0 transition-colors ${isLessonPlan ? 'rounded-lg' : 'rounded-full'} `;
            if (isLessonPlan) {
              circleClass += isActive
                ? 'bg-accent text-accent-foreground cursor-pointer hover:opacity-90'
                : 'border border-accent/50 bg-accent-subtle text-accent cursor-pointer hover:opacity-80';
            } else if (isLocked) {
              circleClass += 'border border-border bg-surface text-muted-foreground opacity-50 cursor-not-allowed';
            } else if (isComplete || isActive) {
              circleClass += 'bg-primary text-primary-foreground cursor-pointer hover:opacity-90';
            } else {
              circleClass += 'border border-border bg-surface text-muted-foreground cursor-pointer hover:border-primary/50 hover:text-foreground';
            }

            return (
              <div key={item.key} className="flex items-center">
                {idx > 0 && (
                  <div
                    aria-hidden
                    className={`flex-1 h-px w-4 ${prevComplete && items[idx - 1].kind !== 'lessonPlan' ? 'bg-primary' : 'bg-border'}`}
                  />
                )}
                <button
                  onClick={() => !isLocked && onStepClick(item.key)}
                  className={`${circleClass} ${focusRing}`}
                  aria-label={`${label}: ${item.title}`}
                  aria-current={isActive ? 'step' : undefined}
                  aria-disabled={isLocked ? 'true' : undefined}
                  disabled={isLocked}
                  title={isLocked ? 'Complete all required items to unlock the quiz' : `${label}: ${item.title}`}
                >
                  {isLocked ? (
                    <Lock className="w-3.5 h-3.5" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </button>
              </div>
            );
          })}
          {onAdd && (
            <div className="flex items-center">
              <div aria-hidden className="flex-1 h-px w-4 bg-border" />
              <button
                onClick={onAdd}
                className={`flex items-center justify-center w-7 h-7 rounded-full border border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors ${focusRing}`}
                aria-label="Add assignment"
                title="Add assignment"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* Mobile: header + compact segmented progress bar */}
      <div className="md:hidden border-b border-border bg-surface">
        {/* Header row */}
        <div className="flex items-center justify-between px-4 pt-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lesson activities</span>
          <span className="text-xs text-muted-foreground">Step {activeIndex + 1} of {items.length}</span>
        </div>
        {/* Progress bar row */}
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex gap-0.5 flex-1 min-w-0" aria-hidden>
            {items.map(item => {
              const isComplete = isItemComplete(item);
              const isActive = item.key === activeStepKey;
              return (
                <div
                  key={item.key}
                  className={`h-1.5 rounded-full flex-1 ${isComplete || isActive ? 'bg-primary' : 'bg-border'}`}
                />
              );
            })}
          </div>
          {activeItem && (() => {
            const Icon = getStepIcon(activeItem);
            return (
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-primary-foreground" />
              </div>
            );
          })()}
          {onAdd && (
            <button
              onClick={onAdd}
              className={`w-6 h-6 rounded-full flex items-center justify-center border border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors shrink-0 ${focusRing}`}
              aria-label="Add assignment"
            >
              <Plus className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
