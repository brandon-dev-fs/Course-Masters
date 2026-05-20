import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import CourseSettingsModal from '../../../features/courses/CourseSettingsModal.js';
import type { Course } from '../../../api/types.js';

const mockCourse: Course = {
  id: 'c1',
  title: 'My Course',
  description: 'Course description',
  authorId: 'u1',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('CourseSettingsModal', () => {
  const onClose = vi.fn();
  const onUpdateCourse = vi.fn().mockResolvedValue(undefined);
  const onDeleteCourse = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderModal() {
    return render(
      <MemoryRouter>
        <CourseSettingsModal
          course={mockCourse}
          onClose={onClose}
          onUpdateCourse={onUpdateCourse}
          onDeleteCourse={onDeleteCourse}
        />
      </MemoryRouter>,
    );
  }

  it('renders Course Settings title', () => {
    renderModal();
    expect(screen.getByText('Course Settings')).toBeInTheDocument();
  });

  it('renders Delete Course button', () => {
    renderModal();
    expect(screen.getByText('Delete Course')).toBeInTheDocument();
  });

  it('shows confirm dialog when Delete Course is clicked', () => {
    renderModal();
    fireEvent.click(screen.getByText('Delete Course'));
    expect(screen.getByText(/delete "my course"/i)).toBeInTheDocument();
  });

  it('hides confirm dialog when cancel is clicked', () => {
    renderModal();
    fireEvent.click(screen.getByText('Delete Course'));
    const cancelBtn = screen.getAllByRole('button', { name: /cancel/i }).at(-1)!;
    fireEvent.click(cancelBtn);
    expect(screen.queryByText(/delete "my course"/i)).not.toBeInTheDocument();
  });

  it('calls onClose when modal close is triggered', () => {
    renderModal();
    // The modal has a close button (X)
    const closeBtn = screen.getByLabelText(/close/i);
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('populates form with course data', () => {
    renderModal();
    const titleInput = screen.getByDisplayValue('My Course');
    expect(titleInput).toBeInTheDocument();
  });
});
