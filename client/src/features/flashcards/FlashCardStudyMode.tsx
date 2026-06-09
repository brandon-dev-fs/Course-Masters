import { useState } from 'react';
import type { StudyCard } from '../../api/types.js';
import Button from '../../components/Button.js';

interface FlashCardStudyModeProps {
  cards: StudyCard[];
  onExit: () => void;
}

export default function FlashCardStudyMode({ cards, onExit }: FlashCardStudyModeProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [seen, setSeen] = useState<Set<string>>(new Set());

  if (cards.length === 0) return null;

  const current = cards[index];
  const isLast = index === cards.length - 1;

  function next() {
    setSeen(prev => new Set([...prev, current.id]));
    setFlipped(false);
    if (!isLast) setIndex(i => i + 1);
  }

  function prev() {
    if (index > 0) {
      setFlipped(false);
      setIndex(i => i - 1);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-muted-foreground">{index + 1} / {cards.length}</span>
          <span className="text-sm text-muted-foreground">{seen.size} reviewed</span>
          <Button variant="ghost" size="sm" onClick={onExit}>✕ Exit</Button>
        </div>

        <div className="mb-6 relative cursor-pointer" style={{ perspective: '1000px', minHeight: '200px' }} onClick={() => setFlipped(f => !f)}>
          <div
            className="relative w-full transition-transform duration-500"
            style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)', minHeight: '200px' }}
          >
            <div
              className="absolute inset-0 flex flex-col justify-center rounded-2xl bg-surface border-2 border-border p-5"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Front</p>
              <p className="text-foreground font-medium">{current.front}</p>
              <p className="text-xs text-muted-foreground mt-auto pt-2">Click to flip</p>
            </div>
            <div
              className="absolute inset-0 flex flex-col justify-center rounded-2xl bg-accent-subtle border-2 border-accent/30 p-5"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <p className="text-xs text-accent mb-2 uppercase tracking-wide">Back</p>
              <p className="text-foreground">{current.back}</p>
              <p className="text-xs text-muted-foreground mt-auto pt-2">Click to flip back</p>
            </div>
          </div>
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
