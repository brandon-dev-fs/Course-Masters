import { useState } from 'react';
import { assessmentsApi } from '../../api/assessments.js';
import useAssessment from '../../hooks/useAssessment.js';
import AssessmentForm from '../assessments/AssessmentForm.js';
import AssessmentTaker from '../assessments/AssessmentTaker.js';
import AssessmentResults from '../assessments/AssessmentResults.js';
import Modal from '../../components/Modal.js';
import Button from '../../components/Button.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import type { QuestionDraft } from '../assessments/QuestionEditor.js';

const testApi = {
  get: assessmentsApi.getUnitQuiz,
  create: assessmentsApi.createUnitQuiz,
  update: assessmentsApi.update,
  submitAttempt: assessmentsApi.submitAttempt,
  getAttempts: assessmentsApi.getAttempts,
};

interface TestSectionProps {
  unitId: string;
  canEdit?: boolean;
  allLessonsComplete?: boolean;
}

export default function TestSection({ unitId, canEdit = false, allLessonsComplete = false }: TestSectionProps) {
  const [editQuestions, setEditQuestions] = useState<QuestionDraft[] | null>(null);
  const {
    assessment: test, loading, error,
    view, setView, result, attempts,
    handleCreate, handleUpdate, handleSubmit,
  } = useAssessment(testApi, unitId);

  function openEdit() {
    if (!test) return;
    setEditQuestions(test.questions.map(q => ({
      question: q.question,
      content: {
        options: (q.content.options as string[]) ?? [],
        correctIndex: (q.content.correctIndex as number) ?? 0,
      },
      order: q.order,
    })));
    setView('creating');
  }

  function closeModal() {
    setView('idle');
    setEditQuestions(null);
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="rounded-xl bg-surface border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Unit Test</h3>
        {test && <span className="text-xs text-muted-foreground">{test.questions.length} questions</span>}
      </div>

      {!test ? (
        <div className="text-center py-6">
          <p className="text-muted-foreground text-sm mb-4">
            {canEdit ? 'No unit test created yet.' : 'Unit test not yet available.'}
          </p>
          {canEdit && <Button onClick={() => setView('creating')}>Create Test</Button>}
        </div>
      ) : (
        <>
          {!allLessonsComplete && !canEdit && (
            <p className="text-sm text-muted-foreground mb-4">Complete all lessons to unlock the unit test.</p>
          )}
          <div className="flex gap-3 mb-4">
            {canEdit && (
              <Button variant="secondary" size="sm" onClick={openEdit}>Edit Test</Button>
            )}
            <Button
              size="sm"
              onClick={() => setView('taking')}
              disabled={!allLessonsComplete && !canEdit}
            >
              {attempts.length > 0 ? 'Retake Test' : 'Take Test'}
            </Button>
          </div>

          {attempts.length > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-medium text-muted-foreground">Previous Attempts</h4>
              <div className="flex flex-col gap-1.5">
                {attempts.map((a, i) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm">
                    <span className="text-muted-foreground">#{attempts.length - i}</span>
                    <span className={`font-medium ${a.passed ? 'text-accent' : 'text-destructive'}`}>{Math.round(a.score * 100)}%</span>
                    <span className={`text-xs ${a.passed ? 'text-accent' : 'text-destructive'}`}>{a.passed ? 'Passed' : 'Failed'}</span>
                    <span className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {view === 'creating' && (
        <Modal title={test ? 'Edit Unit Test' : 'Create Unit Test'} onClose={closeModal}>
          <AssessmentForm
            initialQuestions={editQuestions ?? undefined}
            onSubmit={test ? handleUpdate : handleCreate}
            onCancel={closeModal}
          />
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
