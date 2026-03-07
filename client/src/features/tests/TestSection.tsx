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

export default function TestSection({ unitId }: { unitId: string }) {
  const [test, setTest] = useState<Test | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<View>('idle');
  const [result, setResult] = useState<AttemptResult | null>(null);

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
    <div className="rounded-xl bg-surface border border-border p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Unit Test</h3>
        {test && <span className="text-xs text-muted-foreground">{test.questions.length} questions</span>}
      </div>

      {!test ? (
        <div className="text-center py-6">
          <p className="text-muted-foreground text-sm mb-4">No test created yet.</p>
          <Button onClick={() => setView('creating')}>Create Test</Button>
        </div>
      ) : (
        <div className="flex gap-3">
          <Button onClick={() => setView('taking')}>Take Test</Button>
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
