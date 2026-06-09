import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VocabAssignmentForm from '../../../features/assignments/VocabAssignmentForm.js';
import type { VocabEntry } from '../../../api/types.js';

const sampleEntries: VocabEntry[] = [
  { term: 'Variable', definition: 'A named storage location' },
  { term: 'Function', definition: 'A reusable block of code' },
];

const defaultProps = {
  url: '',
  displayTitle: '',
  description: '',
  estimatedMinutes: '',
  entries: sampleEntries,
  onUrlChange: vi.fn(),
  onDisplayTitleChange: vi.fn(),
  onDescriptionChange: vi.fn(),
  onEstimatedMinutesChange: vi.fn(),
  onEntriesChange: vi.fn(),
};

describe('VocabAssignmentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders entry inputs', () => {
    render(<VocabAssignmentForm {...defaultProps} />);
    expect(screen.getByDisplayValue('Variable')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Function')).toBeInTheDocument();
  });

  it('renders Add term button', () => {
    render(<VocabAssignmentForm {...defaultProps} />);
    expect(screen.getByText('Add term')).toBeInTheDocument();
  });

  it('calls onEntriesChange with new entry when Add term is clicked', () => {
    render(<VocabAssignmentForm {...defaultProps} />);
    fireEvent.click(screen.getByText('Add term'));
    expect(defaultProps.onEntriesChange).toHaveBeenCalledWith([
      ...sampleEntries,
      { term: '', definition: '', example: '' },
    ]);
  });

  it('calls onEntriesChange when entry is removed', () => {
    render(<VocabAssignmentForm {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Remove term 1'));
    expect(defaultProps.onEntriesChange).toHaveBeenCalledWith([sampleEntries[1]]);
  });

  it('shows move up button disabled for first entry', () => {
    render(<VocabAssignmentForm {...defaultProps} />);
    expect(screen.getByLabelText('Move term 1 up')).toBeDisabled();
  });

  it('shows move down button disabled for last entry', () => {
    render(<VocabAssignmentForm {...defaultProps} />);
    expect(screen.getByLabelText('Move term 2 down')).toBeDisabled();
  });

  it('shows move up/down buttons enabled for middle entries', () => {
    const threeEntries = [...sampleEntries, { term: 'Loop', definition: 'Repeating code' }];
    render(<VocabAssignmentForm {...defaultProps} entries={threeEntries} />);
    expect(screen.getByLabelText('Move term 2 up')).not.toBeDisabled();
    expect(screen.getByLabelText('Move term 2 down')).not.toBeDisabled();
  });

  it('calls onEntriesChange when move up is clicked', () => {
    render(<VocabAssignmentForm {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Move term 2 up'));
    expect(defaultProps.onEntriesChange).toHaveBeenCalledWith([sampleEntries[1], sampleEntries[0]]);
  });

  it('shows error when no valid entry exists', () => {
    render(<VocabAssignmentForm {...defaultProps} entries={[{ term: '', definition: '' }]} />);
    expect(screen.getByText(/at least one term/i)).toBeInTheDocument();
  });

  it('does not show error when valid entries exist', () => {
    render(<VocabAssignmentForm {...defaultProps} />);
    expect(screen.queryByText(/at least one term/i)).not.toBeInTheDocument();
  });
});
