import { useState } from 'react';
import { testsApi } from '../../api/tests.js';
import useAssessment from '../../hooks/useAssessment.js';
import AssessmentForm from '../assessments/AssessmentForm.js';
import AssessmentTaker from '../assessments/AssessmentTaker.js';
import AssessmentResults from '../assessments/AssessmentResults.js';
import Modal from '../../components/Modal.js';
import Button from '../../components/Button.js';
import Tooltip from '../../components/Tooltip.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import type { QuestionDraft } from '../assessments/QuestionEditor.js';

interface TestSectionProps {
  unitId: string;
  canEdit?: boolean;
  allLessonsComplete?: boolean;
  completedCount?: number;
  totalCount?: number;
}

export default function TestSection({ unitId, canEdit = false, allLessonsComplete = true, completedCount = 0, totalCount = 0 }: TestSectionProps) {
  const [editQuestions, setEditQuestions] = useState<QuestionDraft[] | null>(null);
  const {
    assessment: test, loading, error,
    view, setView, result, lastAttempt,
    handleCreate, handleUpdate, handleSubmit,
  } = useAssessment(testsApi, unitId);

  async function openEdit() {
    const full = await testsApi.getForEdit(unitId);
    if (full) {
      setEditQuestions(full.questions.map(q => ({
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        order: q.order,
      })));
    }
    setView('creating');
  }

  function closeModal() {
    setView('idle');
    setEditQuestions(null);
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
          {canEdit ? (
            <Button size="sm" onClick={() => setView('creating')}>Create Test</Button>
          ) : (
            <Tooltip content={`Complete all lessons first (${completedCount}/${totalCount})`}>
              <Button size="sm" onClick={() => setView('creating')} disabled={!allLessonsComplete}>Create Test</Button>
            </Tooltip>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          {canEdit && (
            <Button size="sm" variant="secondary" onClick={openEdit}>Edit Test</Button>
          )}
          <Tooltip content={`Complete all lessons first (${completedCount}/${totalCount})`}>
            <Button size="sm" onClick={() => setView('taking')} disabled={!allLessonsComplete}>Take Test</Button>
          </Tooltip>
        </div>
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
