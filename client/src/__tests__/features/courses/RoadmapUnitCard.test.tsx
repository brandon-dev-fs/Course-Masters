import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import RoadmapUnitCard from '../../../features/courses/RoadmapUnitCard.js';
import type { Unit, CourseProgress } from '../../../api/types.js';
import type { UnitState } from '../../../features/courses/UnitRoadmap.js';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const mockUnit: Unit = {
  id: 'unit-1',
  title: 'Variables and Expressions',
  description: '',
  order: 1,
  courseId: 'course-1',
  lessons: [
    { id: 'lesson-1', title: 'Intro', description: '', order: 1, unitId: 'unit-1', objective: '', planContent: {} },
    { id: 'lesson-2', title: 'Advanced', description: '', order: 2, unitId: 'unit-1', objective: '', planContent: {} },
  ],
};

const mockUnitProgress: CourseProgress['units'][number] = {
  unitId: 'unit-1',
  title: 'Variables and Expressions',
  order: 1,
  isComplete: true,
  totalLessons: 2,
  completedLessons: 2,
  testPassed: true,
  lessons: [
    { lessonId: 'lesson-1', hasQuiz: true, attempted: true, quizPassed: true },
    { lessonId: 'lesson-2', hasQuiz: true, attempted: true, quizPassed: true },
  ],
};

const inProgressUnitProgress: CourseProgress['units'][number] = {
  unitId: 'unit-1',
  title: 'Variables and Expressions',
  order: 1,
  isComplete: false,
  totalLessons: 2,
  completedLessons: 1,
  testPassed: false,
  lessons: [
    { lessonId: 'lesson-1', hasQuiz: true, attempted: true, quizPassed: true },
    { lessonId: 'lesson-2', hasQuiz: true, attempted: false, quizPassed: false },
  ],
};

function renderCard(state: UnitState, unitProgress?: CourseProgress['units'][number], canEdit = false) {
  return render(
    <MemoryRouter>
      <RoadmapUnitCard
        courseId="course-1"
        unit={mockUnit}
        unitProgress={unitProgress}
        state={state}
        canEdit={canEdit}
        onEditUnit={vi.fn()}
      />
    </MemoryRouter>,
  );
}

describe('RoadmapUnitCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders unit title', () => {
    renderCard('completed', mockUnitProgress);
    expect(screen.getByText('Variables and Expressions')).toBeInTheDocument();
  });

  it('renders Complete badge for completed state', () => {
    renderCard('completed', mockUnitProgress);
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });

  it('renders In progress badge for in-progress state', () => {
    renderCard('in-progress', inProgressUnitProgress);
    expect(screen.getByText('In progress')).toBeInTheDocument();
  });

  it('renders no badge for locked state', () => {
    renderCard('locked', undefined);
    expect(screen.queryByText('Complete')).not.toBeInTheDocument();
    expect(screen.queryByText('In progress')).not.toBeInTheDocument();
  });

  it('renders lesson list as links for completed state', () => {
    renderCard('completed', mockUnitProgress);
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(2);
  });

  it('renders lesson list as non-interactive spans for locked state', () => {
    renderCard('locked', undefined);
    // Locked lessons render as spans, not links
    expect(screen.queryByRole('link', { name: /intro/i })).not.toBeInTheDocument();
    expect(screen.getByText('Intro')).toBeInTheDocument();
  });

  it('renders Continue lesson button only for in-progress state', () => {
    const { unmount } = renderCard('in-progress', inProgressUnitProgress);
    expect(screen.getByRole('link', { name: /continue lesson/i })).toBeInTheDocument();
    unmount();

    renderCard('completed', mockUnitProgress);
    expect(screen.queryByRole('link', { name: /continue lesson/i })).not.toBeInTheDocument();
  });

  it('shows Up next badge on first incomplete lesson in in-progress state', () => {
    renderCard('in-progress', inProgressUnitProgress);
    expect(screen.getByText('Up next')).toBeInTheDocument();
  });

  it('renders Unit test passed when state is completed', () => {
    renderCard('completed', mockUnitProgress);
    expect(screen.getByText(/unit test passed/i)).toBeInTheDocument();
  });

  it('shows pencil edit button when canEdit is true', () => {
    renderCard('completed', mockUnitProgress, true);
    expect(screen.getByRole('button', { name: /edit unit/i })).toBeInTheDocument();
  });

  it('hides edit button when canEdit is false', () => {
    renderCard('completed', mockUnitProgress, false);
    expect(screen.queryByRole('button', { name: /edit unit/i })).not.toBeInTheDocument();
  });

  it('renders no lessons message when unit has no lessons', () => {
    const emptyUnit: Unit = { ...mockUnit, lessons: [] };
    render(
      <MemoryRouter>
        <RoadmapUnitCard
          courseId="course-1"
          unit={emptyUnit}
          unitProgress={undefined}
          state="locked"
          canEdit={false}
          onEditUnit={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText(/no lessons yet/i)).toBeInTheDocument();
  });
});
