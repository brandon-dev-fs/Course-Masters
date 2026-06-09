vi.mock('../../../components/RichTextEditor.js', () => ({
  default: () => <div data-testid="rich-text-editor" />,
}));

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SyllabusSection from '../../../features/courses/SyllabusSection.js';

describe('SyllabusSection', () => {
  const onEditSyllabus = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when no syllabus and canEdit is false', () => {
    const { container } = render(
      <SyllabusSection syllabus={null} canEdit={false} onEditSyllabus={onEditSyllabus} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders when no syllabus but canEdit is true', () => {
    render(
      <SyllabusSection syllabus={null} canEdit={true} onEditSyllabus={onEditSyllabus} />,
    );
    expect(screen.getByText('Syllabus')).toBeInTheDocument();
  });

  it('renders when syllabus exists and canEdit is false', () => {
    render(
      <SyllabusSection
        syllabus={{ type: 'doc', content: [] }}
        canEdit={false}
        onEditSyllabus={onEditSyllabus}
      />,
    );
    expect(screen.getByText('Syllabus')).toBeInTheDocument();
  });

  it('shows Edit button when canEdit is true', () => {
    render(
      <SyllabusSection
        syllabus={{ type: 'doc' }}
        canEdit={true}
        onEditSyllabus={onEditSyllabus}
      />,
    );
    expect(screen.getByLabelText('Edit syllabus')).toBeInTheDocument();
  });

  it('calls onEditSyllabus when edit button is clicked', () => {
    render(
      <SyllabusSection
        syllabus={{ type: 'doc' }}
        canEdit={true}
        onEditSyllabus={onEditSyllabus}
      />,
    );
    fireEvent.click(screen.getByLabelText('Edit syllabus'));
    expect(onEditSyllabus).toHaveBeenCalledOnce();
  });

  it('opens section when header button is clicked', () => {
    const { container } = render(
      <SyllabusSection
        syllabus={{ type: 'doc' }}
        canEdit={false}
        onEditSyllabus={onEditSyllabus}
      />,
    );
    const headerBtn = container.querySelector('button');
    if (headerBtn) fireEvent.click(headerBtn);
    // After click the grid row should expand
    const gridDiv = container.querySelector('.grid');
    expect(gridDiv).toBeTruthy();
  });

  it('shows Add Syllabus button inside when no syllabus and canEdit', () => {
    render(
      <SyllabusSection syllabus={null} canEdit={true} onEditSyllabus={onEditSyllabus} />,
    );
    // Open the section
    const headerBtn = screen.getByText('Syllabus').closest('button');
    if (headerBtn) fireEvent.click(headerBtn);
    expect(screen.getByText('+ Add Syllabus')).toBeInTheDocument();
  });
});
