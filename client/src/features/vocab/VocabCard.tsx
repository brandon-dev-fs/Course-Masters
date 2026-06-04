import { useState } from 'react';
import { BookOpen, BookmarkPlus, BookmarkCheck } from 'lucide-react';
import type { LessonTool } from '../../api/types.js';
import { lessonToolsApi } from '../../api/lesson-tools.js';
import CardActions from '../../components/CardActions.js';

interface VocabCardProps {
  vocab: LessonTool;
  onEdit?: () => void;
  onDelete?: () => void;
  saved?: boolean;
  onSavedChange?: (toolId: string, saved: boolean) => void;
}

export default function VocabCard({ vocab, onEdit, onDelete, saved = false, onSavedChange }: VocabCardProps) {
  const [toggling, setToggling] = useState(false);

  if (vocab.type !== 'vocab') {
    return <p className="text-sm text-muted-foreground">Unsupported tool type.</p>;
  }
  const term = vocab.content.term ?? vocab.title;
  const definition = vocab.content.definition ?? '';
  const example = vocab.content.example;

  async function handleToggle() {
    if (toggling) return;
    setToggling(true);
    try {
      if (saved) {
        await lessonToolsApi.removeVocabFlashCard(vocab.id);
      } else {
        await lessonToolsApi.saveVocabFlashCard(vocab.id);
      }
      onSavedChange?.(vocab.id, !saved);
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="rounded-lg bg-surface border border-border p-4 group shadow-warm-sm hover:border-primary/30 transition-all">
      <div className="flex items-start gap-3">
        <BookOpen className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <div className="flex-1 flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-foreground font-semibold text-sm">{term}</p>
            <p className="text-muted-foreground text-sm mt-1">{definition}</p>
            {example && (
              <p className="text-muted-foreground text-sm mt-2 italic border-l-2 border-border pl-3">{example}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onSavedChange && (
              <button
                onClick={handleToggle}
                disabled={toggling}
                aria-label={saved ? 'Remove from flashcards' : 'Save to flashcards'}
                className={`p-1 rounded transition-colors ${saved ? 'text-green-primary hover:text-green-primary/70' : 'text-muted-foreground hover:text-green-primary'}`}
              >
                {saved ? <BookmarkCheck className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
              </button>
            )}
            {onEdit && onDelete && <CardActions onEdit={onEdit} onDelete={onDelete} />}
          </div>
        </div>
      </div>
    </div>
  );
}
