import { useState } from 'react';
import { GripVertical, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

import useChecklist from './hooks/useChecklist.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import EmptyState from '../../components/EmptyState.js';
import Input from '../../components/Input.js';

interface ChecklistPanelProps {
  lessonId: string;
}

export default function ChecklistPanel({ lessonId }: ChecklistPanelProps) {
  const {
    items, loading, error,
    addItem, toggleItem, deleteItem, moveItem,
    deletingItemId,
  } = useChecklist(lessonId);

  const [inputValue, setInputValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const inputAtLimit = inputValue.length >= 200;

  async function handleAdd() {
    if (inputValue.trim().length === 0) return;
    setSubmitting(true);
    setInputError(null);
    try {
      await addItem(inputValue.trim());
      setInputValue('');
    } catch (err: unknown) {
      setInputError(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setSubmitting(false);
    }
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col gap-3 h-full">
      {error && <ErrorMessage message={error} />}

      {items.length === 0 && !error ? (
        <EmptyState
          title="No checklist items yet"
          description="Add items below to track your progress through this lesson."
        />
      ) : (
        <ul role="list" className="flex flex-col gap-1" aria-label="Checklist items">
          {items.map((item, idx) => {
            const isDeleting = deletingItemId === item.id;
            return (
              <li
                key={item.id}
                className="group flex items-center gap-2 py-1.5 px-2 rounded-lg bg-surface hover:bg-surface-raised transition-colors"
              >
                {/* Drag handle — visual only */}
                <GripVertical
                  className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0 cursor-grab"
                  aria-hidden="true"
                />

                {/* Checkbox */}
                <input
                  type="checkbox"
                  id={`checklist-item-${item.id}`}
                  checked={item.checked}
                  aria-checked={item.checked}
                  onChange={e => toggleItem(item.id, e.target.checked)}
                  className="w-4 h-4 rounded border-border accent-primary shrink-0"
                />

                {/* Text label */}
                <label
                  htmlFor={`checklist-item-${item.id}`}
                  className={`text-sm flex-1 cursor-pointer select-none ${
                    item.checked ? 'line-through text-muted-foreground' : 'text-foreground'
                  }`}
                >
                  {item.text}
                </label>

                {/* Reorder + delete controls */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveItem(item.id, 'up')}
                    disabled={idx === 0}
                    aria-label="Move up"
                    className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(item.id, 'down')}
                    disabled={idx === items.length - 1}
                    aria-label="Move down"
                    className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteItem(item.id)}
                    disabled={isDeleting}
                    aria-label={`Delete: ${item.text}`}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? (
                      <span className="w-3.5 h-3.5 block border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Add item input */}
      <div className="mt-auto pt-3 border-t border-border flex flex-col gap-1">
        <Input
          aria-label="New checklist item"
          placeholder="Add a checklist item…"
          value={inputValue}
          onChange={e => { setInputValue(e.target.value); if (inputError) setInputError(null); }}
          onKeyDown={handleInputKeyDown}
          maxLength={200}
          disabled={submitting}
        />
        <p className={`text-xs text-right ${inputAtLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
          {inputValue.length}/200
        </p>
        {inputError && <ErrorMessage message={inputError} />}
      </div>
    </div>
  );
}
