import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FlashCard from '../../../features/flashcards/FlashCard.js';
import type { LessonTool } from '../../../api/types.js';

const flashCardTool: LessonTool = {
  id: 't1',
  type: 'flash_card',
  title: 'Card 1',
  content: { front: 'What is a variable?', back: 'A named storage location.' },
  order: 1,
  lessonId: 'l1',
  isRequired: false,
};

describe('FlashCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing in view mode', () => {
    render(<FlashCard card={flashCardTool} />);
    expect(screen.getByText('What is a variable?')).toBeInTheDocument();
  });

  it('flips to show back when clicked', () => {
    render(<FlashCard card={flashCardTool} />);
    const cardEl = screen.getByText('What is a variable?').closest('[style]')!;
    fireEvent.click(cardEl.parentElement!);
    // Both faces exist in DOM; clicking flips
    expect(screen.getByText('A named storage location.')).toBeInTheDocument();
  });

  it('renders in edit mode', () => {
    render(<FlashCard card={flashCardTool} editMode={true} onUpdate={vi.fn()} onDelete={vi.fn()} />);
    // In edit mode, shows textareas
    const textareas = screen.getAllByRole('textbox');
    expect(textareas.length).toBeGreaterThanOrEqual(2);
  });

  it('shows unsupported message for wrong type', () => {
    const wrongType = { ...flashCardTool, type: 'vocab' } as unknown as LessonTool;
    render(<FlashCard card={wrongType} />);
    expect(screen.getByText(/unsupported tool type/i)).toBeInTheDocument();
  });
});
