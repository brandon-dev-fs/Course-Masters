import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MatchingEditor from '../../../../features/assignments/question-editors/MatchingEditor.js';

const defaultContent = {
  question: 'Match the following:',
  leftItems: ['Cat', 'Dog'],
  rightItems: ['Meows', 'Barks'],
  correctPairs: [[0, 0], [1, 1]] as [number, number][],
};

describe('MatchingEditor', () => {
  it('renders question textarea', () => {
    render(<MatchingEditor content={defaultContent} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('Match the following:')).toBeInTheDocument();
  });

  it('renders left items', () => {
    render(<MatchingEditor content={defaultContent} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('Cat')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Dog')).toBeInTheDocument();
  });

  it('renders right items', () => {
    render(<MatchingEditor content={defaultContent} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('Meows')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Barks')).toBeInTheDocument();
  });

  it('calls onChange when question changes', () => {
    const onChange = vi.fn();
    render(<MatchingEditor content={defaultContent} onChange={onChange} />);
    fireEvent.change(screen.getByDisplayValue('Match the following:'), {
      target: { value: 'New question' },
    });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ question: 'New question' }));
  });

  it('calls onChange when left item changes', () => {
    const onChange = vi.fn();
    render(<MatchingEditor content={defaultContent} onChange={onChange} />);
    fireEvent.change(screen.getByDisplayValue('Cat'), { target: { value: 'Lion' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ leftItems: ['Lion', 'Dog'] }),
    );
  });

  it('calls onChange when right item changes', () => {
    const onChange = vi.fn();
    render(<MatchingEditor content={defaultContent} onChange={onChange} />);
    fireEvent.change(screen.getByDisplayValue('Meows'), { target: { value: 'Roars' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ rightItems: ['Roars', 'Barks'] }),
    );
  });

  it('adds a pair when + Add pair is clicked', () => {
    const onChange = vi.fn();
    render(<MatchingEditor content={defaultContent} onChange={onChange} />);
    fireEvent.click(screen.getByText('+ Add pair'));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        leftItems: ['Cat', 'Dog', ''],
        rightItems: ['Meows', 'Barks', ''],
      }),
    );
  });

  it('does not show remove buttons when 2 pairs', () => {
    render(<MatchingEditor content={defaultContent} onChange={vi.fn()} />);
    expect(screen.queryAllByRole('button', { name: /remove pair/i }).length).toBe(0);
  });

  it('shows remove buttons when more than 2 pairs', () => {
    const content = {
      ...defaultContent,
      leftItems: ['A', 'B', 'C'],
      rightItems: ['X', 'Y', 'Z'],
      correctPairs: [[0, 0], [1, 1], [2, 2]] as [number, number][],
    };
    render(<MatchingEditor content={content} onChange={vi.fn()} />);
    expect(screen.getAllByRole('button', { name: /remove pair/i }).length).toBe(3);
  });

  it('calls onChange when pair match select changes (covers updatePair)', () => {
    const onChange = vi.fn();
    render(<MatchingEditor content={defaultContent} onChange={onChange} />);
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '1' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ correctPairs: [[0, 1], [1, 1]] }),
    );
  });

  it('calls onChange when remove pair is clicked (covers removePair)', () => {
    const onChange = vi.fn();
    const content = {
      ...defaultContent,
      leftItems: ['Cat', 'Dog', 'Bird'],
      rightItems: ['Meows', 'Barks', 'Chirps'],
      correctPairs: [[0, 0], [1, 1], [2, 2]] as [number, number][],
    };
    render(<MatchingEditor content={content} onChange={onChange} />);
    fireEvent.click(screen.getAllByRole('button', { name: /remove pair/i })[0]);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        leftItems: ['Dog', 'Bird'],
        rightItems: ['Barks', 'Chirps'],
      }),
    );
  });

  it('renders with missing content fields (covers ?? fallbacks)', () => {
    render(<MatchingEditor content={{}} onChange={vi.fn()} />);
    expect(screen.getByText('Pairs')).toBeInTheDocument();
  });

  it('covers l > i false branch by removing middle pair', () => {
    const onChange = vi.fn();
    const content = {
      ...defaultContent,
      leftItems: ['Cat', 'Dog', 'Bird'],
      rightItems: ['Meows', 'Barks', 'Chirps'],
      correctPairs: [[0, 0], [1, 1], [2, 2]] as [number, number][],
    };
    render(<MatchingEditor content={content} onChange={onChange} />);
    // Remove index 1 (middle) — item at index 2 has l=2 > 1 (true branch) and l=0 <= 1 (false branch)
    fireEvent.click(screen.getAllByRole('button', { name: /remove pair/i })[1]);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ leftItems: ['Cat', 'Bird'] }),
    );
  });

  it('hides + Add pair when at 8 pairs', () => {
    const leftItems = Array.from({ length: 8 }, (_, i) => `L${i}`);
    const rightItems = Array.from({ length: 8 }, (_, i) => `R${i}`);
    const correctPairs = leftItems.map((_, i) => [i, i] as [number, number]);
    render(
      <MatchingEditor
        content={{ question: '', leftItems, rightItems, correctPairs }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.queryByText('+ Add pair')).not.toBeInTheDocument();
  });
});
