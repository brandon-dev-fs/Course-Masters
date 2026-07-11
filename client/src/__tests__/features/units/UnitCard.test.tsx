import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import UnitCard from '../../../features/units/UnitCard.js';
import type { Unit } from '../../../api/types.js';

const unit: Unit = {
  id: 'u1',
  title: 'Unit One',
  description: 'First unit',
  order: 1,
  courseId: 'c1',
  lessons: [
    { id: 'l1', title: 'Lesson A', description: '', order: 1, unitId: 'u1', objective: '', planContent: {} },
    { id: 'l2', title: 'Lesson B', description: '', order: 2, unitId: 'u1', objective: '', planContent: {} },
  ],
};

describe('UnitCard', () => {
  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <UnitCard courseId="c1" unit={unit} unitProgress={null} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Unit One')).toBeInTheDocument();
  });

  it('shows lessons in the card', () => {
    render(
      <MemoryRouter>
        <UnitCard courseId="c1" unit={unit} unitProgress={null} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Lesson A')).toBeInTheDocument();
  });

  it('shows unit order badge', () => {
    render(
      <MemoryRouter>
        <UnitCard courseId="c1" unit={unit} unitProgress={null} />
      </MemoryRouter>,
    );
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('shows unit test locked status when not all lessons complete', () => {
    render(
      <MemoryRouter>
        <UnitCard courseId="c1" unit={unit} unitProgress={null} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/unit test locked/i)).toBeInTheDocument();
  });

  it('shows "No lessons yet" when unit has no lessons', () => {
    const emptyUnit: Unit = { ...unit, lessons: [] };
    render(
      <MemoryRouter>
        <UnitCard courseId="c1" unit={emptyUnit} unitProgress={null} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/no lessons yet/i)).toBeInTheDocument();
  });

  it('handles unit with undefined lessons gracefully', () => {
    const noLessonsUnit: Unit = { ...unit, lessons: undefined as unknown as Unit['lessons'] };
    render(
      <MemoryRouter>
        <UnitCard courseId="c1" unit={noLessonsUnit} unitProgress={null} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/no lessons yet/i)).toBeInTheDocument();
  });

  it('shows "unit test available" when all lessons are complete', () => {
    const progress = {
      unitId: 'u1', title: 'Unit One', order: 1,
      isComplete: false, totalLessons: 2, completedLessons: 2,
      testPassed: false,
      lessons: [],
    };
    render(
      <MemoryRouter>
        <UnitCard courseId="c1" unit={unit} unitProgress={progress} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/unit test available/i)).toBeInTheDocument();
  });

  it('shows "unit test passed" when testPassed is true', () => {
    const progress = {
      unitId: 'u1', title: 'Unit One', order: 1,
      isComplete: true, totalLessons: 2, completedLessons: 2,
      testPassed: true,
      lessons: [],
    };
    render(
      <MemoryRouter>
        <UnitCard courseId="c1" unit={unit} unitProgress={progress} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/unit test passed/i)).toBeInTheDocument();
  });

  it('shows "··· and X more" when there are more than 3 lessons', () => {
    const manyLessons = [1, 2, 3, 4, 5].map(i => ({
      id: `l${i}`, title: `Lesson ${i}`, description: '', order: i, unitId: 'u1', objective: '', planContent: {},
    }));
    const bigUnit: Unit = { ...unit, lessons: manyLessons };
    render(
      <MemoryRouter>
        <UnitCard courseId="c1" unit={bigUnit} unitProgress={null} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/and 2 more/i)).toBeInTheDocument();
  });

  it('applies complete styling to the order badge when unit is complete', () => {
    const progress = {
      unitId: 'u1', title: 'Unit One', order: 1,
      isComplete: true, totalLessons: 2, completedLessons: 2,
      testPassed: true,
      lessons: [],
    };
    const { container } = render(
      <MemoryRouter>
        <UnitCard courseId="c1" unit={unit} unitProgress={progress} />
      </MemoryRouter>,
    );
    // Complete badge uses bg-green-primary
    const badge = container.querySelector('.bg-green-primary');
    expect(badge).toBeInTheDocument();
  });
});
