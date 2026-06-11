import { useState } from 'react';

import type { Assignment, StudyCard } from '../../api/types.js';
import useCanEdit from '../../hooks/useCanEdit.js';
import FlashCardComponent from './FlashCard.js';
import FlashCardStudyMode from './FlashCardStudyMode.js';
import Button from '../../components/Button.js';
import EmptyState from '../../components/EmptyState.js';

interface FlashCardListProps {
  assignments: Assignment[];
}

export default function FlashCardList({ assignments }: FlashCardListProps) {
  const canEdit = useCanEdit();
  const [studying, setStudying] = useState(false);
  const [studyCards, setStudyCards] = useState<StudyCard[]>([]);

  // Extract vocab entries from vocab-type assignments
  const vocabEntries = assignments
    .filter(a => a.type === 'vocab' && a.vocabAssignment)
    .flatMap(a => a.vocabAssignment!.entries);

  function handleStudyMode() {
    const cards: StudyCard[] = vocabEntries
      .filter(e => e.id != null)
      .map(e => ({ id: e.id!, front: e.term, back: e.definition }));
    setStudyCards(cards);
    setStudying(true);
  }

  return (
    <div>
      <div className="flex items-center gap-2 justify-end mb-4">
        {vocabEntries.length > 0 && (
          <Button variant="accent" size="sm" onClick={handleStudyMode}>Study Mode</Button>
        )}
        {vocabEntries.length > 0 && canEdit && (
          <span className="text-xs text-muted-foreground ml-1">
            Edit vocab in the assignment editor
          </span>
        )}
      </div>

      {vocabEntries.length === 0 ? (
        <EmptyState
          title="No flash cards yet"
          description="No vocab assignments have been added to this lesson yet."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {vocabEntries.map((entry, idx) => (
            <FlashCardComponent
              key={entry.id ?? idx}
              card={{
                id: entry.id ?? String(idx),
                type: 'flash_card' as const,
                title: entry.term,
                content: { front: entry.term, back: entry.definition },
                order: idx,
                lessonId: '',
                isRequired: false,
              }}
              editMode={false}
            />
          ))}
        </div>
      )}

      {studying && <FlashCardStudyMode cards={studyCards} onExit={() => setStudying(false)} />}
    </div>
  );
}
