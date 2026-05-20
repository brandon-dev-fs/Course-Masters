const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock('../../../api/client.js', () => ({ apiClient: apiClientMock }));

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import UnitLessonSidebar from '../../../features/lessons/UnitLessonSidebar.js';
import type { Lesson } from '../../../api/types.js';

const lessons: Lesson[] = [
  { id: 'l1', unitId: 'u1', title: 'Lesson 1', description: '', order: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01', objective: '', planContent: {} },
  { id: 'l2', unitId: 'u1', title: 'Lesson 2', description: '', order: 2, createdAt: '2024-01-01', updatedAt: '2024-01-01', objective: '', planContent: {} },
];

describe('UnitLessonSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderSidebar(props: Partial<Parameters<typeof UnitLessonSidebar>[0]> = {}) {
    return render(
      <MemoryRouter>
        <UnitLessonSidebar
          lessons={lessons}
          currentLessonId="l1"
          courseId="c1"
          unitId="u1"
          courseTitle="My Course"
          unitTitle="Unit 1"
          {...props}
        />
      </MemoryRouter>,
    );
  }

  it('renders lesson titles', () => {
    renderSidebar();
    expect(screen.getAllByText('1. Lesson 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2. Lesson 2').length).toBeGreaterThan(0);
  });

  it('shows Unit Test button when onUnitTestClick provided', () => {
    renderSidebar({ onUnitTestClick: vi.fn() });
    expect(screen.getAllByText('Unit Test').length).toBeGreaterThan(0);
  });

  it('calls onUnitTestClick when Unit Test button is clicked', () => {
    const onUnitTestClick = vi.fn();
    renderSidebar({ onUnitTestClick });
    // Mobile Unit Test button (first one)
    const utBtn = screen.getAllByText('Unit Test')[0];
    fireEvent.click(utBtn);
    expect(onUnitTestClick).toHaveBeenCalledOnce();
  });

  it('shows Add Lesson button for teacher', () => {
    renderSidebar({ canEdit: true });
    expect(screen.getAllByText('Add Lesson').length).toBeGreaterThan(0);
  });

  it('does not show Add Lesson button for students', () => {
    renderSidebar({ canEdit: false });
    expect(screen.queryByText('Add Lesson')).not.toBeInTheDocument();
  });

  it('opens add lesson modal when Add Lesson is clicked', () => {
    renderSidebar({ canEdit: true, onAddLesson: vi.fn() });
    // Desktop Add Lesson button is in the sidebar nav
    const addButtons = screen.getAllByText('Add Lesson');
    fireEvent.click(addButtons[addButtons.length - 1]); // last one is desktop
    // Modal opened — check for a form field in the modal
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
  });

  it('renders course title link', () => {
    renderSidebar();
    // Course title appears in desktop sidebar as a link
    expect(screen.getByText('My Course')).toBeInTheDocument();
  });
});
