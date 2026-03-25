import { useState } from 'react';
import { GraduationCap, ChevronDown, ChevronRight, Lock, CheckCircle2, XCircle } from 'lucide-react';
import { examsApi } from '../../api/exams.js';
import useAssessment from '../../hooks/useAssessment.js';
import AssessmentForm from '../assessments/AssessmentForm.js';
import AssessmentTaker from '../assessments/AssessmentTaker.js';
import AssessmentResults from '../assessments/AssessmentResults.js';
import Modal from '../../components/Modal.js';
import Button from '../../components/Button.js';
import type { CourseProgress } from '../../api/types.js';
import type { QuestionDraft } from '../assessments/QuestionEditor.js';

interface ExamAccordionItemProps {
  courseId: string;
  allUnitsMastered: boolean;
  progress: CourseProgress | null;
  canEdit: boolean;
}

export default function ExamAccordionItem({
  courseId,
  allUnitsMastered,
  progress,
  canEdit,
}: ExamAccordionItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editQuestions, setEditQuestions] = useState<QuestionDraft[] | null>(null);
  const {
    assessment: exam,
    view, setView, result, lastAttempt,
    handleCreate, handleUpdate, handleSubmit,
  } = useAssessment(examsApi, courseId);

  const locked = !allUnitsMastered && !canEdit;

  function handleToggle() {
    if (locked) return;
    setIsExpanded(prev => !prev);
  }

  async function openEdit() {
    const full = await examsApi.getForEdit(courseId);
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

  return (
    <div className={`rounded-xl bg-surface border transition-all ${
      locked
        ? 'border-border opacity-60'
        : isExpanded
          ? 'border-primary/40 shadow-warm-md'
          : 'border-border shadow-warm-sm'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={handleToggle}
          disabled={locked}
          className="flex items-center gap-3 flex-1 min-w-0 text-left disabled:cursor-not-allowed"
        >
          <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary-subtle text-primary shrink-0">
            {locked ? <Lock className="w-3.5 h-3.5" /> : <GraduationCap className="w-4 h-4" />}
          </span>
          <span className="font-medium text-foreground truncate">Final Exam</span>
          {lastAttempt && (
            <span className={`flex items-center gap-1 text-xs font-semibold shrink-0 ${lastAttempt.passed ? 'text-success' : 'text-destructive'}`}>
              {lastAttempt.passed ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              {lastAttempt.passed ? 'Passed' : 'Failed'} · {Math.round(lastAttempt.score * 100)}%
            </span>
          )}
        </button>
        <div className="flex items-center gap-3 shrink-0">
          {locked && (
            <span className="text-xs text-muted-foreground">
              Complete all units first
            </span>
          )}
          {!locked && (
            <button onClick={handleToggle} className="text-muted-foreground hover:text-foreground transition-colors">
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {!locked && (
        <div
          className="grid transition-[grid-template-rows] duration-300"
          style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
        >
          <div className="overflow-hidden min-h-0">
            <div className="border-t border-border px-4 py-4 flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                {exam
                  ? `${exam.questions.length} question${exam.questions.length !== 1 ? 's' : ''} · Complete the final exam to finish this course.`
                  : canEdit ? 'No exam created yet.' : 'Exam not yet available.'}
              </p>
              <div className="flex items-center gap-3">
                {!exam ? (
                  canEdit ? (
                    <Button size="sm" onClick={() => setView('creating')}>
                      Create Exam
                    </Button>
                  ) : null
                ) : (
                  <>
                    {canEdit && (
                      <Button size="sm" variant="secondary" onClick={openEdit}>
                        Edit Exam
                      </Button>
                    )}
                    {allUnitsMastered && (
                      <Button size="sm" onClick={() => setView('taking')}>
                        {lastAttempt ? 'Retake Exam' : 'Take Exam'}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {view === 'creating' && (
        <Modal title={exam ? 'Edit Final Exam' : 'Create Final Exam'} onClose={closeModal}>
          <AssessmentForm
            initialQuestions={editQuestions ?? undefined}
            onSubmit={exam ? handleUpdate : handleCreate}
            onCancel={closeModal}
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
    </div>
  );
}
