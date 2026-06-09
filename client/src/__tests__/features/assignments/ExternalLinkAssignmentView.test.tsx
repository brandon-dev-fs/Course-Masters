const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock('../../../api/client.js', () => ({ apiClient: apiClientMock }));

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ExternalLinkAssignmentView from '../../../features/assignments/ExternalLinkAssignmentView.js';

// jsdom stubs window.matchMedia to return matches: false (mobile) — so the component
// will render the fallback block showing the "cannot be embedded" message.

describe('ExternalLinkAssignmentView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the "Open in new tab" link with correct href', () => {
    render(<ExternalLinkAssignmentView url="https://example.com/article" assignmentId="a1" />);
    const links = screen.getAllByRole('link', { name: /open in new tab/i });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute('href', 'https://example.com/article');
  });

  it('renders the URL in the fallback block', () => {
    render(<ExternalLinkAssignmentView url="https://example.com/article" assignmentId="a1" />);
    expect(screen.getByText('https://example.com/article')).toBeInTheDocument();
  });

  it('shows estimated minutes when provided', () => {
    render(<ExternalLinkAssignmentView url="https://example.com" assignmentId="a1" estimatedMinutes={10} />);
    expect(screen.getByText(/10 min/i)).toBeInTheDocument();
  });

  it('does not show estimated minutes when null', () => {
    render(<ExternalLinkAssignmentView url="https://example.com" assignmentId="a1" estimatedMinutes={null} />);
    expect(screen.queryByText(/min/)).not.toBeInTheDocument();
  });

  it('shows description when provided', () => {
    render(<ExternalLinkAssignmentView url="https://example.com" assignmentId="a1" description="Read carefully." />);
    expect(screen.getByText('Read carefully.')).toBeInTheDocument();
  });

  it('does not show description when null', () => {
    render(<ExternalLinkAssignmentView url="https://example.com" assignmentId="a1" description={null} />);
    expect(screen.queryByText('Read carefully.')).not.toBeInTheDocument();
  });

  it('opens link in new tab', () => {
    render(<ExternalLinkAssignmentView url="https://example.com" assignmentId="a1" />);
    const links = screen.getAllByRole('link', { name: /open in new tab/i });
    expect(links[0]).toHaveAttribute('target', '_blank');
  });

  it('does not render BookmarkButton when isStudent is false', () => {
    render(<ExternalLinkAssignmentView url="https://example.com" assignmentId="a1" isStudent={false} onBookmarkChange={vi.fn()} />);
    expect(screen.queryByLabelText(/bookmark/i)).not.toBeInTheDocument();
  });
});
