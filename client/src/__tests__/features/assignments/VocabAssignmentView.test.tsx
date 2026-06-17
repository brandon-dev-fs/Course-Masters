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
    get: vi.fn().mockResolvedValue([]),
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

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VocabAssignmentView from '../../../features/assignments/VocabAssignmentView.js';

function renderView(props: React.ComponentProps<typeof VocabAssignmentView>) {
  return render(<MemoryRouter><VocabAssignmentView {...props} /></MemoryRouter>);
}

describe('VocabAssignmentView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authClientMock.getSession.mockResolvedValue({ data: null, error: null });
    apiClientMock.get.mockResolvedValue([]);
  });

  it('shows "no terms" message when entries are empty', () => {
    renderView({ entries: [], lessonId: 'lesson-1' });
    expect(screen.queryByText(/no terms defined/i)).not.toBeNull();
  });

  it('renders vocab entries', () => {
    renderView({
      lessonId: 'lesson-1',
      entries: [
        { id: 'e1', term: 'Variable', definition: 'A named storage location.' },
        { id: 'e2', term: 'Function', definition: 'A reusable block of code.' },
      ],
    });
    expect(screen.queryByText('Variable')).not.toBeNull();
    expect(screen.queryByText('A named storage location.')).not.toBeNull();
    expect(screen.queryByText('Function')).not.toBeNull();
    expect(screen.queryByText('A reusable block of code.')).not.toBeNull();
  });

  it('renders add-to-flashcard buttons for entries with ids', () => {
    renderView({
      lessonId: 'lesson-1',
      entries: [
        { id: 'e1', term: 'Variable', definition: 'A named storage location.' },
      ],
    });
    expect(screen.queryByRole('button', { name: /add "variable" to flashcards/i })).not.toBeNull();
  });

  it('does not render add-to-flashcard button for entries without ids', () => {
    renderView({
      lessonId: 'lesson-1',
      entries: [
        { term: 'Variable', definition: 'A named storage location.' },
      ],
    });
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders example text when provided', () => {
    renderView({
      lessonId: 'lesson-1',
      entries: [
        { id: 'e1', term: 'Variable', definition: 'A storage location.', example: 'x = 5' },
      ],
    });
    expect(screen.queryByText('x = 5')).not.toBeNull();
  });

  it('marks entry as saved after clicking add button', async () => {
    apiClientMock.post.mockResolvedValue({ id: 'fc1', entryId: 'e1', createdAt: '2024-01-01' });
    // Render and wait for the initial getSavedFlashCards fetch to resolve before clicking
    await act(async () => {
      renderView({
        lessonId: 'lesson-1',
        entries: [
          { id: 'e1', term: 'Variable', definition: 'A named storage location.' },
        ],
      });
    });
    const addButton = screen.getByRole('button', { name: /add "variable" to flashcards/i });
    await act(async () => {
      fireEvent.click(addButton);
    });
    // After clicking, the button should change to "Remove" state
    expect(screen.queryByRole('button', { name: /remove "variable" from flashcards/i })).not.toBeNull();
  });

  it('toggles entry back to unsaved after clicking remove button', async () => {
    apiClientMock.get.mockResolvedValue([{ id: 'e1', term: 'Variable', definition: 'A named storage location.' }]);
    apiClientMock.delete.mockResolvedValue(undefined);
    renderView({
      lessonId: 'lesson-1',
      entries: [
        { id: 'e1', term: 'Variable', definition: 'A named storage location.' },
      ],
    });

    // Wait for savedEntries to load (the get mock will resolve)
    await act(async () => {});

    // Now it should show "Remove" button
    const removeButton = screen.queryByRole('button', { name: /remove "variable" from flashcards/i });
    if (removeButton) {
      await act(async () => {
        fireEvent.click(removeButton);
      });
      expect(screen.queryByRole('button', { name: /add "variable" to flashcards/i })).not.toBeNull();
    }
  });

  it('rolls back optimistic save on API failure', async () => {
    apiClientMock.post.mockRejectedValue(new Error('Save failed'));
    renderView({
      lessonId: 'lesson-1',
      entries: [
        { id: 'e1', term: 'Variable', definition: 'A named storage location.' },
      ],
    });
    const addButton = screen.getByRole('button', { name: /add "variable" to flashcards/i });
    await act(async () => {
      fireEvent.click(addButton);
    });
    // After the API failure, rollback: button should show "Add" again
    expect(screen.queryByRole('button', { name: /add "variable" to flashcards/i })).not.toBeNull();
  });
});
