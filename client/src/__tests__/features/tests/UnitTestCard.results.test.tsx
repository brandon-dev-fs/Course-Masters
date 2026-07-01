// Separate test file for UnitTestCard results view,
// since vi.mock is hoisted and we need a different useAssessment mock here.

const mockSetView = vi.fn();

vi.mock('../../../hooks/useAssessment.js', () => ({
  default: vi.fn(),
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

const { authClientMock } = vi.hoisted(() => ({
  authClientMock: {
    getSession: vi.fn().mockResolvedValue({ data: null, error: null }),
    signIn: { email: vi.fn() },
    signUp: { email: vi.fn() },
    signOut: vi.fn(),
  },
}));
const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock('../../../api/auth.js', () => ({ authClient: authClientMock }));
vi.mock('../../../api/client.js', () => ({
  apiClient: apiClientMock,
  ApiClientError: class ApiClientError extends Error {},
  classifyError: (e: unknown) => String(e),
}));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../setup/renderWithProviders.js';
import { makeStudentUser } from '../../mocks/authContext.mock.js';
import UnitTestCard from '../../../features/tests/UnitTestCard.js';
import useAssessment from '../../../hooks/useAssessment.js';

const mockUseAssessment = vi.mocked(useAssessment);

const baseAssessment = {
  id: 'a1',
  type: 'unit_quiz' as const,
  unitId: 'u1',
  questions: [
    {
      id: 'q1',
      type: 'multiple_choice' as const,
      question: 'What is 2+2?',
      content: { options: ['2', '3', '4'], correctIndex: 2 },
      order: 1,
      assessmentId: 'a1',
      calculatorEnabled: false,
    },
  ],
  lastAttempt: null,
};

const baseReturnValue = {
  assessment: baseAssessment,
  loading: false,
  error: '',
  view: 'idle' as const,
  setView: mockSetView,
  result: null,
  attempts: [],
  lastAttempt: null,
  handleCreate: vi.fn(),
  handleUpdate: vi.fn(),
  handleSubmit: vi.fn(),
};

describe('UnitTestCard — results view', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authClientMock.getSession.mockResolvedValue({ data: { user: makeStudentUser() }, error: null });
  });

  it('shows AssessmentResults modal when view is "results" and result exists', () => {
    const result = { score: 0.9, passed: true, totalQuestions: 1, correctCount: 1 };
    mockUseAssessment.mockReturnValue({
      ...baseReturnValue,
      view: 'results',
      result,
      lastAttempt: { score: 0.9, passed: true },
    });
    renderWithProviders(<UnitTestCard unitId="u1" allLessonsComplete={true} />);
    expect(screen.getByTestId('assessment-results')).toBeInTheDocument();
  });

  it('does not show AssessmentResults modal when view is "results" but result is null', () => {
    mockUseAssessment.mockReturnValue({
      ...baseReturnValue,
      view: 'results',
      result: null,
    });
    renderWithProviders(<UnitTestCard unitId="u1" allLessonsComplete={true} />);
    expect(screen.queryByTestId('assessment-results')).not.toBeInTheDocument();
  });

  it('calls setView("idle") when Dismiss is clicked in results modal', () => {
    const result = { score: 0.9, passed: true, totalQuestions: 1, correctCount: 1 };
    mockUseAssessment.mockReturnValue({
      ...baseReturnValue,
      view: 'results',
      result,
    });
    renderWithProviders(<UnitTestCard unitId="u1" allLessonsComplete={true} />);
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(mockSetView).toHaveBeenCalledWith('idle');
  });

  it('calls setView("taking") when Retake is clicked in results modal', () => {
    const result = { score: 0.5, passed: false, totalQuestions: 1, correctCount: 0 };
    mockUseAssessment.mockReturnValue({
      ...baseReturnValue,
      view: 'results',
      result,
    });
    renderWithProviders(<UnitTestCard unitId="u1" allLessonsComplete={true} />);
    fireEvent.click(screen.getByRole('button', { name: /retake/i }));
    expect(mockSetView).toHaveBeenCalledWith('taking');
  });

  it('shows taking modal when view is "taking"', () => {
    mockUseAssessment.mockReturnValue({
      ...baseReturnValue,
      view: 'taking',
    });
    renderWithProviders(<UnitTestCard unitId="u1" allLessonsComplete={true} />);
    expect(screen.getByTestId('assessment-taker')).toBeInTheDocument();
  });

  it('returns null when loading', () => {
    mockUseAssessment.mockReturnValue({
      ...baseReturnValue,
      loading: true,
      assessment: null,
    });
    const { container } = renderWithProviders(<UnitTestCard unitId="u1" allLessonsComplete={true} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when assessment is null', () => {
    mockUseAssessment.mockReturnValue({
      ...baseReturnValue,
      assessment: null,
    });
    const { container } = renderWithProviders(<UnitTestCard unitId="u1" allLessonsComplete={true} />);
    expect(container.firstChild).toBeNull();
  });
});
