import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MultipleChoiceEditor from '../../../../features/assignments/question-editors/MultipleChoiceEditor.js';

const defaultContent = {
  question: 'What is 2+2?',
  options: ['2', '3', '4', '5'],
  correctIndex: 2,
};

describe('MultipleChoiceEditor', () => {
  it('renders question textarea', () => {
    render(<MultipleChoiceEditor content={defaultContent} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('What is 2+2?')).toBeInTheDocument();
  });

  it('renders all options', () => {
    render(<MultipleChoiceEditor content={defaultContent} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3')).toBeInTheDocument();
    expect(screen.getByDisplayValue('4')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });

  it('calls onChange when question changes', () => {
    const onChange = vi.fn();
    render(<MultipleChoiceEditor content={defaultContent} onChange={onChange} />);
    fireEvent.change(screen.getByDisplayValue('What is 2+2?'), { target: { value: 'New question?' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ question: 'New question?' }));
  });

  it('calls onChange when correct radio is changed', () => {
    const onChange = vi.fn();
    render(<MultipleChoiceEditor content={defaultContent} onChange={onChange} />);
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[0]);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ correctIndex: 0 }));
  });

  it('calls onChange when an option text is changed', () => {
    const onChange = vi.fn();
    render(<MultipleChoiceEditor content={defaultContent} onChange={onChange} />);
    fireEvent.change(screen.getByDisplayValue('2'), { target: { value: 'Two' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ options: ['Two', '3', '4', '5'] }),
    );
  });

  it('shows remove buttons when more than 2 options', () => {
    render(<MultipleChoiceEditor content={defaultContent} onChange={vi.fn()} />);
    const removeBtns = screen.getAllByRole('button', { name: /remove option/i });
    expect(removeBtns.length).toBe(4);
  });

  it('does not show remove button when exactly 2 options', () => {
    const content = { ...defaultContent, options: ['A', 'B'], correctIndex: 0 };
    render(<MultipleChoiceEditor content={content} onChange={vi.fn()} />);
    expect(screen.queryAllByRole('button', { name: /remove option/i }).length).toBe(0);
  });

  it('calls onChange when add option button is clicked', () => {
    const onChange = vi.fn();
    render(<MultipleChoiceEditor content={defaultContent} onChange={onChange} />);
    fireEvent.click(screen.getByText('+ Add option'));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ options: [...defaultContent.options, ''] }),
    );
  });

  it('hides add button when options reach 6', () => {
    const content = { ...defaultContent, options: ['A', 'B', 'C', 'D', 'E', 'F'], correctIndex: 0 };
    render(<MultipleChoiceEditor content={content} onChange={vi.fn()} />);
    expect(screen.queryByText('+ Add option')).not.toBeInTheDocument();
  });

  it('renders with index prop (covers index ?? 0 left branch)', () => {
    render(<MultipleChoiceEditor content={defaultContent} index={1} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('What is 2+2?')).toBeInTheDocument();
  });

  it('renders with missing options/correctIndex (covers ?? fallback branches)', () => {
    render(<MultipleChoiceEditor content={{ question: 'Q' }} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('Q')).toBeInTheDocument();
  });

  it('does not shift correctIndex when removed option is before it stays in range', () => {
    const onChange = vi.fn();
    // 3 options, correctIndex = 0. Remove last → correctIndex stays 0 (false branch of ternary)
    const content = { question: 'Q', options: ['A', 'B', 'C'], correctIndex: 0 };
    render(<MultipleChoiceEditor content={content} onChange={onChange} />);
    const removeBtns = screen.getAllByRole('button', { name: /remove option/i });
    fireEvent.click(removeBtns[2]);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ correctIndex: 0 }));
  });

  it('calls onChange with updated correctIndex when removing option shifts it', () => {
    const onChange = vi.fn();
    // 3 options, correctIndex = 2 (last). Remove last option → correctIndex should shift to 1
    const content = { question: 'Q', options: ['A', 'B', 'C'], correctIndex: 2 };
    render(<MultipleChoiceEditor content={content} onChange={onChange} />);
    const removeBtns = screen.getAllByRole('button', { name: /remove option/i });
    fireEvent.click(removeBtns[2]);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ correctIndex: 1 }));
  });
});
