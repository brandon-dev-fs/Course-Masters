import { FormEvent, useState } from 'react';
import QuestionEditor, { type QuestionDraft } from './QuestionEditor.js';
import Button from '../../components/Button.js';

interface AssessmentFormProps {
  onSubmit: (questions: QuestionDraft[]) => Promise<void>;
  onCancel: () => void;
}

function newQuestion(order: number): QuestionDraft {
  return { question: '', options: ['', ''], correctIndex: 0, order };
}

export default function AssessmentForm({ onSubmit, onCancel }: AssessmentFormProps) {
  const [questions, setQuestions] = useState<QuestionDraft[]>([newQuestion(1)]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function addQuestion() {
    setQuestions(prev => [...prev, newQuestion(prev.length + 1)]);
  }

  function updateQuestion(i: number, draft: QuestionDraft) {
    setQuestions(prev => prev.map((q, idx) => idx === i ? draft : q));
  }

  function removeQuestion(i: number) {
    if (questions.length <= 1) return;
    setQuestions(prev => prev.filter((_, idx) => idx !== i).map((q, idx) => ({ ...q, order: idx + 1 })));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const invalid = questions.find(q => !q.question.trim() || q.options.some(o => !o.trim()));
    if (invalid) { setError('All questions and options must be filled in'); return; }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(questions);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
      {questions.map((q, i) => (
        <QuestionEditor
          key={i}
          index={i}
          value={q}
          onChange={draft => updateQuestion(i, draft)}
          onRemove={() => removeQuestion(i)}
        />
      ))}

      <button type="button" onClick={addQuestion} className="text-sm text-muted-foreground hover:text-foreground text-left underline">
        + Add Question
      </button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-3 pt-2 sticky bottom-0 bg-surface-raised py-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Create Assessment'}</Button>
      </div>
    </form>
  );
}
