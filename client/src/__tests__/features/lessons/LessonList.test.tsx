import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LessonList from '../../../features/lessons/LessonList.js';
import type { Lesson } from '../../../api/types.js';

const lessons: Lesson[] = [
  { id: 'l1', title: 'Intro', description: 'Introduction lesson', order: 1, unitId: 'u1', objective: '', planContent: {} },
  { id: 'l2', title: 'Advanced', description: 'Advanced material', order: 2, unitId: 'u1', objective: '', planContent: {} },
];

describe('LessonList', () => {
  it('renders empty state when no lessons', () => {
    render(
      <MemoryRouter>
        <LessonList courseId="c1" unitId="u1" lessons={[]} />
      </MemoryRouter>,
    );
    expect(screen.getByText('No lessons yet')).toBeInTheDocument();
  });

  it('renders lesson titles', () => {
    render(
      <MemoryRouter>
        <LessonList courseId="c1" unitId="u1" lessons={lessons} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Intro')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
  });

  it('shows Go to Lesson links', () => {
    render(
      <MemoryRouter>
        <LessonList courseId="c1" unitId="u1" lessons={lessons} />
      </MemoryRouter>,
    );
    const links = screen.getAllByRole('link', { name: /go to lesson/i });
    expect(links.length).toBe(2);
  });
});
