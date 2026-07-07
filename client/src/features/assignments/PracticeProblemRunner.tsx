import { useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import Button from '../../components/Button.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import type { PracticeQuestion, PracticeQuestionType } from '../../api/types.js';

interface PracticeProblemRunnerProps {
  questions: PracticeQuestion[];
  passingPercentage?: number | null;
  onAutoComplete: () => Promise<void>;
  onManualComplete: () => Promise<void>;
}

type Phase = 'question' | 'feedback' | 'summary';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function checkCorrect(question: PracticeQuestion, answer: unknown): boolean {
  const c = question.content;
  switch (question.type as PracticeQuestionType) {
    case 'multiple_choice': {
      return answer === (c.correctIndex as number);
    }
    case 'true_false': {
      return answer === (c.correct as boolean);
    }
    case 'matching': {
      // answer is Record<number, number> mapping leftIdx → rightIdx
      const answerMap = answer as Record<number, number>;
      const pairs = c.pairs as { id?: string; left: string; right: string }[] | undefined;
      if (pairs) {
        // New shape: pairs[i] is the correct match, rightItems shown in same order
        return pairs.every((_, i) => answerMap[i] === i);
      }
      const correctPairs = (c.correctPairs as [number, number][]) ?? [];
      return correctPairs.every(([l, r]) => answerMap[l] === r);
    }
    case 'fill_in_blank': {
      const blanks = (c.blanks as { answer: string; alternatives?: string[] }[]) ?? [];
      const answerArr = answer as string[];
      return blanks.every((blank, i) => {
        const given = (answerArr[i] ?? '').trim().toLowerCase();
        if (!given) return false;
        const correct = blank.answer.toLowerCase();
        if (given === correct) return true;
        return (blank.alternatives ?? []).some(alt => alt.toLowerCase() === given);
      });
    }
    default:
      return false;
  }
}

function isAnswerSelected(question: PracticeQuestion, answer: unknown): boolean {
  switch (question.type as PracticeQuestionType) {
    case 'multiple_choice':
      return answer !== null;
    case 'true_false':
      return answer !== null;
    case 'matching': {
      const map = answer as Record<number, number> | null;
      if (!map) return false;
      const pairs = question.content.pairs as unknown[] | undefined;
      const count = pairs ? pairs.length : ((question.content.leftItems as string[]) ?? []).length;
      return Array.from({ length: count }, (_, i) => i).every(i => map[i] !== undefined);
    }
    case 'fill_in_blank': {
      const arr = answer as string[] | null;
      if (!arr) return false;
      const blanks = (question.content.blanks as { answer: string }[]) ?? [];
      return blanks.every((_, i) => (arr[i] ?? '').trim().length > 0);
    }
    default:
      return false;
  }
}

// ─── Answer Controls ──────────────────────────────────────────────────────────

interface MultipleChoiceRunnerProps {
  content: Record<string, unknown>;
  answer: number | null;
  submitted: boolean;
  onChange: (idx: number) => void;
}

function MultipleChoiceRunner({ content, answer, submitted, onChange }: MultipleChoiceRunnerProps) {
  const options = (content.options as string[]) ?? [];
  const correctIndex = content.correctIndex as number;

  return (
    <div className="flex flex-col gap-2">
      {options.map((opt, i) => {
        let rowClass = 'flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border cursor-pointer transition-colors hover:bg-surface-raised min-h-[44px]';
        if (submitted) {
          if (i === correctIndex) rowClass = 'flex items-center gap-3 px-3 py-2.5 rounded-lg border border-success bg-success/10 text-success min-h-[44px] pointer-events-none';
          else if (i === answer) rowClass = 'flex items-center gap-3 px-3 py-2.5 rounded-lg border border-destructive bg-destructive/10 text-destructive min-h-[44px] pointer-events-none opacity-80';
          else rowClass = 'flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border min-h-[44px] pointer-events-none opacity-80';
        }

        return (
          <label key={i} className={rowClass}>
            <input
              type="radio"
              name="mc-answer"
              checked={answer === i}
              onChange={() => !submitted && onChange(i)}
              disabled={submitted}
              className="accent-accent shrink-0"
            />
            <span className="text-sm text-foreground">{opt}</span>
          </label>
        );
      })}
    </div>
  );
}

interface TrueFalseRunnerProps {
  answer: boolean | null;
  submitted: boolean;
  correct: boolean;
  onChange: (v: boolean) => void;
}

function TrueFalseRunner({ answer, submitted, correct, onChange }: TrueFalseRunnerProps) {
  return (
    <div className="flex gap-3">
      {([true, false] as boolean[]).map(v => {
        const label = v ? 'True' : 'False';
        let rowClass = 'flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border cursor-pointer transition-colors hover:bg-surface-raised min-h-[44px] flex-1 justify-center';
        if (submitted) {
          if (v === correct) rowClass = 'flex items-center gap-2 px-4 py-2.5 rounded-lg border border-success bg-success/10 text-success min-h-[44px] flex-1 justify-center pointer-events-none';
          else if (v === answer) rowClass = 'flex items-center gap-2 px-4 py-2.5 rounded-lg border border-destructive bg-destructive/10 text-destructive min-h-[44px] flex-1 justify-center pointer-events-none opacity-80';
          else rowClass = 'flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border min-h-[44px] flex-1 justify-center pointer-events-none opacity-80';
        }
        return (
          <label key={label} className={rowClass}>
            <input
              type="radio"
              name="tf-answer"
              checked={answer === v}
              onChange={() => !submitted && onChange(v)}
              disabled={submitted}
              className="accent-accent shrink-0"
            />
            <span className="text-sm font-medium">{label}</span>
          </label>
        );
      })}
    </div>
  );
}

interface MatchingRunnerProps {
  content: Record<string, unknown>;
  answer: Record<number, number> | null;
  submitted: boolean;
  onChange: (map: Record<number, number>) => void;
}

function MatchingRunner({ content, answer, submitted, onChange }: MatchingRunnerProps) {
  // Support both old shape (leftItems/rightItems/correctPairs) and new shape (pairs:[{id?,left,right}])
  const rawPairs = content.pairs as { id?: string; left: string; right: string }[] | undefined;
  const leftItems  = rawPairs ? rawPairs.map(p => p.left)  : (content.leftItems  as string[]) ?? [];
  const rightItems = rawPairs ? rawPairs.map(p => p.right) : (content.rightItems as string[]) ?? [];
  const correctPairs: [number, number][] = rawPairs
    ? rawPairs.map((_, i) => [i, i])
    : (content.correctPairs as [number, number][]) ?? [];

  function handleChange(leftIdx: number, rightIdx: number) {
    onChange({ ...(answer ?? {}), [leftIdx]: rightIdx });
  }

  return (
    <div className="flex flex-col gap-2">
      {leftItems.map((left, li) => {
        const selected = answer?.[li];
        const correct = correctPairs.find(([l]) => l === li)?.[1];
        let rowClass = 'flex items-center gap-3';
        return (
          <div key={li} className={rowClass}>
            <span className="flex-1 text-sm text-foreground">{left}</span>
            <span className="text-muted-foreground text-sm">→</span>
            <select
              value={selected ?? ''}
              onChange={e => !submitted && handleChange(li, Number(e.target.value))}
              disabled={submitted}
              className={`flex-1 rounded-md border px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary ${
                submitted
                  ? selected === correct
                    ? 'border-success bg-success/10'
                    : 'border-destructive bg-destructive/10'
                  : 'border-border bg-surface-raised'
              }`}
            >
              <option value="" disabled>Select...</option>
              {rightItems.map((r, ri) => (
                <option key={ri} value={ri}>{r}</option>
              ))}
            </select>
          </div>
        );
      })}
      {submitted && (
        <div className="mt-2 text-xs text-muted-foreground">
          Correct pairs: {correctPairs.map(([l, r]) => `${leftItems[l]} → ${rightItems[r]}`).join(', ')}
        </div>
      )}
    </div>
  );
}

interface FillInBlankRunnerProps {
  content: Record<string, unknown>;
  answer: string[] | null;
  submitted: boolean;
  onChange: (arr: string[]) => void;
}

function FillInBlankRunner({ content, answer, submitted, onChange }: FillInBlankRunnerProps) {
  const blanks = (content.blanks as { answer: string; alternatives?: string[] }[]) ?? [];

  function handleChange(i: number, v: string) {
    const next = [...(answer ?? blanks.map(() => ''))];
    next[i] = v;
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      {blanks.map((blank, i) => {
        const given = (answer?.[i] ?? '').trim().toLowerCase();
        const correct = blank.answer.toLowerCase();
        const isCorrect = given === correct || (blank.alternatives ?? []).some(alt => alt.toLowerCase() === given);
        return (
          <div key={i} className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Blank {i + 1}</label>
            <input
              type="text"
              value={answer?.[i] ?? ''}
              onChange={e => !submitted && handleChange(i, e.target.value)}
              disabled={submitted}
              placeholder="Your answer..."
              className={`rounded-xl border-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none ${
                submitted
                  ? isCorrect
                    ? 'border-success bg-success/10'
                    : 'border-destructive bg-destructive/10'
                  : 'border-border bg-surface-raised focus:border-primary'
              }`}
            />
            {submitted && !isCorrect && (
              <p className="text-xs text-success">Correct answer: {blank.answer}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Runner ──────────────────────────────────────────────────────────────

export default function PracticeProblemRunner({
  questions, passingPercentage, onAutoComplete, onManualComplete,
}: PracticeProblemRunnerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(unknown | null)[]>(() => new Array(questions.length).fill(null));
  const [submittedAt, setSubmittedAt] = useState<boolean[]>(() => new Array(questions.length).fill(false));
  const [phase, setPhase] = useState<Phase>('question');
  const [score, setScore] = useState<{ correct: number; total: number; percent: number } | null>(null);
  const [autoCompleted, setAutoCompleted] = useState(false);
  const [completeError, setCompleteError] = useState('');
  const [completing, setCompleting] = useState(false);

  const currentQuestion = questions[currentIndex];
  const isSubmitted = submittedAt[currentIndex];
  const currentAnswer = answers[currentIndex];

  function handleAnswerChange(answer: unknown) {
    setAnswers(prev => prev.map((a, i) => i === currentIndex ? answer : a));
  }

  function handleSubmitAnswer() {
    if (!isAnswerSelected(currentQuestion, currentAnswer)) return;
    setSubmittedAt(prev => prev.map((s, i) => i === currentIndex ? true : s));
    setPhase('feedback');
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setPhase('question');
    } else {
      // Last question submitted — compute score and go to summary
      // Include the current (just-submitted) answer in the count
      const finalCorrect = questions.filter((q, i) => {
        const ans = i === currentIndex ? currentAnswer : answers[i];
        return checkCorrect(q, ans);
      }).length;
      const percent = (finalCorrect / questions.length) * 100;
      const result = { correct: finalCorrect, total: questions.length, percent };
      setScore(result);
      setPhase('summary');

      if (passingPercentage != null && percent >= passingPercentage) {
        setCompleting(true);
        onAutoComplete()
          .then(() => { setAutoCompleted(true); setCompleting(false); })
          .catch(err => { setCompleteError(err instanceof Error ? err.message : 'Failed to mark complete'); setCompleting(false); });
      }
    }
  }

  function handleManualCompleteClick() {
    setCompleting(true);
    setCompleteError('');
    onManualComplete()
      .catch(err => { setCompleteError(err instanceof Error ? err.message : 'Failed to mark complete'); })
      .finally(() => setCompleting(false));
  }

  function handleRetry() {
    setCurrentIndex(0);
    setAnswers(new Array(questions.length).fill(null));
    setSubmittedAt(new Array(questions.length).fill(false));
    setPhase('question');
    setScore(null);
    setAutoCompleted(false);
    setCompleteError('');
    setCompleting(false);
  }

  if (questions.length === 0) {
    return <p className="text-sm text-muted-foreground">No questions available.</p>;
  }

  // ── Summary ──
  if (phase === 'summary' && score) {
    const passed = passingPercentage != null && score.percent >= passingPercentage;
    return (
      <div className="flex flex-col gap-4">
        <div aria-live="polite" className="flex flex-col gap-2 text-center py-4">
          <p className="text-2xl font-bold text-foreground">
            {score.correct} / {score.total}
          </p>
          <p className="text-lg font-semibold text-foreground">{Math.round(score.percent)}%</p>
          {passingPercentage != null && (
            <p className="text-sm text-muted-foreground">
              Passing: {passingPercentage}%
            </p>
          )}
          {autoCompleted && (
            <p className="text-sm font-medium text-success">Assignment completed!</p>
          )}
          {completing && !autoCompleted && (
            <p className="text-sm text-muted-foreground">Marking complete...</p>
          )}
          {completeError && (
            <ErrorMessage variant="inline" message={completeError} />
          )}
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <Button
            type="button"
            variant="secondary"
            onClick={handleRetry}
            className="w-full sm:w-auto"
          >
            <RotateCcw className="w-4 h-4" />
            Retry
          </Button>
          {passingPercentage == null && !autoCompleted && (
            <Button
              type="button"
              onClick={handleManualCompleteClick}
              disabled={completing}
              className="w-full sm:w-auto"
            >
              {completing ? 'Marking...' : 'Mark complete'}
            </Button>
          )}
          {passingPercentage != null && !passed && !autoCompleted && (
            <p className="text-sm text-muted-foreground w-full text-center">
              Score {Math.round(score.percent)}% did not meet the passing threshold of {passingPercentage}%. Retry to try again.
            </p>
          )}
          {completeError && passingPercentage != null && (
            <Button
              type="button"
              onClick={handleManualCompleteClick}
              disabled={completing}
              className="w-full sm:w-auto"
            >
              {completing ? 'Marking...' : 'Mark complete'}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ── Question / Feedback ──
  const progressPct = ((currentIndex + (phase === 'summary' ? 1 : 0)) / questions.length) * 100;
  const wasCorrect = isSubmitted && checkCorrect(currentQuestion, currentAnswer);

  return (
    <div className="flex flex-col gap-4">
      {/* Progress bar */}
      <div className="w-full bg-surface-raised rounded-full h-1.5 mb-4" aria-hidden="true">
        <div
          className="bg-primary h-1.5 rounded-full transition-all"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Question header */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          Question {currentIndex + 1} of {questions.length}
        </span>
      </div>

      {/* Question text */}
      {typeof currentQuestion.content.question === 'string' && currentQuestion.content.question && (
        <p className="text-sm font-medium text-foreground">
          {currentQuestion.content.question}
        </p>
      )}

      {/* Answer controls */}
      {currentQuestion.type === 'multiple_choice' && (
        <MultipleChoiceRunner
          content={currentQuestion.content}
          answer={currentAnswer as number | null}
          submitted={isSubmitted}
          onChange={handleAnswerChange}
        />
      )}
      {currentQuestion.type === 'true_false' && (
        <TrueFalseRunner
          answer={currentAnswer as boolean | null}
          submitted={isSubmitted}
          correct={(currentQuestion.content.correct as boolean) ?? true}
          onChange={handleAnswerChange}
        />
      )}
      {currentQuestion.type === 'matching' && (
        <MatchingRunner
          content={currentQuestion.content}
          answer={currentAnswer as Record<number, number> | null}
          submitted={isSubmitted}
          onChange={handleAnswerChange}
        />
      )}
      {currentQuestion.type === 'fill_in_blank' && (
        <FillInBlankRunner
          content={currentQuestion.content}
          answer={currentAnswer as string[] | null}
          submitted={isSubmitted}
          onChange={handleAnswerChange}
        />
      )}

      {/* Feedback */}
      {isSubmitted && (
        <div className={`flex items-center gap-2 text-sm font-medium ${wasCorrect ? 'text-success' : 'text-destructive'}`}>
          {wasCorrect ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
          {wasCorrect ? 'Correct!' : 'Incorrect'}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end gap-3 pt-2">
        {!isSubmitted ? (
          <Button
            type="button"
            onClick={handleSubmitAnswer}
            disabled={!isAnswerSelected(currentQuestion, currentAnswer)}
          >
            Submit
          </Button>
        ) : (
          <Button type="button" onClick={handleNext}>
            {currentIndex < questions.length - 1 ? 'Next question' : 'See results'}
          </Button>
        )}
      </div>
    </div>
  );
}
