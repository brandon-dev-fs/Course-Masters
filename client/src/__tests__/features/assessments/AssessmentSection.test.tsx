const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock('../../../api/client.js', () => ({
  apiClient: apiClientMock,
  ApiClientError: class ApiClientError extends Error {},
  classifyError: (e: unknown) => String(e),
}));
vi.mock('../../../features/assessments/AssessmentForm.js', () => ({
  default: ({ onCancel }: { onCancel: () => void }) => (
    <div data-testid="assessment-form">
      <button onClick={onCancel}>Cancel Form</button>
    </div>
  ),
  toQuestionDraft: (q: unknown) => q,
}));
vi.mock('../../../features/assessments/AssessmentTaker.js', () => ({
  default: ({ onCancel }: { onCancel: () => void }) => (
    <div data-testid="assessment-taker">
      <button onClick={onCancel}>Cancel Taker</button>
    </div>
  ),
}));
vi.mock('../../../features/assessments/AssessmentResults.js', () => ({
  default: ({ onDismiss, onRetake }: { onDismiss: () => void; onRetake: () => void }) => (
    <div data-testid="assessment-results">
      <button onClick={onDismiss}>Dismiss</button>
      <button onClick={onRetake}>Retake</button>
    </div>
  ),
}));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AssessmentSection from '../../../features/assessments/AssessmentSection.js';

const mockApi = {
  get: vi.fn().mockResolvedValue(null),
  create: vi.fn(),
  update: vi.fn(),
  submitAttempt: vi.fn(),
  getAttempts: vi.fn().mockResolvedValue({ data: [] }),
};

const mockAssessment = {
  id: 'a1',
  type: 'lesson_quiz' as const,
  questions: [
    {
      id: 'q1',
      type: 'multiple_choice' as const,
      question: 'Test question?',
      content: { options: ['A', 'B'], correctIndex: 0 },
      order: 1,
      calculatorEnabled: false,
      assessmentId: 'a1',
    },
  ],
};

const baseProps = {
  parentId: 'l1',
  api: mockApi,
  label: 'Lesson Quiz',
  createLabel: 'Create Quiz',
  takeLabel: 'Take Quiz',
  retakeLabel: 'Retake Quiz',
  modalTitle: 'Quiz',
  resultsTitle: 'Results',
  displayMode: 'inline' as const,
};

describe('AssessmentSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.get.mockResolvedValue(null);
    mockApi.getAttempts.mockResolvedValue({ data: [] });
  });

  it('renders without crashing in inline mode (no assessment)', async () => {
    render(<AssessmentSection {...baseProps} canEdit={false} />);
    expect(await screen.findByText('Lesson Quiz')).toBeInTheDocument();
  });

  it('shows create button for teacher when no assessment', async () => {
    render(<AssessmentSection {...baseProps} canEdit={true} />);
    expect(await screen.findByRole('button', { name: /create quiz/i })).toBeInTheDocument();
  });

  it('renders nothing in modal-only mode when not open and idle', () => {
    const { container } = render(
      <AssessmentSection
        {...baseProps}
        displayMode="modal-only"
        open={false}
        onClose={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows take button when assessment exists', async () => {
    mockApi.get.mockResolvedValue(mockAssessment);
    render(<AssessmentSection {...baseProps} />);
    expect(await screen.findByRole('button', { name: /take quiz/i })).toBeInTheDocument();
  });

  it('shows edit button for teacher when assessment exists', async () => {
    mockApi.get.mockResolvedValue(mockAssessment);
    render(<AssessmentSection {...baseProps} canEdit={true} />);
    expect(await screen.findByRole('button', { name: /edit lesson quiz/i })).toBeInTheDocument();
  });

  it('opens taking modal when Take Quiz is clicked', async () => {
    mockApi.get.mockResolvedValue(mockAssessment);
    render(<AssessmentSection {...baseProps} />);
    fireEvent.click(await screen.findByRole('button', { name: /take quiz/i }));
    expect(screen.getByTestId('assessment-taker')).toBeInTheDocument();
  });

  it('closes taking modal when cancel is clicked', async () => {
    mockApi.get.mockResolvedValue(mockAssessment);
    render(<AssessmentSection {...baseProps} />);
    fireEvent.click(await screen.findByRole('button', { name: /take quiz/i }));
    expect(screen.getByTestId('assessment-taker')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /cancel taker/i }));
    expect(screen.queryByTestId('assessment-taker')).not.toBeInTheDocument();
  });

  it('opens creating modal when Edit is clicked', async () => {
    mockApi.get.mockResolvedValue(mockAssessment);
    render(<AssessmentSection {...baseProps} canEdit={true} />);
    fireEvent.click(await screen.findByRole('button', { name: /edit lesson quiz/i }));
    expect(screen.getByTestId('assessment-form')).toBeInTheDocument();
  });

  it('closes creating modal when form cancel is clicked', async () => {
    mockApi.get.mockResolvedValue(mockAssessment);
    render(<AssessmentSection {...baseProps} canEdit={true} />);
    fireEvent.click(await screen.findByRole('button', { name: /edit lesson quiz/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancel form/i }));
    expect(screen.queryByTestId('assessment-form')).not.toBeInTheDocument();
  });

  it('opens creating modal from create button when no assessment', async () => {
    render(<AssessmentSection {...baseProps} canEdit={true} />);
    fireEvent.click(await screen.findByRole('button', { name: /create quiz/i }));
    expect(screen.getByTestId('assessment-form')).toBeInTheDocument();
  });

  it('closes create modal when form cancel is clicked', async () => {
    render(<AssessmentSection {...baseProps} canEdit={true} />);
    fireEvent.click(await screen.findByRole('button', { name: /create quiz/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancel form/i }));
    expect(screen.queryByTestId('assessment-form')).not.toBeInTheDocument();
  });

  it('disables take button when unlocked is false and canEdit is false', async () => {
    mockApi.get.mockResolvedValue(mockAssessment);
    render(<AssessmentSection {...baseProps} unlocked={false} canEdit={false} />);
    const takeBtn = await screen.findByRole('button', { name: /take quiz/i });
    expect(takeBtn).toBeDisabled();
  });

  it('shows locked message when unlocked=false and lockedMessage is provided', async () => {
    mockApi.get.mockResolvedValue(mockAssessment);
    render(
      <AssessmentSection
        {...baseProps}
        unlocked={false}
        canEdit={false}
        lockedMessage="Complete all assignments first"
      />,
    );
    expect(await screen.findByText('Complete all assignments first')).toBeInTheDocument();
  });

  it('shows retake label when previous attempts exist', async () => {
    mockApi.get.mockResolvedValue(mockAssessment);
    mockApi.getAttempts.mockResolvedValue({
      data: [{ id: 'at1', score: 0.8, passed: true, createdAt: '2024-01-01T00:00:00Z', answers: [] }],
    });
    render(<AssessmentSection {...baseProps} />);
    expect(await screen.findByRole('button', { name: /retake quiz/i })).toBeInTheDocument();
  });

  it('renders previous attempts list with score and pass status', async () => {
    mockApi.get.mockResolvedValue(mockAssessment);
    mockApi.getAttempts.mockResolvedValue({
      data: [{ id: 'at1', score: 0.8, passed: true, createdAt: '2024-01-01T00:00:00Z', answers: [] }],
    });
    render(<AssessmentSection {...baseProps} />);
    expect(await screen.findByText('80%')).toBeInTheDocument();
    expect(screen.getByText('Passed')).toBeInTheDocument();
  });

  it('shows question count when assessment exists', async () => {
    mockApi.get.mockResolvedValue(mockAssessment);
    render(<AssessmentSection {...baseProps} />);
    expect(await screen.findByText('1 questions')).toBeInTheDocument();
  });

  it('shows import button when lessonId and canEdit are provided with existing assessment', async () => {
    mockApi.get.mockResolvedValue(mockAssessment);
    render(<AssessmentSection {...baseProps} canEdit={true} lessonId="l1" />);
    expect(
      await screen.findByRole('button', { name: /import from practice problems/i }),
    ).toBeInTheDocument();
  });
});
