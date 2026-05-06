import type { VocabEntry } from '../../api/types.js';

interface VocabAssignmentViewProps {
  entries: VocabEntry[];
}

export default function VocabAssignmentView({ entries }: VocabAssignmentViewProps) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No terms defined.</p>;
  }

  return (
    <dl className="divide-y divide-border">
      {entries.map((entry, i) => (
        <div key={i} className="py-3">
          <dt className="text-sm font-semibold text-foreground">{entry.term}</dt>
          <dd className="text-sm text-muted-foreground pl-4 mt-0.5">{entry.definition}</dd>
        </div>
      ))}
    </dl>
  );
}
