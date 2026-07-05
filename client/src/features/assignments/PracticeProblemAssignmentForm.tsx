import { useState } from 'react';

import { ArrowUp, ArrowDown, Trash2, Plus, ChevronDown } from 'lucide-react';

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
  isExpanded: boolean;
  onToggle: () => void;
  onChange: (q: PracticeQuestionDraft) => void;
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
  function handleTypeChange(type: PracticeQuestionType) {
    onChange({ ...question, type, content: defaultContent(type) });
  }

  function handleContentChange(content: Record<string, unknown>) {
    onChange({ ...question, content });
  }

  const questionText = question.content['question'] as string | undefined;
  const hasPreview = questionText && questionText.trim().length > 0;

  return (
    <div className="rounded-lg border border-border bg-surface">
      {/* Header row — always visible */}
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Accordion trigger */}
        <button
          type="button"
          id={`question-${index}-header`}
          aria-expanded={isExpanded}
          aria-controls={`question-${index}-body`}
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} question ${index + 1}: ${QUESTION_TYPE_LABELS[question.type]}`}
          onClick={onToggle}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          <span className="text-xs text-text-secondary font-medium shrink-0">
            Q{index + 1}
          </span>
          <span className="bg-green-surface text-green-surface-text rounded-md px-2 py-0.5 text-xs font-medium shrink-0">
            {QUESTION_TYPE_LABELS[question.type]}
          </span>
          <span className="text-sm text-text-secondary truncate flex-1">
            {hasPreview ? questionText : <em>New question</em>}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-text-secondary shrink-0 transition-transform duration-200${isExpanded ? ' rotate-180' : ''}`}
          />
        </button>

        {/* Action buttons — outside the accordion trigger */}
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

      {/* Body — conditionally rendered */}
      {isExpanded && (
        <div
          id={`question-${index}-body`}
          role="region"
          aria-labelledby={`question-${index}-header`}
          className="border-t border-border-subtle px-4 py-4 flex flex-col gap-3"
        >
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
      )}
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export default function PracticeProblemAssignmentForm({ questions, onQuestionsChange }: SubFormProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    questions.length > 0 ? 0 : null
  );

  function addQuestion() {
    const newQ: PracticeQuestionDraft = {
      id: crypto.randomUUID(),
      type: 'multiple_choice',
      order: questions.length + 1,
      content: defaultContent('multiple_choice'),
    };
    const newQuestions = [...questions, newQ];
    onQuestionsChange(newQuestions);
    setExpandedIndex(newQuestions.length - 1);
  }

  function updateQuestion(idx: number, q: PracticeQuestionDraft) {
    onQuestionsChange(questions.map((old, i) => i === idx ? q : old));
  }

  function removeQuestion(idx: number) {
    const next = questions.filter((_, i) => i !== idx).map((q, i) => ({ ...q, order: i + 1 }));
    onQuestionsChange(next);

    if (idx === expandedIndex) {
      if (next.length === 0) {
        setExpandedIndex(null);
      } else if (idx > 0) {
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
    onQuestionsChange(next.map((q, i) => ({ ...q, order: i + 1 })));

    if (idx === expandedIndex) {
      setExpandedIndex(swapIdx);
    } else if (expandedIndex === swapIdx) {
      setExpandedIndex(idx);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-foreground">
        Questions<span aria-hidden="true"> *</span>
        <span className="sr-only"> (required)</span>
      </p>
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
