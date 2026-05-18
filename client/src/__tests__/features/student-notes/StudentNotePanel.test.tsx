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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
});
