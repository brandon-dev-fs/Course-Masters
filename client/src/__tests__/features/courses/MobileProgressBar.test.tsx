import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import MobileProgressBar from '../../../features/courses/MobileProgressBar.js';
import type { CourseProgress } from '../../../api/types.js';

const mockProgress: CourseProgress = {
  percentComplete: 60,
  completedLessons: 3,
  totalLessons: 5,
  completedUnits: 1,
  totalUnits: 2,
  examPassed: false,
  examScore: null,
  units: [],
};

function renderMobileProgressBar(
  props: Partial<Parameters<typeof MobileProgressBar>[0]> = {},
) {
  const defaultProps = {
    progress: mockProgress,
    onOpenSyllabus: vi.fn(),
    onReviewFlashCards: vi.fn(),
  };
  return render(<MobileProgressBar {...defaultProps} {...props} />);
}

describe('MobileProgressBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders progress percentage', () => {
    renderMobileProgressBar();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('renders 0% when progress is null', () => {
    renderMobileProgressBar({ progress: null });
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('renders Flash cards action button', () => {
    renderMobileProgressBar();
    expect(screen.getByRole('button', { name: /flash cards/i })).toBeInTheDocument();
  });

  it('renders Syllabus action button', () => {
    renderMobileProgressBar();
    expect(screen.getByRole('button', { name: /syllabus/i })).toBeInTheDocument();
  });

  it('calls onReviewFlashCards when Flash cards clicked', () => {
    const onReviewFlashCards = vi.fn();
    renderMobileProgressBar({ onReviewFlashCards });
    fireEvent.click(screen.getByRole('button', { name: /flash cards/i }));
    expect(onReviewFlashCards).toHaveBeenCalledOnce();
  });

  it('calls onOpenSyllabus when Syllabus clicked', () => {
    const onOpenSyllabus = vi.fn();
    renderMobileProgressBar({ onOpenSyllabus });
    fireEvent.click(screen.getByRole('button', { name: /syllabus/i }));
    expect(onOpenSyllabus).toHaveBeenCalledOnce();
  });

  it('has region role with correct aria-label', () => {
    renderMobileProgressBar();
    expect(
      screen.getByRole('region', { name: /course progress summary/i }),
    ).toBeInTheDocument();
  });
});
