import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import VideoCard from '../../../features/videos/VideoCard.js';
import type { LessonResource } from '../../../api/types.js';

const videoResource: LessonResource = {
  id: 'r1',
  type: 'video',
  title: 'Intro Video',
  content: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  order: 1,
  lessonId: 'l1',
  isRequired: false,
};

describe('VideoCard', () => {
  it('renders without crashing', () => {
    render(<VideoCard video={videoResource} />);
    expect(screen.getByText('Intro Video')).toBeInTheDocument();
  });

  it('shows the video title', () => {
    render(<VideoCard video={videoResource} />);
    expect(screen.getByText('Intro Video')).toBeInTheDocument();
  });

  it('shows edit/delete when handlers provided', () => {
    render(<VideoCard video={videoResource} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });

  it('shows completion checkbox when toggle handler provided', () => {
    render(
      <VideoCard
        video={videoResource}
        isComplete={false}
        onToggleComplete={vi.fn()}
      />,
    );
    expect(screen.getByText('Mark as complete')).toBeInTheDocument();
  });

  it('shows unsupported message for wrong type', () => {
    const wrongType = { ...videoResource, type: 'note' } as unknown as LessonResource;
    render(<VideoCard video={wrongType} />);
    expect(screen.getByText(/unsupported resource type/i)).toBeInTheDocument();
  });
});
