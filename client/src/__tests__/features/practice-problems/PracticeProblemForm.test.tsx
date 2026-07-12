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
import PracticeProblemForm from '../../../features/practice-problems/PracticeProblemForm.js';

describe('PracticeProblemForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<PracticeProblemForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: /add problem/i })).toBeInTheDocument();
  });

  it('calls onCancel when Cancel clicked', () => {
    const onCancel = vi.fn();
    render(<PracticeProblemForm onSubmit={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('shows validation error when submitted with empty question', async () => {
    render(<PracticeProblemForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /add problem/i }));
    expect(await screen.findByText(/question is required/i)).toBeInTheDocument();
  });

  it('shows validation error when options are empty but question is filled', async () => {
    render(<PracticeProblemForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('What is...?'), { target: { value: 'Test question?' } });
    fireEvent.click(screen.getByRole('button', { name: /add problem/i }));
    expect(await screen.findByText(/all options must have text/i)).toBeInTheDocument();
  });

  it('changing order input updates value', () => {
    render(<PracticeProblemForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const orderInput = screen.getByLabelText(/order/i);
    fireEvent.change(orderInput, { target: { value: '5' } });
    expect(orderInput).toHaveValue(5);
  });

  it('shows Save Changes button when editing', () => {
    const initial = {
      id: 'pp1',
      type: 'practice_problem' as const,
      content: { question: 'Q?', options: ['A', 'B'], correctIndex: 0, calculatorEnabled: false },
      order: 2,
    };
    render(<PracticeProblemForm initial={initial} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('calls onSubmit when form is valid', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<PracticeProblemForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('What is...?'), { target: { value: 'Test question?' } });
    // Form initializes with 4 option slots — all must be non-empty to pass validation
    fireEvent.change(screen.getByPlaceholderText('Option 1'), { target: { value: 'Option A' } });
    fireEvent.change(screen.getByPlaceholderText('Option 2'), { target: { value: 'Option B' } });
    fireEvent.change(screen.getByPlaceholderText('Option 3'), { target: { value: 'Option C' } });
    fireEvent.change(screen.getByPlaceholderText('Option 4'), { target: { value: 'Option D' } });
    fireEvent.click(screen.getByRole('button', { name: /add problem/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });
});
