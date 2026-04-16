import { FormEvent, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import QuestionEditor, { type QuestionDraft } from './QuestionEditor.js';
import Button from '../../components/Button.js';

export interface AssessmentFormProps {
  initialQuestions?: QuestionDraft[];
  /** Initial value of the calculator-allowed toggle. Defaults to false. */
  initialCalculatorAllowed?: boolean;
  /** Called on valid submit with all questions and the calculator flag. */
  onSubmit: (questions: QuestionDraft[], calculatorAllowed: boolean) => Promise<void>;
  onCancel: () => void;
  /**
   * When true, renders the "Settings" section with the calculator toggle.
   * Should be true for teacher/admin roles only.
   */
  showCalculatorToggle?: boolean;
}

function newQuestion(order: number): QuestionDraft {
  return { question: '', content: { options: ['', ''], correctIndex: 0 }, order };
}

function isComplete(q: QuestionDraft) {
  return q.question.trim() !== '' && q.content.options.every(o => o.trim() !== '');
}

export default function AssessmentForm({
  initialQuestions,
  initialCalculatorAllowed = false,
  onSubmit,
  onCancel,
  showCalculatorToggle = false,
}: AssessmentFormProps) {
  const [questions, setQuestions] = useState<QuestionDraft[]>(
    initialQuestions && initialQuestions.length > 0 ? initialQuestions : [newQuestion(1)],
  );
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [calculatorAllowed, setCalculatorAllowed] = useState(initialCalculatorAllowed);

  const currentComplete = isComplete(questions[current]);

  function addQuestion() {
    const next = questions.length;
    setQuestions(prev => [...prev, newQuestion(prev.length + 1)]);
    setCurrent(next);
  }

  function updateQuestion(draft: QuestionDraft) {
    setQuestions(prev => prev.map((q, idx) => (idx === current ? draft : q)));
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
      await onSubmit(questions, calculatorAllowed);
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

      {/* Settings section — only visible to teachers/admins */}
      {showCalculatorToggle && (
        <>
          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Settings</h3>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Allow Calculator</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Students can open the calculator during this assessment
                </p>
              </div>
              {/* Toggle switch — WCAG role="switch" */}
              <button
                type="button"
                role="switch"
                aria-checked={calculatorAllowed}
                aria-label="Allow calculator"
                onClick={() => setCalculatorAllowed(prev => !prev)}
                className={[
                  'relative inline-flex shrink-0 items-center',
                  'w-10 h-6 rounded-full border transition-colors duration-200',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                  'active:scale-95 transition-transform',
                  calculatorAllowed
                    ? 'bg-primary border-primary hover:bg-primary/90'
                    : 'bg-muted border-border hover:border-muted-foreground',
                ].join(' ')}
              >
                <span
                  aria-hidden="true"
                  className={[
                    'inline-block w-4 h-4 rounded-full bg-surface-raised shadow-warm-sm',
                    'transition-transform duration-200',
                    calculatorAllowed ? 'translate-x-5' : 'translate-x-1',
                  ].join(' ')}
                />
              </button>
            </div>
          </div>
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-3 pt-2 border-t border-border">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save Assessment'}
        </Button>
      </div>
    </form>
  );
}
