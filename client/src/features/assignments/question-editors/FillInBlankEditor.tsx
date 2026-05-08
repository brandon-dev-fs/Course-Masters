import Textarea from '../../../components/Textarea.js';
import Input from '../../../components/Input.js';
import type { QuestionTypeEditorProps } from './index.js';

interface BlankDraft {
  answer: string;
  alternatives: string[];
}

export default function FillInBlankEditor({ content, onChange }: QuestionTypeEditorProps) {
  const question = (content.question as string) ?? '';
  const blanks = (content.blanks as BlankDraft[]) ?? [{ answer: '', alternatives: [] }];

  function updateBlankAnswer(i: number, answer: string) {
    const next = blanks.map((b, bi) => bi === i ? { ...b, answer } : b);
    onChange({ ...content, blanks: next });
  }

  function updateAlternatives(i: number, raw: string) {
    const alternatives = raw.split(',').map(s => s.trim()).filter(Boolean);
    const next = blanks.map((b, bi) => bi === i ? { ...b, alternatives } : b);
    onChange({ ...content, blanks: next });
  }

  function addBlank() {
    onChange({ ...content, blanks: [...blanks, { answer: '', alternatives: [] }] });
  }

  function removeBlank(i: number) {
    if (blanks.length <= 1) return;
    onChange({ ...content, blanks: blanks.filter((_, bi) => bi !== i) });
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Textarea
          label="Question"
          value={question}
          onChange={e => onChange({ ...content, question: e.target.value })}
          placeholder="The capital of France is ___."
          rows={2}
        />
        <p className="text-xs text-muted-foreground mt-1">Use ___ to indicate blank positions.</p>
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground mb-2">Blank answers</p>
        <div className="flex flex-col gap-3">
          {blanks.map((blank, i) => (
            <div key={i} className="rounded-lg border border-border p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground shrink-0">Blank {i + 1}</span>
                {blanks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBlank(i)}
                    className="text-muted-foreground hover:text-destructive text-xs ml-auto"
                    aria-label={`Remove blank ${i + 1}`}
                  >
                    Remove
                  </button>
                )}
              </div>
              <Input
                label="Correct answer"
                value={blank.answer}
                onChange={e => updateBlankAnswer(i, e.target.value)}
                placeholder="e.g. Paris"
              />
              <Input
                label="Alternatives (comma-separated, optional)"
                value={blank.alternatives.join(', ')}
                onChange={e => updateAlternatives(i, e.target.value)}
                placeholder="e.g. paris, PARIS"
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addBlank}
          className="text-xs text-muted-foreground hover:text-foreground mt-2 underline"
        >
          + Add blank
        </button>
      </div>
    </div>
  );
}
