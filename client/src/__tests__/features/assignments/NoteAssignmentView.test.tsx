vi.mock('../../../components/RichTextEditor.js', () => ({
  default: ({ editable }: { editable: boolean }) => (
    <div data-testid="rich-text-editor" data-editable={String(editable)} />
  ),
}));

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import NoteAssignmentView from '../../../features/assignments/NoteAssignmentView.js';

describe('NoteAssignmentView', () => {
  it('renders the RichTextEditor', () => {
    render(<NoteAssignmentView content={{ type: 'doc', content: [] }} />);
    expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
  });

  it('renders RichTextEditor in read-only mode', () => {
    render(<NoteAssignmentView content={{ type: 'doc', content: [] }} />);
    expect(screen.getByTestId('rich-text-editor')).toHaveAttribute('data-editable', 'false');
  });
});
