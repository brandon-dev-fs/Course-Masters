import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import UnitRoadmap from '../../../features/courses/UnitRoadmap.js';
import type { Unit, CourseProgress } from '../../../api/types.js';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
vi.mock('../../../features/courses/RoadmapUnitCard.js', () => ({
  default: ({ unit, state }: { unit: Unit; state: string }) => (
    <div data-testid={`unit-card-${unit.id}`} data-state={state}>
      {unit.title}
    </div>
  ),
}));

const mockUnits: Unit[] = [
  {
    id: 'unit-1',
    title: 'Variables and Expressions',
    description: '',
    order: 1,
    courseId: 'course-1',
    lessons: [
      { id: 'lesson-1', title: 'Intro', description: '', order: 1, unitId: 'unit-1', objective: '', planContent: {} },
    ],
  },
  {
    id: 'unit-2',
    title: 'Equations',
    description: '',
    order: 2,
    courseId: 'course-1',
    lessons: [
      { id: 'lesson-2', title: 'Basic Equations', description: '', order: 1, unitId: 'unit-2', objective: '', planContent: {} },
    ],
  },
];

const mockProgressUnit1Complete: CourseProgress = {
  percentComplete: 50,
  completedLessons: 1,
  totalLessons: 2,
  completedUnits: 1,
  totalUnits: 2,
  examPassed: false,
  examScore: null,
  units: [
    {
      unitId: 'unit-1',
      title: 'Variables and Expressions',
      order: 1,
      isComplete: true,
      totalLessons: 1,
      completedLessons: 1,
      testPassed: true,
      lessons: [{ lessonId: 'lesson-1', hasQuiz: true, attempted: true, quizPassed: true }],
    },
    {
      unitId: 'unit-2',
      title: 'Equations',
      order: 2,
      isComplete: false,
      totalLessons: 1,
      completedLessons: 0,
      testPassed: false,
      lessons: [{ lessonId: 'lesson-2', hasQuiz: false, attempted: false, quizPassed: false }],
    },
  ],
};

const mockProgressAllUnitsComplete: CourseProgress = {
  percentComplete: 90,
  completedLessons: 2,
  totalLessons: 2,
  completedUnits: 2,
  totalUnits: 2,
  examPassed: false,
  examScore: null,
  units: [
    {
      unitId: 'unit-1',
      title: 'Variables and Expressions',
      order: 1,
      isComplete: true,
      totalLessons: 1,
      completedLessons: 1,
      testPassed: true,
      lessons: [{ lessonId: 'lesson-1', hasQuiz: true, attempted: true, quizPassed: true }],
    },
    {
      unitId: 'unit-2',
      title: 'Equations',
      order: 2,
      isComplete: true,
      totalLessons: 1,
      completedLessons: 1,
      testPassed: true,
      lessons: [{ lessonId: 'lesson-2', hasQuiz: true, attempted: true, quizPassed: true }],
    },
  ],
};

function renderUnitRoadmap(units: Unit[], progress: CourseProgress | null, canEdit = false) {
  return render(
    <MemoryRouter>
      <UnitRoadmap
        courseId="course-1"
        units={units}
        progress={progress}
        canEdit={canEdit}
        onEditUnit={vi.fn()}
      />
    </MemoryRouter>,
  );
}

describe('UnitRoadmap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no units', () => {
    renderUnitRoadmap([], null);
    expect(screen.getByText(/no units yet/i)).toBeInTheDocument();
  });

  it('renders a card for each unit', () => {
    renderUnitRoadmap(mockUnits, mockProgressUnit1Complete);
    expect(screen.getByTestId('unit-card-unit-1')).toBeInTheDocument();
    expect(screen.getByTestId('unit-card-unit-2')).toBeInTheDocument();
  });

  it('assigns completed state to completed units', () => {
    renderUnitRoadmap(mockUnits, mockProgressUnit1Complete);
    expect(screen.getByTestId('unit-card-unit-1')).toHaveAttribute('data-state', 'completed');
  });

  it('assigns in-progress state to first incomplete unit', () => {
    renderUnitRoadmap(mockUnits, mockProgressUnit1Complete);
    expect(screen.getByTestId('unit-card-unit-2')).toHaveAttribute('data-state', 'in-progress');
  });

  it('assigns locked state to units after the in-progress unit', () => {
    const threeUnits: Unit[] = [
      ...mockUnits,
      {
        id: 'unit-3',
        title: 'Inequalities',
        description: '',
        order: 3,
        courseId: 'course-1',
        lessons: [],
      },
    ];
    const progressWithThree: CourseProgress = {
      ...mockProgressUnit1Complete,
      totalUnits: 3,
      units: [
        ...mockProgressUnit1Complete.units,
        {
          unitId: 'unit-3',
          title: 'Inequalities',
          order: 3,
          isComplete: false,
          totalLessons: 0,
          completedLessons: 0,
          testPassed: false,
          lessons: [],
        },
      ],
    };
    renderUnitRoadmap(threeUnits, progressWithThree);
    expect(screen.getByTestId('unit-card-unit-3')).toHaveAttribute('data-state', 'locked');
  });

  it('renders final exam item as locked when not all units are complete', () => {
    renderUnitRoadmap(mockUnits, mockProgressUnit1Complete);
    expect(screen.getByText(/complete all units to unlock/i)).toBeInTheDocument();
  });

  it('renders final exam as unlocked when all units are complete', () => {
    renderUnitRoadmap(mockUnits, mockProgressAllUnitsComplete);
    expect(screen.queryByText(/complete all units to unlock/i)).not.toBeInTheDocument();
    expect(screen.getByText('Final exam')).toBeInTheDocument();
  });
});
