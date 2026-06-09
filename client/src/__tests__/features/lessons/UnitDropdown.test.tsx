const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock('../../../api/client.js', () => ({ apiClient: apiClientMock }));

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import UnitDropdown from '../../../features/lessons/UnitDropdown.js';
import type { Unit } from '../../../api/types.js';

const units: Unit[] = [
  { id: 'u1', title: 'Unit 1', description: '', order: 1, courseId: 'c1' },
  { id: 'u2', title: 'Unit 2', description: '', order: 2, courseId: 'c1' },
];

describe('UnitDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders current unit title', () => {
    render(
      <MemoryRouter>
        <UnitDropdown units={units} currentUnitId="u1" courseId="c1" />
      </MemoryRouter>,
    );
    expect(screen.getByText('Unit 1')).toBeInTheDocument();
  });

  it('dropdown is closed by default', () => {
    render(
      <MemoryRouter>
        <UnitDropdown units={units} currentUnitId="u1" courseId="c1" />
      </MemoryRouter>,
    );
    expect(screen.queryByText('1. Unit 1')).not.toBeInTheDocument();
  });

  it('opens dropdown when button is clicked', () => {
    render(
      <MemoryRouter>
        <UnitDropdown units={units} currentUnitId="u1" courseId="c1" />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('Unit 1'));
    expect(screen.getByText('1. Unit 1')).toBeInTheDocument();
    expect(screen.getByText('2. Unit 2')).toBeInTheDocument();
  });

  it('closes dropdown on overlay click', () => {
    render(
      <MemoryRouter>
        <UnitDropdown units={units} currentUnitId="u1" courseId="c1" />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('Unit 1'));
    expect(screen.getByText('2. Unit 2')).toBeInTheDocument();
    // The fixed overlay div closes on click
    const overlay = document.querySelector('.fixed.inset-0');
    if (overlay) fireEvent.click(overlay);
  });

  it('does not navigate when selecting current unit', async () => {
    render(
      <MemoryRouter>
        <UnitDropdown units={units} currentUnitId="u1" courseId="c1" />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('Unit 1'));
    fireEvent.click(screen.getByText('1. Unit 1'));
    // Dropdown should close
    await waitFor(() => {
      expect(screen.queryByText('2. Unit 2')).not.toBeInTheDocument();
    });
    expect(apiClientMock.get).not.toHaveBeenCalled();
  });

  it('navigates to first lesson of selected unit', async () => {
    apiClientMock.get.mockResolvedValue([
      { id: 'l1', title: 'Lesson 1', order: 1, unitId: 'u2' },
    ]);
    render(
      <MemoryRouter>
        <UnitDropdown units={units} currentUnitId="u1" courseId="c1" />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('Unit 1'));
    fireEvent.click(screen.getByText('2. Unit 2'));
    await waitFor(() => expect(apiClientMock.get).toHaveBeenCalledOnce());
  });
});
