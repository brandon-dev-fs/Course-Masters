import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import CourseProgressSidebar from '../../../features/courses/CourseProgressSidebar.js';
import type { CourseProgress } from '../../../api/types.js';

const mockProgress: CourseProgress = {
  percentComplete: 75,
  completedLessons: 3,
  totalLessons: 4,
  completedUnits: 1,
  totalUnits: 2,
  examPassed: false,
  examScore: null,
  units: [],
};

function renderSidebar(props: Partial<Parameters<typeof CourseProgressSidebar>[0]> = {}) {
  const defaultProps = {
    progress: mockProgress,
    canEdit: false,
    onOpenSyllabus: vi.fn(),
    onOpenCalendar: vi.fn(),
    onReviewFlashCards: vi.fn(),
    onAddUnit: vi.fn(),
  };
  return render(<CourseProgressSidebar {...defaultProps} {...props} />);
}

describe('CourseProgressSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders progress percentage', () => {
    renderSidebar();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('renders lessons completed stat', () => {
    renderSidebar();
    expect(screen.getByText('3/4')).toBeInTheDocument();
  });

  it('renders unit tests stat', () => {
    renderSidebar();
    expect(screen.getByText('1/2')).toBeInTheDocument();
  });

  it('renders 0% when progress is null', () => {
    renderSidebar({ progress: null });
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('renders Review flash cards action button', () => {
    renderSidebar();
    expect(screen.getByRole('button', { name: /review flash cards/i })).toBeInTheDocument();
  });

  it('renders View syllabus action button', () => {
    renderSidebar();
    expect(screen.getByRole('button', { name: /view syllabus/i })).toBeInTheDocument();
  });

  it('renders Calendar action button', () => {
    renderSidebar();
    expect(screen.getByRole('button', { name: /calendar/i })).toBeInTheDocument();
  });

  it('calls onReviewFlashCards when flash cards button clicked', () => {
    const onReviewFlashCards = vi.fn();
    renderSidebar({ onReviewFlashCards });
    fireEvent.click(screen.getByRole('button', { name: /review flash cards/i }));
    expect(onReviewFlashCards).toHaveBeenCalledOnce();
  });

  it('calls onOpenSyllabus when syllabus button clicked', () => {
    const onOpenSyllabus = vi.fn();
    renderSidebar({ onOpenSyllabus });
    fireEvent.click(screen.getByRole('button', { name: /view syllabus/i }));
    expect(onOpenSyllabus).toHaveBeenCalledOnce();
  });

  it('calls onOpenCalendar when calendar button clicked', () => {
    const onOpenCalendar = vi.fn();
    renderSidebar({ onOpenCalendar });
    fireEvent.click(screen.getByRole('button', { name: /calendar/i }));
    expect(onOpenCalendar).toHaveBeenCalledOnce();
  });

  it('shows Add unit button when canEdit is true', () => {
    renderSidebar({ canEdit: true });
    expect(screen.getByRole('button', { name: /add unit/i })).toBeInTheDocument();
  });

  it('hides Add unit button when canEdit is false', () => {
    renderSidebar({ canEdit: false });
    expect(screen.queryByRole('button', { name: /add unit/i })).not.toBeInTheDocument();
  });

  it('calls onAddUnit when add unit button clicked', () => {
    const onAddUnit = vi.fn();
    renderSidebar({ canEdit: true, onAddUnit });
    fireEvent.click(screen.getByRole('button', { name: /add unit/i }));
    expect(onAddUnit).toHaveBeenCalledOnce();
  });
});
