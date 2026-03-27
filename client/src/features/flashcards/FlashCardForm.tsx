import { useState } from 'react';
import Input from '../../components/Input.js';
import Textarea from '../../components/Textarea.js';
import Button from '../../components/Button.js';
import type { LessonTool } from '../../api/types.js';
import useFormSubmit from '../../hooks/useFormSubmit.js';

interface FlashCardFormProps {
  initial?: LessonTool;
  nextOrder?: number;
  onSubmit: (data: { front: string; back: string; order: number }) => Promise<void>;
  onCancel: () => void;
}

export default function FlashCardForm({ initial, nextOrder = 1, onSubmit, onCancel }: FlashCardFormProps) {
  const [front, setFront] = useState((initial?.content?.front as string) ?? '');
  const [back, setBack] = useState((initial?.content?.back as string) ?? '');
  const [order, setOrder] = useState(initial?.order ?? nextOrder);
  const { error, submitting, handleSubmit } = useFormSubmit(async () => {
    if (!front.trim() || !back.trim()) throw new Error('Front and back are required');
    await onSubmit({ front: front.trim(), back: back.trim(), order });
  });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Textarea id="front" label="Front (Question / Term)" value={front} onChange={e => setFront(e.target.value)} placeholder="What is..." rows={3} autoFocus />
      <Textarea id="back" label="Back (Answer / Definition)" value={back} onChange={e => setBack(e.target.value)} placeholder="The answer is..." rows={3} />
      <Input id="order" label="Order" type="number" value={order} onChange={e => setOrder(Number(e.target.value))} min={1} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : initial?.id ? 'Save Changes' : 'Add Card'}</Button>
      </div>
    </form>
  );
}
