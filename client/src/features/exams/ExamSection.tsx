import { useEffect, useRef, useState } from 'react';
import { assessmentsApi } from '../../api/assessments.js';
import useAssessment from '../../hooks/useAssessment.js';
import AssessmentForm from '../assessments/AssessmentForm.js';
import AssessmentTaker from '../assessments/AssessmentTaker.js';
import AssessmentResults from '../assessments/AssessmentResults.js';
import Modal from '../../components/Modal.js';
import CalculatorFAB from '../../components/CalculatorFAB.js';
import CalculatorPanel from '../../components/CalculatorPanel.js';
import { useAuth } from '../../context/AuthContext.js';
import type { QuestionDraft } from '../assessments/QuestionEditor.js';

const examApi = {
  get: assessmentsApi.getCourseExam,
  create: assessmentsApi.createCourseExam,
  update: assessmentsApi.update,
  submitAttempt: assessmentsApi.submitAttempt,
};

interface ExamSectionProps {
  courseId: string;
  open: boolean;
  onClose: () => void;
}

export default function ExamSection({ courseId, open, onClose }: ExamSectionProps) {
  const { user } = useAuth();
  const showCalculatorToggle = user?.role === 'teacher' || user?.role === 'admin';

  const {
    assessment: exam, view, setView, result,
    handleCreate, handleUpdate, handleSubmit,
  } = useAssessment(examApi, courseId);

  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const calcFabRef = useRef<HTMLButtonElement>(null);

  const calculatorAllowed = exam?.calculatorAllowed ?? false;

  useEffect(() => {
    if (open) setView(exam === null ? 'creating' : 'taking');
  }, [open, exam]);

  function handleClose() {
    setView('idle');
    onClose();
  }

  function handleCreateWithCalc(questions: QuestionDraft[], calcAllowed: boolean) {
    return handleCreate(questions, calcAllowed);
  }

  function handleUpdateWithCalc(questions: QuestionDraft[], calcAllowed: boolean) {
    return handleUpdate(questions, calcAllowed);
  }

  if (!open && view === 'idle') return null;

  return (
    <>
      {view === 'creating' && (
        <Modal title={exam ? 'Edit Final Exam' : 'Create Final Exam'} onClose={handleClose}>
          <AssessmentForm
            initialCalculatorAllowed={exam?.calculatorAllowed}
            onSubmit={exam ? handleUpdateWithCalc : handleCreateWithCalc}
            onCancel={handleClose}
            showCalculatorToggle={showCalculatorToggle}
          />
        </Modal>
      )}
      {view === 'taking' && exam && (
        <Modal title="Final Exam" onClose={handleClose}>
          <AssessmentTaker questions={exam.questions} onSubmit={handleSubmit} onCancel={handleClose} />
        </Modal>
      )}
      {view === 'results' && result && (
        <Modal title="Final Exam Results" onClose={handleClose}>
          <AssessmentResults result={result} onRetake={() => setView('taking')} onDismiss={handleClose} />
        </Modal>
      )}

      {/* Calculator — only shown when assessment has calculatorAllowed=true */}
      {calculatorAllowed && (
        <>
          <CalculatorPanel
            isOpen={isCalculatorOpen}
            onClose={() => setIsCalculatorOpen(false)}
            zClass="z-60"
            fabRef={calcFabRef}
          />
          <div className="fixed bottom-6 right-6 z-60">
            <CalculatorFAB
              ref={calcFabRef}
              isOpen={isCalculatorOpen}
              onToggle={() => setIsCalculatorOpen(prev => !prev)}
            />
          </div>
        </>
      )}
    </>
  );
}
