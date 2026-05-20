vi.mock('../../../api/client.js', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  ApiClientError: class ApiClientError extends Error {},
  classifyError: (e: unknown) => String(e),
}));
vi.mock('../../../components/RichTextEditor.js', () => ({
  default: () => <div data-testid="rich-text-editor" />,
}));

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext.js';
import { makeAuthContext, makeTeacherUser } from '../../mocks/authContext.mock.js';
import AssignmentFormModal from '../../../features/assignments/AssignmentFormModal.js';

function renderModal(props: Partial<React.ComponentProps<typeof AssignmentFormModal>> = {}) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={makeAuthContext({ user: makeTeacherUser() })}>
        <AssignmentFormModal
          onSubmit={vi.fn()}
          onClose={vi.fn()}
          {...props}
        />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe('AssignmentFormModal', () => {
  it('shows type picker on first step (create mode)', () => {
    renderModal();
    expect(screen.getByText('Add Assignment')).toBeInTheDocument();
  });

  it('shows type options in picker', () => {
    renderModal();
    expect(screen.getByText('Note')).toBeInTheDocument();
    expect(screen.getByText('Video')).toBeInTheDocument();
    expect(screen.getByText('Reading')).toBeInTheDocument();
    expect(screen.getByText('Vocab')).toBeInTheDocument();
    expect(screen.getByText('Practice Problem')).toBeInTheDocument();
  });

  it('advances to meta step when a type is selected', () => {
    renderModal();
    fireEvent.click(screen.getByText('Video'));
    expect(screen.getByText('Add Video')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
  });

  it('shows back button on meta step in create mode', () => {
    renderModal();
    fireEvent.click(screen.getByText('Note'));
    expect(screen.getByRole('button', { name: /back to type selection/i })).toBeInTheDocument();
  });

  it('returns to picker when back is clicked from meta step', () => {
    renderModal();
    fireEvent.click(screen.getByText('Note'));
    fireEvent.click(screen.getByRole('button', { name: /back to type selection/i }));
    expect(screen.getByText('Add Assignment')).toBeInTheDocument();
  });

  it('shows title required error on submit without title', async () => {
    const { container } = renderModal();
    fireEvent.click(screen.getByText('Video'));
    const form = container.querySelector('form');
    fireEvent.submit(form!);
    const errors = await screen.findAllByText('Title is required');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('shows edit mode with type label when initial is provided', () => {
    const initial = {
      id: 'a1',
      type: 'video' as const,
      title: 'My Video',
      objective: '',
      order: 1,
      lessonId: 'l1',
      isRequired: false,
      videoAssignment: { url: 'https://youtube.com/watch?v=abc', title: 'Video Title' },
    };
    renderModal({ initial });
    expect(screen.getByText('Edit Video')).toBeInTheDocument();
  });

  it('advances to items step for vocab type', () => {
    renderModal();
    fireEvent.click(screen.getByText('Vocab'));
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'My Vocab' } });
    fireEvent.click(screen.getByText(/next: terms/i));
    expect(screen.getByText('2 of 2')).toBeInTheDocument();
  });

  it('advances to items step for practice problem type', () => {
    renderModal();
    fireEvent.click(screen.getByText('Practice Problem'));
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'My Practice' } });
    fireEvent.click(screen.getByText(/next: questions/i));
    expect(screen.getByText('2 of 2')).toBeInTheDocument();
  });

  it('returns from items step to meta step when back is clicked', () => {
    renderModal();
    fireEvent.click(screen.getByText('Vocab'));
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'My Vocab' } });
    fireEvent.click(screen.getByText(/next: terms/i));
    expect(screen.getByText('2 of 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /back to details/i }));
    expect(screen.getByText('1 of 2')).toBeInTheDocument();
  });

  it('calls onClose when cancel is clicked', () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    fireEvent.click(screen.getByText('Note'));
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onSubmit with video payload on valid submit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { container } = renderModal({ onSubmit });
    fireEvent.click(screen.getByText('Video'));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'My Video Assignment' } });
    // Fill URL in VideoAssignmentForm
    const urlInput = screen.getByLabelText(/url/i);
    fireEvent.change(urlInput, { target: { value: 'https://youtube.com/watch?v=test' } });
    const form = container.querySelector('form');
    fireEvent.submit(form!);
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'video', title: 'My Video Assignment' }),
      );
    });
  });

  it('shows error when URL is missing for video submit', async () => {
    const { container } = renderModal();
    fireEvent.click(screen.getByText('Video'));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'My Video' } });
    const form = container.querySelector('form');
    fireEvent.submit(form!);
    expect(await screen.findByText(/url is required/i)).toBeInTheDocument();
  });

  it('does not advance to items step when title is empty', () => {
    renderModal();
    fireEvent.click(screen.getByText('Vocab'));
    // No title entered — click Next
    fireEvent.click(screen.getByText(/next: terms/i));
    // Should still be on step 1 of 2, showing title error
    expect(screen.queryByText('2 of 2')).not.toBeInTheDocument();
  });
});
