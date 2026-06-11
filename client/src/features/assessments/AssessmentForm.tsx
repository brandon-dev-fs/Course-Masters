import { FormEvent, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ApiClientError, classifyError } from '../../api/client.js';
import QuestionEditor, { type QuestionDraft } from './QuestionEditor.js';
import ImportQuestionsModal from './ImportQuestionsModal.js';
import Button from '../../components/Button.js';
import ConfirmDialog from '../../components/ConfirmDialog.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import { assessmentsApi } from '../../api/assessments.js';
import type { AssessmentQuestion } from '../../api/types.js';

interface AssessmentFormProps {
  initialQuestions?: QuestionDraft[];
  onSubmit: (questions: QuestionDraft[]) => Promise<void>;
  onCancel: () => void;
  /** Present only in edit mode (assessment already persisted). Enables bulk toolbar. */
  assessmentId?: string;
  /**
   * When provided, renders an "Import Questions" button in the form toolbar.
   * Called with the imported question drafts to append to the form state.
   */
  onImport?: (questions: AssessmentQuestion[]) => void;
  /** Lesson ID — required when onImport is provided to know which lesson to import from. */
  lessonId?: string;
}

function newQuestion(order: number): QuestionDraft {
  return { question: '', content: { options: ['', ''], correctIndex: 0 }, order, calculatorEnabled: false };
}

function isComplete(q: QuestionDraft) {
  return q.question.trim() !== '' && q.content.options.every(o => o.trim() !== '');
}

/** Convert a persisted question to a local draft. */
export function toQuestionDraft(q: AssessmentQuestion): QuestionDraft {
  if (q.type !== 'multiple_choice') {
    // Non-multiple-choice question types are not yet supported in the editor;
    // return a safe draft with empty options so the form can still render.
    return {
      id: q.id,
      type: q.type,
      question: q.question,
      content: { options: [], correctIndex: 0 },
      order: q.order,
      calculatorEnabled: q.calculatorEnabled ?? false,
    };
  }
  return {
    id: q.id,
    type: q.type,
    question: q.question,
    content: {
      options: q.content.options ?? [],
      correctIndex: q.content.correctIndex ?? 0,
    },
    order: q.order,
    calculatorEnabled: q.calculatorEnabled ?? false,
  };
}

export default function AssessmentForm({ initialQuestions, onSubmit, onCancel, assessmentId, onImport, lessonId }: AssessmentFormProps) {
  const [questions, setQuestions] = useState<QuestionDraft[]>(
    initialQuestions && initialQuestions.length > 0 ? initialQuestions : [newQuestion(1)]
  );
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // Bulk toolbar state
  const [bulkConfirm, setBulkConfirm] = useState<{ target: boolean; open: boolean } | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState('');

  const currentComplete = isComplete(questions[current]);

  function addQuestion() {
    const next = questions.length;
    setQuestions(prev => [...prev, newQuestion(prev.length + 1)]);
    setCurrent(next);
  }

  function updateQuestion(draft: QuestionDraft) {
    setQuestions(prev => prev.map((q, idx) => idx === current ? draft : q));
  }

  function removeQuestion() {
    if (questions.length <= 1) return;
    const updated = questions
      .filter((_, idx) => idx !== current)
      .map((q, idx) => ({ ...q, order: idx + 1 }));
    setQuestions(updated);
    setCurrent(prev => Math.min(prev, updated.length - 1));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const invalid = questions.find(q => !isComplete(q));
    if (invalid) {
      setCurrent(questions.indexOf(invalid));
      setError('All questions and options must be filled in');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(questions);
    } catch (err: unknown) {
      setError(err instanceof ApiClientError ? classifyError(err) : err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  function handleQuestionsImported(importedQuestions: AssessmentQuestion[]) {
    const drafts = importedQuestions.map(toQuestionDraft);
    setQuestions(prev => [...prev, ...drafts]);
    setCurrent(questions.length); // navigate to first imported question
    onImport?.(importedQuestions);
    setShowImport(false);
  }

  // ── Bulk calculator helpers ────────────────────────────────────────────────

  async function executeBulkApply(targetValue: boolean) {
    if (!assessmentId) return;
    if (questions.length === 0) return;

    const questionIds = questions.map(q => q.id).filter((id): id is string => Boolean(id));
    if (questionIds.length === 0) return;

    // Snapshot for revert
    const snapshot = questions.slice();

    // Optimistic update
    setQuestions(prev => prev.map(q => ({ ...q, calculatorEnabled: targetValue })));
    setBulkLoading(true);
    setBulkError('');

    try {
      const updated = await assessmentsApi.bulkUpdateCalculator(assessmentId, {
        questionIds,
        calculatorEnabled: targetValue,
      });
      setQuestions(updated.questions.map(toQuestionDraft));
    } catch (err: unknown) {
      setQuestions(snapshot);
      setBulkError(err instanceof ApiClientError ? classifyError(err) : err instanceof Error ? err.message : 'Bulk update failed');
    } finally {
      setBulkLoading(false);
    }
  }

  function onBulkClick(targetValue: boolean) {
    if (questions.length === 0) return;

    const allMatch = questions.every(q => (q.calculatorEnabled ?? false) === targetValue);
    if (allMatch) return; // no-op

    const isMixed =
      questions.some(q => q.calculatorEnabled) &&
      questions.some(q => !q.calculatorEnabled);

    if (isMixed) {
      setBulkConfirm({ target: targetValue, open: true });
      return;
    }

    // All are the opposite — no confirm needed
    void executeBulkApply(targetValue);
  }

  function onBulkConfirm() {
    if (!bulkConfirm) return;
    const target = bulkConfirm.target;
    setBulkConfirm(null);
    void executeBulkApply(target);
  }

  function onBulkCancel() {
    setBulkConfirm(null);
  }

  const total = questions.length;

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Progress label */}
        <span className="text-sm font-medium text-foreground">
          Question {current + 1} <span className="text-muted-foreground">of {total}</span>
        </span>

        {/* Bulk calculator toolbar — edit mode only */}
        {assessmentId && (
          <div className="bg-surface rounded-xl border border-border px-3 py-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                🧮 Calculator
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={bulkLoading}
                  aria-label="Enable calculator for all questions"
                  onClick={() => onBulkClick(true)}
                >
                  Enable all
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={bulkLoading}
                  aria-label="Disable calculator for all questions"
                  onClick={() => onBulkClick(false)}
                >
                  Disable all
                </Button>
              </div>
            </div>
            {bulkError && (
              <ErrorMessage variant="inline" message={bulkError} className="text-xs mt-1" />
            )}
          </div>
        )}

        {/* Current question */}
        <QuestionEditor
          index={current}
          value={questions[current]}
          onChange={updateQuestion}
          onRemove={removeQuestion}
        />

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrent(prev => prev - 1)}
            disabled={current === 0}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>

          {current === total - 1 ? (
            <button
              type="button"
              onClick={addQuestion}
              disabled={!currentComplete}
              className="text-sm text-primary hover:text-primary/80 font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              + Add Question
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrent(prev => prev + 1)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {error && <ErrorMessage message={error} />}

        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          {onImport && lessonId && assessmentId && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowImport(true)} disabled={submitting}>
              Import Questions
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Cancel</Button>
          <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save Assessment'}</Button>
        </div>
      </form>

      {/* Import questions modal */}
      {showImport && lessonId && assessmentId && (
        <ImportQuestionsModal
          assessmentId={assessmentId}
          lessonId={lessonId}
          onImported={handleQuestionsImported}
          onClose={() => setShowImport(false)}
        />
      )}

      {/* Bulk-apply confirmation dialog */}
      {bulkConfirm?.open && (
        <ConfirmDialog
          title={bulkConfirm.target ? 'Enable calculator for all questions?' : 'Disable calculator for all questions?'}
          message={
            bulkConfirm.target
              ? `Some questions currently have the calculator disabled. This will enable it for all ${questions.length} questions.`
              : `Some questions currently have the calculator enabled. This will disable it for all ${questions.length} questions.`
          }
          confirmLabel={bulkConfirm.target ? 'Enable for all' : 'Disable for all'}
          onConfirm={onBulkConfirm}
          onClose={onBulkCancel}
        />
      )}
    </>
  );
}
