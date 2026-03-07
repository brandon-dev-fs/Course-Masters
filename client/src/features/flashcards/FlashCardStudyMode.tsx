import { useState } from 'react';
import type { FlashCard } from '../../api/types.js';
import FlashCardComponent from './FlashCard.js';
import Button from '../../components/Button.js';

interface FlashCardStudyModeProps {
  cards: FlashCard[];
  onExit: () => void;
}

export default function FlashCardStudyMode({ cards, onExit }: FlashCardStudyModeProps) {
  const [index, setIndex] = useState(0);
  const [seen, setSeen] = useState<Set<string>>(new Set());

  if (cards.length === 0) return null;

  const current = cards[index];
  const isLast = index === cards.length - 1;

  function next() {
    setSeen(prev => new Set([...prev, current.id]));
    if (!isLast) setIndex(i => i + 1);
  }

  function prev() {
    if (index > 0) setIndex(i => i - 1);
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-muted-foreground">{index + 1} / {cards.length}</span>
          <span className="text-sm text-muted-foreground">{seen.size} reviewed</span>
          <Button variant="ghost" size="sm" onClick={onExit}>✕ Exit</Button>
        </div>

        <div className="mb-6" style={{ minHeight: '200px' }}>
          {current && <FlashCardComponent card={current} showActions={false} />}
        </div>

        <div className="flex justify-center gap-4">
          <Button variant="secondary" onClick={prev} disabled={index === 0}>← Previous</Button>
          {!isLast ? (
            <Button onClick={next}>Next →</Button>
          ) : (
            <Button variant="secondary" onClick={onExit}>Finish</Button>
          )}
        </div>

        <div className="flex justify-center mt-4 gap-1">
          {cards.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${i === index ? 'bg-primary' : i < index ? 'bg-accent' : 'bg-border'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
