import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import UnitList from '../../../features/units/UnitList.js';
import type { Unit } from '../../../api/types.js';

const units: Unit[] = [
  { id: 'u1', title: 'Unit Alpha', description: '', order: 1, courseId: 'c1', _count: { lessons: 2 } },
  { id: 'u2', title: 'Unit Beta', description: '', order: 2, courseId: 'c1', _count: { lessons: 0 } },
];

describe('UnitList', () => {
  const onEdit = vi.fn();
  const onDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no units', () => {
    render(
      <MemoryRouter>
        <UnitList courseId="c1" units={[]} onEdit={onEdit} onDelete={onDelete} />
      </MemoryRouter>,
    );
    expect(screen.getByText('No units yet')).toBeInTheDocument();
  });

  it('renders unit titles', () => {
    render(
      <MemoryRouter>
        <UnitList courseId="c1" units={units} onEdit={onEdit} onDelete={onDelete} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Unit Alpha')).toBeInTheDocument();
    expect(screen.getByText('Unit Beta')).toBeInTheDocument();
  });

  it('calls onEdit when Edit is clicked', () => {
    render(
      <MemoryRouter>
        <UnitList courseId="c1" units={units} onEdit={onEdit} onDelete={onDelete} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getAllByRole('button', { name: /edit/i })[0]);
    expect(onEdit).toHaveBeenCalledWith(units[0]);
  });

  it('calls onDelete when Delete is clicked', () => {
    render(
      <MemoryRouter>
        <UnitList courseId="c1" units={units} onEdit={onEdit} onDelete={onDelete} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getAllByRole('button', { name: /delete/i })[0]);
    expect(onDelete).toHaveBeenCalledWith(units[0]);
  });
});
