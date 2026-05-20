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

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../setup/renderWithProviders.js';
import { makeStudentUser } from '../../mocks/authContext.mock.js';
import UnitTestCard from '../../../features/tests/UnitTestCard.js';

const unitTest = {
  id: 'a1',
  type: 'unit_quiz',
  unitId: 'u1',
  questions: [
    {
      id: 'q1',
      type: 'multiple_choice',
      content: { question: 'What is 2+2?', options: ['2', '3', '4', '5'], answer: '4' },
      order: 1,
      assessmentId: 'a1',
      calculatorEnabled: false,
    },
  ],
};

describe('UnitTestCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authClientMock.getSession.mockResolvedValue({ data: { user: makeStudentUser() }, error: null });
    apiClientMock.get.mockResolvedValue(unitTest);
  });

  it('returns null while loading', () => {
    apiClientMock.get.mockReturnValue(new Promise(() => {}));
    const { container } = renderWithProviders(
      <UnitTestCard unitId="u1" allLessonsComplete={true} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows Unit Test when loaded', async () => {
    renderWithProviders(<UnitTestCard unitId="u1" allLessonsComplete={true} />);
    expect(await screen.findByText('Unit Test')).toBeInTheDocument();
  });

  it('shows Take Test button when loaded and not locked', async () => {
    renderWithProviders(<UnitTestCard unitId="u1" allLessonsComplete={true} />);
    expect(await screen.findByRole('button', { name: /take test/i })).toBeInTheDocument();
  });

  it('shows locked state when not all lessons complete', async () => {
    renderWithProviders(<UnitTestCard unitId="u1" allLessonsComplete={false} />);
    expect(await screen.findByText(/complete all lessons first/i)).toBeInTheDocument();
  });

  it('shows question count when not locked and no attempt', async () => {
    renderWithProviders(<UnitTestCard unitId="u1" allLessonsComplete={true} />);
    expect(await screen.findByText(/1 question/i)).toBeInTheDocument();
  });

  it('disables Take Test button when locked', async () => {
    renderWithProviders(<UnitTestCard unitId="u1" allLessonsComplete={false} />);
    const btn = await screen.findByRole('button', { name: /take test/i });
    expect(btn).toBeDisabled();
  });

  it('opens taking modal when Take Test is clicked', async () => {
    renderWithProviders(<UnitTestCard unitId="u1" allLessonsComplete={true} />);
    fireEvent.click(await screen.findByRole('button', { name: /take test/i }));
    expect(screen.getByTestId('assessment-taker')).toBeInTheDocument();
  });

  it('closes taking modal when cancel is clicked', async () => {
    renderWithProviders(<UnitTestCard unitId="u1" allLessonsComplete={true} />);
    fireEvent.click(await screen.findByRole('button', { name: /take test/i }));
    expect(screen.getByTestId('assessment-taker')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /cancel taker/i }));
    expect(screen.queryByTestId('assessment-taker')).not.toBeInTheDocument();
  });
});
