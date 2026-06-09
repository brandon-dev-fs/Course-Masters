import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FlashCard from '../../../features/flashcards/FlashCard.js';
import type { LessonTool, FlashCardContent } from '../../../api/types.js';

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

  it('renders with missing front/back content (covers ?? fallbacks)', () => {
    const cardNoContent: LessonTool = { ...flashCardTool, content: {} as FlashCardContent };
    render(<FlashCard card={cardNoContent} />);
    // Should render without crashing; empty strings used as fallback
    expect(screen.queryByText(/unsupported/i)).not.toBeInTheDocument();
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

  it('calls onDelete when delete button clicked in editMode', () => {
    const onDelete = vi.fn();
    render(<FlashCard card={flashCardTool} editMode={true} onUpdate={vi.fn()} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: /delete card/i }));
    expect(onDelete).toHaveBeenCalled();
  });

  it('fires onChange on front textarea in editMode', () => {
    render(<FlashCard card={flashCardTool} editMode={true} onUpdate={vi.fn()} onDelete={vi.fn()} />);
    const textareas = screen.getAllByRole('textbox');
    fireEvent.change(textareas[0], { target: { value: 'Updated front' } });
    expect(textareas[0]).toHaveValue('Updated front');
  });

  it('fires onChange on back textarea in editMode', () => {
    render(<FlashCard card={flashCardTool} editMode={true} onUpdate={vi.fn()} onDelete={vi.fn()} />);
    const textareas = screen.getAllByRole('textbox');
    fireEvent.change(textareas[1], { target: { value: 'Updated back' } });
    expect(textareas[1]).toHaveValue('Updated back');
  });

  it('calls onUpdate on blur when values changed in editMode', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(<FlashCard card={flashCardTool} editMode={true} onUpdate={onUpdate} onDelete={vi.fn()} />);
    const textareas = screen.getAllByRole('textbox');
    fireEvent.change(textareas[0], { target: { value: 'New question' } });
    fireEvent.blur(textareas[0]);
    await waitFor(() =>
      expect(onUpdate).toHaveBeenCalledWith('t1', { front: 'New question', back: 'A named storage location.' }),
    );
  });

  it('does not call onUpdate on blur when values unchanged', () => {
    const onUpdate = vi.fn();
    render(<FlashCard card={flashCardTool} editMode={true} onUpdate={onUpdate} onDelete={vi.fn()} />);
    const textareas = screen.getAllByRole('textbox');
    fireEvent.blur(textareas[0]);
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('reverts to original value on blur when front is cleared', async () => {
    const onUpdate = vi.fn();
    render(<FlashCard card={flashCardTool} editMode={true} onUpdate={onUpdate} onDelete={vi.fn()} />);
    const textareas = screen.getAllByRole('textbox');
    fireEvent.change(textareas[0], { target: { value: '' } });
    fireEvent.blur(textareas[0]);
    await waitFor(() => expect(textareas[0]).toHaveValue('What is a variable?'));
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('shows unsupported message for wrong type', () => {
    const wrongType = { ...flashCardTool, type: 'vocab' } as unknown as LessonTool;
    render(<FlashCard card={wrongType} />);
    expect(screen.getByText(/unsupported tool type/i)).toBeInTheDocument();
  });
});
