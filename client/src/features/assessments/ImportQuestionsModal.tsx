import { useState } from 'react';
import { assessmentsApi } from '../../api/assessments.js';
import { assignmentsApi } from '../../api/assignments.js';
import type { Assignment, AssessmentQuestion } from '../../api/types.js';
import { ApiClientError, classifyError } from '../../api/client.js';
import useFetch from '../../hooks/useFetch.js';
import Modal from '../../components/Modal.js';
import Button from '../../components/Button.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import EmptyState from '../../components/EmptyState.js';

interface ImportQuestionsModalProps {
  assessmentId: string;
  lessonId: string;
  onImported: (questions: AssessmentQuestion[]) => void;
  onClose: () => void;
}

export default function ImportQuestionsModal({
  assessmentId,
  lessonId,
  onImported,
  onClose,
}: ImportQuestionsModalProps) {
  const [selectedId, setSelectedId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { data: assignments, loading } = useFetch<Assignment[]>(
    () => assignmentsApi.getAll(lessonId),
    [lessonId],
  );

  const practiceProblemAssignments = (assignments ?? []).filter(
    a => a.type === 'practice_problem' && a.practiceProblemAssignment,
  );

  async function handleImport() {
    if (!selectedId) return;
    setSubmitting(true);
    setError('');
    try {
      const newQuestions = await assessmentsApi.importQuestions(assessmentId, {
        practiceProblemAssignmentId: selectedId,
      });
      onImported(newQuestions);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof ApiClientError ? classifyError(err) : err instanceof Error ? err.message : 'Import failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Import from Practice Problems" onClose={onClose}>
      <div className="flex flex-col gap-4">
        {loading ? (
          <LoadingSpinner />
        ) : practiceProblemAssignments.length === 0 ? (
          <EmptyState
            title="No practice problem assignments"
            description="No practice problem assignments in this lesson."
          />
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Select a practice problem assignment to import its questions into this assessment.
            </p>
            <ul className="flex flex-col gap-2" role="list">
              {practiceProblemAssignments.map(a => (
                <li key={a.id}>
                  <label className="flex items-center gap-3 cursor-pointer rounded-lg border border-border p-3 hover:bg-surface-raised transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary-subtle">
                    <input
                      type="radio"
                      name="practiceProblemAssignment"
                      value={a.id}
                      checked={selectedId === a.id}
                      onChange={() => setSelectedId(a.id)}
                      className="accent-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                      {a.practiceProblemAssignment && (
                        <p className="text-xs text-muted-foreground">
                          {a.practiceProblemAssignment.questions.length} question{a.practiceProblemAssignment.questions.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && <ErrorMessage message={error} />}

        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!selectedId || submitting || practiceProblemAssignments.length === 0}
          >
            {submitting ? 'Importing…' : 'Import Questions'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
