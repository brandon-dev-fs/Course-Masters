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
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LessonForm from '../../../features/lessons/LessonForm.js';

describe('LessonForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<LessonForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('shows Add Lesson button', () => {
    render(<LessonForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: /add lesson/i })).toBeInTheDocument();
  });

  it('shows Save Changes when editing', () => {
    render(
      <LessonForm
        initial={{ id: 'l1', title: 'Old', description: 'Desc', order: 1, unitId: 'u1', objective: '', planContent: {} }}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('calls onCancel when Cancel clicked', () => {
    const onCancel = vi.fn();
    render(<LessonForm onSubmit={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('disables submit button when form is empty', () => {
    render(<LessonForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: /add lesson/i })).toBeDisabled();
  });

  it('disables submit button when only title is filled', () => {
    render(<LessonForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'My Lesson' } });
    expect(screen.getByRole('button', { name: /add lesson/i })).toBeDisabled();
  });

  it('calls onSubmit with trimmed title and description', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<LessonForm onSubmit={onSubmit} onCancel={vi.fn()} nextOrder={3} />);
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: '  My Lesson  ' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: '  My Desc  ' } });
    fireEvent.click(screen.getByRole('button', { name: /add lesson/i }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ title: 'My Lesson', description: 'My Desc', order: 3 }),
    );
  });

  it('pre-fills fields from initial prop', () => {
    render(
      <LessonForm
        initial={{ id: 'l1', title: 'Existing', description: 'Old desc', order: 2, unitId: 'u1', objective: '', planContent: {} }}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByDisplayValue('Existing')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Old desc')).toBeInTheDocument();
  });

  it('shows error message when onSubmit rejects', async () => {
    const onSubmit = vi.fn().mockRejectedValueOnce(new Error('Server rejected'));
    render(<LessonForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Title' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Desc' } });
    fireEvent.click(screen.getByRole('button', { name: /add lesson/i }));
    expect(await screen.findByText(/server rejected/i)).toBeInTheDocument();
  });
});
