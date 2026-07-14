import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LessonPlanRow from '../../../features/builder/LessonPlanRow.js';

describe('LessonPlanRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when no lesson plan is set (hasLessonPlan=false)', () => {
    it('renders the "Set lesson plan" call-to-action text', () => {
      render(<LessonPlanRow hasLessonPlan={false} onClick={vi.fn()} />);
      expect(screen.getByText('Set lesson plan')).toBeInTheDocument();
    });

    it('renders a button element', () => {
      render(<LessonPlanRow hasLessonPlan={false} onClick={vi.fn()} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('has aria-label indicating no plan is set', () => {
      render(<LessonPlanRow hasLessonPlan={false} onClick={vi.fn()} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'No lesson plan — click to set one before adding activities');
    });

    it('calls onClick when the button is clicked', () => {
      const onClick = vi.fn();
      render(<LessonPlanRow hasLessonPlan={false} onClick={onClick} />);
      fireEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledOnce();
    });

    it('does not render "set · edit" indicator', () => {
      render(<LessonPlanRow hasLessonPlan={false} onClick={vi.fn()} />);
      expect(screen.queryByText('set · edit')).not.toBeInTheDocument();
    });
  });

  describe('when a lesson plan is set (hasLessonPlan=true)', () => {
    it('renders "Lesson plan" label', () => {
      render(<LessonPlanRow hasLessonPlan={true} onClick={vi.fn()} />);
      expect(screen.getByText('Lesson plan')).toBeInTheDocument();
    });

    it('renders a button element', () => {
      render(<LessonPlanRow hasLessonPlan={true} onClick={vi.fn()} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('shows the "set · edit" status indicator', () => {
      render(<LessonPlanRow hasLessonPlan={true} onClick={vi.fn()} />);
      expect(screen.getByText('set · edit')).toBeInTheDocument();
    });

    it('has aria-label indicating the plan exists and can be edited', () => {
      render(<LessonPlanRow hasLessonPlan={true} onClick={vi.fn()} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Lesson plan set — click to edit');
    });

    it('calls onClick when the button is clicked', () => {
      const onClick = vi.fn();
      render(<LessonPlanRow hasLessonPlan={true} onClick={onClick} />);
      fireEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledOnce();
    });

    it('does not render "Set lesson plan" text', () => {
      render(<LessonPlanRow hasLessonPlan={true} onClick={vi.fn()} />);
      expect(screen.queryByText('Set lesson plan')).not.toBeInTheDocument();
    });
  });
});
