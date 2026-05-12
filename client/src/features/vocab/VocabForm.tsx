import { useState } from 'react';
import Input from '../../components/Input.js';
import Textarea from '../../components/Textarea.js';
import Button from '../../components/Button.js';
import type { LessonTool } from '../../api/types.js';
import useFormSubmit from '../../hooks/useFormSubmit.js';

interface VocabFormProps {
  initial?: LessonTool;
  nextOrder?: number;
  onSubmit: (data: { term: string; definition: string; order: number }) => Promise<void>;
  onCancel: () => void;
}

export default function VocabForm({ initial, nextOrder = 1, onSubmit, onCancel }: VocabFormProps) {
  const [term, setTerm] = useState(initial?.type === 'vocab' ? (initial.content.term ?? '') : '');
  const [definition, setDefinition] = useState(initial?.type === 'vocab' ? (initial.content.definition ?? '') : '');
  const [order, setOrder] = useState(initial?.order ?? nextOrder);
  const { error, submitting, handleSubmit } = useFormSubmit(async () => {
    if (!term.trim() || !definition.trim()) throw new Error('Term and definition are required');
    await onSubmit({ term: term.trim(), definition: definition.trim(), order });
  });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input id="term" label="Term" value={term} onChange={e => setTerm(e.target.value)} placeholder="e.g. Variable" autoFocus />
      <Textarea id="definition" label="Definition" value={definition} onChange={e => setDefinition(e.target.value)} placeholder="A clear, concise explanation..." rows={3} />
      <Input id="order" label="Order" type="number" value={order} onChange={e => setOrder(Number(e.target.value))} min={1} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : initial?.id ? 'Save Changes' : 'Add Term'}</Button>
      </div>
    </form>
  );
}
