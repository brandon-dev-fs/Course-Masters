import { FormEvent, useState } from 'react';
import Textarea from '../../components/Textarea.js';
import Input from '../../components/Input.js';
import Button from '../../components/Button.js';
import type { Note } from '../../api/types.js';

interface NoteFormProps {
  initial?: Partial<Note>;
  nextOrder?: number;
  onSubmit: (data: { content: string; order: number }) => Promise<void>;
  onCancel: () => void;
}

export default function NoteForm({ initial, nextOrder = 1, onSubmit, onCancel }: NoteFormProps) {
  const [content, setContent] = useState(initial?.content ?? '');
  const [order, setOrder] = useState(initial?.order ?? nextOrder);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) { setError('Content is required'); return; }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({ content: content.trim(), order });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Textarea id="content" label="Content" value={content} onChange={e => setContent(e.target.value)} placeholder="Write your note here..." rows={5} autoFocus />
      <Input id="order" label="Order" type="number" value={order} onChange={e => setOrder(Number(e.target.value))} min={1} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : initial?.id ? 'Save Changes' : 'Add Note'}</Button>
      </div>
    </form>
  );
}
