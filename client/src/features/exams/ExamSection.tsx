import { useEffect, useState } from 'react';
import { examsApi } from '../../api/exams.js';
import type { FinalExam, AttemptResult } from '../../api/types.js';
import AssessmentForm from '../assessments/AssessmentForm.js';
import AssessmentTaker from '../assessments/AssessmentTaker.js';
import AssessmentResults from '../assessments/AssessmentResults.js';
import { type QuestionDraft } from '../assessments/QuestionEditor.js';
import Modal from '../../components/Modal.js';
import Button from '../../components/Button.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';

type View = 'idle' | 'creating' | 'taking' | 'results';

export default function ExamSection({ courseId }: { courseId: string }) {
  const [exam, setExam] = useState<FinalExam | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<View>('idle');
  const [result, setResult] = useState<AttemptResult | null>(null);

  useEffect(() => {
    examsApi.get(courseId)
      .then(setExam)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load exam'))
      .finally(() => setLoading(false));
  }, [courseId]);

  async function handleCreate(questions: QuestionDraft[]) {
    const created = await examsApi.create(courseId, { questions });
    setExam(created);
    setView('idle');
  }

  async function handleSubmit(answers: number[]) {
    if (!exam) return;
    const res = await examsApi.submitAttempt(exam.id, answers);
    setResult(res);
    setView('results');
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="rounded-xl bg-surface border border-primary/30 p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Final Exam</h3>
        {exam && <span className="text-xs text-muted-foreground">{exam.questions.length} questions</span>}
      </div>

      {!exam ? (
        <div className="text-center py-6">
          <p className="text-muted-foreground text-sm mb-4">No final exam created yet.</p>
          <Button onClick={() => setView('creating')}>Create Final Exam</Button>
        </div>
      ) : (
        <div className="flex gap-3">
          <Button onClick={() => setView('taking')}>Take Final Exam</Button>
        </div>
      )}

      {view === 'creating' && (
        <Modal title="Create Final Exam" onClose={() => setView('idle')}>
          <AssessmentForm onSubmit={handleCreate} onCancel={() => setView('idle')} />
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
