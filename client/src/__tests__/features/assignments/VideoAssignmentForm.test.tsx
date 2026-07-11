import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VideoAssignmentForm from '../../../features/assignments/VideoAssignmentForm.js';
import type { SubFormProps } from '../../../features/assignments/AssignmentFormModal.js';

function makeProps(overrides: Partial<SubFormProps> = {}): SubFormProps {
  return {
    url: '',
    onUrlChange: vi.fn(),
    fetchingVideoTitle: false,
    handleVideoUrlBlur: vi.fn().mockResolvedValue(undefined),
    // Unused by VideoAssignmentForm but required by the interface
    noteContent: null,
    estimatedMinutes: '',
    passingPercentage: '',
    entries: [],
    questions: [],
    onNoteContentChange: vi.fn(),
    onEstimatedMinutesChange: vi.fn(),
    onPassingPercentageChange: vi.fn(),
    onEntriesChange: vi.fn(),
    onQuestionsChange: vi.fn(),
    ...overrides,
  };
}

describe('VideoAssignmentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the YouTube URL input', () => {
    render(<VideoAssignmentForm {...makeProps()} />);
    expect(screen.getByLabelText(/youtube url/i)).toBeInTheDocument();
  });

  it('reflects url prop value in the input', () => {
    render(<VideoAssignmentForm {...makeProps({ url: 'https://youtu.be/abc' })} />);
    expect(screen.getByLabelText(/youtube url/i)).toHaveValue('https://youtu.be/abc');
  });

  it('calls onUrlChange when text is typed', () => {
    const onUrlChange = vi.fn();
    render(<VideoAssignmentForm {...makeProps({ onUrlChange })} />);
    fireEvent.change(screen.getByLabelText(/youtube url/i), { target: { value: 'https://www.youtube.com/watch?v=123' } });
    expect(onUrlChange).toHaveBeenCalledWith('https://www.youtube.com/watch?v=123');
  });

  it('shows spinner when fetchingVideoTitle is true', () => {
    const { container } = render(<VideoAssignmentForm {...makeProps({ fetchingVideoTitle: true })} />);
    // Loader2 renders as an SVG — check for the "Fetching" text and disabled input
    expect(screen.getByText(/fetching video title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/youtube url/i)).toBeDisabled();
  });

  it('does not show spinner or fetching text when fetchingVideoTitle is false', () => {
    render(<VideoAssignmentForm {...makeProps({ fetchingVideoTitle: false })} />);
    expect(screen.queryByText(/fetching video title/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/youtube url/i)).not.toBeDisabled();
  });

  it('shows validation error after blur when url is empty', async () => {
    const handleVideoUrlBlur = vi.fn().mockResolvedValue(undefined);
    render(<VideoAssignmentForm {...makeProps({ url: '', handleVideoUrlBlur })} />);
    fireEvent.blur(screen.getByLabelText(/youtube url/i));
    await waitFor(() => {
      expect(screen.getByText(/url is required/i)).toBeInTheDocument();
    });
    expect(handleVideoUrlBlur).toHaveBeenCalledOnce();
  });

  it('does not show validation error before the field is touched', () => {
    render(<VideoAssignmentForm {...makeProps({ url: '' })} />);
    expect(screen.queryByText(/url is required/i)).not.toBeInTheDocument();
  });

  it('does not show validation error after blur when url has a value', async () => {
    render(<VideoAssignmentForm {...makeProps({ url: 'https://youtu.be/abc' })} />);
    fireEvent.blur(screen.getByLabelText(/youtube url/i));
    await waitFor(() => {
      expect(screen.queryByText(/url is required/i)).not.toBeInTheDocument();
    });
  });
});
