import { Lock, CheckCircle2 } from 'lucide-react';

export interface StepperItem {
  key: string;
  title: string;
  kind: 'lessonPlan' | 'resource' | 'tool' | 'quiz';
  completionId: string | null;
}

interface AssignmentStepperProps {
  items: StepperItem[];
  activeStepKey: string;
  completedIds: Set<string>;
  quizUnlocked: boolean;
  quizPassed: boolean;
  onStepClick: (key: string) => void;
}

export default function AssignmentStepper({
  items, activeStepKey, completedIds, quizUnlocked, quizPassed, onStepClick,
}: AssignmentStepperProps) {
  const totalSteps = items.length;
  const activeIndex = items.findIndex(i => i.key === activeStepKey);

  return (
    <div className="sticky top-0 z-10 bg-surface border-b border-border">
      {/* Desktop: full nodes with connecting line */}
      <div className="hidden lg:flex items-center gap-0 px-4 py-2 overflow-x-auto">
        {items.map((item, idx) => {
          const isComplete = item.kind === 'quiz' ? quizPassed : (item.completionId ? completedIds.has(item.completionId) : false);
          const isActive = item.key === activeStepKey;
          const isLocked = item.kind === 'quiz' && !quizUnlocked;

          let nodeClass = 'flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold shrink-0 transition-colors ';
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
            <div key={item.key} className="flex items-center">
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
                  <span>{idx + 1}</span>
                )}
              </button>
              {idx < totalSteps - 1 && (
                <div className={`h-px w-4 shrink-0 mx-0.5 ${isComplete ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: compact scrollable nodes + step counter */}
      <div className="lg:hidden flex items-center gap-2 px-4 py-2">
        <div className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0">
          {items.map((item, idx) => {
            const isComplete = item.kind === 'quiz' ? quizPassed : (item.completionId ? completedIds.has(item.completionId) : false);
            const isActive = item.key === activeStepKey;
            const isLocked = item.kind === 'quiz' && !quizUnlocked;

            let nodeClass = 'flex-shrink-0 w-5 h-5 rounded-full transition-colors ';
            if (isLocked) nodeClass += 'bg-surface-raised opacity-50';
            else if (isComplete) nodeClass += 'bg-primary';
            else if (isActive) nodeClass += 'bg-primary-subtle border-2 border-primary';
            else nodeClass += 'bg-surface-raised border border-border';

            return (
              <button
                key={item.key}
                onClick={() => !isLocked && onStepClick(item.key)}
                className={nodeClass}
                disabled={isLocked}
                aria-label={item.title}
              />
            );
          })}
        </div>
        {activeIndex >= 0 && (
          <span className="text-xs text-muted-foreground shrink-0">
            {activeIndex + 1} / {totalSteps}
          </span>
        )}
      </div>
    </div>
  );
}
