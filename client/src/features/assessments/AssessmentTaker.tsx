import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { AssessmentQuestion } from '../../api/types.js';
import Button from '../../components/Button.js';

interface AssessmentTakerProps {
  questions: AssessmentQuestion[];
  onSubmit: (answers: unknown[]) => Promise<void>;
  onCancel: () => void;
}

export default function AssessmentTaker({ questions, onSubmit, onCancel }: AssessmentTakerProps) {
  const [answers, setAnswers] = useState<(number | null)[]>(questions.map(() => null));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const total = questions.length;
  const isFirst = currentIdx === 0;
  const isLast = currentIdx === total - 1;
  const q = questions[currentIdx];
  const options = (q.content?.options as string[]) ?? [];

  function selectAnswer(optIdx: number) {
    setAnswers(prev => prev.map((a, i) => i === currentIdx ? optIdx : a));
  }

  async function handleSubmit() {
    if (answers.some(a => a === null)) { setError('Please answer all questions before submitting'); return; }
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
      {/* Question counter */}
      <div className="flex justify-end">
        <span className="text-xs text-muted-foreground font-medium">
          {currentIdx + 1} / {total}
        </span>
      </div>

      {/* Current question */}
      <div className="flex flex-col gap-3">
        <p className="font-medium text-foreground">{currentIdx + 1}. {q.question}</p>
        <div className="flex flex-col gap-2">
          {options.map((opt, optIdx) => (
            <label
              key={optIdx}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                answers[currentIdx] === optIdx
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-surface text-muted-foreground hover:border-primary/50'
              }`}
            >
              <input
                type="radio"
                name={`q-${currentIdx}`}
                checked={answers[currentIdx] === optIdx}
                onChange={() => selectAnswer(optIdx)}
                className="accent-primary"
              />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Navigation and actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentIdx(i => i - 1)}
          disabled={isFirst}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>Cancel</Button>
          {isLast ? (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit'}
            </Button>
          ) : (
            <Button onClick={() => setCurrentIdx(i => i + 1)}>
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
