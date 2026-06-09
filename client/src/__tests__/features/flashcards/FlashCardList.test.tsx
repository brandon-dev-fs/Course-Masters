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
vi.mock('../../../features/flashcards/FlashCardStudyMode.js', () => ({
  default: ({ onExit }: { onExit: () => void }) => (
    <div data-testid="study-mode">
      <button onClick={onExit}>Exit Study Mode</button>
    </div>
  ),
}));
vi.mock('../../../features/flashcards/FlashCard.js', () => ({
  default: ({ card, onDelete }: { card: { content: { front: string } }; onDelete?: () => void }) => (
    <div>
      <span>{card.content.front}</span>
      {onDelete && <button onClick={onDelete}>Delete Card</button>}
    </div>
  ),
}));
vi.mock('../../../features/flashcards/FlashCardForm.js', () => ({
  default: ({ onSubmit, onCancel }: { onSubmit: (data: object) => void; onCancel: () => void }) => (
    <div data-testid="flash-card-form">
      <button onClick={() => onSubmit({ front: 'Q?', back: 'A!', order: 1 })}>Submit Card</button>
      <button onClick={onCancel}>Cancel Form</button>
    </div>
  ),
}));

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../setup/renderWithProviders.js';
import { makeTeacherUser } from '../../mocks/authContext.mock.js';
import FlashCardList from '../../../features/flashcards/FlashCardList.js';

const flashCard = {
  id: 'fc1',
  type: 'flash_card',
  title: 'What is a variable?',
  content: { front: 'What is a variable?', back: 'A named storage location.' },
  order: 1,
  lessonId: 'l1',
  isRequired: false,
};

describe('FlashCardList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authClientMock.getSession.mockResolvedValue({ data: null, error: null });
    apiClientMock.get.mockResolvedValue([]);
  });

  it('renders empty state when no flash cards', async () => {
    renderWithProviders(<FlashCardList lessonId="l1" />);
    expect(await screen.findByText(/no flash cards yet/i)).toBeInTheDocument();
  });

  it('shows flash card when data exists', async () => {
    apiClientMock.get.mockResolvedValue([flashCard]);
    renderWithProviders(<FlashCardList lessonId="l1" />);
    expect(await screen.findByText('What is a variable?')).toBeInTheDocument();
  });

  it('shows study mode button when cards exist', async () => {
    apiClientMock.get.mockResolvedValue([flashCard]);
    renderWithProviders(<FlashCardList lessonId="l1" />);
    expect(await screen.findByText('Study Mode')).toBeInTheDocument();
  });

  it('shows add button for teacher when cards exist', async () => {
    apiClientMock.get.mockResolvedValue([flashCard]);
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<FlashCardList lessonId="l1" />);
    expect(await screen.findByText('+ Add Card')).toBeInTheDocument();
  });

  it('shows edit cards button for teacher when cards exist', async () => {
    apiClientMock.get.mockResolvedValue([flashCard]);
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<FlashCardList lessonId="l1" />);
    expect(await screen.findByText('Edit Cards')).toBeInTheDocument();
  });

  it('enters study mode when Study Mode button is clicked', async () => {
    apiClientMock.get.mockResolvedValue([flashCard]);
    renderWithProviders(<FlashCardList lessonId="l1" />);
    fireEvent.click(await screen.findByText('Study Mode'));
    expect(await screen.findByTestId('study-mode')).toBeInTheDocument();
  });

  it('exits study mode when onExit is called', async () => {
    apiClientMock.get.mockResolvedValue([flashCard]);
    renderWithProviders(<FlashCardList lessonId="l1" />);
    fireEvent.click(await screen.findByText('Study Mode'));
    fireEvent.click(await screen.findByText('Exit Study Mode'));
    expect(screen.queryByTestId('study-mode')).not.toBeInTheDocument();
  });

  it('shows Done Editing when Edit Cards is clicked', async () => {
    apiClientMock.get.mockResolvedValue([flashCard]);
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<FlashCardList lessonId="l1" />);
    fireEvent.click(await screen.findByText('Edit Cards'));
    expect(screen.getByText('Done Editing')).toBeInTheDocument();
  });

  it('returns to normal view when Done Editing is clicked', async () => {
    apiClientMock.get.mockResolvedValue([flashCard]);
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<FlashCardList lessonId="l1" />);
    fireEvent.click(await screen.findByText('Edit Cards'));
    fireEvent.click(screen.getByText('Done Editing'));
    expect(screen.getByText('Edit Cards')).toBeInTheDocument();
  });

  it('shows add card button for teacher in empty state', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<FlashCardList lessonId="l1" />);
    // Empty state shows add action for teachers (toolbar + EmptyState action = multiple buttons)
    expect(await screen.findByText(/no flash cards yet/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /\+ add card/i }).length).toBeGreaterThan(0);
  });

  it('shows add modal when Add Card button is clicked for empty state teacher', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<FlashCardList lessonId="l1" />);
    await screen.findByText(/no flash cards yet/i);
    fireEvent.click(screen.getAllByRole('button', { name: /\+ add card/i })[0]);
    expect(screen.getByText('Add Flash Card')).toBeInTheDocument();
  });

  it('submits add form and calls create API', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.post.mockResolvedValue({ ...flashCard, id: 'fc2' });
    renderWithProviders(<FlashCardList lessonId="l1" />);
    await screen.findByText(/no flash cards yet/i);
    fireEvent.click(screen.getAllByRole('button', { name: /\+ add card/i })[0]);
    fireEvent.click(screen.getByText('Submit Card'));
    await waitFor(() => expect(apiClientMock.post).toHaveBeenCalled());
  });

  it('closes add modal when form cancel is clicked', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<FlashCardList lessonId="l1" />);
    await screen.findByText(/no flash cards yet/i);
    fireEvent.click(screen.getAllByRole('button', { name: /\+ add card/i })[0]);
    expect(screen.getByTestId('flash-card-form')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel Form'));
    expect(screen.queryByTestId('flash-card-form')).not.toBeInTheDocument();
  });

  it('shows delete confirm when delete card button clicked', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get.mockResolvedValue([flashCard]);
    renderWithProviders(<FlashCardList lessonId="l1" />);
    await screen.findByText('What is a variable?');
    fireEvent.click(screen.getByText('Delete Card'));
    expect(screen.getByText(/delete this flash card/i)).toBeInTheDocument();
  });

  it('calls delete API when confirm delete clicked', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get.mockResolvedValue([flashCard]);
    apiClientMock.delete.mockResolvedValue(undefined);
    renderWithProviders(<FlashCardList lessonId="l1" />);
    await screen.findByText('What is a variable?');
    fireEvent.click(screen.getByText('Delete Card'));
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    await waitFor(() => expect(apiClientMock.delete).toHaveBeenCalled());
  });

  it('closes delete dialog when cancel clicked', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get.mockResolvedValue([flashCard]);
    renderWithProviders(<FlashCardList lessonId="l1" />);
    await screen.findByText('What is a variable?');
    fireEvent.click(screen.getByText('Delete Card'));
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByText(/delete this flash card/i)).not.toBeInTheDocument();
  });
});
