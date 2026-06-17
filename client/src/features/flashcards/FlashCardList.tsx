import { useState, useEffect } from 'react';

import type { VocabEntry, StudyCard } from '../../api/types.js';
import { assignmentsApi } from '../../api/assignments.js';
import useFetch from '../../hooks/useFetch.js';
import FlashCardComponent from './FlashCard.js';
import FlashCardStudyMode from './FlashCardStudyMode.js';
import Button from '../../components/Button.js';
import EmptyState from '../../components/EmptyState.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';

interface FlashCardListProps {
  lessonId: string;
}

export default function FlashCardList({ lessonId }: FlashCardListProps) {
  const { data: fetchedCards, loading } = useFetch<VocabEntry[]>(
    () => assignmentsApi.getSavedFlashCards(lessonId),
    [lessonId],
  );

  const [cards, setCards] = useState<VocabEntry[]>([]);

  useEffect(() => {
    if (fetchedCards) setCards(fetchedCards);
  }, [fetchedCards]);

  const [studying, setStudying] = useState(false);
  const [studyCards, setStudyCards] = useState<StudyCard[]>([]);

  async function handleRemove(entryId: string) {
    setCards(prev => prev.filter(c => c.id !== entryId));
    try {
      await assignmentsApi.removeFlashCard(entryId);
    } catch {
      // Restore card on failure
      if (fetchedCards) setCards(fetchedCards);
    }
  }

  function handleStudyMode() {
    const sc: StudyCard[] = cards
      .filter(c => c.id != null)
      .map(c => ({ id: c.id!, front: c.term, back: c.definition }));
    setStudyCards(sc);
    setStudying(true);
  }

  if (loading && cards.length === 0) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-end mb-4">
        {cards.length > 0 && (
          <Button variant="accent" size="sm" onClick={handleStudyMode}>Study Mode</Button>
        )}
      </div>

      {cards.length === 0 ? (
        <EmptyState
          title="No flashcards yet"
          description="Add vocab terms to your flashcards while studying the vocab assignment."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map((entry, idx) => (
            <FlashCardComponent
              key={entry.id ?? idx}
              card={{
                id: entry.id ?? String(idx),
                type: 'flash_card' as const,
                title: entry.term,
                content: { front: entry.term, back: entry.definition },
                order: idx,
                lessonId,
                isRequired: false,
              }}
              editMode={false}
              onDelete={entry.id ? () => handleRemove(entry.id!) : undefined}
            />
          ))}
        </div>
      )}

      {studying && <FlashCardStudyMode cards={studyCards} onExit={() => setStudying(false)} />}
    </div>
  );
}
