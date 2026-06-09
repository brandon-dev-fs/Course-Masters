import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { LessonTool } from '../../api/types.js';

interface FlashCardProps {
  card: LessonTool;
  editMode?: boolean;
  onUpdate?: (id: string, data: { front: string; back: string }) => Promise<void>;
  onDelete?: () => void;
}

export default function FlashCard({ card, editMode = false, onUpdate, onDelete }: FlashCardProps) {
  if (card.type !== 'flash_card') {
    return <p className="text-sm text-muted-foreground">Unsupported tool type.</p>;
  }
  const cardFront = card.content.front ?? '';
  const cardBack = card.content.back ?? '';

  const [flipped, setFlipped] = useState(false);
  const [front, setFront] = useState(cardFront);
  const [back, setBack] = useState(cardBack);
  const [saving, setSaving] = useState(false);
  const [frontError, setFrontError] = useState(false);
  const [backError, setBackError] = useState(false);

  useEffect(() => {
    setFront(cardFront);
    setBack(cardBack);
  }, [cardFront, cardBack]);

  useEffect(() => {
    if (!editMode) setFlipped(false);
  }, [editMode]);

  async function handleBlur() {
    const trimmedFront = front.trim();
    const trimmedBack = back.trim();
    const frontInvalid = !trimmedFront;
    const backInvalid = !trimmedBack;

    if (frontInvalid || backInvalid) {
      setFrontError(frontInvalid);
      setBackError(backInvalid);
      if (frontInvalid) setFront(cardFront);
      if (backInvalid) setBack(cardBack);
      return;
    }

    setFrontError(false);
    setBackError(false);

    if (trimmedFront === cardFront && trimmedBack === cardBack) return;

    setSaving(true);
    try {
      await onUpdate?.(card.id, { front: trimmedFront, back: trimmedBack });
    } finally {
      setSaving(false);
    }
  }

  const isDirty = front.trim() !== cardFront || back.trim() !== cardBack;

  if (editMode) {
    return (
      <div className={`relative rounded-2xl bg-surface border-2 p-5 flex flex-col gap-3 transition-colors ${isDirty ? 'border-accent' : 'border-border'} ${saving ? 'opacity-60' : ''}`}>
        <button
          onClick={onDelete}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-destructive hover:bg-destructive/10 transition-colors"
          aria-label="Delete card"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex flex-col gap-1 pr-6">
          <p className={`text-xs uppercase tracking-wide ${frontError ? 'text-destructive' : 'text-muted-foreground'}`}>Front</p>
          <textarea
            className={`w-full bg-transparent border rounded-lg p-2 text-sm text-foreground resize-none focus:outline-none transition-colors ${frontError ? 'border-destructive' : 'border-border focus:border-primary'}`}
            rows={2}
            value={front}
            onChange={e => { setFront(e.target.value); setFrontError(false); }}
            onBlur={handleBlur}
            disabled={saving}
          />
        </div>

        <div className="flex flex-col gap-1">
          <p className={`text-xs uppercase tracking-wide ${backError ? 'text-destructive' : 'text-muted-foreground'}`}>Back</p>
          <textarea
            className={`w-full bg-transparent border rounded-lg p-2 text-sm text-foreground resize-none focus:outline-none transition-colors ${backError ? 'border-destructive' : 'border-border focus:border-primary'}`}
            rows={2}
            value={back}
            onChange={e => { setBack(e.target.value); setBackError(false); }}
            onBlur={handleBlur}
            disabled={saving}
          />
        </div>
      </div>
    );
  }

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
          <p className="text-foreground font-medium">{cardFront}</p>
          <p className="text-xs text-muted-foreground mt-auto pt-2">Click to flip</p>
        </div>
        {/* Back */}
        <div
          className="absolute inset-0 flex flex-col justify-center rounded-2xl bg-accent-subtle border-2 border-accent/30 p-5"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <p className="text-xs text-accent mb-2 uppercase tracking-wide">Back</p>
          <p className="text-foreground">{cardBack}</p>
          <p className="text-xs text-muted-foreground mt-auto pt-2">Click to flip back</p>
        </div>
      </div>
    </div>
  );
}
