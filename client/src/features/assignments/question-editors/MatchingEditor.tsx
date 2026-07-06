import { Trash2 } from 'lucide-react';

import type { QuestionTypeEditorProps } from './index.js';
import Textarea from '../../../components/Textarea.js';

interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

function derivePairs(content: Record<string, unknown>): MatchingPair[] {
  // New shape
  if (Array.isArray(content['pairs'])) {
    return (content['pairs'] as MatchingPair[]).map(p => ({
      id: p.id ?? crypto.randomUUID(),
      left: p.left,
      right: p.right,
    }));
  }
  // Old shape: leftItems + rightItems + correctPairs
  const leftItems = content['leftItems'] as string[] | undefined;
  const rightItems = content['rightItems'] as string[] | undefined;
  const correctPairs = content['correctPairs'] as [number, number][] | undefined;
  if (leftItems && rightItems && correctPairs) {
    return correctPairs.map(([leftIdx, rightIdx]) => ({
      id: crypto.randomUUID(),
      left: leftItems[leftIdx] ?? '',
      right: rightItems[rightIdx] ?? '',
    }));
  }
  return [
    { id: crypto.randomUUID(), left: '', right: '' },
    { id: crypto.randomUUID(), left: '', right: '' },
  ];
}

export default function MatchingEditor({ content, index, onChange }: QuestionTypeEditorProps) {
  const idx = index ?? 0;
  const questionText = (content['question'] as string) ?? '';
  const pairs = derivePairs(content);

  function emitChange(newPairs: MatchingPair[], newQuestion: string) {
    // Always write the new shape only — drops leftItems/rightItems/correctPairs
    onChange({ question: newQuestion, pairs: newPairs });
  }

  function updatePairLeft(i: number, value: string) {
    emitChange(pairs.map((p, pi) => pi === i ? { ...p, left: value } : p), questionText);
  }

  function updatePairRight(i: number, value: string) {
    emitChange(pairs.map((p, pi) => pi === i ? { ...p, right: value } : p), questionText);
  }

  function addPair() {
    if (pairs.length >= 8) return;
    emitChange([...pairs, { id: crypto.randomUUID(), left: '', right: '' }], questionText);
  }

  function removePair(i: number) {
    if (pairs.length <= 2) return;
    emitChange(pairs.filter((_, pi) => pi !== i), questionText);
  }

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        label="Question (optional context)"
        value={questionText}
        onChange={e => emitChange(pairs, e.target.value)}
        placeholder="Match the following..."
        rows={2}
      />

      <div>
        {/* Column headers — hidden on mobile */}
        <div className="hidden sm:flex gap-2 mb-1 px-1">
          <p className="flex-1 text-xs text-text-secondary font-medium uppercase tracking-wide">Term</p>
          <p className="flex-1 text-xs text-text-secondary font-medium uppercase tracking-wide">Definition</p>
          <div className="w-8" /> {/* spacer for delete button column */}
        </div>

        {/* Pair rows */}
        <div className="flex flex-col gap-2">
          {pairs.map((pair, i) => (
            <div key={pair.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              {/* Mobile: inline labels */}
              <div className="flex flex-col gap-1 flex-1 w-full">
                <span aria-hidden="true" className="text-xs text-text-secondary sm:hidden">Term</span>
                <input
                  type="text"
                  value={pair.left}
                  onChange={e => updatePairLeft(i, e.target.value)}
                  placeholder="Term"
                  aria-label={`Term for pair ${i + 1}`}
                  className="w-full rounded-md border border-border bg-surface-raised px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1 w-full">
                <span aria-hidden="true" className="text-xs text-text-secondary sm:hidden">Definition</span>
                <input
                  type="text"
                  value={pair.right}
                  onChange={e => updatePairRight(i, e.target.value)}
                  placeholder="Definition"
                  aria-label={`Definition for pair ${i + 1}`}
                  className="w-full rounded-md border border-border bg-surface-raised px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <button
                type="button"
                onClick={() => removePair(i)}
                disabled={pairs.length <= 2}
                aria-label={`Remove pair ${i + 1}`}
                className="text-text-secondary hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed shrink-0 self-start sm:self-center p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {pairs.length < 8 && (
          <button
            type="button"
            onClick={addPair}
            className="text-xs text-text-secondary hover:text-text-primary mt-2 underline"
          >
            + Add pair
          </button>
        )}
      </div>
    </div>
  );
}
