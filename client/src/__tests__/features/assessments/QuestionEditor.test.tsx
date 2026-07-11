import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import QuestionEditor from '../../../features/assessments/QuestionEditor.js';
import type { QuestionDraft } from '../../../features/assessments/QuestionEditor.js';

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
});
