import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ApiClientError, classifyError } from '../../api/client.js';
import type { AssessmentQuestion } from '../../api/types.js';
import Button from '../../components/Button.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import CalculatorPanel from './CalculatorPanel.js';

interface AssessmentTakerProps {
  questions: AssessmentQuestion[];
  onSubmit: (answers: unknown[]) => Promise<void>;
  onCancel: () => void;
}

/** Fisher-Yates shuffle — returns a new shuffled array. */
function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Pre-shuffle right-side items for every matching question (stable across re-renders). */
function buildShuffledRights(questions: AssessmentQuestion[]): string[][] {
  return questions.map(q => {
    if (q.type !== 'matching') return [];
    return shuffle(q.content.pairs.map(p => p.right));
  });
}

function isAnswerComplete(q: AssessmentQuestion, answer: unknown): boolean {
  if (answer === null || answer === undefined) return false;
  switch (q.type) {
    case 'multiple_choice':
    case 'true_false':
      return true; // non-null is sufficient
    case 'fill_in_blank': {
      const arr = answer as string[];
      return Array.isArray(arr) && arr.every(s => s.trim() !== '');
    }
    case 'matching': {
      const arr = answer as string[];
      return Array.isArray(arr) && arr.every(s => s !== '');
    }
  }
}

export default function AssessmentTaker({ questions, onSubmit, onCancel }: AssessmentTakerProps) {
  const [answers, setAnswers] = useState<(unknown | null)[]>(questions.map(() => null));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  // Shuffled right-side values for matching questions (stable — computed once on mount)
  const [shuffledRights] = useState<string[][]>(() => buildShuffledRights(questions));

  const calcTriggerRef = useRef<HTMLButtonElement | null>(null);

  const total = questions.length;
  const isFirst = currentIdx === 0;
  const isLast = currentIdx === total - 1;
  const q = questions[currentIdx];

  // Reset calculator panel whenever the active question changes
  useEffect(() => {
    setIsCalculatorOpen(false);
  }, [currentIdx]);

  function setAnswer(value: unknown) {
    setAnswers(prev => prev.map((a, i) => (i === currentIdx ? value : a)));
  }

  async function handleSubmit() {
    const firstIncomplete = questions.findIndex((q, i) => !isAnswerComplete(q, answers[i]));
    if (firstIncomplete !== -1) {
      setCurrentIdx(firstIncomplete);
      setError('Please answer all questions before submitting.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(answers);
    } catch (err: unknown) {
      setError(
        err instanceof ApiClientError
          ? classifyError(err)
          : err instanceof Error
            ? err.message
            : 'Submission failed',
      );
      setSubmitting(false);
    }
  }

  // ── Per-type answer UI ─────────────────────────────────────────────────────

  function renderAnswerUI() {
    switch (q.type) {
      case 'multiple_choice': {
        const options = q.content.options;
        const selected = answers[currentIdx] as number | null;
        return (
          <div className="flex flex-col gap-2">
            {options.map((opt, optIdx) => (
              <label
                key={optIdx}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                  selected === optIdx
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-surface text-muted-foreground hover:border-primary/50'
                }`}
              >
                <input
                  type="radio"
                  name={`q-${currentIdx}`}
                  checked={selected === optIdx}
                  onChange={() => setAnswer(optIdx)}
                  className="accent-primary"
                />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
        );
      }

      case 'true_false': {
        const selected = answers[currentIdx] as boolean | null;
        return (
          <div className="flex gap-3">
            {([true, false] as const).map(val => (
              <button
                key={String(val)}
                type="button"
                onClick={() => setAnswer(val)}
                className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                  selected === val
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-surface text-muted-foreground hover:border-primary/50'
                }`}
              >
                {val ? 'True' : 'False'}
              </button>
            ))}
          </div>
        );
      }

      case 'fill_in_blank': {
        const blanks = q.content.blanks;
        const answerArr = (answers[currentIdx] as string[] | null) ?? Array(blanks.length).fill('');

        return (
          <div className="flex flex-col gap-3">
            {blanks.map((_, blankIdx) => (
              <div key={blankIdx} className="flex flex-col gap-1">
                <label
                  htmlFor={`q-${currentIdx}-blank-${blankIdx}`}
                  className="text-xs font-medium text-muted-foreground"
                >
                  Blank {blankIdx + 1}
                </label>
                <input
                  id={`q-${currentIdx}-blank-${blankIdx}`}
                  type="text"
                  value={answerArr[blankIdx] ?? ''}
                  onChange={e => {
                    const next = [...answerArr];
                    next[blankIdx] = e.target.value;
                    setAnswer(next);
                  }}
                  className="rounded-xl border-2 border-border bg-surface-raised px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                  placeholder={`Answer for blank ${blankIdx + 1}`}
                />
              </div>
            ))}
          </div>
        );
      }

      case 'matching': {
        const pairs = q.content.pairs;
        const rightOptions = shuffledRights[currentIdx];
        const answerArr = (answers[currentIdx] as string[] | null) ?? Array(pairs.length).fill('');

        return (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              Match each item on the left with its pair on the right.
            </p>
            {pairs.map((pair, pairIdx) => (
              <div key={pairIdx} className="flex items-center gap-3">
                <span className="flex-1 text-sm text-foreground rounded-lg border border-border bg-surface px-3 py-2">
                  {pair.left}
                </span>
                <span className="text-muted-foreground text-sm shrink-0">→</span>
                <select
                  value={answerArr[pairIdx] ?? ''}
                  onChange={e => {
                    const next = [...answerArr];
                    next[pairIdx] = e.target.value;
                    setAnswer(next);
                  }}
                  aria-label={`Match for: ${pair.left}`}
                  className="flex-1 rounded-xl border-2 border-border bg-surface-raised px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="">Select…</option>
                  {rightOptions.map((right, ri) => (
                    <option key={ri} value={right}>{right}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        );
      }
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
        <p className="font-medium text-foreground">
          {currentIdx + 1}. {q.question}
        </p>

        {/* Calculator button — only when enabled for this question */}
        {q.calculatorEnabled && (
          <button
            ref={calcTriggerRef}
            type="button"
            aria-expanded={isCalculatorOpen}
            aria-controls="calculator-panel"
            aria-label={isCalculatorOpen ? 'Close calculator' : 'Open calculator'}
            onClick={() => setIsCalculatorOpen(prev => !prev)}
            className="
              inline-flex items-center justify-center gap-2 font-semibold
              transition-all cursor-pointer
              focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
              bg-surface hover:bg-surface-raised text-foreground border border-border shadow-warm-sm
              px-3 py-1.5 text-sm rounded-xl self-start
              sm:self-start w-full sm:w-auto min-h-[44px] sm:min-h-0
            "
          >
            🧮 {isCalculatorOpen ? 'Close calculator' : 'Calculator'}
          </button>
        )}

        {/* Inline calculator panel (mobile) or floating portal (desktop) */}
        {q.calculatorEnabled && isCalculatorOpen && (
          <CalculatorPanel
            key={currentIdx}
            onClose={() => setIsCalculatorOpen(false)}
            triggerRef={calcTriggerRef}
          />
        )}

        {renderAnswerUI()}
      </div>

      {error && <ErrorMessage message={error} />}

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
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
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
