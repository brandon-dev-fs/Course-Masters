import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import CourseHeader from '../../../features/courses/CourseHeader.js';
import type { Course } from '../../../api/types.js';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const mockCourse: Course = {
  id: 'course-1',
  title: 'Algebra Essentials',
  description: 'A course about algebra',
  authorId: 'user-1',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  author: { id: 'user-1', name: 'Teacher User' },
  units: [
    {
      id: 'unit-1',
      title: 'Unit 1',
      description: '',
      order: 1,
      courseId: 'course-1',
      lessons: [{ id: 'l1', title: 'L1', description: '', order: 1, unitId: 'unit-1', objective: '', planContent: {} }],
    },
    {
      id: 'unit-2',
      title: 'Unit 2',
      description: '',
      order: 2,
      courseId: 'course-1',
      lessons: [],
    },
  ],
};

function renderCourseHeader(props: Partial<Parameters<typeof CourseHeader>[0]> = {}) {
  const defaultProps = {
    course: mockCourse,
    courses: [mockCourse],
    canEdit: false,
    onOpenSettings: vi.fn(),
    onOpenCalendar: vi.fn(),
  };
  return render(
    <MemoryRouter>
      <CourseHeader {...defaultProps} {...props} />
    </MemoryRouter>,
  );
}

describe('CourseHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders course title', () => {
    renderCourseHeader();
    expect(screen.getByText('Algebra Essentials')).toBeInTheDocument();
  });

  it('renders teacher name in meta row', () => {
    renderCourseHeader();
    expect(screen.getByText('Teacher User')).toBeInTheDocument();
  });

  it('renders unit and lesson counts', () => {
    renderCourseHeader();
    expect(screen.getByText('2 units')).toBeInTheDocument();
    expect(screen.getByText('1 lesson')).toBeInTheDocument();
  });

  it('shows settings button when canEdit is true', () => {
    renderCourseHeader({ canEdit: true });
    expect(screen.getByRole('button', { name: /course settings/i })).toBeInTheDocument();
  });

  it('hides settings button when canEdit is false', () => {
    renderCourseHeader({ canEdit: false });
    expect(screen.queryByRole('button', { name: /course settings/i })).not.toBeInTheDocument();
  });

  it('calls onOpenSettings when settings button clicked', () => {
    const onOpenSettings = vi.fn();
    renderCourseHeader({ canEdit: true, onOpenSettings });
    fireEvent.click(screen.getByRole('button', { name: /course settings/i }));
    expect(onOpenSettings).toHaveBeenCalledOnce();
  });

  it('calls onOpenCalendar when calendar button clicked', () => {
    const onOpenCalendar = vi.fn();
    renderCourseHeader({ onOpenCalendar });
    fireEvent.click(screen.getByRole('button', { name: /open course calendar/i }));
    expect(onOpenCalendar).toHaveBeenCalledOnce();
  });
});
