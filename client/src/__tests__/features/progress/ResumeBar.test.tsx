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

  it('shows exam prompt when all lessons complete but exam not passed', () => {
    const unit2: Unit = {
      id: 'u2',
      title: 'Unit 2',
      description: '',
      order: 2,
      courseId: 'c1',
      lessons: [
        { id: 'l2', title: 'Lesson 2', description: '', order: 1, unitId: 'u2', objective: '', planContent: {} },
      ],
    };
    const progressAllDone: CourseProgress = {
      completedLessons: 2,
      totalLessons: 2,
      percentComplete: 90,
      examPassed: false,
      totalUnits: 2,
      units: [
        { unitId: 'u1', lessons: [{ lessonId: 'l1', quizPassed: true }] },
        { unitId: 'u2', lessons: [{ lessonId: 'l2', quizPassed: true }] },
      ],
    };
    render(
      <MemoryRouter>
        <ResumeBar courseId="c1" units={[unit2, unit]} progress={progressAllDone} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Final Exam')).toBeInTheDocument();
  });

  it('renders nothing when all lessons and exam complete', () => {
    const progressComplete: CourseProgress = {
      completedLessons: 1,
      totalLessons: 1,
      percentComplete: 100,
      examPassed: true,
      totalUnits: 1,
      units: [{ unitId: 'u1', lessons: [{ lessonId: 'l1', quizPassed: true }] }],
    };
    const { container } = render(
      <MemoryRouter>
        <ResumeBar courseId="c1" units={[unit]} progress={progressComplete} />
      </MemoryRouter>,
    );
    expect(container.firstChild).toBeNull();
  });
});
