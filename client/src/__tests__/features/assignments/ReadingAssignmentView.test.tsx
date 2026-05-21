import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReadingAssignmentView from '../../../features/assignments/ReadingAssignmentView.js';

describe('ReadingAssignmentView', () => {
  it('renders the URL as a link', () => {
    render(<ReadingAssignmentView url="https://example.com/article" />);
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.com/article');
  });

  it('shows the URL text', () => {
    render(<ReadingAssignmentView url="https://example.com/article" />);
    expect(screen.getByText('https://example.com/article')).toBeInTheDocument();
  });

  it('shows estimated minutes when provided', () => {
    render(<ReadingAssignmentView url="https://example.com" estimatedMinutes={10} />);
    expect(screen.getByText(/10 min read/i)).toBeInTheDocument();
  });

  it('does not show estimated minutes when null', () => {
    render(<ReadingAssignmentView url="https://example.com" estimatedMinutes={null} />);
    expect(screen.queryByText(/min read/i)).not.toBeInTheDocument();
  });

  it('shows description when provided', () => {
    render(<ReadingAssignmentView url="https://example.com" description="Read carefully." />);
    expect(screen.getByText('Read carefully.')).toBeInTheDocument();
  });

  it('does not show description when null', () => {
    render(<ReadingAssignmentView url="https://example.com" description={null} />);
    expect(screen.queryByText('Read carefully.')).not.toBeInTheDocument();
  });

  it('opens link in new tab', () => {
    render(<ReadingAssignmentView url="https://example.com" />);
    expect(screen.getByRole('link')).toHaveAttribute('target', '_blank');
  });
});
