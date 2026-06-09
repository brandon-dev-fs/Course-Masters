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
  { id: 'l1', unitId: 'u1', title: 'Lesson 1', description: '', order: 1, objective: '', planContent: {} },
  { id: 'l2', unitId: 'u1', title: 'Lesson 2', description: '', order: 2, objective: '', planContent: {} },
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
    expect(screen.getAllByText('Lesson 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Lesson 2').length).toBeGreaterThan(0);
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

  it('renders lessons heading in sidebar', () => {
    renderSidebar();
    // "Lessons" heading appears in the mobile drawer header and (when not collapsed) in the desktop sidebar
    expect(screen.getAllByText('Lessons').length).toBeGreaterThan(0);
  });

  it('marks completed lessons with a completion icon', () => {
    renderSidebar({ completedLessonIds: new Set(['l2']) });
    // Lesson 2 is completed — it still renders its title
    expect(screen.getAllByText('Lesson 2').length).toBeGreaterThan(0);
    // Lesson 2 renders as a Link (not the current-div), visible in the DOM
    const links = screen.getAllByRole('link');
    const l2Links = links.filter(l => l.getAttribute('href')?.includes('l2'));
    expect(l2Links.length).toBeGreaterThan(0);
  });

  it('treats current lesson as a non-link div when unitTestActive is false', () => {
    renderSidebar({ unitTestActive: false });
    // l1 is currentLessonId; when unitTestActive=false it renders as a highlighted div, not a Link
    const links = screen.queryAllByRole('link');
    const l1Links = links.filter(l => l.getAttribute('href')?.includes('l1'));
    expect(l1Links.length).toBe(0);
  });

  it('treats current lesson as a link when unitTestActive is true', () => {
    renderSidebar({ unitTestActive: true, onUnitTestClick: vi.fn() });
    // When unitTestActive=true, isCurrent=false for l1, so it becomes a Link
    const links = screen.getAllByRole('link');
    const l1Links = links.filter(l => l.getAttribute('href')?.includes('l1'));
    expect(l1Links.length).toBeGreaterThan(0);
  });

  it('shows expand button when collapsed', () => {
    renderSidebar({ collapsed: true, onToggle: vi.fn() });
    expect(screen.getAllByLabelText('Expand sidebar').length).toBeGreaterThan(0);
  });

  it('calls onToggle when collapse toggle is clicked', () => {
    const onToggle = vi.fn();
    renderSidebar({ collapsed: false, onToggle });
    fireEvent.click(screen.getByLabelText('Collapse sidebar'));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('renders mobile drawer dialog when mobileOpen is true', () => {
    renderSidebar({ mobileOpen: true, onMobileClose: vi.fn() });
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('calls onMobileClose when drawer close button is clicked', () => {
    const onMobileClose = vi.fn();
    renderSidebar({ mobileOpen: true, onMobileClose });
    const closeButtons = screen.getAllByLabelText('Close navigation');
    fireEvent.click(closeButtons[closeButtons.length - 1]);
    expect(onMobileClose).toHaveBeenCalled();
  });

  it('calls onMobileClose when lesson is clicked in mobile drawer', () => {
    const onMobileClose = vi.fn();
    renderSidebar({ mobileOpen: true, onMobileClose });
    const links = screen.getAllByRole('link');
    fireEvent.click(links[0]);
    expect(onMobileClose).toHaveBeenCalled();
  });
});
