import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TrueFalseEditor from '../../../../features/assignments/question-editors/TrueFalseEditor.js';

describe('TrueFalseEditor', () => {
  it('renders question textarea', () => {
    render(<TrueFalseEditor content={{ question: 'The sky is blue.', correct: true }} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('The sky is blue.')).toBeInTheDocument();
  });

  it('shows True and False radio options', () => {
    render(<TrueFalseEditor content={{ question: '', correct: true }} onChange={vi.fn()} />);
    expect(screen.getByText('True')).toBeInTheDocument();
    expect(screen.getByText('False')).toBeInTheDocument();
  });

  it('True radio is selected by default when correct is true', () => {
    render(<TrueFalseEditor content={{ question: '', correct: true }} onChange={vi.fn()} />);
    const radios = screen.getAllByRole('radio');
    expect(radios[0]).toBeChecked();
    expect(radios[1]).not.toBeChecked();
  });

  it('False radio is selected when correct is false', () => {
    render(<TrueFalseEditor content={{ question: '', correct: false }} onChange={vi.fn()} />);
    const radios = screen.getAllByRole('radio');
    expect(radios[0]).not.toBeChecked();
    expect(radios[1]).toBeChecked();
  });

  it('calls onChange with correct: false when False is selected', () => {
    const onChange = vi.fn();
    render(<TrueFalseEditor content={{ question: '', correct: true }} onChange={onChange} />);
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[1]);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ correct: false }));
  });

  it('calls onChange with correct: true when True is selected', () => {
    const onChange = vi.fn();
    render(<TrueFalseEditor content={{ question: '', correct: false }} onChange={onChange} />);
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[0]);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ correct: true }));
  });

  it('calls onChange when question changes', () => {
    const onChange = vi.fn();
    render(<TrueFalseEditor content={{ question: 'Original', correct: true }} onChange={onChange} />);
    fireEvent.change(screen.getByDisplayValue('Original'), { target: { value: 'Updated' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ question: 'Updated' }));
  });

  it('defaults correct to true when undefined', () => {
    render(<TrueFalseEditor content={{ question: '' }} onChange={vi.fn()} />);
    const radios = screen.getAllByRole('radio');
    expect(radios[0]).toBeChecked();
  });

  it('renders with missing question property (covers question ?? fallback)', () => {
    render(<TrueFalseEditor content={{}} onChange={vi.fn()} />);
    expect(screen.getByText('True')).toBeInTheDocument();
  });
});
