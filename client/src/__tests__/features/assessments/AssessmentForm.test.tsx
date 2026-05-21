const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock('../../../api/client.js', () => ({ apiClient: apiClientMock }));

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AssessmentForm from '../../../features/assessments/AssessmentForm.js';
import type { QuestionDraft } from '../../../features/assessments/QuestionEditor.js';

const sampleQuestions: QuestionDraft[] = [
  {
    id: 'q1',
    type: 'multiple_choice',
    question: 'What is 2+2?',
    content: { options: ['3', '4', '5', '6'], correctIndex: 1 },
    order: 1,
    calculatorEnabled: false,
  },
];

describe('AssessmentForm', () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Question label with count', () => {
    render(<AssessmentForm initialQuestions={sampleQuestions} onSubmit={onSubmit} onCancel={onCancel} />);
    // The progress label says "Question 1 of 1"
    expect(screen.getAllByText(/question 1/i).length).toBeGreaterThan(0);
  });

  it('renders Cancel button', () => {
    render(<AssessmentForm initialQuestions={sampleQuestions} onSubmit={onSubmit} onCancel={onCancel} />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders Save Assessment button', () => {
    render(<AssessmentForm initialQuestions={sampleQuestions} onSubmit={onSubmit} onCancel={onCancel} />);
    expect(screen.getByText('Save Assessment')).toBeInTheDocument();
  });

  it('calls onCancel when Cancel is clicked', () => {
    render(<AssessmentForm initialQuestions={sampleQuestions} onSubmit={onSubmit} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('shows bulk calculator toolbar when assessmentId provided', () => {
    render(
      <AssessmentForm
        initialQuestions={sampleQuestions}
        onSubmit={onSubmit}
        onCancel={onCancel}
        assessmentId="a1"
      />
    );
    expect(screen.getByLabelText('Enable calculator for all questions')).toBeInTheDocument();
    expect(screen.getByLabelText('Disable calculator for all questions')).toBeInTheDocument();
  });

  it('does not show bulk toolbar when assessmentId is not provided', () => {
    render(<AssessmentForm initialQuestions={sampleQuestions} onSubmit={onSubmit} onCancel={onCancel} />);
    expect(screen.queryByLabelText('Enable calculator for all questions')).not.toBeInTheDocument();
  });

  it('shows Add Question button on last question', () => {
    render(<AssessmentForm initialQuestions={sampleQuestions} onSubmit={onSubmit} onCancel={onCancel} />);
    expect(screen.getByText('+ Add Question')).toBeInTheDocument();
  });

  it('shows Prev button disabled when on first question', () => {
    render(<AssessmentForm initialQuestions={sampleQuestions} onSubmit={onSubmit} onCancel={onCancel} />);
    expect(screen.getByText('Prev')).toBeDisabled();
  });

  it('starts with one default question when no initial questions provided', () => {
    render(<AssessmentForm onSubmit={onSubmit} onCancel={onCancel} />);
    expect(screen.getAllByText(/question 1/i).length).toBeGreaterThan(0);
    expect(screen.getByText('of 1')).toBeInTheDocument();
  });

  it('calls onSubmit when form is submitted', async () => {
    render(<AssessmentForm initialQuestions={sampleQuestions} onSubmit={onSubmit} onCancel={onCancel} />);
    fireEvent.submit(screen.getByRole('button', { name: /save assessment/i }).closest('form')!);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
  });

  it('adds a new question when Add Question is clicked', () => {
    render(<AssessmentForm initialQuestions={sampleQuestions} onSubmit={onSubmit} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('+ Add Question'));
    expect(screen.getByText('of 2')).toBeInTheDocument();
  });

  it('shows Next button when there are multiple questions', () => {
    const twoQs = [sampleQuestions[0], { ...sampleQuestions[0], id: 'q2', order: 2 }];
    render(<AssessmentForm initialQuestions={twoQs} onSubmit={onSubmit} onCancel={onCancel} />);
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('navigates to next question when Next is clicked', () => {
    const twoQs = [sampleQuestions[0], { ...sampleQuestions[0], id: 'q2', order: 2 }];
    render(<AssessmentForm initialQuestions={twoQs} onSubmit={onSubmit} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Next'));
    // On question 2 of 2: Prev is now enabled and + Add Question shows
    expect(screen.getByText('Prev')).not.toBeDisabled();
    expect(screen.getByText('+ Add Question')).toBeInTheDocument();
  });

  it('navigates back to previous question when Prev is clicked', () => {
    const twoQs = [sampleQuestions[0], { ...sampleQuestions[0], id: 'q2', order: 2 }];
    render(<AssessmentForm initialQuestions={twoQs} onSubmit={onSubmit} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Prev'));
    // Back on question 1 of 2: Prev disabled again, Next visible
    expect(screen.getByText('Prev')).toBeDisabled();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('shows error when submitting with incomplete question', async () => {
    const incomplete = [{ ...sampleQuestions[0], question: '' }];
    render(<AssessmentForm initialQuestions={incomplete} onSubmit={onSubmit} onCancel={onCancel} />);
    fireEvent.submit(screen.getByRole('button', { name: /save assessment/i }).closest('form')!);
    await waitFor(() =>
      expect(screen.getByText(/all questions and options must be filled in/i)).toBeInTheDocument()
    );
  });

  it('shows bulk confirm dialog when mixed calculator state and Enable all clicked', () => {
    const mixed = [
      { ...sampleQuestions[0], id: 'q1', calculatorEnabled: true },
      { ...sampleQuestions[0], id: 'q2', order: 2, calculatorEnabled: false },
    ];
    render(
      <AssessmentForm initialQuestions={mixed} onSubmit={onSubmit} onCancel={onCancel} assessmentId="a1" />
    );
    fireEvent.click(screen.getByLabelText('Enable calculator for all questions'));
    expect(screen.getByText(/enable calculator for all questions\?/i)).toBeInTheDocument();
  });

  it('cancels bulk confirm dialog when cancel is clicked', () => {
    const mixed = [
      { ...sampleQuestions[0], id: 'q1', calculatorEnabled: true },
      { ...sampleQuestions[0], id: 'q2', order: 2, calculatorEnabled: false },
    ];
    render(
      <AssessmentForm initialQuestions={mixed} onSubmit={onSubmit} onCancel={onCancel} assessmentId="a1" />
    );
    fireEvent.click(screen.getByLabelText('Enable calculator for all questions'));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/enable calculator for all questions\?/i)).toBeInTheDocument();
    // Use the Cancel button scoped to the dialog (not the form's Cancel)
    fireEvent.click(within(dialog).getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows confirm dialog for Disable all with mixed state', () => {
    const mixed = [
      { ...sampleQuestions[0], id: 'q1', calculatorEnabled: true },
      { ...sampleQuestions[0], id: 'q2', order: 2, calculatorEnabled: false },
    ];
    render(
      <AssessmentForm initialQuestions={mixed} onSubmit={onSubmit} onCancel={onCancel} assessmentId="a1" />
    );
    fireEvent.click(screen.getByLabelText('Disable calculator for all questions'));
    expect(screen.getByText(/disable calculator for all questions\?/i)).toBeInTheDocument();
  });
});
