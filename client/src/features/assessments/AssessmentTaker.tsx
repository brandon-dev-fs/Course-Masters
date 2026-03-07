import { useState } from 'react';
import type { QuizQuestion, TestQuestion, FinalExamQuestion } from '../../api/types.js';
import Button from '../../components/Button.js';

type Question = QuizQuestion | TestQuestion | FinalExamQuestion;

interface AssessmentTakerProps {
  questions: Question[];
  onSubmit: (answers: number[]) => Promise<void>;
  onCancel: () => void;
}

export default function AssessmentTaker({ questions, onSubmit, onCancel }: AssessmentTakerProps) {
  const [answers, setAnswers] = useState<(number | null)[]>(questions.map(() => null));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function selectAnswer(qIdx: number, optIdx: number) {
    setAnswers(prev => prev.map((a, i) => i === qIdx ? optIdx : a));
  }

  async function handleSubmit() {
    if (answers.some(a => a === null)) { setError('Please answer all questions'); return; }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(answers as number[]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed');
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {questions.map((q, qIdx) => (
        <div key={q.id} className="flex flex-col gap-3">
          <p className="font-medium text-foreground">{qIdx + 1}. {q.question}</p>
          <div className="flex flex-col gap-2">
            {q.options.map((opt, optIdx) => (
              <label
                key={optIdx}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                  answers[qIdx] === optIdx
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-surface text-muted-foreground hover:border-primary/50'
                }`}
              >
                <input
                  type="radio"
                  name={`q-${qIdx}`}
                  checked={answers[qIdx] === optIdx}
                  onChange={() => selectAnswer(qIdx, optIdx)}
                  className="accent-primary"
                />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit'}
        </Button>
      </div>
    </div>
  );
}
