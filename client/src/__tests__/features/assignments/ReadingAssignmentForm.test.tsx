import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReadingAssignmentForm from '../../../features/assignments/ReadingAssignmentForm.js';

const defaultProps = {
  url: '',
  displayTitle: '',
  description: '',
  estimatedMinutes: '',
  entries: [],
  onUrlChange: vi.fn(),
  onDisplayTitleChange: vi.fn(),
  onDescriptionChange: vi.fn(),
  onEstimatedMinutesChange: vi.fn(),
  onEntriesChange: vi.fn(),
};

describe('ReadingAssignmentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders URL input', () => {
    render(<ReadingAssignmentForm {...defaultProps} />);
    expect(screen.getByLabelText(/^URL$/i)).toBeInTheDocument();
  });

  it('renders Description textarea', () => {
    render(<ReadingAssignmentForm {...defaultProps} />);
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('renders Estimated reading time input', () => {
    render(<ReadingAssignmentForm {...defaultProps} />);
    expect(screen.getByLabelText(/estimated reading time/i)).toBeInTheDocument();
  });

  it('calls onUrlChange when URL input changes', () => {
    render(<ReadingAssignmentForm {...defaultProps} />);
    fireEvent.change(screen.getByLabelText(/^URL$/i), { target: { value: 'https://example.com' } });
    expect(defaultProps.onUrlChange).toHaveBeenCalledWith('https://example.com');
  });

  it('shows URL required error after blur when empty', () => {
    render(<ReadingAssignmentForm {...defaultProps} />);
    fireEvent.blur(screen.getByLabelText(/^URL$/i));
    expect(screen.getByText('URL is required')).toBeInTheDocument();
  });

  it('does not show URL error before blur', () => {
    render(<ReadingAssignmentForm {...defaultProps} />);
    expect(screen.queryByText('URL is required')).not.toBeInTheDocument();
  });

  it('shows URL value from props', () => {
    render(<ReadingAssignmentForm {...defaultProps} url="https://example.com" />);
    expect(screen.getByDisplayValue('https://example.com')).toBeInTheDocument();
  });
});
