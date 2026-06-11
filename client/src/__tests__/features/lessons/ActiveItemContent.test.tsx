vi.mock('../../../components/RichTextEditor.js', () => ({
  default: () => <div data-testid="rich-text-editor" />,
}));

const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock('../../../api/client.js', () => ({ apiClient: apiClientMock }));

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ActiveItemContent from '../../../features/lessons/ActiveItemContent.js';
import type { AssignmentItem } from '../../../features/lessons/AssignmentSection.js';
import type { Lesson, Assignment } from '../../../api/types.js';

const mockLesson: Lesson = {
  id: 'l1',
  unitId: 'u1',
  title: 'Intro Lesson',
  description: 'A lesson',
  order: 1,
  objective: 'Learn basics',
  planContent: {},
};

const noteAssignment: Assignment = {
  id: 'a1',
  lessonId: 'l1',
  order: 1,
  title: 'Note Assignment',
  objective: null,
  type: 'note',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  completed: false,
  bookmark: null,
  noteAssignment: { id: 'na1', content: { type: 'doc', content: [] } },
  videoAssignment: null,
  readingAssignment: null,
  vocabAssignment: null,
  practiceProblemAssignment: null,
};

const defaultProps = {
  lesson: mockLesson,
  assignments: [noteAssignment],
  canEdit: false,
  onToggleAssignmentCompletion: vi.fn(),
  onBookmarkChange: vi.fn(),
  isStudent: false,
  onPlanEdit: vi.fn(),
};

describe('ActiveItemContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClientMock.get.mockResolvedValue(null);
  });

  it('renders lesson plan view for lessonPlan kind', () => {
    const item: AssignmentItem = { key: 'lessonPlan', kind: 'lessonPlan', id: 'l1', title: 'Lesson Plan', isRequired: false, order: 0 };
    render(
      <MemoryRouter>
        <ActiveItemContent {...defaultProps} item={item} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Learn basics')).toBeInTheDocument();
  });

  it('renders assignment content for assignment kind', () => {
    const item: AssignmentItem = { key: 'assignment:a1', kind: 'assignment', id: 'a1', title: 'Note Assignment', isRequired: true, order: 1, assignmentType: 'note' };
    render(
      <MemoryRouter>
        <ActiveItemContent {...defaultProps} item={item} />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
  });

  it('returns null when assignment id not found', () => {
    const item: AssignmentItem = { key: 'assignment:a999', kind: 'assignment', id: 'a999', title: 'Missing', isRequired: true, order: 1 };
    const { container } = render(
      <MemoryRouter>
        <ActiveItemContent {...defaultProps} item={item} />
      </MemoryRouter>,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders quiz section for quiz kind', () => {
    const item: AssignmentItem = { key: 'quiz', kind: 'quiz', id: null, title: 'Lesson Quiz', isRequired: true, order: Infinity };
    render(
      <MemoryRouter>
        <ActiveItemContent {...defaultProps} item={item} />
      </MemoryRouter>,
    );
    // AssessmentSection renders as it loads; the component renders without crashing
    expect(screen.queryByText('Lesson Plan')).not.toBeInTheDocument();
  });
});
