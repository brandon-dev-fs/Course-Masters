import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ResumeBar from '../../../features/progress/ResumeBar.js';
import type { Unit, CourseProgress } from '../../../api/types.js';

const unit: Unit = {
  id: 'u1',
  title: 'Unit 1',
  description: '',
  order: 1,
  courseId: 'c1',
  lessons: [
    { id: 'l1', title: 'Lesson 1', description: '', order: 1, unitId: 'u1', objective: '', planContent: {} },
  ],
};

const progressWithIncomplete: CourseProgress = {
  completedLessons: 0,
  totalLessons: 1,
  percentComplete: 0,
  examPassed: false,
  totalUnits: 1,
  units: [
    { unitId: 'u1', lessons: [] },
  ],
};

describe('ResumeBar', () => {
  it('renders nothing when no progress', () => {
    const { container } = render(
      <MemoryRouter>
        <ResumeBar courseId="c1" units={[unit]} progress={null} />
      </MemoryRouter>,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when units is empty', () => {
    const { container } = render(
      <MemoryRouter>
        <ResumeBar courseId="c1" units={[]} progress={progressWithIncomplete} />
      </MemoryRouter>,
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows resume bar with incomplete lesson', () => {
    render(
      <MemoryRouter>
        <ResumeBar courseId="c1" units={[unit]} progress={progressWithIncomplete} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Continue where you left off')).toBeInTheDocument();
    expect(screen.getByText('Lesson 1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /resume/i })).toBeInTheDocument();
  });
});
