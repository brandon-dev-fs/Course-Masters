import { useState, useEffect } from 'react';
import { PlusCircle, CheckCircle } from 'lucide-react';

import { assignmentsApi } from '../../api/assignments.js';
import type { VocabEntry } from '../../api/types.js';
import { useAuth } from '../../context/AuthContext.js';
import Tooltip from '../../components/Tooltip.js';

interface VocabAssignmentViewProps {
  entries: VocabEntry[];
  lessonId: string;
}

export default function VocabAssignmentView({ entries, lessonId }: VocabAssignmentViewProps) {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';

  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [toggling, setToggling] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isStudent) return;
    let cancelled = false;
    assignmentsApi.getSavedVocabEntryFlashCards(lessonId).then(saved => {
      if (cancelled) return;
      setSavedIds(new Set(saved.map(e => e.id).filter((id): id is string => !!id)));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [isStudent, lessonId]);

  // Sync when FlashCardList removes an entry via the X button
  useEffect(() => {
    if (!isStudent) return;
    function onRemoved(e: Event) {
      const { entryId } = (e as CustomEvent<{ entryId: string }>).detail;
      setSavedIds(prev => { const next = new Set(prev); next.delete(entryId); return next; });
    }
    window.addEventListener('vocabflashcard:removed', onRemoved);
    return () => window.removeEventListener('vocabflashcard:removed', onRemoved);
  }, [isStudent]);

  async function handleToggle(entryId: string) {
    if (toggling.has(entryId)) return;
    setToggling(prev => new Set(prev).add(entryId));

    const wasSaved = savedIds.has(entryId);

    // Optimistic update — change icon immediately
    if (wasSaved) {
      setSavedIds(prev => { const next = new Set(prev); next.delete(entryId); return next; });
      window.dispatchEvent(new CustomEvent('vocabflashcard:removed', { detail: { entryId } }));
    } else {
      setSavedIds(prev => new Set(prev).add(entryId));
      const entry = entries.find(e => e.id === entryId);
      if (entry) {
        window.dispatchEvent(new CustomEvent('vocabflashcard:saved', { detail: { entry } }));
      }
    }

    try {
      if (wasSaved) {
        await assignmentsApi.removeVocabEntryFlashCard(entryId);
      } else {
        await assignmentsApi.saveVocabEntryFlashCard(entryId);
      }
    } catch {
      // Revert the optimistic update
      if (wasSaved) {
        setSavedIds(prev => new Set(prev).add(entryId));
        const entry = entries.find(e => e.id === entryId);
        if (entry) window.dispatchEvent(new CustomEvent('vocabflashcard:saved', { detail: { entry } }));
      } else {
        setSavedIds(prev => { const next = new Set(prev); next.delete(entryId); return next; });
        window.dispatchEvent(new CustomEvent('vocabflashcard:removed', { detail: { entryId } }));
      }
    } finally {
      setToggling(prev => { const next = new Set(prev); next.delete(entryId); return next; });
    }
  }

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No terms defined.</p>;
  }

  return (
    <dl className="divide-y divide-border">
      {entries.map((entry, i) => {
        const entryId = entry.id;
        const isSaved = entryId ? savedIds.has(entryId) : false;
        const isToggling = entryId ? toggling.has(entryId) : false;

        return (
          <div key={entryId ?? i} className="py-3 flex items-start gap-2">
            <div className="flex-1">
              <dt className="text-sm font-semibold text-foreground">{entry.term}</dt>
              <dd className="text-sm text-muted-foreground pl-4 mt-0.5">{entry.definition}</dd>
              {entry.example && (
                <dd className="text-sm text-muted-foreground pl-4 mt-1 italic border-l-2 border-border">{entry.example}</dd>
              )}
            </div>
            {isStudent && entryId && (
              isSaved ? (
                <button
                  type="button"
                  onClick={() => handleToggle(entryId)}
                  disabled={isToggling}
                  aria-label={`Remove "${entry.term}" from flash cards`}
                  className="shrink-0 mt-0.5 p-1 text-muted-foreground hover:text-green-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-4 h-4 text-green-primary" />
                </button>
              ) : (
                <Tooltip content="Add to flash cards">
                  <button
                    type="button"
                    onClick={() => handleToggle(entryId)}
                    disabled={isToggling}
                    aria-label={`Add "${entry.term}" to flash cards`}
                    className="shrink-0 mt-0.5 p-1 text-muted-foreground hover:text-green-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                </Tooltip>
              )
            )}
          </div>
        );
      })}
    </dl>
  );
}
