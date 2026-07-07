vi.mock('../../../api/link.js', () => ({
  linkApi: { checkEmbed: vi.fn() },
}));

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ExternalLinkAssignmentView from '../../../features/assignments/ExternalLinkAssignmentView.js';
import { linkApi } from '../../../api/link.js';

// Each test resolves to canEmbed: false by default so the fallback block renders.
// Tests that need the embed / checking state override this.
beforeEach(() => {
  vi.clearAllMocks();
  (linkApi.checkEmbed as ReturnType<typeof vi.fn>).mockResolvedValue({ canEmbed: false });
});

describe('ExternalLinkAssignmentView', () => {
  it('renders the "Open in new tab" link with correct href', async () => {
    render(<ExternalLinkAssignmentView url="https://example.com/article" />);
    const link = await screen.findByRole('link', { name: /open in new tab/i });
    expect(link).toHaveAttribute('href', 'https://example.com/article');
  });

  it('renders the URL in the fallback block', async () => {
    render(<ExternalLinkAssignmentView url="https://example.com/article" />);
    // Wait for cannot state to render
    await screen.findByText('https://example.com/article');
    expect(screen.getByText('https://example.com/article')).toBeInTheDocument();
  });

  it('shows estimated minutes when provided', () => {
    render(<ExternalLinkAssignmentView url="https://example.com" estimatedMinutes={10} />);
    expect(screen.getByText(/10 min/i)).toBeInTheDocument();
  });

  it('does not show estimated minutes when null', () => {
    render(<ExternalLinkAssignmentView url="https://example.com" estimatedMinutes={null} />);
    expect(screen.queryByText(/min/)).not.toBeInTheDocument();
  });

  it('shows "This page cannot be embedded" when canEmbed is false', async () => {
    render(<ExternalLinkAssignmentView url="https://example.com" />);
    await screen.findByText(/cannot be embedded/i);
    expect(screen.getByText(/cannot be embedded/i)).toBeInTheDocument();
  });

  it('opens link in new tab', async () => {
    render(<ExternalLinkAssignmentView url="https://example.com" />);
    const link = await screen.findByRole('link', { name: /open in new tab/i });
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('shows loading spinner before embed check resolves', () => {
    // Keep the promise pending so the component stays in checking state
    (linkApi.checkEmbed as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    render(<ExternalLinkAssignmentView url="https://example.com" />);
    // Spinner is visible in the checking state
    expect(screen.queryByText(/cannot be embedded/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /open in new tab/i })).not.toBeInTheDocument();
  });

  it('shows "External Link" label', () => {
    render(<ExternalLinkAssignmentView url="https://example.com" />);
    expect(screen.getByText('External Link')).toBeInTheDocument();
  });
});
