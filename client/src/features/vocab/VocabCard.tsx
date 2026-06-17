import { BookOpen } from 'lucide-react';

interface VocabEntry {
  term: string;
  definition: string;
  example?: string;
}

interface VocabCardProps {
  vocab: VocabEntry;
  onEdit?: () => void;
  onDelete?: () => void;
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
            {vocab.example && (
              <p className="text-muted-foreground text-sm mt-2 italic border-l-2 border-border pl-3">{vocab.example}</p>
            )}
          </div>
          {onEdit && onDelete && (
            <div className="shrink-0 flex gap-1">
              <button
                onClick={onEdit}
                aria-label="Edit vocab term"
                className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="sr-only">Edit</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2.414a2 2 0 01.586-1.414z" />
                </svg>
              </button>
              <button
                onClick={onDelete}
                aria-label="Delete vocab term"
                className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
              >
                <span className="sr-only">Delete</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
