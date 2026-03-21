import { useState } from 'react';
import Input from '../../components/Input.js';
import Button from '../../components/Button.js';
import QuestionEditor, { type QuestionDraft } from '../assessments/QuestionEditor.js';
import type { PracticeProblem } from '../../api/types.js';
import useFormSubmit from '../../hooks/useFormSubmit.js';

interface PracticeProblemFormProps {
  initial?: Partial<PracticeProblem>;
  nextOrder?: number;
  onSubmit: (data: { question: string; options: string[]; correctIndex: number; order: number }) => Promise<void>;
  onCancel: () => void;
}

export default function PracticeProblemForm({ initial, nextOrder = 1, onSubmit, onCancel }: PracticeProblemFormProps) {
  const [draft, setDraft] = useState<QuestionDraft>({
    question: initial?.question ?? '',
    options: (initial?.options as string[]) ?? ['', ''],
    correctIndex: initial?.correctIndex ?? 0,
    order: initial?.order ?? nextOrder,
  });
  const { error, submitting, handleSubmit } = useFormSubmit(async () => {
    if (!draft.question.trim()) throw new Error('Question is required');
    if (draft.options.some(o => !o.trim())) throw new Error('All options must have text');
    await onSubmit({ question: draft.question.trim(), options: draft.options, correctIndex: draft.correctIndex, order: draft.order });
  });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <QuestionEditor index={0} value={draft} onChange={setDraft} onRemove={() => {}} />
      <Input id="order" label="Order" type="number" value={draft.order} onChange={e => setDraft(prev => ({ ...prev, order: Number(e.target.value) }))} min={1} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : initial?.id ? 'Save Changes' : 'Add Problem'}</Button>
      </div>
    </form>
  );
}
