import { Lock, CheckCircle2, BookOpen, FileText, Video, Presentation, Layers, Brain, BookMarked, ClipboardCheck, ExternalLink, Plus } from 'lucide-react';
import type React from 'react';
import type { AssignmentType } from '../../api/types.js';

export interface StepperItem {
  key: string;
  title: string;
  kind: 'lessonPlan' | 'resource' | 'tool' | 'quiz' | 'assignment';
  completionId: string | null;
  resourceType?: 'note' | 'video' | 'lecture';
  toolType?: 'flash_card' | 'practice_problem' | 'vocab';
  assignmentType?: AssignmentType;
}

interface AssignmentStepperProps {
  items: StepperItem[];
  activeStepKey: string;
  completedIds: Set<string>;
  completedAssignmentIds: Set<string>;
  quizUnlocked: boolean;
  quizPassed: boolean;
  onStepClick: (key: string) => void;
  onAdd?: () => void;
}

function getStepIcon(item: StepperItem): React.ComponentType<{ className?: string }> {
  if (item.kind === 'quiz') return ClipboardCheck;
  if (item.kind === 'lessonPlan') return BookOpen;
  if (item.kind === 'resource') {
    if (item.resourceType === 'video') return Video;
    if (item.resourceType === 'lecture') return Presentation;
    return FileText;
  }
  if (item.kind === 'tool') {
    if (item.toolType === 'flash_card') return Layers;
    if (item.toolType === 'practice_problem') return Brain;
    if (item.toolType === 'vocab') return BookMarked;
  }
  if (item.kind === 'assignment') {
    if (item.assignmentType === 'note') return FileText;
    if (item.assignmentType === 'video') return Video;
    if (item.assignmentType === 'reading') return ExternalLink;
    if (item.assignmentType === 'vocab') return BookMarked;
    if (item.assignmentType === 'practice_problem') return Brain;
  }
  return FileText;
}

export function getStepLabel(item: StepperItem): string {
  if (item.kind === 'lessonPlan') return 'Plan';
  if (item.kind === 'quiz') return 'Quiz';
  if (item.kind === 'resource') {
    if (item.resourceType === 'video') return 'Video';
    if (item.resourceType === 'lecture') return 'Lecture';
    return 'Read';
  }
  if (item.kind === 'tool') {
    if (item.toolType === 'flash_card') return 'Cards';
    if (item.toolType === 'practice_problem') return 'Practice';
    if (item.toolType === 'vocab') return 'Vocab';
    return 'Read';
  }
  if (item.kind === 'assignment') {
    if (item.assignmentType === 'note') return 'Read';
    if (item.assignmentType === 'video') return 'Video';
    if (item.assignmentType === 'reading') return 'Link';
    if (item.assignmentType === 'vocab') return 'Vocab';
    if (item.assignmentType === 'practice_problem') return 'Practice';
    return 'Read';
  }
  return 'Step';
}

const focusRing = 'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none';

export default function AssignmentStepper({
  items, activeStepKey, completedIds, completedAssignmentIds, quizUnlocked, quizPassed, onStepClick, onAdd,
}: AssignmentStepperProps) {
  if (items.length === 0) return null;

  const activeIndex = items.findIndex(i => i.key === activeStepKey);
  const activeItem = items[activeIndex];

  function isItemComplete(item: StepperItem): boolean {
    const completionSet = item.kind === 'assignment' ? completedAssignmentIds : completedIds;
    return item.kind === 'quiz'
      ? quizPassed
      : item.completionId ? completionSet.has(item.completionId) : false;
  }

  return (
    <>
      {/* Desktop: vertical step sidebar */}
      <nav
        aria-label="Lesson steps"
        className="hidden lg:flex flex-col w-14 shrink-0 border-r border-border bg-surface overflow-y-auto py-3 items-center"
        tabIndex={0}
      >
        {items.map((item, idx) => {
          const isComplete = isItemComplete(item);
          const isActive = item.key === activeStepKey;
          const isLocked = item.kind === 'quiz' && !quizUnlocked;
          const prevComplete = idx > 0 ? isItemComplete(items[idx - 1]) : false;
          const Icon = getStepIcon(item);
          const label = getStepLabel(item);

          let circleClass = 'flex items-center justify-center w-8 h-8 rounded-full shrink-0 transition-colors ';
          if (isLocked) {
            circleClass += 'border border-border bg-surface text-muted-foreground opacity-50 cursor-not-allowed';
          } else if (isComplete || isActive) {
            circleClass += 'bg-primary text-white cursor-pointer hover:opacity-90';
          } else {
            circleClass += 'border border-border bg-surface text-muted-foreground cursor-pointer hover:border-primary/50 hover:text-foreground';
          }

          return (
            <div key={item.key} className="flex flex-col items-center w-full">
              {idx > 0 && (
                <div
                  aria-hidden
                  className={`w-px h-3 mx-auto ${prevComplete ? 'bg-primary' : 'bg-border'}`}
                />
              )}
              <div className="flex flex-col items-center gap-0.5 px-1">
                <button
                  onClick={() => !isLocked && onStepClick(item.key)}
                  className={`${circleClass} ${focusRing}`}
                  aria-label={`${label}: ${item.title}`}
                  aria-current={isActive ? 'step' : undefined}
                  aria-disabled={isLocked ? 'true' : undefined}
                  disabled={isLocked}
                  title={isLocked ? 'Complete all required items to unlock the quiz' : item.title}
                >
                  {isLocked ? (
                    <Lock className="w-3.5 h-3.5" />
                  ) : isComplete ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </button>
                <span
                  aria-hidden
                  className={`text-[10px] text-center leading-tight ${
                    isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                  }`}
                >
                  {label}
                </span>
              </div>
            </div>
          );
        })}
        {onAdd && (
          <div className="flex flex-col items-center w-full">
            <div aria-hidden className="w-px h-3 mx-auto bg-border" />
            <div className="flex flex-col items-center gap-0.5 px-1">
              <button
                onClick={onAdd}
                className={`flex items-center justify-center w-8 h-8 rounded-full border border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors ${focusRing}`}
                aria-label="Add assignment"
                title="Add assignment"
              >
                <Plus className="w-4 h-4" />
              </button>
              <span aria-hidden className="text-[10px] text-muted-foreground text-center leading-tight">Add</span>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile: compact segmented progress bar */}
      <div className="lg:hidden flex items-center gap-2 px-4 py-2 border-b border-border bg-surface">
        <span className="text-xs text-muted-foreground font-medium shrink-0">
          {activeIndex + 1}/{items.length}
        </span>
        <div className="flex gap-0.5 flex-1 min-w-0" aria-hidden>
          {items.map((item, idx) => {
            const isComplete = isItemComplete(item);
            const isActive = item.key === activeStepKey;
            return (
              <div
                key={idx}
                className={`h-1.5 rounded-full flex-1 ${isComplete || isActive ? 'bg-primary' : 'bg-border'}`}
              />
            );
          })}
        </div>
        {activeItem && (() => {
          const Icon = getStepIcon(activeItem);
          return <Icon aria-hidden className="w-4 h-4 text-muted-foreground shrink-0" />;
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
    </>
  );
}
