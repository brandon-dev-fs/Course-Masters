import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AssignmentStepper, { getStepLabel } from '../../../features/lessons/AssignmentStepper.js';
import type { StepperItem } from '../../../features/lessons/AssignmentStepper.js';

const items: StepperItem[] = [
  { key: 'lessonPlan', title: 'Lesson Plan', kind: 'lessonPlan', completionId: null },
  { key: 'assignment:a1', title: 'Video 1', kind: 'assignment', completionId: 'a1', assignmentType: 'video' },
  { key: 'quiz', title: 'Quiz', kind: 'quiz', completionId: null },
];

describe('AssignmentStepper', () => {
  const onStepClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderStepper(props: Partial<Parameters<typeof AssignmentStepper>[0]> = {}) {
    return render(
      <AssignmentStepper
        items={items}
        activeStepKey="lessonPlan"
        completedAssignmentIds={new Set()}
        quizUnlocked={true}
        quizPassed={false}
        onStepClick={onStepClick}
        {...props}
      />
    );
  }

  it('renders step buttons for each item via aria-labels', () => {
    renderStepper();
    expect(screen.getAllByLabelText('Plan: Lesson Plan').length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('Video: Video 1').length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('Quiz: Quiz').length).toBeGreaterThan(0);
  });

  it('calls onStepClick when a step is clicked', () => {
    renderStepper();
    const buttons = screen.getAllByLabelText('Plan: Lesson Plan');
    fireEvent.click(buttons[0]);
    expect(onStepClick).toHaveBeenCalledWith('lessonPlan');
  });

  it('does not call onStepClick for locked quiz', () => {
    renderStepper({ quizUnlocked: false });
    const quizButtons = screen.getAllByLabelText('Quiz: Quiz');
    fireEvent.click(quizButtons[0]);
    expect(onStepClick).not.toHaveBeenCalled();
  });

  it('marks quiz as disabled when not unlocked', () => {
    renderStepper({ quizUnlocked: false });
    const quizButtons = screen.getAllByLabelText('Quiz: Quiz');
    expect(quizButtons[0]).toBeDisabled();
  });

  it('renders Add button when onAdd is provided', () => {
    renderStepper({ onAdd: vi.fn() });
    expect(screen.getAllByLabelText('Add assignment').length).toBeGreaterThan(0);
  });

  it('calls onAdd when Add button is clicked', () => {
    const onAdd = vi.fn();
    renderStepper({ onAdd });
    const addButtons = screen.getAllByLabelText('Add assignment');
    fireEvent.click(addButtons[0]);
    expect(onAdd).toHaveBeenCalledOnce();
  });

  it('shows active step with aria-current on the active button', () => {
    renderStepper();
    const lessonPlanBtns = screen.getAllByLabelText('Plan: Lesson Plan');
    expect(lessonPlanBtns[0]).toHaveAttribute('aria-current', 'step');
  });

  it('marks quiz step as active when it is the active step', () => {
    renderStepper({ quizPassed: true, activeStepKey: 'quiz' });
    const quizBtns = screen.getAllByLabelText('Quiz: Quiz');
    expect(quizBtns[0]).toHaveAttribute('aria-current', 'step');
  });

  it('shows step counter in mobile progress bar', () => {
    renderStepper({ activeStepKey: 'assignment:a1' });
    // Header shows "Step 2 of 3" when second item (index 1) is active out of 3 items
    expect(screen.getAllByText('Step 2 of 3').length).toBeGreaterThan(0);
  });

  describe('getStepLabel', () => {
    it('returns Plan for lessonPlan', () => {
      expect(getStepLabel({ key: 'k', title: 't', kind: 'lessonPlan', completionId: null })).toBe('Plan');
    });
    it('returns Quiz for quiz', () => {
      expect(getStepLabel({ key: 'k', title: 't', kind: 'quiz', completionId: null })).toBe('Quiz');
    });
    it('returns Read for note assignment', () => {
      expect(getStepLabel({ key: 'k', title: 't', kind: 'assignment', completionId: null, assignmentType: 'note' })).toBe('Read');
    });
    it('returns Video for video assignment', () => {
      expect(getStepLabel({ key: 'k', title: 't', kind: 'assignment', completionId: null, assignmentType: 'video' })).toBe('Video');
    });
    it('returns Link for reading assignment', () => {
      expect(getStepLabel({ key: 'k', title: 't', kind: 'assignment', completionId: null, assignmentType: 'reading' })).toBe('Link');
    });
    it('returns Vocab for vocab assignment', () => {
      expect(getStepLabel({ key: 'k', title: 't', kind: 'assignment', completionId: null, assignmentType: 'vocab' })).toBe('Vocab');
    });
    it('returns Practice for practice_problem assignment', () => {
      expect(getStepLabel({ key: 'k', title: 't', kind: 'assignment', completionId: null, assignmentType: 'practice_problem' })).toBe('Practice');
    });
    it('returns Step for unknown kind', () => {
      // exercise the default branch
      expect(getStepLabel({ key: 'k', title: 't', kind: 'assignment', completionId: null })).toBe('Read');
    });
  });
});
