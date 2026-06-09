import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import VideoAssignmentView from '../../../features/assignments/VideoAssignmentView.js';

describe('VideoAssignmentView', () => {
  it('renders iframe for valid YouTube URL', () => {
    render(<VideoAssignmentView url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" title="Test Video" />);
    expect(screen.getByTitle('Test Video')).toBeInTheDocument();
  });

  it('renders default title when no title provided', () => {
    render(<VideoAssignmentView url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />);
    expect(screen.getByTitle('Video')).toBeInTheDocument();
  });

  it('shows title text when title is provided', () => {
    render(<VideoAssignmentView url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" title="My Video Title" />);
    expect(screen.getByText('My Video Title')).toBeInTheDocument();
  });

  it('shows error message for invalid URL', () => {
    render(<VideoAssignmentView url="https://example.com/not-youtube" />);
    expect(screen.getByText(/unable to embed/i)).toBeInTheDocument();
  });

  it('does not show title text when title is null', () => {
    render(<VideoAssignmentView url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" title={null} />);
    expect(screen.queryByText('My Video Title')).not.toBeInTheDocument();
  });
});
