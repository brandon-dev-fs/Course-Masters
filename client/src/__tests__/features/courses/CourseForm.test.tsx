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
import CourseForm from '../../../features/courses/CourseForm.js';

describe('CourseForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<CourseForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('shows Create Course button for new form', () => {
    render(<CourseForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: /create course/i })).toBeInTheDocument();
  });

  it('shows Save Changes button when editing', () => {
    render(
      <CourseForm
        initial={{ id: 'c1', title: 'Old Title', description: 'Old desc' }}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn();
    render(<CourseForm onSubmit={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('disables submit button when form is empty', () => {
    render(<CourseForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: /create course/i })).toBeDisabled();
  });

  it('disables submit button when only title is filled', () => {
    render(<CourseForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'My Course' } });
    expect(screen.getByRole('button', { name: /create course/i })).toBeDisabled();
  });

  it('enables submit button when both fields are filled', () => {
    render(<CourseForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'My Course' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'A description' } });
    expect(screen.getByRole('button', { name: /create course/i })).toBeEnabled();
  });

  it('calls onSubmit with trimmed title and description on valid submit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<CourseForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: '  My Course  ' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: '  A description  ' } });
    fireEvent.click(screen.getByRole('button', { name: /create course/i }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ title: 'My Course', description: 'A description' });
    });
  });

  it('shows error message when onSubmit rejects', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Server error'));
    render(<CourseForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'My Course' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Description' } });
    fireEvent.click(screen.getByRole('button', { name: /create course/i }));
    expect(await screen.findByText('Server error')).toBeInTheDocument();
  });

  it('pre-populates title and description when initial is provided', () => {
    render(
      <CourseForm
        initial={{ id: 'c1', title: 'Existing Title', description: 'Existing desc' }}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(/title/i)).toHaveValue('Existing Title');
    expect(screen.getByLabelText(/description/i)).toHaveValue('Existing desc');
  });

  it('shows character count for the title field', () => {
    render(<CourseForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Hello' } });
    expect(screen.getByText('5/30')).toBeInTheDocument();
  });
});
