import { ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react';
import Input from '../../components/Input.js';
import Textarea from '../../components/Textarea.js';
import type { PracticeQuestionType } from '../../api/types.js';

export interface PracticeQuestionDraft {
  id?: string;
  type: PracticeQuestionType;
  order: number;
  content: Record<string, unknown>;
}

interface PracticeProblemAssignmentFormProps {
  passingPercentage: string;
  questions: PracticeQuestionDraft[];
  onPassingPercentageChange: (v: string) => void;
  onQuestionsChange: (questions: PracticeQuestionDraft[]) => void;
}

// ─── Default content shapes per question type ─────────────────────────────────

function defaultContent(type: PracticeQuestionType): Record<string, unknown> {
  switch (type) {
    case 'multiple_choice':
      return { question: '', options: ['', ''], correctIndex: 0 };
    case 'true_false':
      return { question: '', correct: true };
    case 'matching':
      return { question: '', leftItems: ['', ''], rightItems: ['', ''], correctPairs: [[0, 0], [1, 1]] };
    case 'fill_in_blank':
      return { question: '', blanks: [{ answer: '', alternatives: [] }] };
  }
}

// ─── Multiple Choice Editor ───────────────────────────────────────────────────

interface MCEditorProps {
  content: Record<string, unknown>;
  index: number;
  onChange: (content: Record<string, unknown>) => void;
}

function MultipleChoiceEditor({ content, index, onChange }: MCEditorProps) {
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
                name={`mc-correct-${index}`}
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

// ─── True/False Editor ────────────────────────────────────────────────────────

interface TFEditorProps {
  content: Record<string, unknown>;
  index: number;
  onChange: (content: Record<string, unknown>) => void;
}

function TrueFalseEditor({ content, index, onChange }: TFEditorProps) {
  const question = (content.question as string) ?? '';
  const correct = (content.correct as boolean) ?? true;

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        label="Question"
        value={question}
        onChange={e => onChange({ ...content, question: e.target.value })}
        placeholder="Is it true that...?"
        rows={2}
      />
      <div>
        <p className="text-sm font-semibold text-foreground mb-2">Correct answer</p>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`tf-correct-${index}`}
              checked={correct === true}
              onChange={() => onChange({ ...content, correct: true })}
              className="accent-accent"
            />
            <span className="text-sm text-foreground">True</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`tf-correct-${index}`}
              checked={correct === false}
              onChange={() => onChange({ ...content, correct: false })}
              className="accent-accent"
            />
            <span className="text-sm text-foreground">False</span>
          </label>
        </div>
      </div>
    </div>
  );
}

// ─── Matching Editor ──────────────────────────────────────────────────────────

interface MatchingEditorProps {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
}

function MatchingEditor({ content, onChange }: MatchingEditorProps) {
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

// ─── Fill in the Blank Editor ─────────────────────────────────────────────────

interface FIBEditorProps {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
}

interface BlankDraft {
  answer: string;
  alternatives: string[];
}

function FillInBlankEditor({ content, onChange }: FIBEditorProps) {
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

// ─── Question Card ────────────────────────────────────────────────────────────

const QUESTION_TYPE_LABELS: Record<PracticeQuestionType, string> = {
  multiple_choice: 'Multiple Choice',
  true_false: 'True / False',
  matching: 'Matching',
  fill_in_blank: 'Fill in the Blank',
};

interface QuestionCardProps {
  question: PracticeQuestionDraft;
  index: number;
  total: number;
  onChange: (q: PracticeQuestionDraft) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

function QuestionCard({ question, index, total, onChange, onMoveUp, onMoveDown, onRemove }: QuestionCardProps) {
  function handleTypeChange(type: PracticeQuestionType) {
    onChange({ ...question, type, content: defaultContent(type) });
  }

  function handleContentChange(content: Record<string, unknown>) {
    onChange({ ...question, content });
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          Question {index + 1}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            aria-label={`Move question ${index + 1} up`}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            aria-label={`Move question ${index + 1} down`}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove question ${index + 1}`}
            className="p-1 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-foreground mb-1 block">Question type</label>
        <select
          value={question.type}
          onChange={e => handleTypeChange(e.target.value as PracticeQuestionType)}
          className="w-full rounded-xl border-2 border-border bg-surface-raised px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary"
        >
          {(Object.keys(QUESTION_TYPE_LABELS) as PracticeQuestionType[]).map(t => (
            <option key={t} value={t}>{QUESTION_TYPE_LABELS[t]}</option>
          ))}
        </select>
      </div>

      {question.type === 'multiple_choice' && (
        <MultipleChoiceEditor content={question.content} index={index} onChange={handleContentChange} />
      )}
      {question.type === 'true_false' && (
        <TrueFalseEditor content={question.content} index={index} onChange={handleContentChange} />
      )}
      {question.type === 'matching' && (
        <MatchingEditor content={question.content} onChange={handleContentChange} />
      )}
      {question.type === 'fill_in_blank' && (
        <FillInBlankEditor content={question.content} onChange={handleContentChange} />
      )}
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export default function PracticeProblemAssignmentForm({
  passingPercentage, questions, onPassingPercentageChange, onQuestionsChange,
}: PracticeProblemAssignmentFormProps) {
  function addQuestion() {
    const newQ: PracticeQuestionDraft = {
      type: 'multiple_choice',
      order: questions.length + 1,
      content: defaultContent('multiple_choice'),
    };
    onQuestionsChange([...questions, newQ]);
  }

  function updateQuestion(idx: number, q: PracticeQuestionDraft) {
    onQuestionsChange(questions.map((old, i) => i === idx ? q : old));
  }

  function removeQuestion(idx: number) {
    const next = questions.filter((_, i) => i !== idx).map((q, i) => ({ ...q, order: i + 1 }));
    onQuestionsChange(next);
  }

  function moveQuestion(idx: number, direction: 'up' | 'down') {
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= questions.length) return;
    const next = [...questions];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    onQuestionsChange(next.map((q, i) => ({ ...q, order: i + 1 })));
  }

  const ppVal = passingPercentage === '' ? '' : Number(passingPercentage);
  const ppError = passingPercentage !== '' && (Number(passingPercentage) < 0 || Number(passingPercentage) > 100)
    ? 'Passing percentage must be between 0 and 100.'
    : '';

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Input
          id="passing-pct"
          label="Passing percentage (optional)"
          type="number"
          value={passingPercentage}
          onChange={e => onPassingPercentageChange(e.target.value)}
          placeholder="e.g. 80"
          min={0}
          max={100}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Leave empty — student marks complete manually.
        </p>
        {ppError && <p role="alert" className="text-sm text-destructive mt-1">{ppError}</p>}
        {typeof ppVal === 'number' && !isNaN(ppVal) && ppVal >= 0 && ppVal <= 100 && (
          <p className="text-xs text-muted-foreground mt-1">
            Assignment auto-completes when score &ge; {ppVal}%.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-foreground">
          Questions<span aria-hidden="true"> *</span>
          <span className="sr-only"> (required)</span>
        </p>
        {questions.map((q, idx) => (
          <QuestionCard
            key={idx}
            question={q}
            index={idx}
            total={questions.length}
            onChange={updated => updateQuestion(idx, updated)}
            onMoveUp={() => moveQuestion(idx, 'up')}
            onMoveDown={() => moveQuestion(idx, 'down')}
            onRemove={() => removeQuestion(idx)}
          />
        ))}
        <button
          type="button"
          onClick={addQuestion}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors self-start"
        >
          <Plus className="w-3.5 h-3.5" />
          Add question
        </button>
        {questions.length === 0 && (
          <p role="alert" className="text-sm text-destructive">
            At least one question is required.
          </p>
        )}
      </div>
    </div>
  );
}
