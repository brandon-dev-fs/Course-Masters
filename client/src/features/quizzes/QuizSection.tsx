import { useEffect, useState } from 'react';
import { quizzesApi } from '../../api/quizzes.js';
import type { Quiz, AttemptResult } from '../../api/types.js';
import AssessmentForm from '../assessments/AssessmentForm.js';
import AssessmentTaker from '../assessments/AssessmentTaker.js';
import AssessmentResults from '../assessments/AssessmentResults.js';
import { type QuestionDraft } from '../assessments/QuestionEditor.js';
import Modal from '../../components/Modal.js';
import Button from '../../components/Button.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';

type View = 'idle' | 'creating' | 'taking' | 'results';

export default function QuizSection({ lessonId }: { lessonId: string }) {
  const [quiz, setQuiz] = useState<Quiz | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<View>('idle');
  const [result, setResult] = useState<AttemptResult | null>(null);

  useEffect(() => {
    quizzesApi.get(lessonId)
      .then(setQuiz)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load quiz'))
      .finally(() => setLoading(false));
  }, [lessonId]);

  async function handleCreate(questions: QuestionDraft[]) {
    const created = await quizzesApi.create(lessonId, { questions });
    setQuiz(created);
    setView('idle');
  }

  async function handleSubmit(answers: number[]) {
    if (!quiz) return;
    const res = await quizzesApi.submitAttempt(quiz.id, answers);
    setResult(res);
    setView('results');
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="rounded-xl bg-surface border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Lesson Quiz</h3>
        {quiz && <span className="text-xs text-muted-foreground">{quiz.questions.length} questions</span>}
      </div>

      {!quiz ? (
        <div className="text-center py-6">
          <p className="text-muted-foreground text-sm mb-4">No quiz created yet.</p>
          <Button onClick={() => setView('creating')}>Create Quiz</Button>
        </div>
      ) : (
        <div className="flex gap-3">
          <Button onClick={() => setView('taking')}>Take Quiz</Button>
        </div>
      )}

      {view === 'creating' && (
        <Modal title="Create Quiz" onClose={() => setView('idle')}>
          <AssessmentForm onSubmit={handleCreate} onCancel={() => setView('idle')} />
        </Modal>
      )}

      {view === 'taking' && quiz && (
        <Modal title="Lesson Quiz" onClose={() => setView('idle')}>
          <AssessmentTaker questions={quiz.questions} onSubmit={handleSubmit} onCancel={() => setView('idle')} />
        </Modal>
      )}

      {view === 'results' && result && (
        <Modal title="Quiz Results" onClose={() => setView('idle')}>
          <AssessmentResults result={result} onRetake={() => setView('taking')} onDismiss={() => setView('idle')} />
        </Modal>
      )}
    </div>
  );
}
