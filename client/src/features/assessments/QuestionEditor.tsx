import {
  MultipleChoiceEditor,
  TrueFalseEditor,
  FillInBlankEditor,
  MatchingEditor,
} from '../assignments/question-editors/index.js';

export type QuestionType = 'multiple_choice' | 'true_false' | 'fill_in_blank' | 'matching';

export interface QuestionDraft {
  /** Persisted question ID — present only when editing an existing assessment. */
  id?: string;
  type: QuestionType;
  question: string;
  content: Record<string, unknown>;
  order: number;
  /** Whether the calculator is enabled for this question. Defaults to false. */
  calculatorEnabled?: boolean;
}

const TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: 'Multiple choice',
  true_false: 'True / False',
  fill_in_blank: 'Fill in the blank',
  matching: 'Matching',
};

/** Return a fresh default content object for the given type. */
export function defaultContent(type: QuestionType): Record<string, unknown> {
  switch (type) {
    case 'multiple_choice':
      return { question: '', options: ['', '', '', ''], correctIndex: 0 };
    case 'true_false':
      return { question: '', correct: true };
    case 'fill_in_blank':
      return { question: '', blanks: [{ answer: '', alternatives: [] }] };
    case 'matching':
      return {
        question: '',
        pairs: [
          { id: crypto.randomUUID(), left: '', right: '' },
          { id: crypto.randomUUID(), left: '', right: '' },
        ],
      };
  }
}

interface QuestionEditorProps {
  index: number;
  value: QuestionDraft;
  onChange: (draft: QuestionDraft) => void;
  onRemove: () => void;
}

export default function QuestionEditor({ index, value, onChange, onRemove }: QuestionEditorProps) {
  const calculatorEnabled = value.calculatorEnabled ?? false;

  function handleTypeChange(newType: QuestionType) {
    if (newType === value.type) return;
    onChange({ ...value, type: newType, content: defaultContent(newType) });
  }

  function handleContentChange(newContent: Record<string, unknown>) {
    onChange({ ...value, content: newContent });
  }

  function toggleCalculator() {
    onChange({ ...value, calculatorEnabled: !calculatorEnabled });
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4 flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        {/* Type selector */}
        <select
          value={value.type}
          onChange={e => handleTypeChange(e.target.value as QuestionType)}
          className="text-xs font-medium rounded border border-border bg-surface-raised px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          aria-label="Question type"
        >
          {(Object.keys(TYPE_LABELS) as QuestionType[]).map(t => (
            <option key={t} value={t}>{TYPE_LABELS[t]}</option>
          ))}
        </select>

        <div className="flex items-center gap-3 flex-wrap justify-end">
          {/* Calculator toggle */}
          <div className="flex items-center gap-1.5 select-none">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              🧮 Calculator
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={calculatorEnabled}
              aria-label="Allow calculator for this question"
              onClick={toggleCalculator}
              className={`
                relative w-9 h-5 rounded-full transition-colors duration-150
                focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                ${calculatorEnabled ? 'bg-primary' : 'bg-border'}
              `}
            >
              <span
                className={`
                  absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-150
                  ${calculatorEnabled ? 'left-[18px]' : 'left-0.5'}
                `}
              />
            </button>
          </div>

          {/* Remove */}
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-muted-foreground hover:text-destructive px-2 py-1 rounded hover:bg-surface-raised"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Type-specific editor */}
      {value.type === 'multiple_choice' && (
        <MultipleChoiceEditor content={value.content} index={index} onChange={handleContentChange} />
      )}
      {value.type === 'true_false' && (
        <TrueFalseEditor content={value.content} index={index} onChange={handleContentChange} />
      )}
      {value.type === 'fill_in_blank' && (
        <FillInBlankEditor content={value.content} index={index} onChange={handleContentChange} />
      )}
      {value.type === 'matching' && (
        <MatchingEditor content={value.content} index={index} onChange={handleContentChange} />
      )}
    </div>
  );
}
