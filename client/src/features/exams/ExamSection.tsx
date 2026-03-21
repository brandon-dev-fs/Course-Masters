import { useEffect } from 'react';
import { examsApi } from '../../api/exams.js';
import useAssessment from '../../hooks/useAssessment.js';
import AssessmentForm from '../assessments/AssessmentForm.js';
import AssessmentTaker from '../assessments/AssessmentTaker.js';
import AssessmentResults from '../assessments/AssessmentResults.js';
import Modal from '../../components/Modal.js';

interface ExamSectionProps {
  courseId: string;
  open: boolean;
  onClose: () => void;
}

export default function ExamSection({ courseId, open, onClose }: ExamSectionProps) {
  const {
    assessment: exam, view, setView, result,
    handleCreate, handleSubmit,
  } = useAssessment(examsApi, courseId);

  useEffect(() => {
    if (open) setView(exam === null ? 'creating' : 'taking');
  }, [open, exam]);

  function handleClose() {
    setView('idle');
    onClose();
  }

  if (!open && view === 'idle') return null;

  return (
    <>
      {view === 'creating' && (
        <Modal title="Create Final Exam" onClose={handleClose}>
          <AssessmentForm onSubmit={handleCreate} onCancel={handleClose} />
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
    </>
  );
}
