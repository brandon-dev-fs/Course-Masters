vi.mock('../../../components/RichTextEditor.js', () => ({
  default: () => <div data-testid="rich-text-editor" />,
}));

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SyllabusViewModal from '../../../features/courses/SyllabusViewModal.js';

describe('SyllabusViewModal', () => {
  const onClose = vi.fn();
  const onEdit = vi.fn();
  const syllabus = { type: 'doc', content: [] };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Syllabus title', () => {
    render(
      <SyllabusViewModal syllabus={syllabus} canEdit={false} onClose={onClose} onEdit={onEdit} />,
    );
    expect(screen.getByText('Syllabus')).toBeInTheDocument();
  });

  it('renders rich text editor', () => {
    render(
      <SyllabusViewModal syllabus={syllabus} canEdit={false} onClose={onClose} onEdit={onEdit} />,
    );
    expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
  });

  it('shows Edit Syllabus button when canEdit is true', () => {
    render(
      <SyllabusViewModal syllabus={syllabus} canEdit={true} onClose={onClose} onEdit={onEdit} />,
    );
    expect(screen.getByText('Edit Syllabus')).toBeInTheDocument();
  });

  it('does not show Edit Syllabus button when canEdit is false', () => {
    render(
      <SyllabusViewModal syllabus={syllabus} canEdit={false} onClose={onClose} onEdit={onEdit} />,
    );
    expect(screen.queryByText('Edit Syllabus')).not.toBeInTheDocument();
  });

  it('calls onEdit when Edit Syllabus button is clicked', () => {
    render(
      <SyllabusViewModal syllabus={syllabus} canEdit={true} onClose={onClose} onEdit={onEdit} />,
    );
    fireEvent.click(screen.getByText('Edit Syllabus'));
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <SyllabusViewModal syllabus={syllabus} canEdit={false} onClose={onClose} onEdit={onEdit} />,
    );
    fireEvent.click(screen.getByLabelText(/close/i));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
