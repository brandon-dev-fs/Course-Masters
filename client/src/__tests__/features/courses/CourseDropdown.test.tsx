import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import CourseDropdown from '../../../features/courses/CourseDropdown.js';
import type { Course } from '../../../api/types.js';

const courses: Course[] = [
  { id: 'c1', title: 'Course A', description: '', authorId: 'u1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'c2', title: 'Course B', description: '', authorId: 'u1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
];

describe('CourseDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders current course title', () => {
    render(
      <MemoryRouter>
        <CourseDropdown courses={courses} currentCourseId="c1" courseTitle="Course A" />
      </MemoryRouter>,
    );
    expect(screen.getByText('Course A')).toBeInTheDocument();
  });

  it('dropdown is closed by default', () => {
    render(
      <MemoryRouter>
        <CourseDropdown courses={courses} currentCourseId="c1" courseTitle="Course A" />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('opens dropdown when button is clicked', () => {
    render(
      <MemoryRouter>
        <CourseDropdown courses={courses} currentCourseId="c1" courseTitle="Course A" />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: /course a/i }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('shows all courses in dropdown', () => {
    render(
      <MemoryRouter>
        <CourseDropdown courses={courses} currentCourseId="c1" courseTitle="Course A" />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: /course a/i }));
    expect(screen.getByText('Course B')).toBeInTheDocument();
  });

  it('marks current course as selected', () => {
    render(
      <MemoryRouter>
        <CourseDropdown courses={courses} currentCourseId="c1" courseTitle="Course A" />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: /course a/i }));
    const option = screen.getByRole('option', { name: /course a/i });
    expect(option).toHaveAttribute('aria-selected', 'true');
  });

  it('closes dropdown when clicking outside', () => {
    render(
      <MemoryRouter>
        <CourseDropdown courses={courses} currentCourseId="c1" courseTitle="Course A" />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: /course a/i }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    // Click outside
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
