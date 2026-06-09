import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import CourseHero from '../../../features/courses/CourseHero.js';
import type { Course, CourseProgress } from '../../../api/types.js';

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

const lesson1 = { id: 'l1', title: 'Lesson 1', description: '', order: 1, unitId: 'u1', objective: '', planContent: {} };
const lesson2 = { id: 'l2', title: 'Lesson 2', description: '', order: 2, unitId: 'u1', objective: '', planContent: {} };
const unit1 = { id: 'u1', title: 'Unit 1', description: '', order: 1, courseId: 'c1', lessons: [lesson1, lesson2] };

function makeCourseWithUnits(lessons = [lesson1, lesson2]): Course {
  return { ...course, units: [{ ...unit1, lessons }] };
}

function makeProgress(overrides: Partial<CourseProgress['units'][0]> = {}): CourseProgress {
  return {
    totalUnits: 1, completedUnits: 0, totalLessons: 2, completedLessons: 1,
    examPassed: false, examScore: null, percentComplete: 50,
    units: [{
      unitId: 'u1', title: 'Unit 1', order: 1, isComplete: false,
      totalLessons: 2, completedLessons: 1, testPassed: false,
      lessons: [
        { lessonId: 'l1', hasQuiz: true, attempted: true, quizPassed: true },
        { lessonId: 'l2', hasQuiz: true, attempted: false, quizPassed: false },
      ],
      ...overrides,
    }],
  };
}

function renderHero(c: Course, progress: CourseProgress | null) {
  return render(
    <MemoryRouter>
      <CourseHero
        course={c}
        progress={progress}
        courses={[c]}
        canEdit={false}
        onOpenSettings={vi.fn()}
        onOpenCalendar={vi.fn()}
      />
    </MemoryRouter>,
  );
}

describe('CourseHero CTA button', () => {
  it('shows no CTA when course has no units', () => {
    renderHero(course, null);
    expect(screen.queryByText(/start learning|continue learning/i)).not.toBeInTheDocument();
  });

  it('shows no CTA when first unit has no lessons', () => {
    renderHero(makeCourseWithUnits([]), null);
    expect(screen.queryByText(/start learning|continue learning/i)).not.toBeInTheDocument();
  });

  it('shows Start Learning when not started and first lesson exists', () => {
    renderHero(makeCourseWithUnits(), null);
    expect(screen.getByText('Start Learning')).toBeInTheDocument();
  });

  it('Start Learning link points to first lesson', () => {
    renderHero(makeCourseWithUnits(), null);
    const link = screen.getByRole('link', { name: /start learning/i });
    expect(link.getAttribute('href')).toBe('/courses/c1/units/u1/lessons/l1');
  });

  it('shows Continue Learning when course has been started', () => {
    renderHero(makeCourseWithUnits(), makeProgress());
    expect(screen.getByText('Continue Learning')).toBeInTheDocument();
  });

  it('Continue Learning link points to first incomplete lesson', () => {
    renderHero(makeCourseWithUnits(), makeProgress());
    const link = screen.getByRole('link', { name: /continue learning/i });
    expect(link.getAttribute('href')).toBe('/courses/c1/units/u1/lessons/l2');
  });

  it('shows no CTA when all lessons are complete', () => {
    const allComplete = makeProgress({
      isComplete: true, completedLessons: 2,
      lessons: [
        { lessonId: 'l1', hasQuiz: true, attempted: true, quizPassed: true },
        { lessonId: 'l2', hasQuiz: true, attempted: true, quizPassed: true },
      ],
    });
    renderHero(makeCourseWithUnits(), allComplete);
    expect(screen.queryByText(/start learning|continue learning/i)).not.toBeInTheDocument();
  });
});
