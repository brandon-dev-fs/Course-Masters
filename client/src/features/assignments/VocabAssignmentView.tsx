import { useState, useEffect } from 'react';
import { PlusCircle, CheckCircle2 } from 'lucide-react';
import type { VocabEntry } from '../../api/types.js';
import { assignmentsApi } from '../../api/assignments.js';
import useFetch from '../../hooks/useFetch.js';

interface VocabAssignmentViewProps {
  entries: VocabEntry[];
  lessonId: string;
}

export default function VocabAssignmentView({ entries, lessonId }: VocabAssignmentViewProps) {
  const { data: savedEntries } = useFetch<VocabEntry[]>(
    () => assignmentsApi.getSavedFlashCards(lessonId),
    [lessonId],
  );

  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (savedEntries) {
      setSavedIds(new Set(savedEntries.map(e => e.id).filter((id): id is string => id != null)));
    }
  }, [savedEntries]);

  async function toggleFlashCard(entryId: string) {
    if (savedIds.has(entryId)) {
      setSavedIds(prev => { const next = new Set(prev); next.delete(entryId); return next; });
      try {
        await assignmentsApi.removeFlashCard(entryId);
      } catch {
        setSavedIds(prev => new Set(prev).add(entryId));
      }
    } else {
      setSavedIds(prev => new Set(prev).add(entryId));
      try {
        await assignmentsApi.saveFlashCard(entryId);
      } catch {
        setSavedIds(prev => { const next = new Set(prev); next.delete(entryId); return next; });
      }
    }
  }

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No terms defined.</p>;
  }

  return (
    <dl className="divide-y divide-border">
      {entries.map((entry, i) => {
        const id = entry.id;
        const isSaved = id != null && savedIds.has(id);
        return (
          <div key={id ?? i} className="py-3 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <dt className="text-sm font-semibold text-foreground">{entry.term}</dt>
              <dd className="text-sm text-muted-foreground pl-4 mt-0.5">{entry.definition}</dd>
              {entry.example && (
                <dd className="text-sm text-muted-foreground pl-4 mt-1 italic border-l-2 border-border">{entry.example}</dd>
              )}
            </div>
            {id != null && (
              <button
                onClick={() => toggleFlashCard(id)}
                title={isSaved ? 'Added to flashcards' : 'Add to flashcards'}
                aria-label={isSaved ? `Remove "${entry.term}" from flashcards` : `Add "${entry.term}" to flashcards`}
                className={`shrink-0 p-1.5 rounded transition-colors ${
                  isSaved
                    ? 'text-primary hover:text-primary/70'
                    : 'text-muted-foreground hover:text-primary'
                }`}
              >
                {isSaved
                  ? <CheckCircle2 className="w-4 h-4" />
                  : <PlusCircle className="w-4 h-4" />
                }
              </button>
            )}
          </div>
        );
      })}
    </dl>
  );
}
