import { ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react';
import type { SubFormProps } from './AssignmentFormModal.js';
import type { VocabEntry } from '../../api/types.js';

export default function VocabAssignmentForm({ entries, onEntriesChange }: SubFormProps) {
  function addEntry() {
    onEntriesChange([...entries, { term: '', definition: '' }]);
  }

  function removeEntry(idx: number) {
    onEntriesChange(entries.filter((_, i) => i !== idx));
  }

  function moveEntry(idx: number, direction: 'up' | 'down') {
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= entries.length) return;
    const next = [...entries];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    onEntriesChange(next);
  }

  function updateEntry(idx: number, field: keyof VocabEntry, value: string) {
    const next = entries.map((e, i) => i === idx ? { ...e, [field]: value } : e);
    onEntriesChange(next);
  }

  const hasValidEntry = entries.some(e => e.term.trim() && e.definition.trim());

  return (
    <div className="flex flex-col gap-3">
      {entries.map((entry, idx) => (
        <fieldset key={idx} className="rounded-lg border border-border p-3 flex flex-col gap-2">
          <legend className="sr-only">Term {idx + 1}</legend>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={entry.term}
                onChange={e => updateEntry(idx, 'term', e.target.value)}
                placeholder="Term"
                className="flex-1 rounded-xl border-2 border-border bg-surface-raised px-3 py-2 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                aria-label={`Term ${idx + 1}`}
              />
              <input
                type="text"
                value={entry.definition}
                onChange={e => updateEntry(idx, 'definition', e.target.value)}
                placeholder="Definition"
                className="flex-1 rounded-xl border-2 border-border bg-surface-raised px-3 py-2 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                aria-label={`Definition ${idx + 1}`}
              />
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => moveEntry(idx, 'up')}
                disabled={idx === 0}
                aria-label={`Move term ${idx + 1} up`}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => moveEntry(idx, 'down')}
                disabled={idx === entries.length - 1}
                aria-label={`Move term ${idx + 1} down`}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => removeEntry(idx)}
                aria-label={`Remove term ${idx + 1}`}
                className="p-1 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </fieldset>
      ))}

      <button
        type="button"
        onClick={addEntry}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors self-start"
      >
        <Plus className="w-3.5 h-3.5" />
        Add term
      </button>

      {!hasValidEntry && (
        <p role="alert" className="text-sm text-destructive">
          At least one term with a non-empty term and definition is required.
        </p>
      )}
    </div>
  );
}
