import { useState } from 'react';
import Input from '../../components/Input.js';
import Textarea from '../../components/Textarea.js';
import Button from '../../components/Button.js';

export interface QuestionDraft {
  type?: string;
  question: string;
  content: {
    options: string[];
    correctIndex: number;
  };
  order: number;
}

interface QuestionEditorProps {
  index: number;
  value: QuestionDraft;
  onChange: (draft: QuestionDraft) => void;
  onRemove: () => void;
}

export default function QuestionEditor({ index, value, onChange, onRemove }: QuestionEditorProps) {
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

  return (
    <div className="rounded-lg border border-border bg-surface p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Question {index + 1}</span>
        <button onClick={onRemove} className="text-xs text-muted-foreground hover:text-destructive px-2 py-1 rounded hover:bg-surface-raised">Remove</button>
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
                <button onClick={() => removeOption(i)} className="text-muted-foreground hover:text-destructive text-xs px-1">✕</button>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">Select the radio button next to the correct answer.</p>
        {value.content.options.length < 6 && (
          <button onClick={addOption} className="text-xs text-muted-foreground hover:text-foreground mt-2 underline">+ Add option</button>
        )}
      </div>
    </div>
  );
}
