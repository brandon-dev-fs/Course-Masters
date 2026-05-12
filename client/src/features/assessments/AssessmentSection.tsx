import { useEffect, useState } from 'react';
import useAssessment from '../../hooks/useAssessment.js';
import AssessmentForm, { toQuestionDraft } from './AssessmentForm.js';
import AssessmentTaker from './AssessmentTaker.js';
import AssessmentResults from './AssessmentResults.js';
import Modal from '../../components/Modal.js';
import Button from '../../components/Button.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import type { QuestionDraft } from './QuestionEditor.js';

type AssessmentDisplayMode = 'inline' | 'modal-only';

interface AssessmentApi {
  get: (parentId: string) => Promise<import('../../api/types.js').Assessment | null>;
  create: (parentId: string, data: { questions: QuestionDraft[] }) => Promise<import('../../api/types.js').Assessment>;
  update?: (assessmentId: string, data: { questions: QuestionDraft[] }) => Promise<import('../../api/types.js').Assessment>;
  submitAttempt: (id: string, answers: unknown[]) => Promise<import('../../api/types.js').AttemptResult>;
  getAttempts?: (id: string) => Promise<import('../../api/types.js').PaginatedAttempts>;
}

interface AssessmentSectionProps {
  /** The ID of the parent entity (lessonId, unitId, or courseId) */
  parentId: string;
  /** The API adapter built from assessmentsApi methods */
  api: AssessmentApi;
  /** Display label for the assessment (e.g. "Lesson Quiz", "Unit Test", "Final Exam") */
  label: string;
  /** Label for the create button */
  createLabel: string;
  /** Label for take button when no attempts exist */
  takeLabel: string;
  /** Label for take button when attempts exist */
  retakeLabel: string;
  /** Title for the taking modal */
  modalTitle: string;
  /** Title for the results modal */
  resultsTitle: string;
  /** 'inline' = renders a card with buttons; 'modal-only' = renders nothing when idle */
  displayMode: AssessmentDisplayMode;
  /** Whether teacher/admin users can edit the assessment questions */
  canEdit?: boolean;
  /** 'modal-only' mode only: external open/close control */
  open?: boolean;
  onClose?: () => void;
  /** 'inline' mode only: when false and canEdit is false, take button is disabled */
  unlocked?: boolean;
  /** Message shown when unlocked=false and canEdit=false */
  lockedMessage?: string;
}

export default function AssessmentSection({
  parentId,
  api,
  label,
  createLabel,
  takeLabel,
  retakeLabel,
  modalTitle,
  resultsTitle,
  displayMode,
  canEdit = false,
  open,
  onClose,
  unlocked,
  lockedMessage,
}: AssessmentSectionProps) {
  const [editQuestions, setEditQuestions] = useState<QuestionDraft[] | null>(null);
  const {
    assessment, loading, error,
    view, setView, result, attempts,
    handleCreate, handleUpdate, handleSubmit,
  } = useAssessment(api, parentId);

  // modal-only: respond to external open prop
  useEffect(() => {
    if (displayMode === 'modal-only' && open) {
      setView(assessment === null ? 'creating' : 'taking');
    }
  }, [open, assessment, displayMode, setView]);

  function openEdit() {
    if (!assessment) return;
    setEditQuestions(assessment.questions.map(toQuestionDraft));
    setView('creating');
  }

  function closeModal() {
    setView('idle');
    setEditQuestions(null);
    onClose?.();
  }

  // modal-only mode: render nothing when idle
  if (displayMode === 'modal-only') {
    if (!open && view === 'idle') return null;

    return (
      <>
        {view === 'creating' && (
          <Modal title={assessment ? `Edit ${label}` : createLabel} onClose={closeModal}>
            <AssessmentForm
              initialQuestions={editQuestions ?? undefined}
              onSubmit={assessment ? handleUpdate : handleCreate}
              onCancel={closeModal}
              assessmentId={assessment?.id}
            />
          </Modal>
        )}
        {view === 'taking' && assessment && (
          <Modal title={modalTitle} onClose={closeModal}>
            <AssessmentTaker questions={assessment.questions} onSubmit={handleSubmit} onCancel={closeModal} />
          </Modal>
        )}
        {view === 'results' && result && (
          <Modal title={resultsTitle} onClose={closeModal}>
            <AssessmentResults result={result} onRetake={() => setView('taking')} onDismiss={closeModal} />
          </Modal>
        )}
      </>
    );
  }

  // inline mode
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  const isLocked = unlocked === false && !canEdit;
  const hasAttempts = attempts.length > 0;

  return (
    <div className="rounded-xl bg-surface border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">{label}</h3>
        {assessment && <span className="text-xs text-muted-foreground">{assessment.questions.length} questions</span>}
      </div>

      {!assessment ? (
        <div className="text-center py-6">
          <p className="text-muted-foreground text-sm mb-4">
            {canEdit ? `No ${label.toLowerCase()} created yet.` : `${label} not yet available.`}
          </p>
          {canEdit && <Button onClick={() => setView('creating')}>{createLabel}</Button>}
        </div>
      ) : (
        <>
          {isLocked && lockedMessage && (
            <p className="text-sm text-muted-foreground mb-4">{lockedMessage}</p>
          )}
          <div className="flex gap-3 mb-4">
            {canEdit && (
              <Button variant="secondary" size="sm" onClick={openEdit}>
                Edit {label}
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => setView('taking')}
              disabled={isLocked}
            >
              {hasAttempts ? retakeLabel : takeLabel}
            </Button>
          </div>

          {hasAttempts && (
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-medium text-muted-foreground">Previous Attempts</h4>
              <ul className="flex flex-col gap-1.5" role="list">
                {attempts.map((a, i) => (
                  <li key={a.id} className="flex items-center justify-between rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm">
                    <span className="text-muted-foreground">#{attempts.length - i}</span>
                    <span className={`font-medium ${a.passed ? 'text-accent' : 'text-destructive'}`}>{Math.round(a.score * 100)}%</span>
                    <span className={`text-xs ${a.passed ? 'text-accent' : 'text-destructive'}`}>{a.passed ? 'Passed' : 'Failed'}</span>
                    <span className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {view === 'creating' && (
        <Modal title={assessment ? `Edit ${label}` : createLabel} onClose={closeModal}>
          <AssessmentForm
            initialQuestions={editQuestions ?? undefined}
            onSubmit={assessment ? handleUpdate : handleCreate}
            onCancel={closeModal}
            assessmentId={assessment?.id}
          />
        </Modal>
      )}
      {view === 'taking' && assessment && (
        <Modal title={modalTitle} onClose={() => setView('idle')}>
          <AssessmentTaker questions={assessment.questions} onSubmit={handleSubmit} onCancel={() => setView('idle')} />
        </Modal>
      )}
      {view === 'results' && result && (
        <Modal title={resultsTitle} onClose={() => setView('idle')}>
          <AssessmentResults result={result} onRetake={() => setView('taking')} onDismiss={() => setView('idle')} />
        </Modal>
      )}
    </div>
  );
}
