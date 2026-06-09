vi.mock('../../../components/RichTextEditor.js', () => ({
  default: ({ onChange }: { onChange?: (v: unknown) => void }) => (
    <div data-testid="rich-text-editor" onClick={() => onChange?.({ type: 'doc' })} />
  ),
}));

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NoteAssignmentForm from '../../../features/assignments/NoteAssignmentForm.js';

const defaultProps = {
  url: '',
  displayTitle: '',
  description: '',
  estimatedMinutes: '',
  passingPercentage: '',
  entries: [],
  questions: [],
  noteContent: { type: 'doc', content: [] },
  onUrlChange: vi.fn(),
  onDisplayTitleChange: vi.fn(),
  onDescriptionChange: vi.fn(),
  onEstimatedMinutesChange: vi.fn(),
  onPassingPercentageChange: vi.fn(),
  onEntriesChange: vi.fn(),
  onQuestionsChange: vi.fn(),
  onNoteContentChange: vi.fn(),
};

describe('NoteAssignmentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders rich text editor', () => {
    render(<NoteAssignmentForm {...defaultProps} />);
    expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
  });

  it('renders Content label', () => {
    render(<NoteAssignmentForm {...defaultProps} />);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('calls onNoteContentChange when editor changes', () => {
    render(<NoteAssignmentForm {...defaultProps} />);
    fireEvent.click(screen.getByTestId('rich-text-editor'));
    expect(defaultProps.onNoteContentChange).toHaveBeenCalledWith({ type: 'doc' });
  });
});
