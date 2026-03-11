import { BookOpen } from 'lucide-react';
import type { Vocab } from '../../api/types.js';

interface VocabCardProps {
  vocab: Vocab;
  onEdit: () => void;
  onDelete: () => void;
}

export default function VocabCard({ vocab, onEdit, onDelete }: VocabCardProps) {
  return (
    <div className="rounded-lg bg-surface border border-border p-4 group shadow-warm-sm hover:border-primary/30 transition-all">
      <div className="flex items-start gap-3">
        <BookOpen className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <div className="flex-1 flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-foreground font-semibold text-sm">{vocab.term}</p>
            <p className="text-muted-foreground text-sm mt-1">{vocab.definition}</p>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button onClick={onEdit} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-surface-raised">Edit</button>
            <button onClick={onDelete} className="text-xs text-muted-foreground hover:text-destructive px-2 py-1 rounded hover:bg-surface-raised">Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}
