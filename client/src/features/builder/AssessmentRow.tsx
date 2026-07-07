import type { BuilderAssessment } from '../../api/types.js';

interface AssessmentRowProps {
  assessment: BuilderAssessment | null;
  label: string;
  level: 1 | 2 | 3;
  indentClass: string;
  /** When provided the row becomes interactive — renders an Add/Edit button. */
  onManage?: () => void;
}

export default function AssessmentRow({
  assessment,
  label,
  level,
  indentClass,
  onManage,
}: AssessmentRowProps) {
  return (
    <div
      role="treeitem"
      aria-level={level}
      aria-label={
        assessment
          ? `${label} — ${assessment.questionCount} questions`
          : `${label} — no questions yet`
      }
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${onManage ? '' : 'opacity-60'} ${indentClass}`}
    >
      {/* Placeholder for drag handle spacing */}
      <span className="hidden md:block w-4 h-4 shrink-0" aria-hidden="true" />

      <span className="text-sm text-muted-foreground flex-1 truncate italic">
        {label}
      </span>

      {!onManage && (
        <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-surface border border-border-subtle text-muted-foreground shrink-0">
          auto
        </span>
      )}

      {assessment && (
        <span className="text-xs text-muted-foreground shrink-0">
          {assessment.questionCount} {assessment.questionCount === 1 ? 'question' : 'questions'}
        </span>
      )}

      {onManage && (
        <button
          type="button"
          onClick={onManage}
          aria-label={assessment ? `Edit ${label}` : `Add ${label}`}
          className="text-xs font-medium text-primary hover:text-primary/80 px-2 py-0.5 rounded transition-colors shrink-0"
        >
          {assessment ? 'Edit' : 'Add'}
        </button>
      )}
    </div>
  );
}
