import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import ExternalLinkAssignmentForm from '../../../features/assignments/ExternalLinkAssignmentForm.js';

vi.mock('../../../api/link.js', () => ({
  linkApi: {
    checkEmbed: vi.fn().mockResolvedValue({ canEmbed: true }),
  },
}));

const defaultProps = {
  url: '',
  estimatedMinutes: '',
  entries: [],
  noteContent: null,
  passingPercentage: '',
  questions: [],
  fetchingVideoTitle: false,
  handleVideoUrlBlur: vi.fn(),
  onUrlChange: vi.fn(),
  onEstimatedMinutesChange: vi.fn(),
  onEntriesChange: vi.fn(),
  onNoteContentChange: vi.fn(),
  onPassingPercentageChange: vi.fn(),
  onQuestionsChange: vi.fn(),
};

describe('ExternalLinkAssignmentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders URL input', () => {
    render(<ExternalLinkAssignmentForm {...defaultProps} />);
    expect(screen.getByLabelText(/^URL$/i)).toBeInTheDocument();
  });

  it('renders Estimated reading time input', () => {
    render(<ExternalLinkAssignmentForm {...defaultProps} />);
    expect(screen.getByLabelText(/estimated reading time/i)).toBeInTheDocument();
  });

  it('does not render a description field', () => {
    render(<ExternalLinkAssignmentForm {...defaultProps} />);
    expect(screen.queryByLabelText(/description/i)).not.toBeInTheDocument();
  });

  it('calls onUrlChange when URL input changes', () => {
    render(<ExternalLinkAssignmentForm {...defaultProps} />);
    fireEvent.change(screen.getByLabelText(/^URL$/i), { target: { value: 'https://example.com' } });
    expect(defaultProps.onUrlChange).toHaveBeenCalledWith('https://example.com');
  });

  it('shows URL required error after blur when empty', () => {
    render(<ExternalLinkAssignmentForm {...defaultProps} />);
    fireEvent.blur(screen.getByLabelText(/^URL$/i));
    expect(screen.getByText('URL is required')).toBeInTheDocument();
  });

  it('does not show URL error before blur', () => {
    render(<ExternalLinkAssignmentForm {...defaultProps} />);
    expect(screen.queryByText('URL is required')).not.toBeInTheDocument();
  });

  it('shows URL value from props', () => {
    render(<ExternalLinkAssignmentForm {...defaultProps} url="https://example.com" />);
    expect(screen.getByDisplayValue('https://example.com')).toBeInTheDocument();
  });

  it('shows "can be embedded" badge after blur with valid URL', async () => {
    const { linkApi } = await import('../../../api/link.js');
    vi.mocked(linkApi.checkEmbed).mockResolvedValueOnce({ canEmbed: true });

    render(<ExternalLinkAssignmentForm {...defaultProps} url="https://example.com" />);
    fireEvent.blur(screen.getByLabelText(/^URL$/i));

    await waitFor(() => {
      expect(screen.getByText(/can be embedded/i)).toBeInTheDocument();
    });
  });

  it('shows "cannot embed" badge when server says false', async () => {
    const { linkApi } = await import('../../../api/link.js');
    vi.mocked(linkApi.checkEmbed).mockResolvedValueOnce({ canEmbed: false });

    render(<ExternalLinkAssignmentForm {...defaultProps} url="https://wikipedia.org" />);
    fireEvent.blur(screen.getByLabelText(/^URL$/i));

    await waitFor(() => {
      expect(screen.getByText(/cannot embed/i)).toBeInTheDocument();
    });
  });
});
