import { useState, useRef, useEffect } from 'react';

import { ApiClientError, classifyError } from '../../api/client.js';

interface InlineRenameInputProps {
  initialValue: string;
  onSave: (newValue: string) => Promise<void>;
  onCancel: () => void;
  ariaLabel: string;
}

export default function InlineRenameInput({
  initialValue,
  onSave,
  onCancel,
  ariaLabel,
}: InlineRenameInputProps) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [inputError, setInputError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = `rename-error-${Math.random().toString(36).slice(2, 9)}`;

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  async function handleSave() {
    const trimmed = value.trim();
    if (!trimmed) {
      setInputError('Name cannot be empty.');
      return;
    }
    if (trimmed === initialValue) {
      onCancel();
      return;
    }
    setSaving(true);
    setInputError('');
    try {
      await onSave(trimmed);
    } catch (err) {
      setInputError(err instanceof ApiClientError ? classifyError(err) : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  }

  function handleBlur() {
    // Only save on blur if not currently saving (avoid double-save)
    if (!saving) {
      handleSave();
    }
  }

  return (
    <div className="flex flex-col gap-1 flex-1 min-w-0">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (inputError) setInputError('');
        }}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        disabled={saving}
        aria-label={ariaLabel}
        aria-describedby={inputError ? errorId : undefined}
        aria-invalid={!!inputError}
        className={`w-full text-sm font-semibold bg-transparent border-b-2 outline-none px-1 py-0.5
          text-text-primary placeholder:text-muted-foreground transition-colors
          disabled:opacity-60
          ${inputError ? 'border-destructive' : 'border-primary'}
        `}
      />
      {inputError && (
        <span id={errorId} className="text-xs text-destructive">
          {inputError}
        </span>
      )}
    </div>
  );
}
