import { useEffect, useState } from 'react';
import { examsApi } from '../../api/exams.js';
import type { FinalExam } from '../../api/types.js';
import AssessmentForm from '../assessments/AssessmentForm.js';
import AssessmentTaker from '../assessments/AssessmentTaker.js';
import AssessmentResults from '../assessments/AssessmentResults.js';
import { type QuestionDraft } from '../assessments/QuestionEditor.js';
import Modal from '../../components/Modal.js';

type View = 'idle' | 'creating' | 'taking' | 'results';

interface ExamSectionProps {
  courseId: string;
  open: boolean;
  onClose: () => void;
}

export default function ExamSection({ courseId, open, onClose }: ExamSectionProps) {
  const [exam, setExam] = useState<FinalExam | null | undefined>(undefined);
  const [view, setView] = useState<View>('idle');
  const [result, setResult] = useState<{ score: number; passed: boolean; totalQuestions: number; correctCount: number } | null>(null);

  useEffect(() => {
    examsApi.get(courseId)
      .then(setExam)
      .catch(() => {});
  }, [courseId]);

  useEffect(() => {
    if (open) {
      setView(exam === null ? 'creating' : 'taking');
    }
  }, [open, exam]);

  function handleClose() {
    setView('idle');
    onClose();
  }

  async function handleCreate(questions: QuestionDraft[]) {
    const created = await examsApi.create(courseId, { questions });
    setExam(created);
    setView('taking');
  }

  async function handleSubmit(answers: number[]) {
    if (!exam) return;
    const res = await examsApi.submitAttempt(exam.id, answers);
    setResult(res);
    setView('results');
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
