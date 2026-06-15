import { useEffect, useRef, useCallback } from 'react';
import { Lock, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';

export type AssignmentKind = 'lessonPlan' | 'quiz' | 'assignment';

export interface AssignmentItem {
  key: string;
  kind: AssignmentKind;
  id: string | null;
  title: string;
  isRequired: boolean;
  order: number;
  assignmentType?: import('../../api/types.js').AssignmentType;
}

interface AssignmentSectionProps {
  item: AssignmentItem;
  isComplete: boolean;
  isLocked: boolean;
  canEdit: boolean;
  isFirst: boolean;
  isLast: boolean;
  incompleteRequired: AssignmentItem[];
  onVisible?: (key: string) => void;
  onToggleCompletion: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onPrev: () => void;
  onNext: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}

export default function AssignmentSection({
  item, isComplete, isLocked, canEdit, isFirst, isLast, incompleteRequired,
  onVisible, onToggleCompletion, onMoveUp, onMoveDown, onPrev, onNext, onEdit, onDelete, headerRight, children,
}: AssignmentSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const stableOnVisible = useCallback((key: string) => onVisible?.(key), [onVisible]);

  useEffect(() => {
    if (!onVisible) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) stableOnVisible(item.key); },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [item.key, stableOnVisible, onVisible]);

  const showCompletion = item.kind === 'assignment';

  function getTypeLabel(): string {
    if (item.kind === 'lessonPlan') return 'Plan';
    if (item.kind === 'quiz') return 'Quiz';
    if (item.assignmentType === 'note') return 'Read';
    if (item.assignmentType === 'video') return 'Video';
    if (item.assignmentType === 'reading') return 'Link';
    if (item.assignmentType === 'vocab') return 'Vocab';
    if (item.assignmentType === 'practice_problem') return 'Practice';
    return 'Read';
  }

  return (
    <section
      ref={ref}
      id={`assignment-${item.key}`}
      className="scroll-mt-24 rounded-xl border border-border bg-surface shadow-warm-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border bg-surface-raised">
        <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {getTypeLabel()}
        </span>
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {headerRight}
          {canEdit && (
            <>
              {onEdit && (
                <button
                  onClick={onEdit}
                  aria-label={`Edit ${item.title}`}
                  className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  aria-label={`Delete ${item.title}`}
                  className="p-1.5 rounded text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              {(onMoveUp || onMoveDown) && (
                <div className="flex items-center gap-0.5 pl-1 border-l border-border ml-1">
                  <span className="text-xs text-muted-foreground mr-0.5">Reorder</span>
                  <button
                    onClick={onMoveUp}
                    disabled={!onMoveUp}
                    title="Move up"
                    className="p-0.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onMoveDown}
                    disabled={!onMoveDown}
                    title="Move down"
                    className="p-0.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Assignment title */}
      <div className="px-5 pt-4 pb-0">
        <h2 className="text-base font-semibold text-foreground">{item.title}</h2>
      </div>

      {/* Content */}
      <div className="px-5 py-4 relative">
        {isLocked ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Lock className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Complete required assignments to unlock the quiz</p>
            {incompleteRequired.length > 0 && (
              <ul className="text-xs text-muted-foreground text-left list-disc list-inside space-y-1">
                {incompleteRequired.map(r => (
                  <li key={r.key}>{r.title}</li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          children
        )}
      </div>

      {/* Footer */}
      {!isLocked && (
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-border">
          {showCompletion ? (
            <button
              onClick={onToggleCompletion}
              className={`flex items-center gap-2 text-sm font-medium transition-colors rounded-lg px-3 py-1.5 ${
                isComplete
                  ? 'text-primary bg-primary-subtle hover:bg-primary-subtle/70'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
              }`}
            >
              <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                isComplete ? 'bg-primary border-primary' : 'border-muted-foreground'
              }`}>
                {isComplete && <span className="text-white text-xs">✓</span>}
              </span>
              {isComplete ? 'Completed' : 'Mark complete'}
            </button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-3">
            {!isFirst && (
              <button
                onClick={onPrev}
                className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium hover:text-foreground hover:underline"
              >
                <ChevronDown className="w-4 h-4 rotate-90" /> Back
              </button>
            )}
            {!isLast && (
              <button
                onClick={onNext}
                className="flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
              >
                Next <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
