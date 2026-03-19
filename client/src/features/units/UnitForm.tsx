import { FormEvent, useState } from 'react';
import Input from '../../components/Input.js';
import Textarea from '../../components/Textarea.js';
import Button from '../../components/Button.js';
import type { Unit } from '../../api/types.js';

interface UnitFormProps {
  initial?: Partial<Unit>;
  nextOrder?: number;
  onSubmit: (data: { title: string; description: string; order: number }) => Promise<void>;
  onCancel: () => void;
}

export default function UnitForm({ initial, nextOrder = 1, onSubmit, onCancel }: UnitFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [order, setOrder] = useState(initial?.order ?? nextOrder);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    if (!description.trim()) { setError('Description is required'); return; }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({ title: title.trim(), description: description.trim(), order });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input id="title" label="Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Chapter 1" error={error && !title.trim() ? error : undefined} autoFocus />
      <Textarea id="description" label="Description" value={description} onChange={e => setDescription(e.target.value)} placeholder="What will students learn in this unit?" rows={3} error={error && title.trim() && !description.trim() ? error : undefined} />
      <Input id="order" label="Order" type="number" value={order} onChange={e => setOrder(Number(e.target.value))} min={1} />
      {error && title.trim() && description.trim() && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : initial?.id ? 'Save Changes' : 'Add Unit'}</Button>
      </div>
    </form>
  );
}
