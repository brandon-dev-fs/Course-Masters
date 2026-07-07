import { FormEvent, useState } from 'react';
import { ArrowUp, ArrowDown, ChevronDown } from 'lucide-react';
import { ApiClientError, classifyError } from '../../api/client.js';
import QuestionEditor, { defaultContent, type QuestionDraft, type QuestionType } from './QuestionEditor.js';
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

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: 'Multiple Choice',
  true_false: 'True / False',
  fill_in_blank: 'Fill in the Blank',
  matching: 'Matching',
};

function newQuestion(order: number): QuestionDraft {
  return {
    type: 'multiple_choice',
    question: '',
    content: defaultContent('multiple_choice'),
    order,
    calculatorEnabled: false,
  };
}

function isComplete(q: QuestionDraft): boolean {
  const questionText = (q.content['question'] as string | undefined ?? '').trim();
  if (!questionText) return false;

  switch (q.type) {
    case 'multiple_choice': {
      const options = q.content['options'] as string[] | undefined;
      return Array.isArray(options) && options.length >= 2 && options.every(o => o.trim() !== '');
    }
    case 'true_false':
      return true;
    case 'fill_in_blank': {
      const blanks = q.content['blanks'] as { answer: string }[] | undefined;
      return Array.isArray(blanks) && blanks.length > 0 && blanks.every(b => b.answer.trim() !== '');
    }
    case 'matching': {
      const pairs = q.content['pairs'] as { left: string; right: string }[] | undefined;
      return Array.isArray(pairs) && pairs.length >= 2 && pairs.every(p => p.left.trim() !== '' && p.right.trim() !== '');
    }
    default:
      return false;
  }
}

/** Convert a persisted question to a local draft (adds question field inside content for editor compat). */
export function toQuestionDraft(q: AssessmentQuestion): QuestionDraft {
  switch (q.type) {
    case 'multiple_choice':
      return {
        id: q.id,
        type: 'multiple_choice',
        question: q.question,
        content: {
          question: q.question,
          options: q.content.options ?? [],
          correctIndex: q.content.correctIndex ?? 0,
        },
        order: q.order,
        calculatorEnabled: q.calculatorEnabled ?? false,
      };
    case 'true_false':
      return {
        id: q.id,
        type: 'true_false',
        question: q.question,
        content: {
          question: q.question,
          correct: q.content.correct ?? true,
        },
        order: q.order,
        calculatorEnabled: q.calculatorEnabled ?? false,
      };
    case 'fill_in_blank':
      return {
        id: q.id,
        type: 'fill_in_blank',
        question: q.question,
        content: {
          question: q.question,
          blanks: q.content.blanks ?? [],
        },
        order: q.order,
        calculatorEnabled: q.calculatorEnabled ?? false,
      };
    case 'matching':
      return {
        id: q.id,
        type: 'matching',
        question: q.question,
        content: {
          question: q.question,
          pairs: (q.content.pairs ?? []).map(p => ({
            id: crypto.randomUUID(),
            left: p.left,
            right: p.right,
          })),
        },
        order: q.order,
        calculatorEnabled: q.calculatorEnabled ?? false,
      };
  }
}

/**
 * Strip editor-only fields before sending to server:
 * - `question` is hoisted out of `content` to the top-level field
 * - matching pair `id` fields are removed (client-only UUIDs)
 */
function toServerQuestion(draft: QuestionDraft): QuestionDraft {
  const { question: contentQuestion, ...contentWithoutQuestion } =
    draft.content as Record<string, unknown> & { question?: string };
  const question = (contentQuestion ?? draft.question ?? '').trim();

  let serverContent: Record<string, unknown> = contentWithoutQuestion;

  if (draft.type === 'matching') {
    const pairs = serverContent['pairs'] as { id?: string; left: string; right: string }[] | undefined;
    if (Array.isArray(pairs)) {
      serverContent = { ...serverContent, pairs: pairs.map(({ left, right }) => ({ left, right })) };
    }
  }

  return { ...draft, question, content: serverContent };
}

// ─── Question Card ────────────────────────────────────────────────────────────

interface QuestionCardProps {
  question: QuestionDraft;
  index: number;
  total: number;
  isExpanded: boolean;
  onToggle: () => void;
  onChange: (q: QuestionDraft) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

function QuestionCard({
  question,
  index,
  total,
  isExpanded,
  onToggle,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
}: QuestionCardProps) {
  const questionText = question.content['question'] as string | undefined;
  const hasPreview = questionText && questionText.trim().length > 0;

  return (
    <div className="rounded-lg border border-border bg-surface">
      {/* Header row — always visible */}
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Accordion trigger */}
        <button
          type="button"
          id={`q-${index}-header`}
          aria-expanded={isExpanded}
          aria-controls={`q-${index}-body`}
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} question ${index + 1}: ${QUESTION_TYPE_LABELS[question.type]}`}
          onClick={onToggle}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          <span className="text-xs text-muted-foreground font-medium shrink-0">Q{index + 1}</span>
          <span className="bg-green-surface text-green-surface-text rounded-md px-2 py-0.5 text-xs font-medium shrink-0">
            {QUESTION_TYPE_LABELS[question.type]}
          </span>
          <span className="text-sm text-muted-foreground truncate flex-1">
            {hasPreview ? questionText : <em>New question</em>}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200${isExpanded ? ' rotate-180' : ''}`}
          />
        </button>

        {/* Move buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            aria-label={`Move question ${index + 1} up`}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            aria-label={`Move question ${index + 1} down`}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body — conditionally rendered */}
      {isExpanded && (
        <div
          id={`q-${index}-body`}
          role="region"
          aria-labelledby={`q-${index}-header`}
          className="border-t border-border-subtle"
        >
          <QuestionEditor
            index={index}
            value={question}
            onChange={onChange}
            onRemove={onRemove}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export default function AssessmentForm({
  initialQuestions,
  onSubmit,
  onCancel,
  assessmentId,
  onImport,
  lessonId,
}: AssessmentFormProps) {
  const [questions, setQuestions] = useState<QuestionDraft[]>(
    initialQuestions && initialQuestions.length > 0 ? initialQuestions : [newQuestion(1)],
  );
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // Bulk toolbar state
  const [bulkConfirm, setBulkConfirm] = useState<{ target: boolean; open: boolean } | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState('');

  function addQuestion() {
    const next = questions.length;
    setQuestions(prev => [...prev, newQuestion(prev.length + 1)]);
    setExpandedIndex(next);
  }

  function updateQuestion(idx: number, draft: QuestionDraft) {
    setQuestions(prev => prev.map((q, i) => (i === idx ? draft : q)));
  }

  function removeQuestion(idx: number) {
    if (questions.length <= 1) return;
    const updated = questions
      .filter((_, i) => i !== idx)
      .map((q, i) => ({ ...q, order: i + 1 }));
    setQuestions(updated);

    if (idx === expandedIndex) {
      if (idx > 0) {
        setExpandedIndex(idx - 1);
      } else {
        setExpandedIndex(0);
      }
    } else if (expandedIndex !== null && idx < expandedIndex) {
      setExpandedIndex(expandedIndex - 1);
    }
  }

  function moveQuestion(idx: number, direction: 'up' | 'down') {
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= questions.length) return;
    const next = [...questions];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    setQuestions(next.map((q, i) => ({ ...q, order: i + 1 })));

    if (idx === expandedIndex) {
      setExpandedIndex(swapIdx);
    } else if (expandedIndex === swapIdx) {
      setExpandedIndex(idx);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const invalidIdx = questions.findIndex(q => !isComplete(q));
    if (invalidIdx !== -1) {
      setExpandedIndex(invalidIdx);
      setError('All questions must be fully filled in before saving.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(questions.map(toServerQuestion));
    } catch (err: unknown) {
      setError(
        err instanceof ApiClientError
          ? classifyError(err)
          : err instanceof Error
            ? err.message
            : 'Something went wrong',
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleQuestionsImported(importedQuestions: AssessmentQuestion[]) {
    const drafts = importedQuestions.map(toQuestionDraft);
    const nextIdx = questions.length;
    setQuestions(prev => [...prev, ...drafts]);
    setExpandedIndex(nextIdx);
    onImport?.(importedQuestions);
    setShowImport(false);
  }

  // ── Bulk calculator helpers ────────────────────────────────────────────────

  async function executeBulkApply(targetValue: boolean) {
    if (!assessmentId) return;
    if (questions.length === 0) return;

    const questionIds = questions.map(q => q.id).filter((id): id is string => Boolean(id));
    if (questionIds.length === 0) return;

    const snapshot = questions.slice();
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
      setBulkError(
        err instanceof ApiClientError
          ? classifyError(err)
          : err instanceof Error
            ? err.message
            : 'Bulk update failed',
      );
    } finally {
      setBulkLoading(false);
    }
  }

  function onBulkClick(targetValue: boolean) {
    if (questions.length === 0) return;
    const allMatch = questions.every(q => (q.calculatorEnabled ?? false) === targetValue);
    if (allMatch) return;

    const isMixed =
      questions.some(q => q.calculatorEnabled) && questions.some(q => !q.calculatorEnabled);
    if (isMixed) {
      setBulkConfirm({ target: targetValue, open: true });
      return;
    }
    void executeBulkApply(targetValue);
  }

  function onBulkConfirm() {
    if (!bulkConfirm) return;
    const target = bulkConfirm.target;
    setBulkConfirm(null);
    void executeBulkApply(target);
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            {bulkError && <ErrorMessage variant="inline" message={bulkError} className="text-xs mt-1" />}
          </div>
        )}

        {/* Question accordion */}
        <div className="flex flex-col gap-2">
          {questions.map((q, idx) => (
            <QuestionCard
              key={q.id ?? String(idx)}
              question={q}
              index={idx}
              total={questions.length}
              isExpanded={expandedIndex === idx}
              onToggle={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
              onChange={updated => updateQuestion(idx, updated)}
              onMoveUp={() => moveQuestion(idx, 'up')}
              onMoveDown={() => moveQuestion(idx, 'down')}
              onRemove={() => removeQuestion(idx)}
            />
          ))}
        </div>

        {/* Add question */}
        <button
          type="button"
          onClick={addQuestion}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors self-start"
        >
          <span className="text-base leading-none">+</span> Add Question
        </button>

        {error && <ErrorMessage message={error} />}

        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          {onImport && lessonId && assessmentId && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowImport(true)}
              disabled={submitting}
            >
              Import Questions
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save Assessment'}
          </Button>
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
          title={
            bulkConfirm.target
              ? 'Enable calculator for all questions?'
              : 'Disable calculator for all questions?'
          }
          message={
            bulkConfirm.target
              ? `Some questions currently have the calculator disabled. This will enable it for all ${questions.length} questions.`
              : `Some questions currently have the calculator enabled. This will disable it for all ${questions.length} questions.`
          }
          confirmLabel={bulkConfirm.target ? 'Enable for all' : 'Disable for all'}
          onConfirm={onBulkConfirm}
          onClose={() => setBulkConfirm(null)}
        />
      )}
    </>
  );
}
