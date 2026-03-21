import { BookOpen } from 'lucide-react';
import type { Vocab } from '../../api/types.js';
import CardActions from '../../components/CardActions.js';

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
          <CardActions onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>
    </div>
  );
}
