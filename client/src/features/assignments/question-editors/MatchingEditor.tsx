import Textarea from '../../../components/Textarea.js';
import type { QuestionTypeEditorProps } from './index.js';

export default function MatchingEditor({ content, onChange }: QuestionTypeEditorProps) {
  const question = (content.question as string) ?? '';
  const leftItems = (content.leftItems as string[]) ?? ['', ''];
  const rightItems = (content.rightItems as string[]) ?? ['', ''];
  const correctPairs = (content.correctPairs as [number, number][]) ?? [[0, 0], [1, 1]];

  function updateLeft(i: number, v: string) {
    const next = [...leftItems];
    next[i] = v;
    onChange({ ...content, leftItems: next });
  }

  function updateRight(i: number, v: string) {
    const next = [...rightItems];
    next[i] = v;
    onChange({ ...content, rightItems: next });
  }

  function updatePair(i: number, rightIdx: number) {
    const next = correctPairs.map((p, pi) => pi === i ? [p[0], rightIdx] as [number, number] : p);
    onChange({ ...content, correctPairs: next });
  }

  function addPair() {
    const li = leftItems.length;
    const ri = rightItems.length;
    onChange({
      ...content,
      leftItems: [...leftItems, ''],
      rightItems: [...rightItems, ''],
      correctPairs: [...correctPairs, [li, ri] as [number, number]],
    });
  }

  function removePair(i: number) {
    if (leftItems.length <= 2) return;
    const newLeft = leftItems.filter((_, idx) => idx !== i);
    const newRight = rightItems.filter((_, idx) => idx !== i);
    const newPairs = correctPairs
      .filter(([l]) => l !== i)
      .map(([l, r]) => [l > i ? l - 1 : l, r > i ? r - 1 : r] as [number, number]);
    onChange({ ...content, leftItems: newLeft, rightItems: newRight, correctPairs: newPairs });
  }

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        label="Question (optional context)"
        value={question}
        onChange={e => onChange({ ...content, question: e.target.value })}
        placeholder="Match the following..."
        rows={2}
      />
      <div>
        <p className="text-sm font-semibold text-foreground mb-2">Pairs</p>
        <div className="flex flex-col gap-2">
          {leftItems.map((left, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={left}
                onChange={e => updateLeft(i, e.target.value)}
                placeholder={`Left ${i + 1}`}
                className="flex-1 rounded-md border border-border bg-surface-raised px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label={`Left item ${i + 1}`}
              />
              <span className="text-muted-foreground text-sm">→</span>
              <select
                value={correctPairs.find(([l]) => l === i)?.[1] ?? 0}
                onChange={e => updatePair(i, Number(e.target.value))}
                className="flex-1 rounded-md border border-border bg-surface-raised px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label={`Match for left ${i + 1}`}
              >
                {rightItems.map((_, ri) => (
                  <option key={ri} value={ri}>Right {ri + 1}</option>
                ))}
              </select>
              <input
                type="text"
                value={rightItems[correctPairs.find(([l]) => l === i)?.[1] ?? i] ?? ''}
                onChange={e => updateRight(correctPairs.find(([l]) => l === i)?.[1] ?? i, e.target.value)}
                placeholder={`Right ${i + 1}`}
                className="flex-1 rounded-md border border-border bg-surface-raised px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label={`Right item ${i + 1}`}
              />
              {leftItems.length > 2 && (
                <button
                  type="button"
                  onClick={() => removePair(i)}
                  className="text-muted-foreground hover:text-destructive text-xs px-1"
                  aria-label={`Remove pair ${i + 1}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        {leftItems.length < 8 && (
          <button
            type="button"
            onClick={addPair}
            className="text-xs text-muted-foreground hover:text-foreground mt-2 underline"
          >
            + Add pair
          </button>
        )}
      </div>
    </div>
  );
}
