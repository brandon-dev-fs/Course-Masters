import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import CourseCard from '../../../features/courses/CourseCard.js';
import type { Course } from '../../../api/types.js';

const course: Course = {
  id: 'c1',
  title: 'Intro to Python',
  description: 'Learn Python basics',
  authorId: 'u1',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  _count: { units: 3 },
};

describe('CourseCard', () => {
  const onEdit = vi.fn();
  const onDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <CourseCard course={course} onEdit={onEdit} onDelete={onDelete} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Intro to Python')).toBeInTheDocument();
  });

  it('shows the course description', () => {
    render(
      <MemoryRouter>
        <CourseCard course={course} onEdit={onEdit} onDelete={onDelete} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Learn Python basics')).toBeInTheDocument();
  });

  it('shows unit count', () => {
    render(
      <MemoryRouter>
        <CourseCard course={course} onEdit={onEdit} onDelete={onDelete} />
      </MemoryRouter>,
    );
    expect(screen.getByText('3 units')).toBeInTheDocument();
  });

  it('shows course options menu button when canEdit is true', () => {
    render(
      <MemoryRouter>
        <CourseCard course={course} canEdit={true} onEdit={onEdit} onDelete={onDelete} />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText('Course options')).toBeInTheDocument();
  });

  it('does not show course options menu button when canEdit is false', () => {
    render(
      <MemoryRouter>
        <CourseCard course={course} canEdit={false} onEdit={onEdit} onDelete={onDelete} />
      </MemoryRouter>,
    );
    expect(screen.queryByLabelText('Course options')).not.toBeInTheDocument();
  });

  it('opens the dropdown menu when the options button is clicked', () => {
    render(
      <MemoryRouter>
        <CourseCard course={course} canEdit={true} onEdit={onEdit} onDelete={onDelete} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByLabelText('Course options'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('calls onEdit when Edit Course menu item is clicked', () => {
    render(
      <MemoryRouter>
        <CourseCard course={course} canEdit={true} onEdit={onEdit} onDelete={onDelete} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByLabelText('Course options'));
    fireEvent.click(screen.getByText('Edit Course'));
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it('renders without crashing when index is not provided (defaults to 0)', () => {
    render(
      <MemoryRouter>
        <CourseCard course={course} onEdit={onEdit} onDelete={onDelete} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Intro to Python')).toBeInTheDocument();
  });

  it('applies different color variants based on index', () => {
    const { rerender } = render(
      <MemoryRouter>
        <CourseCard course={course} index={0} onEdit={onEdit} onDelete={onDelete} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Intro to Python')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <CourseCard course={course} index={1} onEdit={onEdit} onDelete={onDelete} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Intro to Python')).toBeInTheDocument();
  });
});
