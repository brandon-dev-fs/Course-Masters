import { ClipboardCheck, Lock, Check } from 'lucide-react';
import { assessmentsApi } from '../../api/assessments.js';
import useAssessment from '../../hooks/useAssessment.js';
import AssessmentTaker from '../assessments/AssessmentTaker.js';
import AssessmentResults from '../assessments/AssessmentResults.js';
import Modal from '../../components/Modal.js';

const testApi = {
  get: assessmentsApi.getUnitQuiz,
  create: assessmentsApi.createUnitQuiz,
  update: assessmentsApi.update,
  submitAttempt: assessmentsApi.submitAttempt,
  getAttempts: assessmentsApi.getAttempts,
};

export default function UnitTestCard({ unitId, allLessonsComplete }: { unitId: string; allLessonsComplete: boolean }) {
  const { assessment: test, loading, view, setView, result, lastAttempt, handleSubmit } = useAssessment(testApi, unitId);

  if (loading || !test) return null;

  const passed = lastAttempt?.passed ?? false;
  const locked = !allLessonsComplete;

  return (
    <>
      <div className={`flex flex-col gap-1.5 rounded-xl bg-surface border border-border px-4 py-3 shadow-warm-sm ${locked ? 'opacity-60' : ''}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <ClipboardCheck className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="font-medium text-foreground text-sm truncate">Unit Test</span>
          </div>
          <div
            role="img"
            aria-label={locked ? 'Status: Locked' : passed ? 'Status: Passed' : 'Status: Not passed'}
            className={`w-4 h-4 rounded-[3px] border flex items-center justify-center shrink-0 ${
              passed ? 'bg-green-primary border-green-primary' : 'border-border bg-surface-raised'
            }`}
          >
            {locked
              ? <Lock className="w-2.5 h-2.5 text-muted-foreground/50" />
              : <Check className={`w-3 h-3 ${passed ? 'text-white' : 'text-muted-foreground/25'}`} strokeWidth={3} />
            }
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {lastAttempt
            ? `${lastAttempt.passed ? 'Passed' : 'Failed'} · ${Math.round(lastAttempt.score * 100)}%`
            : locked
              ? 'Complete all lessons first'
              : `${test.questions.length} questions`
          }
        </p>
        <button
          onClick={() => setView('taking')}
          disabled={locked}
          className="mt-1 w-full text-center text-xs font-medium bg-primary text-primary-foreground hover:brightness-110 rounded-lg py-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Take Test
        </button>
      </div>

      {view === 'taking' && (
        <Modal title="Unit Test" onClose={() => setView('idle')}>
          <AssessmentTaker questions={test.questions} onSubmit={handleSubmit} onCancel={() => setView('idle')} />
        </Modal>
      )}
      {view === 'results' && result && (
        <Modal title="Test Results" onClose={() => setView('idle')}>
          <AssessmentResults result={result} onRetake={() => setView('taking')} onDismiss={() => setView('idle')} />
        </Modal>
      )}
    </>
  );
}
