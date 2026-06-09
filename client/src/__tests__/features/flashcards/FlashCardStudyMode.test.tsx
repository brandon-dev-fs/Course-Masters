import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FlashCardStudyMode from '../../../features/flashcards/FlashCardStudyMode.js';
import type { StudyCard } from '../../../api/types.js';

const makeCard = (i: number): StudyCard => ({
  id: `card-${i}`,
  front: `Front ${i}`,
  back: `Back ${i}`,
});

const cards = [makeCard(1), makeCard(2), makeCard(3)];

describe('FlashCardStudyMode', () => {
  it('returns null when no cards', () => {
    const { container } = render(
      <FlashCardStudyMode cards={[]} onExit={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders first card and navigation info', () => {
    render(<FlashCardStudyMode cards={cards} onExit={vi.fn()} />);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('shows exit button', () => {
    render(<FlashCardStudyMode cards={cards} onExit={vi.fn()} />);
    expect(screen.getByText(/exit/i)).toBeInTheDocument();
  });

  it('calls onExit when exit button is clicked', () => {
    const onExit = vi.fn();
    render(<FlashCardStudyMode cards={cards} onExit={onExit} />);
    fireEvent.click(screen.getByText(/exit/i));
    expect(onExit).toHaveBeenCalled();
  });

  it('navigates to next card', () => {
    render(<FlashCardStudyMode cards={cards} onExit={vi.fn()} />);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    fireEvent.click(screen.getByText(/next/i));
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('navigates back to previous card', () => {
    render(<FlashCardStudyMode cards={cards} onExit={vi.fn()} />);
    fireEvent.click(screen.getByText(/next/i));
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    fireEvent.click(screen.getByText(/previous/i));
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('previous is disabled on first card', () => {
    render(<FlashCardStudyMode cards={cards} onExit={vi.fn()} />);
    const prevBtn = screen.getByText(/previous/i).closest('button');
    expect(prevBtn).toBeDisabled();
  });

  it('shows finish button on last card', () => {
    render(<FlashCardStudyMode cards={[makeCard(1)]} onExit={vi.fn()} />);
    expect(screen.getByText(/finish/i)).toBeInTheDocument();
  });

  it('calls onExit when finish button is clicked', () => {
    const onExit = vi.fn();
    render(<FlashCardStudyMode cards={[makeCard(1)]} onExit={onExit} />);
    fireEvent.click(screen.getByText(/finish/i));
    expect(onExit).toHaveBeenCalled();
  });

  it('shows reviewed count increasing after navigating', () => {
    render(<FlashCardStudyMode cards={cards} onExit={vi.fn()} />);
    expect(screen.getByText('0 reviewed')).toBeInTheDocument();
    fireEvent.click(screen.getByText(/next/i));
    expect(screen.getByText('1 reviewed')).toBeInTheDocument();
  });

  it('renders progress dots for each card', () => {
    const { container } = render(<FlashCardStudyMode cards={cards} onExit={vi.fn()} />);
    // 3 cards = 3 dots
    const dots = container.querySelectorAll('.rounded-full');
    expect(dots.length).toBe(3);
  });
});
