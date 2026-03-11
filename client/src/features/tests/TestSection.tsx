import { useEffect, useState } from 'react';
import { testsApi } from '../../api/tests.js';
import type { Test, AttemptResult } from '../../api/types.js';
import AssessmentForm from '../assessments/AssessmentForm.js';
import AssessmentTaker from '../assessments/AssessmentTaker.js';
import AssessmentResults from '../assessments/AssessmentResults.js';
import { type QuestionDraft } from '../assessments/QuestionEditor.js';
import Modal from '../../components/Modal.js';
import Button from '../../components/Button.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';

type View = 'idle' | 'creating' | 'taking' | 'results';

interface TestSectionProps {
  unitId: string;
  allLessonsComplete?: boolean;
  completedCount?: number;
  totalCount?: number;
}

export default function TestSection({ unitId, allLessonsComplete = true, completedCount = 0, totalCount = 0 }: TestSectionProps) {
  const [test, setTest] = useState<Test | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<View>('idle');
  const [result, setResult] = useState<AttemptResult | null>(null);

  const lastAttempt = result
    ? { score: result.score, passed: result.passed }
    : (test?.lastAttempt ?? null);

  useEffect(() => {
    testsApi.get(unitId)
      .then(setTest)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load test'))
      .finally(() => setLoading(false));
  }, [unitId]);

  async function handleCreate(questions: QuestionDraft[]) {
    const created = await testsApi.create(unitId, { questions });
    setTest(created);
    setView('idle');
  }

  async function handleSubmit(answers: number[]) {
    if (!test) return;
    const res = await testsApi.submitAttempt(test.id, answers);
    setResult(res);
    setView('results');
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="rounded-xl bg-surface border border-border p-4 flex flex-col gap-3 w-44 shrink-0">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">Unit Test</h3>
        {test && <span className="text-xs text-muted-foreground">{test.questions.length}q</span>}
      </div>

      <div className="h-8 flex items-center justify-center">
        {lastAttempt ? (
          <span className={`text-xs font-medium ${lastAttempt.passed ? 'text-accent' : 'text-destructive'}`}>
            {lastAttempt.passed ? '✓ Passed' : '✗ Failed'} · {Math.round(lastAttempt.score * 100)}%
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">No attempts yet</span>
        )}
      </div>

      {!test ? (
        <div className="flex flex-col items-center gap-2">
          <div className="relative group">
            <Button size="sm" onClick={() => setView('creating')} disabled={!allLessonsComplete}>Create Test</Button>
            {!allLessonsComplete && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 px-3 py-2 rounded-lg bg-surface-raised border border-border shadow-warm-md text-xs text-muted-foreground text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10">
                Complete all lessons first ({completedCount}/{totalCount})
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="relative group">
            <Button size="sm" onClick={() => setView('taking')} disabled={!allLessonsComplete}>Take Test</Button>
            {!allLessonsComplete && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 px-3 py-2 rounded-lg bg-surface-raised border border-border shadow-warm-md text-xs text-muted-foreground text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10">
                Complete all lessons first ({completedCount}/{totalCount})
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'creating' && (
        <Modal title="Create Unit Test" onClose={() => setView('idle')}>
          <AssessmentForm onSubmit={handleCreate} onCancel={() => setView('idle')} />
        </Modal>
      )}
      {view === 'taking' && test && (
        <Modal title="Unit Test" onClose={() => setView('idle')}>
          <AssessmentTaker questions={test.questions} onSubmit={handleSubmit} onCancel={() => setView('idle')} />
        </Modal>
      )}
      {view === 'results' && result && (
        <Modal title="Test Results" onClose={() => setView('idle')}>
          <AssessmentResults result={result} onRetake={() => setView('taking')} onDismiss={() => setView('idle')} />
        </Modal>
      )}
    </div>
  );
}
