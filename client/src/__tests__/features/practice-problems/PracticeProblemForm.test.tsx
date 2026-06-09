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
import type { LessonTool } from '../../../api/types.js';

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
    const initial: LessonTool = {
      id: 'pp1',
      type: 'practice_problem',
      title: 'Existing Problem',
      content: { question: 'Q?', options: ['A', 'B'], correctIndex: 0, calculatorEnabled: false },
      order: 2,
      lessonId: 'l1',
      isRequired: false,
    };
    render(<PracticeProblemForm initial={initial} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('calls onSubmit when form is valid', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<PracticeProblemForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('What is...?'), { target: { value: 'Test question?' } });
    fireEvent.change(screen.getByPlaceholderText('Option 1'), { target: { value: 'Option A' } });
    fireEvent.change(screen.getByPlaceholderText('Option 2'), { target: { value: 'Option B' } });
    fireEvent.click(screen.getByRole('button', { name: /add problem/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });
});
