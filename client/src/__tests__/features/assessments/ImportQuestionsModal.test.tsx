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
  ApiClientError: class ApiClientError extends Error {
    code: string;
    errorClass?: string;
    constructor(code: string, message: string, public details?: unknown, errorClass?: string) {
      super(message);
      this.name = 'ApiClientError';
      this.code = code;
      this.errorClass = errorClass;
    }
  },
  classifyError: (e: unknown) => (e instanceof Error ? e.message : 'Unknown error'),
}));

vi.mock('../../../api/auth.js', () => ({
  authClient: {
    getSession: vi.fn().mockResolvedValue({ data: null, error: null }),
    signIn: { email: vi.fn() },
    signUp: { email: vi.fn() },
    signOut: vi.fn(),
  },
}));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../../context/AuthContext.js';
import ImportQuestionsModal from '../../../features/assessments/ImportQuestionsModal.js';
import type { Assignment } from '../../../api/types.js';

function makeAssignment(overrides: Partial<Assignment> = {}): Assignment {
  return {
    id: 'pp-1',
    lessonId: 'lesson-1',
    order: 1,
    title: 'Practice Set 1',
    type: 'practice_problem',
    objective: null,
    isRequired: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    completed: false,
    noteAssignment: null,
    videoAssignment: null,
    readingAssignment: null,
    vocabAssignment: null,
    fileAssignment: null,
    practiceProblemAssignment: {
      id: 'ppa-1',
      instructions: null,
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          order: 1,
          content: { question: 'Q1?', choices: ['A', 'B'], answer: 'A', explanation: '' },
        },
        {
          id: 'q2',
          type: 'true_false',
          order: 2,
          content: { question: 'Q2?', answer: true, explanation: '' },
        },
      ],
    },
    ...overrides,
  } as Assignment;
}

function renderModal(props: Partial<React.ComponentProps<typeof ImportQuestionsModal>> = {}) {
  const defaults = {
    assessmentId: 'assess-1',
    lessonId: 'lesson-1',
    onImported: vi.fn(),
    onClose: vi.fn(),
  };
  return render(
    <MemoryRouter>
      <AuthProvider>
        <ImportQuestionsModal {...defaults} {...props} />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('ImportQuestionsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('shows a spinner while loading assignments', () => {
      // Never-resolving promise keeps loading=true
      apiClientMock.get.mockReturnValue(new Promise(() => {}));
      renderModal();
      expect(document.querySelector('svg')).toBeTruthy();
    });
  });

  describe('empty state', () => {
    it('shows empty state when no practice problem assignments exist', async () => {
      apiClientMock.get.mockResolvedValueOnce([]);
      await act(async () => {
        renderModal();
      });
      // EmptyState renders title + description; use getAllByText to handle both
      expect(screen.getAllByText(/no practice problem assignments/i).length).toBeGreaterThan(0);
    });

    it('shows empty state when assignments have no practiceProblemAssignment', async () => {
      const noteAssignment = makeAssignment({ type: 'note', practiceProblemAssignment: null });
      apiClientMock.get.mockResolvedValueOnce([noteAssignment]);
      await act(async () => {
        renderModal();
      });
      expect(screen.getAllByText(/no practice problem assignments/i).length).toBeGreaterThan(0);
    });
  });

  describe('assignment list', () => {
    it('renders practice problem assignments as radio options', async () => {
      apiClientMock.get.mockResolvedValueOnce([makeAssignment()]);
      await act(async () => {
        renderModal();
      });
      expect(screen.getByText('Practice Set 1')).toBeTruthy();
      expect(screen.getByRole('radio', { name: /Practice Set 1/i })).toBeTruthy();
    });

    it('shows question count for each assignment', async () => {
      apiClientMock.get.mockResolvedValueOnce([makeAssignment()]);
      await act(async () => {
        renderModal();
      });
      expect(screen.getByText(/2 questions/i)).toBeTruthy();
    });

    it('shows singular "question" for single-question assignment', async () => {
      const single = makeAssignment();
      single.practiceProblemAssignment!.questions = [single.practiceProblemAssignment!.questions[0]];
      apiClientMock.get.mockResolvedValueOnce([single]);
      await act(async () => {
        renderModal();
      });
      expect(screen.getByText(/1 question$/i)).toBeTruthy();
    });

    it('renders multiple assignments', async () => {
      apiClientMock.get.mockResolvedValueOnce([
        makeAssignment({ id: 'pp-1', title: 'Practice Set A' }),
        makeAssignment({ id: 'pp-2', title: 'Practice Set B' }),
      ]);
      await act(async () => {
        renderModal();
      });
      expect(screen.getByText('Practice Set A')).toBeTruthy();
      expect(screen.getByText('Practice Set B')).toBeTruthy();
    });

    it('selecting a radio enables the Import button', async () => {
      apiClientMock.get.mockResolvedValueOnce([makeAssignment()]);
      await act(async () => {
        renderModal();
      });
      const importBtn = screen.getByRole('button', { name: /import questions/i });
      expect(importBtn).toBeDisabled();
      fireEvent.click(screen.getByRole('radio', { name: /Practice Set 1/i }));
      expect(importBtn).not.toBeDisabled();
    });
  });

  describe('import action', () => {
    it('calls assessmentsApi.importQuestions with selected id and closes', async () => {
      const onImported = vi.fn();
      const onClose = vi.fn();
      const newQuestions = [{ id: 'q-new', type: 'multiple_choice', order: 1, content: {} }];

      apiClientMock.get.mockResolvedValueOnce([makeAssignment()]);
      apiClientMock.post.mockResolvedValueOnce(newQuestions);

      await act(async () => {
        renderModal({ onImported, onClose });
      });

      fireEvent.click(screen.getByRole('radio', { name: /Practice Set 1/i }));

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /import questions/i }));
      });

      await waitFor(() => {
        expect(apiClientMock.post).toHaveBeenCalledWith(
          '/assessments/assess-1/import-questions',
          { practiceProblemAssignmentId: 'pp-1' },
        );
        expect(onImported).toHaveBeenCalledWith(newQuestions);
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('shows error message when import fails', async () => {
      const { ApiClientError } = await import('../../../api/client.js') as { ApiClientError: new (code: string, message: string) => Error };
      apiClientMock.get.mockResolvedValueOnce([makeAssignment()]);
      apiClientMock.post.mockRejectedValueOnce(new ApiClientError('IMPORT_FAILED', 'Import failed'));

      await act(async () => {
        renderModal();
      });

      fireEvent.click(screen.getByRole('radio', { name: /Practice Set 1/i }));

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /import questions/i }));
      });

      await waitFor(() => {
        expect(screen.getByText(/import failed/i)).toBeTruthy();
      });
    });
  });

  describe('modal controls', () => {
    it('renders the modal title', async () => {
      apiClientMock.get.mockResolvedValueOnce([]);
      await act(async () => {
        renderModal();
      });
      expect(screen.getByText(/import from practice problems/i)).toBeTruthy();
    });

    it('calls onClose when Cancel is clicked', async () => {
      const onClose = vi.fn();
      apiClientMock.get.mockResolvedValueOnce([]);
      await act(async () => {
        renderModal({ onClose });
      });
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(onClose).toHaveBeenCalled();
    });
  });
});
