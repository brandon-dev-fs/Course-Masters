import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PracticeProblemMetaFields from '../../../features/assignments/PracticeProblemMetaFields.js';

const defaultProps = {
  url: '',
  estimatedMinutes: '',
  passingPercentage: '',
  entries: [],
  noteContent: null,
  questions: [],
  fetchingVideoTitle: false,
  handleVideoUrlBlur: vi.fn(),
  onUrlChange: vi.fn(),
  onEstimatedMinutesChange: vi.fn(),
  onPassingPercentageChange: vi.fn(),
  onEntriesChange: vi.fn(),
  onNoteContentChange: vi.fn(),
  onQuestionsChange: vi.fn(),
};

describe('PracticeProblemMetaFields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders passing percentage input', () => {
    render(<PracticeProblemMetaFields {...defaultProps} />);
    expect(screen.getByPlaceholderText('e.g. 80')).toBeInTheDocument();
  });

  it('renders Passing percentage label', () => {
    render(<PracticeProblemMetaFields {...defaultProps} />);
    expect(screen.getByText('Passing percentage')).toBeInTheDocument();
  });

  it('calls onPassingPercentageChange when input changes', () => {
    render(<PracticeProblemMetaFields {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText('e.g. 80'), { target: { value: '75' } });
    expect(defaultProps.onPassingPercentageChange).toHaveBeenCalledWith('75');
  });

  it('shows error when invalid percentage is entered and blurred', () => {
    render(<PracticeProblemMetaFields {...defaultProps} passingPercentage="150" />);
    fireEvent.blur(screen.getByPlaceholderText('e.g. 80'));
    expect(screen.getByText('Must be between 0 and 100')).toBeInTheDocument();
  });

  it('does not show error when percentage is empty', () => {
    render(<PracticeProblemMetaFields {...defaultProps} passingPercentage="" />);
    fireEvent.blur(screen.getByPlaceholderText('e.g. 80'));
    expect(screen.queryByText('Must be between 0 and 100')).not.toBeInTheDocument();
  });

  it('does not show error before blur', () => {
    render(<PracticeProblemMetaFields {...defaultProps} passingPercentage="150" />);
    expect(screen.queryByText('Must be between 0 and 100')).not.toBeInTheDocument();
  });

  it('shows current value', () => {
    render(<PracticeProblemMetaFields {...defaultProps} passingPercentage="80" />);
    expect(screen.getByDisplayValue('80')).toBeInTheDocument();
  });
});
