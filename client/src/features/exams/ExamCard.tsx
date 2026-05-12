import { useState } from 'react';
import { GraduationCap, Lock, CheckCircle2, XCircle } from 'lucide-react';
import { assessmentsApi } from '../../api/assessments.js';
import useAssessment from '../../hooks/useAssessment.js';
import AssessmentForm, { toQuestionDraft } from '../assessments/AssessmentForm.js';
import AssessmentTaker from '../assessments/AssessmentTaker.js';
import AssessmentResults from '../assessments/AssessmentResults.js';
import Modal from '../../components/Modal.js';
import Button from '../../components/Button.js';
import type { CourseProgress } from '../../api/types.js';
import type { QuestionDraft } from '../assessments/QuestionEditor.js';

const examApi = {
  get: assessmentsApi.getCourseExam,
  create: assessmentsApi.createCourseExam,
  update: assessmentsApi.update,
  submitAttempt: assessmentsApi.submitAttempt,
};

interface ExamCardProps {
  courseId: string;
  allUnitsMastered: boolean;
  progress: CourseProgress | null;
  canEdit: boolean;
}

export default function ExamCard({ courseId, allUnitsMastered, canEdit }: ExamCardProps) {
  const [editQuestions, setEditQuestions] = useState<QuestionDraft[] | null>(null);
  const {
    assessment: exam,
    view, setView, result, lastAttempt,
    handleCreate, handleUpdate, handleSubmit,
  } = useAssessment(examApi, courseId);

  const locked = !allUnitsMastered && !canEdit;

  function openEdit() {
    if (!exam) return;
    setEditQuestions(exam.questions.map(toQuestionDraft));
    setView('creating');
  }

  function closeModal() {
    setView('idle');
    setEditQuestions(null);
  }

  return (
    <>
      <div className={`w-full md:w-64 md:shrink-0 flex flex-col rounded-2xl bg-surface border transition-all ${
        locked ? 'border-border opacity-60' : 'border-border shadow-warm-sm hover:shadow-warm-md'
      }`}>
        {/* Distinct muted accent bar */}
        <div className={`h-1.5 rounded-t-2xl ${lastAttempt?.passed ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />

        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 pt-3 pb-2">
          <span className={`w-6 h-6 flex items-center justify-center rounded-md shrink-0 ${
            locked
              ? 'bg-surface-raised text-muted-foreground border border-border'
              : lastAttempt?.passed
                ? 'bg-green-500 text-white'
                : 'bg-surface-raised text-muted-foreground border border-border'
          }`}>
            {locked ? <Lock className="w-3 h-3" /> : <GraduationCap className="w-3.5 h-3.5" />}
          </span>
          <span className="font-semibold text-sm text-foreground">Final Exam</span>
          {lastAttempt && (
            <span className={`flex items-center gap-1 text-xs font-semibold ml-auto shrink-0 ${lastAttempt.passed ? 'text-green-600' : 'text-destructive'}`}>
              {lastAttempt.passed ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              {Math.round(lastAttempt.score * 100)}%
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col gap-2 px-4 pb-3">
          <p className="text-xs text-muted-foreground">
            {locked
              ? 'Complete all units to unlock.'
              : exam
                ? `${exam.questions.length} question${exam.questions.length !== 1 ? 's' : ''}`
                : canEdit
                  ? 'No exam created yet.'
                  : 'Exam not yet available.'}
          </p>
        </div>

        {/* Footer actions */}
        {!locked && (
          <div className="border-t border-border px-4 py-2.5 flex items-center gap-2">
            {!exam ? (
              canEdit && (
                <Button size="sm" onClick={() => setView('creating')}>
                  Create Exam
                </Button>
              )
            ) : (
              <>
                {canEdit && (
                  <Button size="sm" variant="secondary" onClick={openEdit}>
                    Edit
                  </Button>
                )}
                {allUnitsMastered && (
                  <Button size="sm" onClick={() => setView('taking')}>
                    {lastAttempt ? 'Retake' : 'Take Exam'}
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {view === 'creating' && (
        <Modal title={exam ? 'Edit Final Exam' : 'Create Final Exam'} onClose={closeModal}>
          <AssessmentForm
            initialQuestions={editQuestions ?? undefined}
            onSubmit={exam ? handleUpdate : handleCreate}
            onCancel={closeModal}
            assessmentId={exam?.id}
          />
        </Modal>
      )}
      {view === 'taking' && exam && (
        <Modal title="Final Exam" onClose={() => setView('idle')}>
          <AssessmentTaker questions={exam.questions} onSubmit={handleSubmit} onCancel={() => setView('idle')} />
        </Modal>
      )}
      {view === 'results' && result && (
        <Modal title="Final Exam Results" onClose={() => setView('idle')}>
          <AssessmentResults result={result} onRetake={() => setView('taking')} onDismiss={() => setView('idle')} />
        </Modal>
      )}
    </>
  );
}
