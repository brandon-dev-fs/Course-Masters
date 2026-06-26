import type { AssignmentType } from '../../api/types.js';

interface ActivityTypePillProps {
  type: AssignmentType;
}

const TYPE_LABEL: Record<AssignmentType, string> = {
  note: 'Note',
  video: 'Video',
  reading: 'Reading',
  vocab: 'Vocab',
  practice_problem: 'Practice',
  file: 'File',
};

const TYPE_CLASS: Record<AssignmentType, string> = {
  note: 'bg-blue-surface text-blue-surface-text',
  video: 'bg-orange-surface text-orange-surface-text',
  vocab: 'bg-green-surface text-green-surface-text',
  practice_problem: 'bg-purple-surface text-purple-surface-text',
  reading: 'bg-surface border border-border-subtle text-muted-foreground',
  file: 'bg-surface border border-border-subtle text-muted-foreground',
};

export default function ActivityTypePill({ type }: ActivityTypePillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${TYPE_CLASS[type]}`}
    >
      {TYPE_LABEL[type]}
    </span>
  );
}
