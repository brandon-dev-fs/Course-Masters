import { useState } from 'react';
import type { FlashCard as FlashCardType } from '../../api/types.js';

interface FlashCardProps {
  card: FlashCardType;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export default function FlashCard({ card, onEdit, onDelete, showActions = true }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="relative cursor-pointer"
      style={{ perspective: '1000px' }}
      onClick={() => setFlipped(f => !f)}
    >
      <div
        className="relative w-full transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          minHeight: '160px',
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 flex flex-col justify-center rounded-2xl bg-surface border-2 border-border p-5"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Front</p>
          <p className="text-foreground font-medium">{card.front}</p>
          <p className="text-xs text-muted-foreground mt-auto pt-2">Click to flip</p>
        </div>
        {/* Back */}
        <div
          className="absolute inset-0 flex flex-col justify-center rounded-2xl bg-accent-subtle border-2 border-accent/30 p-5"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <p className="text-xs text-accent mb-2 uppercase tracking-wide">Back</p>
          <p className="text-foreground">{card.back}</p>
          <p className="text-xs text-muted-foreground mt-auto pt-2">Click to flip back</p>
        </div>
      </div>

      {showActions && (
        <div className="absolute top-2 right-2 flex gap-1 z-10" onClick={e => e.stopPropagation()}>
          <button onClick={onEdit} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-surface-raised bg-surface">Edit</button>
          <button onClick={onDelete} className="text-xs text-muted-foreground hover:text-destructive px-2 py-1 rounded hover:bg-surface-raised bg-surface">Delete</button>
        </div>
      )}
    </div>
  );
}
