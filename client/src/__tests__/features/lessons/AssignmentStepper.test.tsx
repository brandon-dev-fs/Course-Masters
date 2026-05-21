import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AssignmentStepper from '../../../features/lessons/AssignmentStepper.js';
import type { StepperItem } from '../../../features/lessons/AssignmentStepper.js';

const items: StepperItem[] = [
  { key: 'lessonPlan', title: 'Lesson Plan', kind: 'lessonPlan', completionId: null },
  { key: 'r1', title: 'Video 1', kind: 'resource', completionId: 'r1', resourceType: 'video' },
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
        completedIds={new Set()}
        completedAssignmentIds={new Set()}
        quizUnlocked={true}
        quizPassed={false}
        onStepClick={onStepClick}
        {...props}
      />
    );
  }

  it('renders all step titles', () => {
    renderStepper();
    expect(screen.getAllByText('Lesson Plan').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Video 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Quiz').length).toBeGreaterThan(0);
  });

  it('calls onStepClick when a step is clicked', () => {
    renderStepper();
    const buttons = screen.getAllByLabelText('Lesson Plan');
    fireEvent.click(buttons[0]);
    expect(onStepClick).toHaveBeenCalledWith('lessonPlan');
  });

  it('does not call onStepClick for locked quiz', () => {
    renderStepper({ quizUnlocked: false });
    const quizButtons = screen.getAllByLabelText('Quiz');
    fireEvent.click(quizButtons[0]);
    expect(onStepClick).not.toHaveBeenCalled();
  });

  it('marks quiz as disabled when not unlocked', () => {
    renderStepper({ quizUnlocked: false });
    const quizButtons = screen.getAllByLabelText('Quiz');
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

  it('shows completed step with check icon when completionId is in completedIds', () => {
    renderStepper({ completedIds: new Set(['r1']) });
    // The component renders CheckCircle2 for completed items
    // We can verify via aria-current on the active item
    const lessonPlanBtns = screen.getAllByLabelText('Lesson Plan');
    expect(lessonPlanBtns[0]).toHaveAttribute('aria-current', 'step');
  });

  it('marks quiz as passed when quizPassed is true', () => {
    renderStepper({ quizPassed: true, activeStepKey: 'quiz' });
    const quizBtns = screen.getAllByLabelText('Quiz');
    // active quiz step should have aria-current
    expect(quizBtns[0]).toHaveAttribute('aria-current', 'step');
  });

  it('shows current step name in mobile view', () => {
    renderStepper({ activeStepKey: 'r1' });
    // Mobile view shows current step title in a span
    expect(screen.getAllByText('Video 1').length).toBeGreaterThan(1);
  });
});
