import { FormEvent, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import QuestionEditor, { type QuestionDraft } from './QuestionEditor.js';
import Button from '../../components/Button.js';

interface AssessmentFormProps {
  initialQuestions?: QuestionDraft[];
  onSubmit: (questions: QuestionDraft[]) => Promise<void>;
  onCancel: () => void;
}

function newQuestion(order: number): QuestionDraft {
  return { question: '', options: ['', ''], correctIndex: 0, order };
}

function isComplete(q: QuestionDraft) {
  return q.question.trim() !== '' && q.options.every(o => o.trim() !== '');
}

export default function AssessmentForm({ initialQuestions, onSubmit, onCancel }: AssessmentFormProps) {
  const [questions, setQuestions] = useState<QuestionDraft[]>(
    initialQuestions && initialQuestions.length > 0 ? initialQuestions : [newQuestion(1)]
  );
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentComplete = isComplete(questions[current]);

  function addQuestion() {
    const next = questions.length;
    setQuestions(prev => [...prev, newQuestion(prev.length + 1)]);
    setCurrent(next);
  }

  function updateQuestion(draft: QuestionDraft) {
    setQuestions(prev => prev.map((q, idx) => idx === current ? draft : q));
  }

  function removeQuestion() {
    if (questions.length <= 1) return;
    const updated = questions
      .filter((_, idx) => idx !== current)
      .map((q, idx) => ({ ...q, order: idx + 1 }));
    setQuestions(updated);
    setCurrent(prev => Math.min(prev, updated.length - 1));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const invalid = questions.find(q => !isComplete(q));
    if (invalid) {
      setCurrent(questions.indexOf(invalid));
      setError('All questions and options must be filled in');
      return;
    }
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

  const total = questions.length;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Progress label */}
      <span className="text-sm font-medium text-foreground">
        Question {current + 1} <span className="text-muted-foreground">of {total}</span>
      </span>

      {/* Current question */}
      <QuestionEditor
        index={current}
        value={questions[current]}
        onChange={updateQuestion}
        onRemove={removeQuestion}
      />

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrent(prev => prev - 1)}
          disabled={current === 0}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Prev
        </button>

        {current === total - 1 ? (
          <button
            type="button"
            onClick={addQuestion}
            disabled={!currentComplete}
            className="text-sm text-primary hover:text-primary/80 font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            + Add Question
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCurrent(prev => prev + 1)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-3 pt-2 border-t border-border">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save Assessment'}</Button>
      </div>
    </form>
  );
}
