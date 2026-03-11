import { FormEvent, useState } from 'react';
import Input from '../../components/Input.js';
import Textarea from '../../components/Textarea.js';
import Button from '../../components/Button.js';
import type { Vocab } from '../../api/types.js';

interface VocabFormProps {
  initial?: Partial<Vocab>;
  nextOrder?: number;
  onSubmit: (data: { term: string; definition: string; order: number }) => Promise<void>;
  onCancel: () => void;
}

export default function VocabForm({ initial, nextOrder = 1, onSubmit, onCancel }: VocabFormProps) {
  const [term, setTerm] = useState(initial?.term ?? '');
  const [definition, setDefinition] = useState(initial?.definition ?? '');
  const [order, setOrder] = useState(initial?.order ?? nextOrder);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!term.trim() || !definition.trim()) { setError('Term and definition are required'); return; }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({ term: term.trim(), definition: definition.trim(), order });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input id="term" label="Term" value={term} onChange={e => setTerm(e.target.value)} placeholder="e.g. Variable" autoFocus />
      <Textarea id="definition" label="Definition" value={definition} onChange={e => setDefinition(e.target.value)} placeholder="A clear, concise explanation..." rows={3} />
      <Input id="order" label="Order" type="number" value={order} onChange={e => setOrder(Number(e.target.value))} min={1} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : initial?.id ? 'Save Changes' : 'Add Term'}</Button>
      </div>
    </form>
  );
}
