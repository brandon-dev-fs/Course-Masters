import { useEffect, useRef, useCallback } from 'react';
import { Lock, ChevronDown, ToggleLeft, ToggleRight, ArrowUp, ArrowDown, Pencil, Trash2 } from 'lucide-react';

export type AssignmentKind = 'lessonPlan' | 'resource' | 'tool' | 'quiz' | 'assignment';

export interface AssignmentItem {
  key: string;
  kind: AssignmentKind;
  id: string | null;
  title: string;
  isRequired: boolean;
  order: number;
  resourceType?: 'note' | 'video' | 'lecture';
  toolType?: 'flash_card' | 'practice_problem' | 'vocab';
  assignmentType?: import('../../api/types.js').AssignmentType;
}

interface AssignmentSectionProps {
  item: AssignmentItem;
  isComplete: boolean;
  isLocked: boolean;
  canEdit: boolean;
  isLast: boolean;
  incompleteRequired: AssignmentItem[];
  onVisible?: (key: string) => void;
  onToggleCompletion: () => void;
  onToggleRequired: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onNext: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  children: React.ReactNode;
}

export default function AssignmentSection({
  item, isComplete, isLocked, canEdit, isLast, incompleteRequired,
  onVisible, onToggleCompletion, onToggleRequired, onMoveUp, onMoveDown, onNext, onEdit, onDelete, children,
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

  const isQuiz = item.kind === 'quiz';
  const showCompletion = !isQuiz;
  const showRequired = item.kind !== 'lessonPlan' && !isQuiz;

  return (
    <section
      ref={ref}
      id={`assignment-${item.key}`}
      className="scroll-mt-24 rounded-xl border border-border bg-surface shadow-warm-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border bg-surface-raised">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-sm font-semibold text-foreground truncate">{item.title}</h2>
          {showRequired && (
            <span className={`shrink-0 px-1.5 py-0.5 rounded text-xs font-medium ${
              item.isRequired
                ? 'bg-primary-subtle text-primary'
                : 'bg-surface text-muted-foreground border border-border'
            }`}>
              {item.isRequired ? 'Required' : 'Optional'}
            </span>
          )}
        </div>
        {canEdit && (
          <div className="flex items-center gap-1 shrink-0">
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
            {showRequired && (
              <button
                onClick={onToggleRequired}
                title={item.isRequired ? 'Mark optional' : 'Mark required'}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.isRequired
                  ? <ToggleRight className="w-5 h-5 text-primary" />
                  : <ToggleLeft className="w-5 h-5" />
                }
              </button>
            )}
            {(onMoveUp || onMoveDown) && (
              <div className="flex items-center">
                <button
                  onClick={onMoveUp}
                  disabled={!onMoveUp}
                  title="Move up"
                  className="p-0.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={onMoveDown}
                  disabled={!onMoveDown}
                  title="Move down"
                  className="p-0.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-5 py-5 relative">
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
          {!isLast && (
            <button
              onClick={onNext}
              className="flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
            >
              Next <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
