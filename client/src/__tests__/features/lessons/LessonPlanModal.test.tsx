vi.mock('../../../components/RichTextEditor.js', () => ({
  default: () => <div data-testid="rich-text-editor" />,
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LessonPlanModal from '../../../features/lessons/LessonPlanModal.js';
import type { Lesson } from '../../../api/types.js';

const mockLesson: Lesson = {
  id: 'l1',
  unitId: 'u1',
  title: 'Intro Lesson',
  description: 'A lesson',
  order: 1,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  objective: 'Learn the basics',
};

describe('LessonPlanModal', () => {
  const onClose = vi.fn();
  const onUpdate = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderModal(lesson = mockLesson) {
    return render(
      <MemoryRouter>
        <LessonPlanModal lesson={lesson} onClose={onClose} onUpdate={onUpdate} />
      </MemoryRouter>,
    );
  }

  it('renders Edit Lesson Plan title', () => {
    renderModal();
    expect(screen.getByText('Edit Lesson Plan')).toBeInTheDocument();
  });

  it('renders rich text editor', () => {
    renderModal();
    expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
  });

  it('renders objective text area with existing value', () => {
    renderModal();
    expect(screen.getByDisplayValue('Learn the basics')).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', () => {
    renderModal();
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onUpdate with lesson data when Save Plan is clicked', async () => {
    renderModal();
    fireEvent.click(screen.getByText('Save Plan'));
    await waitFor(() => expect(onUpdate).toHaveBeenCalledOnce());
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Intro Lesson',
        order: 1,
        objective: 'Learn the basics',
      }),
    );
  });

  it('renders Save Plan button', () => {
    renderModal();
    expect(screen.getByText('Save Plan')).toBeInTheDocument();
  });

  it('renders empty objective when lesson has no objective', () => {
    const lessonWithoutObjective = { ...mockLesson, objective: undefined };
    renderModal(lessonWithoutObjective);
    const textarea = screen.getByPlaceholderText(/what will students learn/i);
    expect(textarea).toHaveValue('');
  });
});
