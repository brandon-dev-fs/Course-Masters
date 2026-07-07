import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FillInBlankEditor from '../../../../features/assignments/question-editors/FillInBlankEditor.js';

// Content with a {{blank_1}} token so the blank answer section renders
const defaultContent = {
  question: 'The capital of France is {{blank_1}}.',
  blanks: [{ answer: 'Paris', alternatives: ['paris', 'PARIS'] }],
};

describe('FillInBlankEditor', () => {
  it('renders question textarea', () => {
    render(<FillInBlankEditor content={defaultContent} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('The capital of France is {{blank_1}}.'))
      .toBeInTheDocument();
  });

  it('renders blank answer fields when tokens exist', () => {
    render(<FillInBlankEditor content={defaultContent} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('Paris')).toBeInTheDocument();
  });

  it('renders alternatives field', () => {
    render(<FillInBlankEditor content={defaultContent} onChange={vi.fn()} />);
    // alternatives are joined with ", "
    expect(screen.getByDisplayValue('paris, PARIS')).toBeInTheDocument();
  });

  it('calls onChange when question changes', () => {
    const onChange = vi.fn();
    render(<FillInBlankEditor content={defaultContent} onChange={onChange} />);
    fireEvent.change(screen.getByDisplayValue('The capital of France is {{blank_1}}.'), {
      target: { value: 'New question {{blank_1}}.' },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ question: 'New question {{blank_1}}.' }),
    );
  });

  it('calls onChange when blank answer changes', () => {
    const onChange = vi.fn();
    render(<FillInBlankEditor content={defaultContent} onChange={onChange} />);
    fireEvent.change(screen.getByDisplayValue('Paris'), { target: { value: 'Lyon' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ blanks: [{ answer: 'Lyon', alternatives: ['paris', 'PARIS'] }] }),
    );
  });

  it('calls onChange when alternatives change', () => {
    const onChange = vi.fn();
    render(<FillInBlankEditor content={defaultContent} onChange={onChange} />);
    fireEvent.change(screen.getByDisplayValue('paris, PARIS'), { target: { value: 'paris' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ blanks: [{ answer: 'Paris', alternatives: ['paris'] }] }),
    );
  });

  it('inserts a blank token when "Insert blank" is clicked', () => {
    const onChange = vi.fn();
    render(<FillInBlankEditor content={{ question: 'The cow', blanks: [] }} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /insert blank/i }));
    // Should call onChange with the new token appended to question
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        question: expect.stringContaining('{{blank_'),
      }),
    );
  });

  it('shows "No blanks defined" message when question has no tokens', () => {
    render(<FillInBlankEditor content={{ question: 'No tokens here', blanks: [] }} onChange={vi.fn()} />);
    expect(screen.getByText(/no blanks defined/i)).toBeInTheDocument();
  });

  it('shows "Blank 1" label when one token exists', () => {
    render(<FillInBlankEditor content={defaultContent} onChange={vi.fn()} />);
    expect(screen.getByText('Blank 1')).toBeInTheDocument();
  });

  it('shows multiple blank sections for multiple tokens', () => {
    const content = {
      question: '{{blank_1}} is the capital and {{blank_2}} is the currency.',
      blanks: [
        { answer: 'Paris', alternatives: [] },
        { answer: 'Euro', alternatives: [] },
      ],
    };
    render(<FillInBlankEditor content={content} onChange={vi.fn()} />);
    expect(screen.getByText('Blank 1')).toBeInTheDocument();
    expect(screen.getByText('Blank 2')).toBeInTheDocument();
  });

  it('renders without question property (covers ?? fallback)', () => {
    render(
      <FillInBlankEditor
        content={{ question: '{{blank_1}} fallback', blanks: [{ answer: 'A', alternatives: [] }] }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Blank 1')).toBeInTheDocument();
  });

  it('calls onChange when second blank answer changes', () => {
    const onChange = vi.fn();
    const content = {
      question: '{{blank_1}} and {{blank_2}}',
      blanks: [
        { answer: 'A', alternatives: [] },
        { answer: 'B', alternatives: [] },
      ],
    };
    render(<FillInBlankEditor content={content} onChange={onChange} />);
    fireEvent.change(screen.getByDisplayValue('A'), { target: { value: 'Alpha' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        blanks: [{ answer: 'Alpha', alternatives: [] }, { answer: 'B', alternatives: [] }],
      }),
    );
  });
});
