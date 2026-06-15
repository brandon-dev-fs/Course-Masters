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

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../setup/renderWithProviders.js';
import FlashCardList from '../../../features/flashcards/FlashCardList.js';
import type { VocabEntry } from '../../../api/types.js';

function makeEntry(overrides?: Partial<VocabEntry>): VocabEntry {
  return {
    id: 'e1',
    term: 'Variable',
    definition: 'A named storage location',
    example: 'let x = 1',
    ...overrides,
  };
}

describe('FlashCardList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authClientMock.getSession.mockResolvedValue({ data: null, error: null });
    apiClientMock.get.mockResolvedValue([]);
    apiClientMock.delete.mockResolvedValue(undefined);
  });

  it('renders empty state when no saved flash cards', async () => {
    renderWithProviders(<FlashCardList lessonId="l1" />);
    // findByText throws if not found — presence is the assertion
    await screen.findByText(/no flashcards yet/i);
  });

  it('renders saved flash cards from API', async () => {
    apiClientMock.get.mockResolvedValue([
      makeEntry({ id: 'e1', term: 'Variable', definition: 'A named storage location' }),
      makeEntry({ id: 'e2', term: 'Function', definition: 'A reusable block of code' }),
    ]);
    renderWithProviders(<FlashCardList lessonId="l1" />);
    await screen.findByText('Variable');
    expect(screen.queryByText('Function')).not.toBeNull();
  });

  it('shows study mode button when cards exist', async () => {
    apiClientMock.get.mockResolvedValue([makeEntry()]);
    renderWithProviders(<FlashCardList lessonId="l1" />);
    await screen.findByRole('button', { name: /study mode/i });
  });

  it('does not show study mode button when no cards', async () => {
    renderWithProviders(<FlashCardList lessonId="l1" />);
    await screen.findByText(/no flashcards yet/i);
    expect(screen.queryByRole('button', { name: /study mode/i })).toBeNull();
  });

  it('enters study mode when Study Mode button is clicked', async () => {
    apiClientMock.get.mockResolvedValue([makeEntry()]);
    renderWithProviders(<FlashCardList lessonId="l1" />);
    fireEvent.click(await screen.findByRole('button', { name: /study mode/i }));
    expect(screen.queryByTestId('study-mode')).not.toBeNull();
  });

  it('exits study mode when onExit is called', async () => {
    apiClientMock.get.mockResolvedValue([makeEntry()]);
    renderWithProviders(<FlashCardList lessonId="l1" />);
    fireEvent.click(await screen.findByRole('button', { name: /study mode/i }));
    fireEvent.click(screen.getByText('Exit Study Mode'));
    expect(screen.queryByTestId('study-mode')).toBeNull();
  });

  it('removes a card when remove button is clicked', async () => {
    apiClientMock.get.mockResolvedValue([makeEntry({ id: 'e1', term: 'Variable', definition: 'A named storage location' })]);
    renderWithProviders(<FlashCardList lessonId="l1" />);
    await screen.findByText('Variable');
    fireEvent.click(screen.getByRole('button', { name: /remove flashcard/i }));
    await waitFor(() => expect(screen.queryByText('Variable')).toBeNull());
  });
});
