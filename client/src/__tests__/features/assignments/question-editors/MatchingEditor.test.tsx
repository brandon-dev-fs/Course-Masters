import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MatchingEditor from '../../../../features/assignments/question-editors/MatchingEditor.js';

const defaultContent = {
  question: 'Match the following:',
  pairs: [
    { id: 'p1', left: 'Cat', right: 'Meows' },
    { id: 'p2', left: 'Dog', right: 'Barks' },
  ],
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
      expect.objectContaining({
        pairs: expect.arrayContaining([expect.objectContaining({ left: 'Lion' })]),
      }),
    );
  });

  it('calls onChange when right item changes', () => {
    const onChange = vi.fn();
    render(<MatchingEditor content={defaultContent} onChange={onChange} />);
    fireEvent.change(screen.getByDisplayValue('Meows'), { target: { value: 'Roars' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        pairs: expect.arrayContaining([expect.objectContaining({ right: 'Roars' })]),
      }),
    );
  });

  it('adds a pair when + Add pair is clicked', () => {
    const onChange = vi.fn();
    render(<MatchingEditor content={defaultContent} onChange={onChange} />);
    fireEvent.click(screen.getByText('+ Add pair'));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        pairs: expect.arrayContaining([
          expect.objectContaining({ left: 'Cat', right: 'Meows' }),
          expect.objectContaining({ left: 'Dog', right: 'Barks' }),
          expect.objectContaining({ left: '', right: '' }),
        ]),
      }),
    );
  });

  it('shows remove buttons disabled when at 2 pairs', () => {
    render(<MatchingEditor content={defaultContent} onChange={vi.fn()} />);
    const removeButtons = screen.getAllByRole('button', { name: /remove pair/i });
    expect(removeButtons).toHaveLength(2);
    removeButtons.forEach(btn => expect(btn).toBeDisabled());
  });

  it('shows enabled remove buttons when more than 2 pairs', () => {
    const content = {
      ...defaultContent,
      pairs: [
        { id: 'p1', left: 'A', right: 'X' },
        { id: 'p2', left: 'B', right: 'Y' },
        { id: 'p3', left: 'C', right: 'Z' },
      ],
    };
    render(<MatchingEditor content={content} onChange={vi.fn()} />);
    expect(screen.getAllByRole('button', { name: /remove pair/i })).toHaveLength(3);
  });

  it('calls onChange when second pair right item changes (covers updatePairRight)', () => {
    const onChange = vi.fn();
    render(<MatchingEditor content={defaultContent} onChange={onChange} />);
    fireEvent.change(screen.getByDisplayValue('Barks'), { target: { value: 'Growls' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        pairs: expect.arrayContaining([expect.objectContaining({ right: 'Growls' })]),
      }),
    );
  });

  it('calls onChange when remove pair is clicked (covers removePair)', () => {
    const onChange = vi.fn();
    const content = {
      ...defaultContent,
      pairs: [
        { id: 'p1', left: 'Cat', right: 'Meows' },
        { id: 'p2', left: 'Dog', right: 'Barks' },
        { id: 'p3', left: 'Bird', right: 'Chirps' },
      ],
    };
    render(<MatchingEditor content={content} onChange={onChange} />);
    fireEvent.click(screen.getAllByRole('button', { name: /remove pair/i })[0]);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        pairs: [
          expect.objectContaining({ left: 'Dog', right: 'Barks' }),
          expect.objectContaining({ left: 'Bird', right: 'Chirps' }),
        ],
      }),
    );
  });

  it('renders with missing content fields (covers ?? fallbacks)', () => {
    render(<MatchingEditor content={{}} onChange={vi.fn()} />);
    // derivePairs returns 2 default empty pairs; remove buttons are present but disabled
    const removeButtons = screen.getAllByRole('button', { name: /remove pair/i });
    expect(removeButtons).toHaveLength(2);
    removeButtons.forEach(btn => expect(btn).toBeDisabled());
  });

  it('covers removing middle pair correctly', () => {
    const onChange = vi.fn();
    const content = {
      ...defaultContent,
      pairs: [
        { id: 'p1', left: 'Cat', right: 'Meows' },
        { id: 'p2', left: 'Dog', right: 'Barks' },
        { id: 'p3', left: 'Bird', right: 'Chirps' },
      ],
    };
    render(<MatchingEditor content={content} onChange={onChange} />);
    fireEvent.click(screen.getAllByRole('button', { name: /remove pair/i })[1]);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        pairs: [
          expect.objectContaining({ left: 'Cat' }),
          expect.objectContaining({ left: 'Bird' }),
        ],
      }),
    );
  });

  it('hides + Add pair when at 8 pairs', () => {
    const pairs = Array.from({ length: 8 }, (_, i) => ({ id: `p${i}`, left: `L${i}`, right: `R${i}` }));
    render(
      <MatchingEditor
        content={{ question: '', pairs }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.queryByText('+ Add pair')).not.toBeInTheDocument();
  });
});
