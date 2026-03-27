import { assessmentsApi } from '../../api/assessments.js';
import useAssessment from '../../hooks/useAssessment.js';
import AssessmentForm from '../assessments/AssessmentForm.js';
import AssessmentTaker from '../assessments/AssessmentTaker.js';
import AssessmentResults from '../assessments/AssessmentResults.js';
import Modal from '../../components/Modal.js';
import Button from '../../components/Button.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';

const quizApi = {
  get: assessmentsApi.getLessonQuiz,
  create: assessmentsApi.createLessonQuiz,
  update: assessmentsApi.update,
  submitAttempt: assessmentsApi.submitAttempt,
  getAttempts: assessmentsApi.getAttempts,
};

export default function QuizSection({ lessonId }: { lessonId: string }) {
  const {
    assessment: quiz, loading, error,
    view, setView, result, attempts,
    handleCreate, handleSubmit,
  } = useAssessment(quizApi, lessonId);

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
        <>
          <div className="flex gap-3 mb-4">
            <Button onClick={() => setView('taking')}>Take Quiz</Button>
          </div>

          {attempts.length > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-medium text-muted-foreground">Previous Attempts</h4>
              <div className="flex flex-col gap-1.5">
                {attempts.map((a, i) => {
                  const pct = Math.round(a.score * 100);
                  return (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm">
                      <span className="text-muted-foreground">#{attempts.length - i}</span>
                      <span className={`font-medium ${a.passed ? 'text-accent' : 'text-destructive'}`}>{pct}%</span>
                      <span className={`text-xs ${a.passed ? 'text-accent' : 'text-destructive'}`}>{a.passed ? 'Passed' : 'Failed'}</span>
                      <span className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
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
