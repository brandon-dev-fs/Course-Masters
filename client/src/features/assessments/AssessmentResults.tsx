import type { AttemptResult } from '../../api/types.js';
import Button from '../../components/Button.js';

interface AssessmentResultsProps {
  result: AttemptResult;
  onRetake: () => void;
  onDismiss: () => void;
}

export default function AssessmentResults({ result, onRetake, onDismiss }: AssessmentResultsProps) {
  const pct = Math.round(result.score * 100);

  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <div
        aria-describedby="assessment-result-status"
        className={`text-6xl font-bold ${result.passed ? 'text-accent' : 'text-destructive'}`}
      >
        {pct}%
      </div>

      <div>
        <p id="assessment-result-status" className={`text-lg font-semibold ${result.passed ? 'text-accent' : 'text-destructive'}`}>
          {result.passed ? '✓ Passed!' : '✗ Not passed'}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {result.correctCount} / {result.totalQuestions} correct &middot; 80% required to pass
        </p>
      </div>

      <div className="w-full bg-surface rounded-full h-2 mt-2">
        <div
          className={`h-2 rounded-full transition-all ${result.passed ? 'bg-accent' : 'bg-destructive'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex gap-3 mt-2">
        <Button variant="secondary" onClick={onRetake}>Try Again</Button>
        <Button onClick={onDismiss}>{result.passed ? 'Continue' : 'Close'}</Button>
      </div>
    </div>
  );
}
