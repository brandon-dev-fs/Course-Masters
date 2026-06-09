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
    constructor(public readonly code: string, message: string) {
      super(message);
      this.name = 'ApiClientError';
    }
  },
  classifyError: (e: unknown) => e instanceof Error ? e.message : String(e),
}));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UnitForm from '../../../features/units/UnitForm.js';

describe('UnitForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<UnitForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
  });

  it('shows Add Unit button for new unit', () => {
    render(<UnitForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: /add unit/i })).toBeInTheDocument();
  });

  it('shows Save Changes button when editing', () => {
    render(
      <UnitForm
        initial={{ id: 'u1', title: 'Old', description: 'Desc', order: 1, courseId: 'c1' }}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn();
    render(<UnitForm onSubmit={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('shows title required error when title is empty on submit', async () => {
    render(<UnitForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'A description' } });
    fireEvent.submit(screen.getByRole('button', { name: /add unit/i }).closest('form')!);
    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
  });

  it('shows description required error when description is empty on submit', async () => {
    render(<UnitForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'My Unit' } });
    fireEvent.submit(screen.getByRole('button', { name: /add unit/i }).closest('form')!);
    expect(await screen.findByText(/description is required/i)).toBeInTheDocument();
  });

  it('calls onSubmit with trimmed values when form is valid', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<UnitForm onSubmit={onSubmit} onCancel={vi.fn()} nextOrder={3} />);
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: '  Chapter One  ' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: '  Intro content  ' } });
    fireEvent.submit(screen.getByRole('button', { name: /add unit/i }).closest('form')!);
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Chapter One',
        description: 'Intro content',
        order: 3,
      });
    });
  });

  it('pre-fills fields from initial values', () => {
    render(
      <UnitForm
        initial={{ id: 'u1', title: 'Existing Title', description: 'Existing desc', order: 2, courseId: 'c1' }}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByDisplayValue('Existing Title')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing desc')).toBeInTheDocument();
  });

  it('shows API error when onSubmit rejects with ApiClientError', async () => {
    const { ApiClientError } = await import('../../../api/client.js');
    const onSubmit = vi.fn().mockRejectedValueOnce(new ApiClientError('MOCK_ERROR', 'Something went wrong'));
    render(<UnitForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'My Unit' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'My desc' } });
    fireEvent.submit(screen.getByRole('button', { name: /add unit/i }).closest('form')!);
    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('shows Saving while submitting', async () => {
    let resolveSubmit!: () => void;
    const onSubmit = vi.fn().mockReturnValueOnce(new Promise<void>(res => { resolveSubmit = res; }));
    render(<UnitForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'My Unit' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'My desc' } });
    fireEvent.submit(screen.getByRole('button', { name: /add unit/i }).closest('form')!);
    expect(await screen.findByText(/saving/i)).toBeInTheDocument();
    resolveSubmit();
  });
});
