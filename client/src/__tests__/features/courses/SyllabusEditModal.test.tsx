vi.mock('../../../components/RichTextEditor.js', () => ({
  default: () => <div data-testid="rich-text-editor" />,
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SyllabusEditModal from '../../../features/courses/SyllabusEditModal.js';
import type { Course } from '../../../api/types.js';

const mockCourse: Course = {
  id: 'c1',
  title: 'My Course',
  description: 'Description',
  authorId: 'u1',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('SyllabusEditModal', () => {
  const onClose = vi.fn();
  const onUpdateCourse = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderModal(course = mockCourse) {
    return render(
      <MemoryRouter>
        <SyllabusEditModal course={course} onClose={onClose} onUpdateCourse={onUpdateCourse} />
      </MemoryRouter>,
    );
  }

  it('renders Edit Syllabus title', () => {
    renderModal();
    expect(screen.getByText('Edit Syllabus')).toBeInTheDocument();
  });

  it('renders rich text editor', () => {
    renderModal();
    expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
  });

  it('renders Cancel button', () => {
    renderModal();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders Save Syllabus button', () => {
    renderModal();
    expect(screen.getByText('Save Syllabus')).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', () => {
    renderModal();
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onUpdateCourse and onClose when Save Syllabus is clicked', async () => {
    renderModal();
    fireEvent.click(screen.getByText('Save Syllabus'));
    await waitFor(() => expect(onUpdateCourse).toHaveBeenCalledOnce());
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('passes course data to onUpdateCourse', async () => {
    renderModal();
    fireEvent.click(screen.getByText('Save Syllabus'));
    await waitFor(() => expect(onUpdateCourse).toHaveBeenCalledWith({
      title: 'My Course',
      description: 'Description',
      syllabus: null,
    }));
  });
});
