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
    // content.question required by isComplete() and the QuestionEditor
    content: { question: 'What is 2+2?', options: ['3', '4', '5', '6'], correctIndex: 1 },
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
    // Accordion shows Q1, Q2, ... labels in each card header
    expect(screen.getByText('Q1')).toBeInTheDocument();
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

  it('shows Add Question button', () => {
    render(<AssessmentForm initialQuestions={sampleQuestions} onSubmit={onSubmit} onCancel={onCancel} />);
    // Use getByRole because the '+' is in a child <span>, splitting the text across elements
    expect(screen.getByRole('button', { name: /add question/i })).toBeInTheDocument();
  });

  it('disables move-up button on first question', () => {
    render(<AssessmentForm initialQuestions={sampleQuestions} onSubmit={onSubmit} onCancel={onCancel} />);
    // Accordion replaces wizard Prev/Next with per-card move-up/move-down buttons
    expect(screen.getByRole('button', { name: /move question 1 up/i })).toBeDisabled();
  });

  it('starts with one default question when no initial questions provided', () => {
    render(<AssessmentForm onSubmit={onSubmit} onCancel={onCancel} />);
    expect(screen.getByText('Q1')).toBeInTheDocument();
    expect(screen.queryByText('Q2')).not.toBeInTheDocument();
  });

  it('calls onSubmit when form is submitted', async () => {
    render(<AssessmentForm initialQuestions={sampleQuestions} onSubmit={onSubmit} onCancel={onCancel} />);
    fireEvent.submit(screen.getByRole('button', { name: /save assessment/i }).closest('form')!);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
  });

  it('adds a new question when Add Question is clicked', () => {
    render(<AssessmentForm initialQuestions={sampleQuestions} onSubmit={onSubmit} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /add question/i }));
    expect(screen.getByText('Q2')).toBeInTheDocument();
  });

  it('shows all questions simultaneously in accordion', () => {
    const twoQs = [sampleQuestions[0], { ...sampleQuestions[0], id: 'q2', order: 2 }];
    render(<AssessmentForm initialQuestions={twoQs} onSubmit={onSubmit} onCancel={onCancel} />);
    // Accordion renders all question cards at once — no pagination
    expect(screen.getByText('Q1')).toBeInTheDocument();
    expect(screen.getByText('Q2')).toBeInTheDocument();
  });

  it('expands a collapsed question when its accordion header is clicked', () => {
    const twoQs = [sampleQuestions[0], { ...sampleQuestions[0], id: 'q2', order: 2 }];
    render(<AssessmentForm initialQuestions={twoQs} onSubmit={onSubmit} onCancel={onCancel} />);
    // Q1 is expanded by default (expandedIndex=0); Q2 header says "Expand"
    const q2Toggle = screen.getByRole('button', { name: /expand question 2/i });
    fireEvent.click(q2Toggle);
    expect(screen.getByRole('button', { name: /collapse question 2/i })).toBeInTheDocument();
  });

  it('collapses an expanded question when its accordion header is clicked again', () => {
    render(<AssessmentForm initialQuestions={sampleQuestions} onSubmit={onSubmit} onCancel={onCancel} />);
    // Q1 starts expanded
    const q1Toggle = screen.getByRole('button', { name: /collapse question 1/i });
    fireEvent.click(q1Toggle);
    expect(screen.getByRole('button', { name: /expand question 1/i })).toBeInTheDocument();
  });

  it('shows error when submitting with incomplete question', async () => {
    // isComplete() reads content.question — clear it to simulate an incomplete question
    const incomplete = [{ ...sampleQuestions[0], content: { ...sampleQuestions[0].content, question: '' } }];
    render(<AssessmentForm initialQuestions={incomplete} onSubmit={onSubmit} onCancel={onCancel} />);
    fireEvent.submit(screen.getByRole('button', { name: /save assessment/i }).closest('form')!);
    await waitFor(() =>
      expect(screen.getByText(/all questions must be fully filled in/i)).toBeInTheDocument()
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
