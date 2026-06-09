import { ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react';
import type { SubFormProps } from './AssignmentFormModal.js';
import type { PracticeQuestionType } from '../../api/types.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import {
  MultipleChoiceEditor,
  TrueFalseEditor,
  MatchingEditor,
  FillInBlankEditor,
  type QuestionTypeEditor,
} from './question-editors/index.js';

export interface PracticeQuestionDraft {
  id?: string;
  type: PracticeQuestionType;
  order: number;
  content: Record<string, unknown>;
}

// ─── Default content shapes per question type ─────────────────────────────────

function defaultContent(type: PracticeQuestionType): Record<string, unknown> {
  switch (type) {
    case 'multiple_choice':
      return { question: '', options: ['', ''], correctIndex: 0 };
    case 'true_false':
      return { question: '', correct: true };
    case 'matching':
      return { question: '', leftItems: ['', ''], rightItems: ['', ''], correctPairs: [[0, 0], [1, 1]] };
    case 'fill_in_blank':
      return { question: '', blanks: [{ answer: '', alternatives: [] }] };
  }
}

const EDITORS: Record<PracticeQuestionType, QuestionTypeEditor> = {
  multiple_choice: MultipleChoiceEditor,
  true_false: TrueFalseEditor,
  matching: MatchingEditor,
  fill_in_blank: FillInBlankEditor,
};

// ─── Question Card ────────────────────────────────────────────────────────────

const QUESTION_TYPE_LABELS: Record<PracticeQuestionType, string> = {
  multiple_choice: 'Multiple Choice',
  true_false: 'True / False',
  matching: 'Matching',
  fill_in_blank: 'Fill in the Blank',
};

interface QuestionCardProps {
  question: PracticeQuestionDraft;
  index: number;
  total: number;
  onChange: (q: PracticeQuestionDraft) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

function QuestionCard({ question, index, total, onChange, onMoveUp, onMoveDown, onRemove }: QuestionCardProps) {
  function handleTypeChange(type: PracticeQuestionType) {
    onChange({ ...question, type, content: defaultContent(type) });
  }

  function handleContentChange(content: Record<string, unknown>) {
    onChange({ ...question, content });
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          Question {index + 1}
        </span>
        <div className="flex items-center gap-1">
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
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove question ${index + 1}`}
            className="p-1 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-foreground mb-1 block">Question type</label>
        <select
          value={question.type}
          onChange={e => handleTypeChange(e.target.value as PracticeQuestionType)}
          className="w-full rounded-xl border-2 border-border bg-surface-raised px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary"
        >
          {(Object.keys(QUESTION_TYPE_LABELS) as PracticeQuestionType[]).map(t => (
            <option key={t} value={t}>{QUESTION_TYPE_LABELS[t]}</option>
          ))}
        </select>
      </div>

      {(() => {
        const Editor = EDITORS[question.type];
        return <Editor content={question.content} index={index} onChange={handleContentChange} />;
      })()}
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export default function PracticeProblemAssignmentForm({ questions, onQuestionsChange }: SubFormProps) {
  function addQuestion() {
    const newQ: PracticeQuestionDraft = {
      type: 'multiple_choice',
      order: questions.length + 1,
      content: defaultContent('multiple_choice'),
    };
    onQuestionsChange([...questions, newQ]);
  }

  function updateQuestion(idx: number, q: PracticeQuestionDraft) {
    onQuestionsChange(questions.map((old, i) => i === idx ? q : old));
  }

  function removeQuestion(idx: number) {
    const next = questions.filter((_, i) => i !== idx).map((q, i) => ({ ...q, order: i + 1 }));
    onQuestionsChange(next);
  }

  function moveQuestion(idx: number, direction: 'up' | 'down') {
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= questions.length) return;
    const next = [...questions];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    onQuestionsChange(next.map((q, i) => ({ ...q, order: i + 1 })));
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-foreground">
        Questions<span aria-hidden="true"> *</span>
        <span className="sr-only"> (required)</span>
      </p>
      {questions.map((q, idx) => (
        <QuestionCard
          key={idx}
          question={q}
          index={idx}
          total={questions.length}
          onChange={updated => updateQuestion(idx, updated)}
          onMoveUp={() => moveQuestion(idx, 'up')}
          onMoveDown={() => moveQuestion(idx, 'down')}
          onRemove={() => removeQuestion(idx)}
        />
      ))}
      <button
        type="button"
        onClick={addQuestion}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors self-start"
      >
        <Plus className="w-3.5 h-3.5" />
        Add question
      </button>
      {questions.length === 0 && (
        <ErrorMessage variant="inline" message="At least one question is required." />
      )}
    </div>
  );
}
