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
import { render, screen } from '@testing-library/react';
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
});
