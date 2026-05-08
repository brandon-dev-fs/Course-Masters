import Textarea from '../../../components/Textarea.js';
import type { QuestionTypeEditorProps } from './index.js';

export default function MultipleChoiceEditor({ content, index, onChange }: QuestionTypeEditorProps) {
  const idx = index ?? 0;
  const options = (content.options as string[]) ?? [];
  const correctIndex = (content.correctIndex as number) ?? 0;
  const question = (content.question as string) ?? '';

  function setOption(i: number, text: string) {
    const opts = [...options];
    opts[i] = text;
    onChange({ ...content, options: opts });
  }

  function addOption() {
    onChange({ ...content, options: [...options, ''] });
  }

  function removeOption(i: number) {
    if (options.length <= 2) return;
    const opts = options.filter((_, idx) => idx !== i);
    const newCorrect = correctIndex >= opts.length ? opts.length - 1 : correctIndex;
    onChange({ ...content, options: opts, correctIndex: newCorrect });
  }

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        label="Question"
        value={question}
        onChange={e => onChange({ ...content, question: e.target.value })}
        placeholder="What is...?"
        rows={2}
      />
      <div>
        <p className="text-sm font-semibold text-foreground mb-2">Options</p>
        <div className="flex flex-col gap-2">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name={`mc-correct-${idx}`}
                checked={correctIndex === i}
                onChange={() => onChange({ ...content, correctIndex: i })}
                className="accent-accent shrink-0"
                title="Mark as correct"
                aria-label={`Option ${i + 1} is correct`}
              />
              <input
                type="text"
                value={opt}
                onChange={e => setOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                className="flex-1 rounded-md border border-border bg-surface-raised px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  className="text-muted-foreground hover:text-destructive text-xs px-1"
                  aria-label={`Remove option ${i + 1}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">Select the radio button next to the correct answer.</p>
        {options.length < 6 && (
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
