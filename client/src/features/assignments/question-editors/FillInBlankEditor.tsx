import { useRef } from 'react';

import Button from '../../../components/Button.js';
import type { QuestionTypeEditorProps } from './index.js';

interface BlankDraft {
  answer: string;
  alternatives: string[];
}

function parseBlankTokens(text: string): number[] {
  const tokens: number[] = [];
  const regex = /\{\{blank_(\d+)\}\}/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    tokens.push(parseInt(match[1], 10));
  }
  return tokens;
}

function syncBlanks(newText: string, oldText: string, currentBlanks: BlankDraft[]): BlankDraft[] {
  const newTokens = parseBlankTokens(newText);
  const oldTokens = parseBlankTokens(oldText);

  const blankMap = new Map<number, BlankDraft>();
  oldTokens.forEach((tokenNum, i) => {
    if (i < currentBlanks.length) {
      blankMap.set(tokenNum, currentBlanks[i]);
    }
  });

  return newTokens.map(tokenNum =>
    blankMap.get(tokenNum) ?? { answer: '', alternatives: [] }
  );
}

export default function FillInBlankEditor({ content, index, onChange }: QuestionTypeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const question = (content.question as string) ?? '';
  const blanks = (content.blanks as BlankDraft[]) ?? [];
  const tokens = parseBlankTokens(question);
  const questionId = `fib-question-${index ?? 0}`;
  const hintId = `fib-hint-${index ?? 0}`;
  const hasDuplicateTokens = new Set(tokens).size !== tokens.length;

  function handleQuestionChange(newText: string) {
    onChange({ ...content, question: newText, blanks: syncBlanks(newText, question, blanks) });
  }

  function insertBlank() {
    const existingTokens = parseBlankTokens(question);
    const nextN = existingTokens.length > 0 ? Math.max(...existingTokens) + 1 : 1;
    const token = `{{blank_${nextN}}}`;
    const textarea = textareaRef.current;

    let newText: string;
    let newCursorPos: number;

    if (textarea && document.activeElement === textarea) {
      const start = textarea.selectionStart ?? question.length;
      const end = textarea.selectionEnd ?? question.length;
      newText = question.slice(0, start) + token + question.slice(end);
      newCursorPos = start + token.length;
    } else {
      const trimmed = question.trimEnd();
      newText = trimmed + (trimmed.length > 0 ? ' ' : '') + token;
      newCursorPos = newText.length;
    }

    onChange({ ...content, question: newText, blanks: syncBlanks(newText, question, blanks) });

    requestAnimationFrame(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    });
  }

  function updateBlankAnswer(i: number, answer: string) {
    const next = blanks.map((b, bi) => bi === i ? { ...b, answer } : b);
    onChange({ ...content, blanks: next });
  }

  function updateBlankAlternatives(i: number, raw: string) {
    const alternatives = raw.split(',').map(s => s.trim()).filter(Boolean);
    const next = blanks.map((b, bi) => bi === i ? { ...b, alternatives } : b);
    onChange({ ...content, blanks: next });
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label htmlFor={questionId} className="text-sm font-semibold text-foreground mb-1 block">Question</label>
        <textarea
          ref={textareaRef}
          id={questionId}
          value={question}
          onChange={e => handleQuestionChange(e.target.value)}
          placeholder="e.g. The {{blank_1}} says moo."
          aria-describedby={hintId}
          rows={3}
          className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-text-secondary" id={hintId}>
            Click "Insert blank" to add a blank position, or type {'{{blank_N}}'} manually.
          </p>
          <Button type="button" variant="ghost" size="sm" onClick={insertBlank}>
            Insert blank
          </Button>
        </div>
      </div>

      {tokens.length > 0 ? (
        <div className="flex flex-col gap-3">
          {hasDuplicateTokens && (
            <p role="alert" className="text-xs text-destructive">
              Duplicate blank numbers found. Each blank number must appear only once.
            </p>
          )}
          {tokens.map((tokenNum, i) => (
            <div key={tokenNum} className="rounded-md border border-border-subtle p-3 flex flex-col gap-2">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                Blank {tokenNum}
              </p>
              <div>
                <label
                  htmlFor={`fib-answer-${tokenNum}`}
                  className="text-xs text-text-secondary mb-0.5 block"
                >
                  Correct answer
                </label>
                <input
                  id={`fib-answer-${tokenNum}`}
                  type="text"
                  value={blanks[i]?.answer ?? ''}
                  onChange={e => updateBlankAnswer(i, e.target.value)}
                  className="w-full rounded-md border border-border bg-surface-raised px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Correct answer"
                />
              </div>
              <div>
                <label
                  htmlFor={`fib-alts-${tokenNum}`}
                  className="text-xs text-text-secondary mb-0.5 block"
                >
                  Alternatives (optional, comma-separated)
                </label>
                <input
                  id={`fib-alts-${tokenNum}`}
                  type="text"
                  value={(blanks[i]?.alternatives ?? []).join(', ')}
                  onChange={e => updateBlankAlternatives(i, e.target.value)}
                  className="w-full rounded-md border border-border bg-surface-raised px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. alt1, alt2"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-secondary italic p-3 border border-border-subtle rounded-lg">
          No blanks defined. Use the "Insert blank" button above to add blank positions to your question text.
        </p>
      )}
    </div>
  );
}
