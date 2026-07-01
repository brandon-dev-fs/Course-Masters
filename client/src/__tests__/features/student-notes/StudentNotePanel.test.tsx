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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import StudentNotePanel from '../../../features/student-notes/StudentNotePanel.js';

describe('StudentNotePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // studentNotesApi.get returns null (no existing note)
    apiClientMock.get.mockResolvedValue(null);
  });

  it('renders without crashing', () => {
    render(<StudentNotePanel lessonId="l1" />);
    expect(screen.getByText('My Notes')).toBeInTheDocument();
  });

  it('shows the notes textarea', () => {
    render(<StudentNotePanel lessonId="l1" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows placeholder text', () => {
    render(<StudentNotePanel lessonId="l1" />);
    expect(screen.getByPlaceholderText(/write your personal notes/i)).toBeInTheDocument();
  });

  it('shows saving indicator when user types', async () => {
    apiClientMock.post.mockResolvedValue({ id: 'sn1', content: 'hello', lessonId: 'l1', userId: 'u1', createdAt: '', updatedAt: '' });
    render(<StudentNotePanel lessonId="l1" />);
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'hello' } });
    expect(screen.getByText(/saving/i)).toBeInTheDocument();
  });

  describe('handleChange — debounced save', () => {
    it('shows "Saved" status after debounce completes', async () => {
      const savedNote = { id: 'sn1', content: 'hello', lessonId: 'l1', userId: 'u1', createdAt: '', updatedAt: '' };
      apiClientMock.post.mockResolvedValue(savedNote);
      render(<StudentNotePanel lessonId="l1" />);
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'hello' } });
      expect(screen.getByText(/saving/i)).toBeInTheDocument();
      // Wait for the 1000ms debounce + the API call to resolve
      await waitFor(
        () => {
          expect(screen.getByText(/saved/i)).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
      expect(apiClientMock.post).toHaveBeenCalled();
    });

    it('resets to idle on save error', async () => {
      apiClientMock.post.mockRejectedValue(new Error('Network error'));
      render(<StudentNotePanel lessonId="l1" />);
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'hello' } });
      expect(screen.getByText(/saving/i)).toBeInTheDocument();
      // Wait for debounce to fire and error to be caught
      await waitFor(
        () => {
          expect(screen.queryByText(/saving/i)).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );
      expect(screen.queryByText(/saved/i)).not.toBeInTheDocument();
    });
  });

  describe('handleDelete', () => {
    it('shows "Clear" button when a note exists', async () => {
      const existingNote = { id: 'sn1', content: 'existing note', lessonId: 'l1', userId: 'u1', createdAt: '', updatedAt: '' };
      apiClientMock.get.mockResolvedValue(existingNote);
      render(<StudentNotePanel lessonId="l1" />);
      expect(await screen.findByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('calls delete API and clears content when Clear is clicked', async () => {
      const existingNote = { id: 'sn1', content: 'existing note', lessonId: 'l1', userId: 'u1', createdAt: '', updatedAt: '' };
      apiClientMock.get.mockResolvedValue(existingNote);
      apiClientMock.delete.mockResolvedValue(undefined);
      render(<StudentNotePanel lessonId="l1" />);
      const clearBtn = await screen.findByRole('button', { name: /clear/i });
      fireEvent.click(clearBtn);
      await waitFor(() => {
        expect(apiClientMock.delete).toHaveBeenCalled();
      });
    });

    it('removes the Clear button after deletion', async () => {
      const existingNote = { id: 'sn1', content: 'existing note', lessonId: 'l1', userId: 'u1', createdAt: '', updatedAt: '' };
      apiClientMock.get.mockResolvedValue(existingNote);
      apiClientMock.delete.mockResolvedValue(undefined);
      render(<StudentNotePanel lessonId="l1" />);
      const clearBtn = await screen.findByRole('button', { name: /clear/i });
      fireEvent.click(clearBtn);
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
      });
    });
  });
});
