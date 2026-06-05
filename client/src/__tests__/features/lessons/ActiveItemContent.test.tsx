vi.mock('../../../components/RichTextEditor.js', () => ({
  default: () => <div data-testid="rich-text-editor" />,
}));

const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock('../../../api/client.js', () => ({ apiClient: apiClientMock }));

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ActiveItemContent from '../../../features/lessons/ActiveItemContent.js';
import type { AssignmentItem } from '../../../features/lessons/AssignmentSection.js';
import type { Lesson, LessonResource, LessonTool, Assignment } from '../../../api/types.js';

const mockLesson: Lesson = {
  id: 'l1',
  unitId: 'u1',
  title: 'Intro Lesson',
  description: 'A lesson',
  order: 1,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  objective: 'Learn basics',
};

const videoResource: LessonResource = {
  id: 'r1',
  lessonId: 'l1',
  type: 'video',
  title: 'Intro Video',
  order: 1,
  isRequired: false,
  content: { url: 'https://www.youtube.com/watch?v=test' },
};

const flashCardTool: LessonTool = {
  id: 't1',
  lessonId: 'l1',
  type: 'flash_card',
  title: 'Flash Card',
  order: 1,
  isRequired: false,
  content: { front: 'Q?', back: 'A!' },
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
  resources: [videoResource],
  tools: [flashCardTool],
  assignments: [noteAssignment],
  canEdit: false,
  editingVideoId: null,
  newNoteIdRef: React.createRef<string | null>(),
  onVideoEditStart: vi.fn(),
  onVideoEditCancel: vi.fn(),
  onVideoUpdated: vi.fn(),
  onVideoDeleted: vi.fn(),
  onNoteUpdated: vi.fn(),
  onEditTool: vi.fn(),
  onToolDeleted: vi.fn(),
  onToolUpdated: vi.fn(),
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
    const item: AssignmentItem = { key: 'lessonPlan', kind: 'lessonPlan', id: null, title: 'Lesson Plan', isRequired: false, order: 0 };
    render(
      <MemoryRouter>
        <ActiveItemContent {...defaultProps} item={item} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Learn basics')).toBeInTheDocument();
  });

  it('renders resource content for resource kind', () => {
    const item: AssignmentItem = { key: 'r1', kind: 'resource', id: 'r1', title: 'Intro Video', isRequired: false, order: 1, resourceType: 'video' };
    render(
      <MemoryRouter>
        <ActiveItemContent {...defaultProps} item={item} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Intro Video')).toBeInTheDocument();
  });

  it('renders tool content for tool kind', () => {
    const item: AssignmentItem = { key: 't1', kind: 'tool', id: 't1', title: 'Flash Card', isRequired: false, order: 1, toolType: 'flash_card' };
    render(
      <MemoryRouter>
        <ActiveItemContent {...defaultProps} item={item} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Q?')).toBeInTheDocument();
  });

  it('renders assignment content for assignment kind', () => {
    const item: AssignmentItem = { key: 'a1', kind: 'assignment', id: 'a1', title: 'Note Assignment', isRequired: false, order: 1, assignmentType: 'note' };
    render(
      <MemoryRouter>
        <ActiveItemContent {...defaultProps} item={item} />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
  });

  it('returns null when resource id not found', () => {
    const item: AssignmentItem = { key: 'r999', kind: 'resource', id: 'r999', title: 'Missing', isRequired: false, order: 1 };
    const { container } = render(
      <MemoryRouter>
        <ActiveItemContent {...defaultProps} item={item} />
      </MemoryRouter>,
    );
    expect(container.firstChild).toBeNull();
  });

  it('returns null when tool id not found', () => {
    const item: AssignmentItem = { key: 't999', kind: 'tool', id: 't999', title: 'Missing', isRequired: false, order: 1 };
    const { container } = render(
      <MemoryRouter>
        <ActiveItemContent {...defaultProps} item={item} />
      </MemoryRouter>,
    );
    expect(container.firstChild).toBeNull();
  });
});
