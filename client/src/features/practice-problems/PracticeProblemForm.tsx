import { useState } from 'react';
import Input from '../../components/Input.js';
import Button from '../../components/Button.js';
import QuestionEditor, { type QuestionDraft } from '../assessments/QuestionEditor.js';
import type { LessonTool } from '../../api/types.js';
import useFormSubmit from '../../hooks/useFormSubmit.js';

interface PracticeProblemFormProps {
  initial?: LessonTool;
  nextOrder?: number;
  onSubmit: (draft: QuestionDraft) => Promise<void>;
  onCancel: () => void;
}

export default function PracticeProblemForm({ initial, nextOrder = 1, onSubmit, onCancel }: PracticeProblemFormProps) {
  const isPracticeProblem = initial?.type === 'practice_problem';
  const [draft, setDraft] = useState<QuestionDraft>({
    question: isPracticeProblem ? (initial.content.question ?? '') : '',
    content: {
      options: isPracticeProblem ? (initial.content.options ?? ['', '']) : ['', ''],
      correctIndex: isPracticeProblem ? (initial.content.correctIndex ?? 0) : 0,
    },
    order: initial?.order ?? nextOrder,
    calculatorEnabled: isPracticeProblem ? (initial.content.calculatorEnabled ?? false) : false,
  });
  const { error, submitting, handleSubmit } = useFormSubmit(async () => {
    if (!draft.question.trim()) throw new Error('Question is required');
    if (draft.content.options.some(o => !o.trim())) throw new Error('All options must have text');
    await onSubmit(draft);
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
