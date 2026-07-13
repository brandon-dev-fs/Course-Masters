import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import CalendarModal from '../../../features/courses/CalendarModal.js';
import type { Course } from '../../../api/types.js';

const mockCourse: Course = {
  id: 'c1',
  title: 'My Course',
  description: 'Description',
  authorId: 'u1',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  units: [
    { id: 'u1', title: 'Unit 1', description: '', order: 1, courseId: 'c1' },
    { id: 'u2', title: 'Unit 2', description: '', order: 2, courseId: 'c1' },
  ],
};

describe('CalendarModal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Course Calendar title with course name', () => {
    render(
      <MemoryRouter>
        <CalendarModal course={mockCourse} progress={null} onClose={onClose} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/course calendar.*my course/i)).toBeInTheDocument();
  });

  it('renders Previous month button', () => {
    render(
      <MemoryRouter>
        <CalendarModal course={mockCourse} progress={null} onClose={onClose} />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText('Previous month')).toBeInTheDocument();
  });

  it('renders Next month button', () => {
    render(
      <MemoryRouter>
        <CalendarModal course={mockCourse} progress={null} onClose={onClose} />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText('Next month')).toBeInTheDocument();
  });

  it('navigates to previous month', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 4, 15)); // May 2024

    render(
      <MemoryRouter>
        <CalendarModal course={mockCourse} progress={null} onClose={onClose} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText('Previous month'));
    expect(screen.getByText(/april/i)).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('renders unit legend', () => {
    render(
      <MemoryRouter>
        <CalendarModal course={mockCourse} progress={null} onClose={onClose} />
      </MemoryRouter>,
    );
    expect(screen.getAllByText('1. Unit 1')[0]).toBeInTheDocument();
    expect(screen.getAllByText('2. Unit 2')[0]).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <MemoryRouter>
        <CalendarModal course={mockCourse} progress={null} onClose={onClose} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByLabelText(/close/i));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('navigates to next month', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 4, 15)); // May 2024

    render(
      <MemoryRouter>
        <CalendarModal course={mockCourse} progress={null} onClose={onClose} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText('Next month'));
    expect(screen.getByText(/june/i)).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('shows "Due dates coming soon" disclaimer text', () => {
    render(
      <MemoryRouter>
        <CalendarModal course={mockCourse} progress={null} onClose={onClose} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/due dates coming soon/i)).toBeInTheDocument();
  });

  it('hides unit legend when course has no units', () => {
    const noUnitCourse = { ...mockCourse, units: [] };
    render(
      <MemoryRouter>
        <CalendarModal course={noUnitCourse} progress={null} onClose={onClose} />
      </MemoryRouter>,
    );
    expect(screen.queryByText('1. Unit 1')).not.toBeInTheDocument();
    expect(screen.queryByText('2. Unit 2')).not.toBeInTheDocument();
  });
});
