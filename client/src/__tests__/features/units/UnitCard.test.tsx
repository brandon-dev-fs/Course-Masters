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
});
