vi.mock('../../../components/RichTextEditor.js', () => ({
  default: () => <div data-testid="rich-text-editor" />,
}));

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LessonAssignmentContent from '../../../features/lessons/LessonAssignmentContent.js';
import type { Assignment } from '../../../api/types.js';

const baseAssignment: Assignment = {
  id: 'a1',
  lessonId: 'l1',
  order: 1,
  title: 'My Assignment',
  objective: null,
  type: 'note',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  completed: false,
  bookmark: null,
  noteAssignment: null,
  videoAssignment: null,
  readingAssignment: null,
  vocabAssignment: null,
  practiceProblemAssignment: null,
  fileAssignment: null,
};

describe('LessonAssignmentContent', () => {
  const onToggle = vi.fn().mockResolvedValue(undefined);
  const onBookmarkChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders note assignment view', () => {
    const assignment: Assignment = {
      ...baseAssignment,
      type: 'note',
      noteAssignment: { id: 'na1', content: { type: 'doc', content: [] } },
    };
    render(<LessonAssignmentContent assignment={assignment} onToggleAssignmentCompletion={onToggle} onBookmarkChange={onBookmarkChange} isStudent={false} />);
    expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
  });

  it('renders video assignment view', () => {
    const assignment: Assignment = {
      ...baseAssignment,
      type: 'video',
      videoAssignment: { id: 'va1', url: 'https://www.youtube.com/watch?v=abc', title: 'Test Video' },
    };
    render(<LessonAssignmentContent assignment={assignment} onToggleAssignmentCompletion={onToggle} onBookmarkChange={onBookmarkChange} isStudent={false} />);
    expect(screen.getByText('Test Video')).toBeInTheDocument();
  });

  it('renders reading assignment view', () => {
    const assignment: Assignment = {
      ...baseAssignment,
      type: 'reading',
      readingAssignment: { id: 'ra1', url: 'https://example.com', description: 'Read this article', estimatedMinutes: 10 },
    };
    render(<LessonAssignmentContent assignment={assignment} onToggleAssignmentCompletion={onToggle} onBookmarkChange={onBookmarkChange} isStudent={false} />);
    expect(screen.getByText('Read this article')).toBeInTheDocument();
  });

  it('renders vocab assignment view', () => {
    const assignment: Assignment = {
      ...baseAssignment,
      type: 'vocab',
      vocabAssignment: {
        id: 'voca1',
        entries: [{ term: 'Variable', definition: 'A named storage' }],
      },
    };
    render(<LessonAssignmentContent assignment={assignment} onToggleAssignmentCompletion={onToggle} onBookmarkChange={onBookmarkChange} isStudent={false} />);
    expect(screen.getByText('Variable')).toBeInTheDocument();
  });

  it('renders null when assignment has no data', () => {
    const { container } = render(
      <LessonAssignmentContent assignment={baseAssignment} onToggleAssignmentCompletion={onToggle} onBookmarkChange={onBookmarkChange} isStudent={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders null for unknown assignment type', () => {
    const assignment = { ...baseAssignment, type: 'unknown' as 'note' };
    const { container } = render(
      <LessonAssignmentContent assignment={assignment} onToggleAssignmentCompletion={onToggle} onBookmarkChange={onBookmarkChange} isStudent={false} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
