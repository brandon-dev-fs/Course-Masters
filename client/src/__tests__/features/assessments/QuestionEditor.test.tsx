import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import QuestionEditor, { defaultContent } from '../../../features/assessments/QuestionEditor.js';
import type { QuestionDraft, QuestionType } from '../../../features/assessments/QuestionEditor.js';

const sampleDraft: QuestionDraft = {
  id: 'q1',
  type: 'multiple_choice',
  question: 'What is 2+2?',
  // content.question required — MultipleChoiceEditor reads content['question'] for the textarea
  content: { question: 'What is 2+2?', options: ['3', '4', '5', '6'], correctIndex: 1 },
  order: 1,
  calculatorEnabled: false,
};

describe('QuestionEditor', () => {
  const onChange = vi.fn();
  const onRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders question textarea', () => {
    render(<QuestionEditor index={0} value={sampleDraft} onChange={onChange} onRemove={onRemove} />);
    expect(screen.getByDisplayValue('What is 2+2?')).toBeInTheDocument();
  });

  it('renders all options', () => {
    render(<QuestionEditor index={0} value={sampleDraft} onChange={onChange} onRemove={onRemove} />);
    expect(screen.getByDisplayValue('3')).toBeInTheDocument();
    expect(screen.getByDisplayValue('4')).toBeInTheDocument();
  });

  it('calls onChange when question text changes', () => {
    render(<QuestionEditor index={0} value={sampleDraft} onChange={onChange} onRemove={onRemove} />);
    fireEvent.change(screen.getByDisplayValue('What is 2+2?'), { target: { value: 'New question?' } });
    // QuestionEditor propagates content changes — question text lives in content.question
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.objectContaining({ question: 'New question?' }) }),
    );
  });

  it('calls onChange when option text changes', () => {
    render(<QuestionEditor index={0} value={sampleDraft} onChange={onChange} onRemove={onRemove} />);
    fireEvent.change(screen.getByDisplayValue('3'), { target: { value: '2' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.objectContaining({ options: expect.arrayContaining(['2']) }) }),
    );
  });

  it('renders calculator toggle switch', () => {
    render(<QuestionEditor index={0} value={sampleDraft} onChange={onChange} onRemove={onRemove} />);
    expect(screen.getByRole('switch', { name: /allow calculator/i })).toBeInTheDocument();
  });

  it('toggles calculator on switch click', () => {
    render(<QuestionEditor index={0} value={sampleDraft} onChange={onChange} onRemove={onRemove} />);
    fireEvent.click(screen.getByRole('switch', { name: /allow calculator/i }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ calculatorEnabled: true }));
  });

  it('renders Add option button', () => {
    render(<QuestionEditor index={0} value={sampleDraft} onChange={onChange} onRemove={onRemove} />);
    expect(screen.getByText(/add option/i)).toBeInTheDocument();
  });

  it('calls onChange when Add option is clicked', () => {
    render(<QuestionEditor index={0} value={sampleDraft} onChange={onChange} onRemove={onRemove} />);
    fireEvent.click(screen.getByText(/add option/i));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({ options: expect.arrayContaining(['3', '4', '5', '6', '']) }),
      }),
    );
  });

  it('renders question type selector with correct initial value', () => {
    // QuestionEditor no longer owns its own "Question N" label — that lives in the accordion
    // card header (QuestionCard in AssessmentForm). Verify the type selector reflects the draft.
    render(<QuestionEditor index={2} value={sampleDraft} onChange={onChange} onRemove={onRemove} />);
    expect(screen.getByRole('combobox', { name: /question type/i })).toHaveValue('multiple_choice');
  });

  it('renders remove button for each option', () => {
    render(<QuestionEditor index={0} value={sampleDraft} onChange={onChange} onRemove={onRemove} />);
    // Option remove buttons render as ✕ icons (visible when options.length > 2)
    const removeButtons = screen.getAllByText('✕');
    expect(removeButtons.length).toBe(4);
  });

  it('calls onChange when option is removed', () => {
    render(<QuestionEditor index={0} value={sampleDraft} onChange={onChange} onRemove={onRemove} />);
    const removeButtons = screen.getAllByText('✕');
    fireEvent.click(removeButtons[2]); // Remove option C ('5')
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({ options: ['3', '4', '6'] }),
      }),
    );
  });

  it('calls onRemove when Remove button is clicked', () => {
    render(<QuestionEditor index={0} value={sampleDraft} onChange={onChange} onRemove={onRemove} />);
    // Exact match — option remove buttons are named "Remove option N"
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onRemove).toHaveBeenCalledOnce();
  });
});

// ── Question type rendering ───────────────────────────────────────────────────

describe('QuestionEditor — question types', () => {
  const onChange = vi.fn();
  const onRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders TrueFalseEditor for true_false type', () => {
    const draft: QuestionDraft = {
      type: 'true_false',
      question: '',
      content: { question: 'Is 2+2=4?', correct: true },
      order: 1,
    };
    render(<QuestionEditor index={0} value={draft} onChange={onChange} onRemove={onRemove} />);
    expect(screen.getByPlaceholderText(/is it true that/i)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /true/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /false/i })).toBeInTheDocument();
  });

  it('renders FillInBlankEditor for fill_in_blank type', () => {
    const draft: QuestionDraft = {
      type: 'fill_in_blank',
      question: '',
      content: { question: 'Fill in: {{blank_1}}', blanks: [{ answer: 'Paris', alternatives: [] }] },
      order: 1,
    };
    render(<QuestionEditor index={0} value={draft} onChange={onChange} onRemove={onRemove} />);
    // FillInBlankEditor renders a template textarea
    expect(screen.getByRole('combobox', { name: /question type/i })).toHaveValue('fill_in_blank');
  });

  it('renders MatchingEditor for matching type', () => {
    const draft: QuestionDraft = {
      type: 'matching',
      question: '',
      content: {
        question: 'Match these',
        pairs: [
          { id: 'p1', left: 'France', right: 'Paris' },
          { id: 'p2', left: 'Germany', right: 'Berlin' },
        ],
      },
      order: 1,
    };
    render(<QuestionEditor index={0} value={draft} onChange={onChange} onRemove={onRemove} />);
    expect(screen.getByRole('combobox', { name: /question type/i })).toHaveValue('matching');
    // MatchingEditor renders left/right input pairs
    expect(screen.getByDisplayValue('France')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Paris')).toBeInTheDocument();
  });

  it('changes type and resets content when a new type is selected', () => {
    render(<QuestionEditor index={0} value={sampleDraft} onChange={onChange} onRemove={onRemove} />);
    const selector = screen.getByRole('combobox', { name: /question type/i });
    fireEvent.change(selector, { target: { value: 'true_false' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'true_false',
        content: expect.objectContaining({ correct: true }),
      }),
    );
  });

  it('does not call onChange when selecting the current type', () => {
    render(<QuestionEditor index={0} value={sampleDraft} onChange={onChange} onRemove={onRemove} />);
    const selector = screen.getByRole('combobox', { name: /question type/i });
    // Already multiple_choice — selecting same type should be a no-op
    fireEvent.change(selector, { target: { value: 'multiple_choice' } });
    expect(onChange).not.toHaveBeenCalled();
  });
});

// ── defaultContent utility ────────────────────────────────────────────────────

describe('defaultContent', () => {
  it('returns multiple_choice defaults', () => {
    const c = defaultContent('multiple_choice');
    expect(c).toMatchObject({ question: '', options: ['', '', '', ''], correctIndex: 0 });
  });

  it('returns true_false defaults', () => {
    const c = defaultContent('true_false');
    expect(c).toMatchObject({ question: '', correct: true });
  });

  it('returns fill_in_blank defaults', () => {
    const c = defaultContent('fill_in_blank');
    expect(c).toMatchObject({ question: '', blanks: [{ answer: '', alternatives: [] }] });
  });

  it('returns matching defaults with two empty pairs', () => {
    const c = defaultContent('matching');
    const pairs = c['pairs'] as Array<{ left: string; right: string }>;
    expect(pairs).toHaveLength(2);
    expect(pairs[0]).toMatchObject({ left: '', right: '' });
    expect(pairs[1]).toMatchObject({ left: '', right: '' });
  });

  it('covers all QuestionType values without throwing', () => {
    const types: QuestionType[] = ['multiple_choice', 'true_false', 'fill_in_blank', 'matching'];
    for (const t of types) {
      expect(() => defaultContent(t)).not.toThrow();
    }
  });
});
