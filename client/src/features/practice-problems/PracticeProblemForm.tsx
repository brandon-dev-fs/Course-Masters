import { FormEvent, useState } from 'react';
import Input from '../../components/Input.js';
import Textarea from '../../components/Textarea.js';
import Button from '../../components/Button.js';
import type { PracticeProblem } from '../../api/types.js';

interface PracticeProblemFormProps {
  initial?: Partial<PracticeProblem>;
  nextOrder?: number;
  onSubmit: (data: { question: string; answer: string; order: number }) => Promise<void>;
  onCancel: () => void;
}

export default function PracticeProblemForm({ initial, nextOrder = 1, onSubmit, onCancel }: PracticeProblemFormProps) {
  const [question, setQuestion] = useState(initial?.question ?? '');
  const [answer, setAnswer] = useState(initial?.answer ?? '');
  const [order, setOrder] = useState(initial?.order ?? nextOrder);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) { setError('Question and answer are required'); return; }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({ question: question.trim(), answer: answer.trim(), order });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Textarea id="question" label="Question" value={question} onChange={e => setQuestion(e.target.value)} placeholder="What is...?" rows={3} autoFocus />
      <Textarea id="answer" label="Answer" value={answer} onChange={e => setAnswer(e.target.value)} placeholder="The answer..." rows={2} />
      <Input id="order" label="Order" type="number" value={order} onChange={e => setOrder(Number(e.target.value))} min={1} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : initial?.id ? 'Save Changes' : 'Add Problem'}</Button>
      </div>
    </form>
  );
}
