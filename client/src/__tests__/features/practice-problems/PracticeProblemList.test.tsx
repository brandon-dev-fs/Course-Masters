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
vi.mock('../../../features/practice-problems/PracticeProblemForm.js', () => ({
  default: ({ onSubmit, onCancel }: { onSubmit: (draft: object) => void; onCancel: () => void }) => (
    <div data-testid="practice-problem-form">
      <button onClick={() => onSubmit({ question: 'Q?', content: { options: ['a', 'b'], correctIndex: 0 }, calculatorEnabled: false, order: 1 })}>Submit Form</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '../../setup/renderWithProviders.js';
import { makeTeacherUser } from '../../mocks/authContext.mock.js';
import PracticeProblemList from '../../../features/practice-problems/PracticeProblemList.js';

const problem = {
  id: 'pp1',
  type: 'practice_problem',
  title: 'Solve for x',
  content: {
    question: 'What is 2+2?',
    options: ['2', '3', '4', '5'],
    correctIndex: 2,
    calculatorEnabled: false,
  },
  order: 1,
  lessonId: 'l1',
  isRequired: false,
};

describe('PracticeProblemList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authClientMock.getSession.mockResolvedValue({ data: null, error: null });
    apiClientMock.get.mockResolvedValue([]);
  });

  it('shows empty state when no problems', async () => {
    renderWithProviders(<PracticeProblemList lessonId="l1" />);
    expect(await screen.findByText(/no practice problems yet/i)).toBeInTheDocument();
  });

  it('shows problem card when data exists', async () => {
    apiClientMock.get.mockResolvedValue([problem]);
    renderWithProviders(<PracticeProblemList lessonId="l1" />);
    expect(await screen.findByText('What is 2+2?')).toBeInTheDocument();
  });

  it('shows add button for teacher in toolbar', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get.mockResolvedValue([problem]);
    renderWithProviders(<PracticeProblemList lessonId="l1" />);
    await screen.findByText('What is 2+2?');
    expect(screen.getByRole('button', { name: /\+ add problem/i })).toBeInTheDocument();
  });

  it('does not show add button for student when no problems', async () => {
    renderWithProviders(<PracticeProblemList lessonId="l1" />);
    await screen.findByText(/no practice problems yet/i);
    expect(screen.queryAllByText('+ Add Problem')).toHaveLength(0);
  });

  it('opens add modal when add button clicked by teacher (toolbar)', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get.mockResolvedValue([problem]);
    renderWithProviders(<PracticeProblemList lessonId="l1" />);
    await screen.findByText('What is 2+2?');
    fireEvent.click(screen.getByRole('button', { name: /\+ add problem/i }));
    expect(screen.getByTestId('practice-problem-form')).toBeInTheDocument();
  });

  it('opens add modal from empty state action for teacher', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<PracticeProblemList lessonId="l1" />);
    await screen.findByText(/no practice problems yet/i);
    // Toolbar + EmptyState action both show for teacher + empty state
    fireEvent.click(screen.getAllByRole('button', { name: /\+ add problem/i })[0]);
    expect(screen.getByTestId('practice-problem-form')).toBeInTheDocument();
  });

  it('closes modal when cancel is clicked', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get.mockResolvedValue([problem]);
    renderWithProviders(<PracticeProblemList lessonId="l1" />);
    await screen.findByText('What is 2+2?');
    fireEvent.click(screen.getByRole('button', { name: /\+ add problem/i }));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByTestId('practice-problem-form')).not.toBeInTheDocument();
  });

  it('submits add form and calls create API', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get.mockResolvedValue([problem]);
    apiClientMock.post.mockResolvedValue({ ...problem, id: 'pp2' });
    renderWithProviders(<PracticeProblemList lessonId="l1" />);
    await screen.findByText('What is 2+2?');
    fireEvent.click(screen.getByRole('button', { name: /\+ add problem/i }));
    fireEvent.click(screen.getByText('Submit Form'));
    await waitFor(() => expect(apiClientMock.post).toHaveBeenCalled());
  });

  it('opens edit modal when edit button clicked on problem card', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get.mockResolvedValue([problem]);
    renderWithProviders(<PracticeProblemList lessonId="l1" />);
    await screen.findByText('What is 2+2?');
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(screen.getByText('Edit Practice Problem')).toBeInTheDocument();
  });

  it('submits edit form and calls update API', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get.mockResolvedValue([problem]);
    apiClientMock.put.mockResolvedValue(problem);
    renderWithProviders(<PracticeProblemList lessonId="l1" />);
    await screen.findByText('What is 2+2?');
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    fireEvent.click(screen.getByText('Submit Form'));
    await waitFor(() => expect(apiClientMock.put).toHaveBeenCalled());
  });

  it('closes edit modal when cancel clicked', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get.mockResolvedValue([problem]);
    renderWithProviders(<PracticeProblemList lessonId="l1" />);
    await screen.findByText('What is 2+2?');
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(screen.getByTestId('practice-problem-form')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByTestId('practice-problem-form')).not.toBeInTheDocument();
  });

  it('opens delete confirm when delete button clicked on problem card', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get.mockResolvedValue([problem]);
    renderWithProviders(<PracticeProblemList lessonId="l1" />);
    await screen.findByText('What is 2+2?');
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(screen.getByText('Delete Problem')).toBeInTheDocument();
  });

  it('calls delete API when confirm delete clicked', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get.mockResolvedValue([problem]);
    apiClientMock.delete.mockResolvedValue(undefined);
    renderWithProviders(<PracticeProblemList lessonId="l1" />);
    await screen.findByText('What is 2+2?');
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^delete$/i }));
    await waitFor(() => expect(apiClientMock.delete).toHaveBeenCalled());
  });

  it('closes delete dialog when cancel clicked', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get.mockResolvedValue([problem]);
    renderWithProviders(<PracticeProblemList lessonId="l1" />);
    await screen.findByText('What is 2+2?');
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
