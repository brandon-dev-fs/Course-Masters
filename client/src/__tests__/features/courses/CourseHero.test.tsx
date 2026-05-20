import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import CourseHero from '../../../features/courses/CourseHero.js';
import type { Course } from '../../../api/types.js';

const course: Course = {
  id: 'c1',
  title: 'Python 101',
  description: 'Learn Python',
  authorId: 'u1',
  author: { id: 'u1', name: 'Alice' },
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  units: [],
};

describe('CourseHero', () => {
  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <CourseHero
          course={course}
          progress={null}
          courses={[course]}
          canEdit={false}
          onOpenSettings={vi.fn()}
          onOpenCalendar={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('Python 101')).toBeInTheDocument();
  });

  it('shows the course description', () => {
    render(
      <MemoryRouter>
        <CourseHero
          course={course}
          progress={null}
          courses={[course]}
          canEdit={false}
          onOpenSettings={vi.fn()}
          onOpenCalendar={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('Learn Python')).toBeInTheDocument();
  });

  it('shows settings button when canEdit is true', () => {
    render(
      <MemoryRouter>
        <CourseHero
          course={course}
          progress={null}
          courses={[course]}
          canEdit={true}
          onOpenSettings={vi.fn()}
          onOpenCalendar={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText(/course settings/i)).toBeInTheDocument();
  });

  it('shows author name', () => {
    render(
      <MemoryRouter>
        <CourseHero
          course={course}
          progress={null}
          courses={[course]}
          canEdit={false}
          onOpenSettings={vi.fn()}
          onOpenCalendar={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
