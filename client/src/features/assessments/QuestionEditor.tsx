import Input from '../../components/Input.js';
import Textarea from '../../components/Textarea.js';

export interface QuestionDraft {
  /** Persisted question ID — present only when editing an existing assessment. */
  id?: string;
  type?: string;
  question: string;
  content: {
    options: string[];
    correctIndex: number;
  };
  order: number;
  /** Whether the calculator is enabled for this question. Defaults to false. */
  calculatorEnabled?: boolean;
}

interface QuestionEditorProps {
  index: number;
  value: QuestionDraft;
  onChange: (draft: QuestionDraft) => void;
  onRemove: () => void;
}

export default function QuestionEditor({ index, value, onChange, onRemove }: QuestionEditorProps) {
  const calculatorEnabled = value.calculatorEnabled ?? false;

  function setOption(i: number, text: string) {
    const opts = [...value.content.options];
    opts[i] = text;
    onChange({ ...value, content: { ...value.content, options: opts } });
  }

  function addOption() {
    onChange({ ...value, content: { ...value.content, options: [...value.content.options, ''] } });
  }

  function removeOption(i: number) {
    if (value.content.options.length <= 2) return;
    const opts = value.content.options.filter((_, idx) => idx !== i);
    const correctIndex = value.content.correctIndex >= opts.length ? opts.length - 1 : value.content.correctIndex;
    onChange({ ...value, content: { options: opts, correctIndex } });
  }

  function toggleCalculator() {
    onChange({ ...value, calculatorEnabled: !calculatorEnabled });
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4 flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide mt-1">
          Question {index + 1}
        </span>

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

      <Textarea
        label="Question"
        value={value.question}
        onChange={e => onChange({ ...value, question: e.target.value })}
        placeholder="What is...?"
        rows={2}
      />

      <div>
        <p className="text-sm font-medium text-foreground mb-2">Options</p>
        <div className="flex flex-col gap-2">
          {value.content.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name={`correct-${index}`}
                checked={value.content.correctIndex === i}
                onChange={() => onChange({ ...value, content: { ...value.content, correctIndex: i } })}
                className="accent-accent shrink-0"
                title="Mark as correct"
              />
              <input
                type="text"
                value={opt}
                onChange={e => setOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                className="flex-1 rounded-md border border-border bg-surface-raised px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {value.content.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  className="text-muted-foreground hover:text-destructive text-xs px-1"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">Select the radio button next to the correct answer.</p>
        {value.content.options.length < 6 && (
          <button
            type="button"
            onClick={addOption}
            className="text-xs text-muted-foreground hover:text-foreground mt-2 underline"
          >
            + Add option
          </button>
        )}
      </div>
    </div>
  );
}
