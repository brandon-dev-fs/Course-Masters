import { StickyNote } from 'lucide-react';
import type { Note } from '../../api/types.js';
import CardActions from '../../components/CardActions.js';

interface NoteCardProps {
  note: Note;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
  return (
    <div className="rounded-lg bg-surface border border-border p-4 group shadow-warm-sm hover:border-primary/30 transition-all">
      <div className="flex items-start gap-3">
        <StickyNote className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="flex-1 flex items-start justify-between gap-2">
          <p className="text-foreground text-sm whitespace-pre-wrap flex-1">{note.content}</p>
          {onEdit && onDelete && <CardActions onEdit={onEdit} onDelete={onDelete} />}
        </div>
      </div>
    </div>
  );
}
