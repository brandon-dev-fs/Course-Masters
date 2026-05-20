import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FillInBlankEditor from '../../../../features/assignments/question-editors/FillInBlankEditor.js';

const defaultContent = {
  question: 'The capital of France is ___.',
  blanks: [{ answer: 'Paris', alternatives: ['paris', 'PARIS'] }],
};

describe('FillInBlankEditor', () => {
  it('renders question textarea', () => {
    render(<FillInBlankEditor content={defaultContent} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('The capital of France is ___.'))
      .toBeInTheDocument();
  });

  it('renders blank answer fields', () => {
    render(<FillInBlankEditor content={defaultContent} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('Paris')).toBeInTheDocument();
  });

  it('renders alternatives field', () => {
    render(<FillInBlankEditor content={defaultContent} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('paris, PARIS')).toBeInTheDocument();
  });

  it('calls onChange when question changes', () => {
    const onChange = vi.fn();
    render(<FillInBlankEditor content={defaultContent} onChange={onChange} />);
    fireEvent.change(screen.getByDisplayValue('The capital of France is ___.'), {
      target: { value: 'New question ___.' },
    });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ question: 'New question ___.' }));
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

  it('adds a blank when + Add blank is clicked', () => {
    const onChange = vi.fn();
    render(<FillInBlankEditor content={defaultContent} onChange={onChange} />);
    fireEvent.click(screen.getByText('+ Add blank'));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        blanks: [...defaultContent.blanks, { answer: '', alternatives: [] }],
      }),
    );
  });

  it('does not show remove button when only one blank', () => {
    render(<FillInBlankEditor content={defaultContent} onChange={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /remove blank/i })).not.toBeInTheDocument();
  });

  it('shows remove button when more than one blank', () => {
    const content = {
      question: 'Q',
      blanks: [
        { answer: 'A', alternatives: [] },
        { answer: 'B', alternatives: [] },
      ],
    };
    render(<FillInBlankEditor content={content} onChange={vi.fn()} />);
    expect(screen.getAllByText('Remove').length).toBe(2);
  });

  it('calls onChange when remove blank is clicked', () => {
    const onChange = vi.fn();
    const content = {
      question: 'Q',
      blanks: [
        { answer: 'A', alternatives: [] },
        { answer: 'B', alternatives: [] },
      ],
    };
    render(<FillInBlankEditor content={content} onChange={onChange} />);
    fireEvent.click(screen.getAllByText('Remove')[0]);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ blanks: [{ answer: 'B', alternatives: [] }] }),
    );
  });

  it('defaults to one blank when none provided', () => {
    render(<FillInBlankEditor content={{ question: 'Q' }} onChange={vi.fn()} />);
    expect(screen.getByText('Blank 1')).toBeInTheDocument();
  });

  it('calls onChange when second blank answer changes (covers non-matching map branch)', () => {
    const onChange = vi.fn();
    const content = {
      question: 'Q',
      blanks: [
        { answer: 'A', alternatives: [] },
        { answer: 'B', alternatives: [] },
      ],
    };
    render(<FillInBlankEditor content={content} onChange={onChange} />);
    fireEvent.change(screen.getByDisplayValue('A'), { target: { value: 'Alpha' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ blanks: [{ answer: 'Alpha', alternatives: [] }, { answer: 'B', alternatives: [] }] }),
    );
  });

  it('renders without question property (covers ?? fallback)', () => {
    render(<FillInBlankEditor content={{ blanks: [{ answer: 'A', alternatives: [] }] }} onChange={vi.fn()} />);
    expect(screen.getByText('Blank 1')).toBeInTheDocument();
  });

  it('calls onChange when alternatives change on second blank (covers bi !== i false branch)', () => {
    const onChange = vi.fn();
    const content = {
      question: 'Q',
      blanks: [
        { answer: 'A', alternatives: [] },
        { answer: 'B', alternatives: [] },
      ],
    };
    render(<FillInBlankEditor content={content} onChange={onChange} />);
    // Change alternatives for the first blank — the map iterates both blanks:
    // bi=0,i=0 → true branch; bi=1,i=0 → false branch (bi !== i)
    // Use exact placeholder unique to alternatives inputs ("PARIS" uppercase only appears there)
    const altInputs = screen.getAllByPlaceholderText('e.g. paris, PARIS');
    fireEvent.change(altInputs[0], { target: { value: 'alpha, ALPHA' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        blanks: [
          { answer: 'A', alternatives: ['alpha', 'ALPHA'] },
          { answer: 'B', alternatives: [] },
        ],
      }),
    );
  });
});
