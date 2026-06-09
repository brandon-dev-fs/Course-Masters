import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UnitSettingsModal from '../../../features/units/UnitSettingsModal.js';
import type { Course, Unit } from '../../../api/types.js';

const unit1: Unit = {
  id: 'u1',
  title: 'Unit One',
  description: '',
  order: 1,
  courseId: 'c1',
  lessons: [],
};

const courseWithUnits: Course = {
  id: 'c1',
  title: 'My Course',
  description: 'desc',
  authorId: 'author1',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  units: [unit1],
};

const emptyCourse: Course = {
  id: 'c1',
  title: 'Empty Course',
  description: '',
  authorId: 'author1',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  units: [],
};

describe('UnitSettingsModal', () => {
  it('renders modal title', () => {
    render(
      <MemoryRouter>
        <UnitSettingsModal
          course={emptyCourse}
          onClose={vi.fn()}
          onAddUnit={vi.fn()}
          onUpdateUnit={vi.fn()}
          onDeleteUnit={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('Unit Settings')).toBeInTheDocument();
  });

  it('shows "no units yet" when course has no units', () => {
    render(
      <MemoryRouter>
        <UnitSettingsModal
          course={emptyCourse}
          onClose={vi.fn()}
          onAddUnit={vi.fn()}
          onUpdateUnit={vi.fn()}
          onDeleteUnit={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText(/no units yet/i)).toBeInTheDocument();
  });

  it('shows units list when course has units', () => {
    render(
      <MemoryRouter>
        <UnitSettingsModal
          course={courseWithUnits}
          onClose={vi.fn()}
          onAddUnit={vi.fn()}
          onUpdateUnit={vi.fn()}
          onDeleteUnit={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('Unit One')).toBeInTheDocument();
  });

  it('shows add unit form when + Add Unit is clicked', () => {
    render(
      <MemoryRouter>
        <UnitSettingsModal
          course={emptyCourse}
          onClose={vi.fn()}
          onAddUnit={vi.fn()}
          onUpdateUnit={vi.fn()}
          onDeleteUnit={vi.fn()}
        />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('+ Add Unit'));
    // Should show the UnitForm
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('starts in adding state when initialAdding is true', () => {
    render(
      <MemoryRouter>
        <UnitSettingsModal
          course={emptyCourse}
          onClose={vi.fn()}
          onAddUnit={vi.fn()}
          onUpdateUnit={vi.fn()}
          onDeleteUnit={vi.fn()}
          initialAdding={true}
        />
      </MemoryRouter>,
    );
    // Form should be shown immediately
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('shows edit form when edit button is clicked', () => {
    render(
      <MemoryRouter>
        <UnitSettingsModal
          course={courseWithUnits}
          onClose={vi.fn()}
          onAddUnit={vi.fn()}
          onUpdateUnit={vi.fn()}
          onDeleteUnit={vi.fn()}
        />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('Edit'));
    // The unit form should appear in the edit panel
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('shows confirm dialog when delete button is clicked', () => {
    render(
      <MemoryRouter>
        <UnitSettingsModal
          course={courseWithUnits}
          onClose={vi.fn()}
          onAddUnit={vi.fn()}
          onUpdateUnit={vi.fn()}
          onDeleteUnit={vi.fn()}
        />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('Delete'));
    expect(screen.getByText('Delete Unit')).toBeInTheDocument();
  });

  it('calls onDeleteUnit when confirm delete clicked', async () => {
    const onDeleteUnit = vi.fn().mockResolvedValue(undefined);
    render(
      <MemoryRouter>
        <UnitSettingsModal
          course={courseWithUnits}
          onClose={vi.fn()}
          onAddUnit={vi.fn()}
          onUpdateUnit={vi.fn()}
          onDeleteUnit={onDeleteUnit}
        />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('Delete'));
    // Two dialogs are in the DOM: outer UnitSettingsModal + inner ConfirmDialog. Target the last one.
    fireEvent.click(within(screen.getAllByRole('dialog').at(-1)!).getByRole('button', { name: /^delete$/i }));
    await waitFor(() => expect(onDeleteUnit).toHaveBeenCalledWith(unit1));
  });

  it('closes delete dialog when cancel clicked', () => {
    render(
      <MemoryRouter>
        <UnitSettingsModal
          course={courseWithUnits}
          onClose={vi.fn()}
          onAddUnit={vi.fn()}
          onUpdateUnit={vi.fn()}
          onDeleteUnit={vi.fn()}
        />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('Delete'));
    fireEvent.click(within(screen.getAllByRole('dialog').at(-1)!).getByRole('button', { name: /cancel/i }));
    // The outer Modal (UnitSettingsModal) is still open; only the ConfirmDialog should be gone.
    expect(screen.queryByText('Delete Unit')).not.toBeInTheDocument();
  });

  it('calls onAddUnit and closes form when add unit submitted', async () => {
    const onAddUnit = vi.fn().mockResolvedValue(undefined);
    render(
      <MemoryRouter>
        <UnitSettingsModal
          course={emptyCourse}
          onClose={vi.fn()}
          onAddUnit={onAddUnit}
          onUpdateUnit={vi.fn()}
          onDeleteUnit={vi.fn()}
        />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('+ Add Unit'));
    fireEvent.change(screen.getByLabelText(/^title$/i), { target: { value: 'New Unit' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'A new unit description' } });
    fireEvent.click(screen.getByRole('button', { name: /add unit/i }));
    await waitFor(() => expect(onAddUnit).toHaveBeenCalled());
  });
});
