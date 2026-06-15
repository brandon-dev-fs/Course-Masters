const { authClientMock } = vi.hoisted(() => ({
  authClientMock: {
    getSession: vi.fn().mockResolvedValue({ data: null, error: null }),
    signIn: { email: vi.fn() },
    signUp: { email: vi.fn() },
    signOut: vi.fn(),
  },
}));
vi.mock('../../../api/auth.js', () => ({ authClient: authClientMock }));
vi.mock('../../../features/flashcards/FlashCardStudyMode.js', () => ({
  default: ({ onExit }: { onExit: () => void }) => (
    <div data-testid="study-mode">
      <button onClick={onExit}>Exit Study Mode</button>
    </div>
  ),
}));

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../setup/renderWithProviders.js';
import type { Assignment } from '../../../api/types.js';
import FlashCardList from '../../../features/flashcards/FlashCardList.js';

function makeVocabAssignment(overrides?: Partial<Assignment>): Assignment {
  return {
    id: 'a1',
    lessonId: 'l1',
    order: 1,
    title: 'Vocab Assignment',
    objective: null,
    type: 'vocab',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    completed: false,
    noteAssignment: null,
    videoAssignment: null,
    readingAssignment: null,
    practiceProblemAssignment: null,
    fileAssignment: null,
    bookmark: null,
    vocabAssignment: {
      id: 'va1',
      entries: [
        { id: 'e1', term: 'Variable', definition: 'A named storage location', example: 'let x = 1' },
        { id: 'e2', term: 'Function', definition: 'A reusable block of code' },
      ],
    },
    ...overrides,
  };
}

describe('FlashCardList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authClientMock.getSession.mockResolvedValue({ data: null, error: null });
  });

  it('renders empty state when no assignments provided', () => {
    renderWithProviders(<FlashCardList assignments={[]} />);
    expect(screen.getByText(/no flash cards yet/i)).toBeInTheDocument();
  });

  it('renders empty state when assignments have no vocab type', () => {
    const nonVocabAssignment: Assignment = {
      id: 'a2',
      lessonId: 'l1',
      order: 1,
      title: 'Note',
      objective: null,
      type: 'note',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      completed: false,
      noteAssignment: { id: 'na1', content: {} },
      videoAssignment: null,
      readingAssignment: null,
      vocabAssignment: null,
      practiceProblemAssignment: null,
      fileAssignment: null,
      bookmark: null,
    };
    renderWithProviders(<FlashCardList assignments={[nonVocabAssignment]} />);
    expect(screen.getByText(/no flash cards yet/i)).toBeInTheDocument();
  });

  it('renders vocab entries as cards', () => {
    renderWithProviders(<FlashCardList assignments={[makeVocabAssignment()]} />);
    expect(screen.getByText('Variable')).toBeInTheDocument();
    expect(screen.getByText('Function')).toBeInTheDocument();
  });

  it('shows study mode button when vocab entries exist', () => {
    renderWithProviders(<FlashCardList assignments={[makeVocabAssignment()]} />);
    expect(screen.getByRole('button', { name: /study mode/i })).toBeInTheDocument();
  });

  it('does not show study mode button when no vocab entries', () => {
    renderWithProviders(<FlashCardList assignments={[]} />);
    expect(screen.queryByRole('button', { name: /study mode/i })).not.toBeInTheDocument();
  });

  it('enters study mode when Study Mode button is clicked', () => {
    renderWithProviders(<FlashCardList assignments={[makeVocabAssignment()]} />);
    fireEvent.click(screen.getByRole('button', { name: /study mode/i }));
    expect(screen.getByTestId('study-mode')).toBeInTheDocument();
  });

  it('exits study mode when onExit is called', () => {
    renderWithProviders(<FlashCardList assignments={[makeVocabAssignment()]} />);
    fireEvent.click(screen.getByRole('button', { name: /study mode/i }));
    fireEvent.click(screen.getByText('Exit Study Mode'));
    expect(screen.queryByTestId('study-mode')).not.toBeInTheDocument();
  });

  it('renders entries from multiple vocab assignments', () => {
    const assignment2 = makeVocabAssignment({
      id: 'a2',
      vocabAssignment: {
        id: 'va2',
        entries: [{ id: 'e3', term: 'Array', definition: 'An ordered collection' }],
      },
    });
    renderWithProviders(<FlashCardList assignments={[makeVocabAssignment(), assignment2]} />);
    expect(screen.getByText('Variable')).toBeInTheDocument();
    expect(screen.getByText('Array')).toBeInTheDocument();
  });
});
