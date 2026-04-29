import { Lock, CheckCircle2, BookOpen, FileText, Video, Presentation, Layers, Brain, BookMarked, ClipboardCheck, ExternalLink } from 'lucide-react';
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
  quizUnlocked: boolean;
  quizPassed: boolean;
  onStepClick: (key: string) => void;
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

export default function AssignmentStepper({
  items, activeStepKey, completedIds, quizUnlocked, quizPassed, onStepClick,
}: AssignmentStepperProps) {
  const totalSteps = items.length;
  const activeIndex = items.findIndex(i => i.key === activeStepKey);
  const activeItem = items[activeIndex];

  return (
    <div className="sticky top-0 z-10 bg-surface border-b border-border">
      {/* Desktop: icon nodes with labels + connecting line */}
      <div className="hidden lg:flex items-start gap-0 px-4 pt-3 pb-2 overflow-x-auto">
        {items.map((item, idx) => {
          const isComplete = item.kind === 'quiz' ? quizPassed : (item.completionId ? completedIds.has(item.completionId) : false);
          const isActive = item.key === activeStepKey;
          const isLocked = item.kind === 'quiz' && !quizUnlocked;
          const Icon = getStepIcon(item);

          let nodeClass = 'flex items-center justify-center w-7 h-7 rounded-full shrink-0 transition-colors ';
          if (isLocked) {
            nodeClass += 'bg-surface-raised text-muted-foreground opacity-50 cursor-not-allowed';
          } else if (isComplete) {
            nodeClass += 'bg-primary text-white cursor-pointer';
          } else if (isActive) {
            nodeClass += 'bg-primary-subtle border-2 border-primary text-primary cursor-pointer';
          } else {
            nodeClass += 'bg-surface-raised border border-border text-muted-foreground cursor-pointer hover:border-primary/50';
          }

          return (
            <div key={item.key} className="flex items-start">
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => !isLocked && onStepClick(item.key)}
                  className={nodeClass}
                  title={item.title}
                  aria-label={item.title}
                  disabled={isLocked}
                >
                  {isLocked ? (
                    <Lock className="w-3 h-3" />
                  ) : isComplete ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </button>
                <span className={`text-[10px] w-14 text-center truncate leading-tight ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  {item.title}
                </span>
              </div>
              {idx < totalSteps - 1 && (
                <div className={`h-px w-4 mt-3.5 shrink-0 mx-0.5 ${isComplete ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: compact icon nodes + current step name */}
      <div className="lg:hidden flex items-center gap-2 px-4 py-2">
        <div className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0">
          {items.map((item) => {
            const isComplete = item.kind === 'quiz' ? quizPassed : (item.completionId ? completedIds.has(item.completionId) : false);
            const isActive = item.key === activeStepKey;
            const isLocked = item.kind === 'quiz' && !quizUnlocked;
            const Icon = getStepIcon(item);

            let nodeClass = 'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ';
            if (isLocked) nodeClass += 'bg-surface-raised opacity-50 text-muted-foreground';
            else if (isComplete) nodeClass += 'bg-primary text-white';
            else if (isActive) nodeClass += 'bg-primary-subtle border-2 border-primary text-primary';
            else nodeClass += 'bg-surface-raised border border-border text-muted-foreground';

            return (
              <button
                key={item.key}
                onClick={() => !isLocked && onStepClick(item.key)}
                className={nodeClass}
                disabled={isLocked}
                aria-label={item.title}
                title={item.title}
              >
                {isLocked ? (
                  <Lock className="w-2.5 h-2.5" />
                ) : isComplete ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Icon className="w-3 h-3" />
                )}
              </button>
            );
          })}
        </div>
        {activeItem && (
          <span className="text-xs text-muted-foreground shrink-0 max-w-[100px] truncate">
            {activeItem.title}
          </span>
        )}
      </div>
    </div>
  );
}
