import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LessonSettingsModal from '../../../features/lessons/LessonSettingsModal.js';
import type { Lesson } from '../../../api/types.js';

const mockLesson: Lesson = {
  id: 'l1',
  unitId: 'u1',
  title: 'Intro Lesson',
  description: 'A lesson description',
  order: 1,
  objective: '',
  planContent: {},
};

describe('LessonSettingsModal', () => {
  const onClose = vi.fn();
  const onUpdate = vi.fn().mockResolvedValue(undefined);
  const onDelete = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderModal() {
    return render(
      <MemoryRouter>
        <LessonSettingsModal
          lesson={mockLesson}
          onClose={onClose}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      </MemoryRouter>,
    );
  }

  it('renders Lesson Settings title', () => {
    renderModal();
    expect(screen.getByText('Lesson Settings')).toBeInTheDocument();
  });

  it('renders Delete Lesson button', () => {
    renderModal();
    expect(screen.getByText('Delete Lesson')).toBeInTheDocument();
  });

  it('shows Danger Zone section', () => {
    renderModal();
    expect(screen.getByText('Danger Zone')).toBeInTheDocument();
  });

  it('shows confirm dialog when Delete Lesson is clicked', () => {
    renderModal();
    fireEvent.click(screen.getByText('Delete Lesson'));
    expect(screen.getByText(/delete "intro lesson"/i)).toBeInTheDocument();
  });

  it('hides confirm dialog when cancel is clicked', () => {
    renderModal();
    fireEvent.click(screen.getByText('Delete Lesson'));
    const cancelBtn = screen.getAllByRole('button', { name: /cancel/i }).at(-1)!;
    fireEvent.click(cancelBtn);
    expect(screen.queryByText(/delete "intro lesson"/i)).not.toBeInTheDocument();
  });

  it('populates form with lesson data', () => {
    renderModal();
    expect(screen.getByDisplayValue('Intro Lesson')).toBeInTheDocument();
  });
});
