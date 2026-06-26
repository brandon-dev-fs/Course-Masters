import { Pencil } from 'lucide-react';

import type { BuilderAssessment } from '../../api/types.js';

interface AssessmentRowProps {
  assessment: BuilderAssessment | null;
  label: string;
  level: 1 | 2 | 3;
  indentClass: string;
}

export default function AssessmentRow({
  assessment,
  label,
  level,
  indentClass,
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
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg opacity-60 ${indentClass}`}
    >
      {/* Placeholder for drag handle spacing */}
      <span className="hidden md:block w-4 h-4 shrink-0" aria-hidden="true" />

      <span className="text-sm text-muted-foreground flex-1 truncate italic">
        {label}
      </span>

      <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-surface border border-border-subtle text-muted-foreground shrink-0">
        auto
      </span>

      {assessment && (
        <span className="text-xs text-muted-foreground shrink-0">
          {assessment.questionCount} {assessment.questionCount === 1 ? 'question' : 'questions'}
        </span>
      )}

      <button
        type="button"
        aria-label={`Edit ${label}`}
        className="p-1 rounded-lg text-muted-foreground hover:text-text-primary hover:bg-surface transition-colors shrink-0"
        onClick={() => {
          // Coming soon — assessment editor navigation is out of scope for this iteration
        }}
      >
        <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
