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
import VocabForm from '../../../features/vocab/VocabForm.js';

describe('VocabForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders term and definition fields', () => {
    render(<VocabForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText(/term/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/definition/i)).toBeInTheDocument();
  });

  it('shows Add Term button', () => {
    render(<VocabForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: /add term/i })).toBeInTheDocument();
  });

  it('calls onCancel when Cancel clicked', () => {
    const onCancel = vi.fn();
    render(<VocabForm onSubmit={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('shows validation error when submitted with empty fields', async () => {
    render(<VocabForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /add term/i }));
    expect(await screen.findByText(/term and definition are required/i)).toBeInTheDocument();
  });

  it('calls onSubmit with trimmed values when valid', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<VocabForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/term/i), { target: { value: ' Variable ' } });
    fireEvent.change(screen.getByLabelText(/definition/i), { target: { value: ' A storage location. ' } });
    fireEvent.click(screen.getByRole('button', { name: /add term/i }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        term: 'Variable',
        definition: 'A storage location.',
        order: 1,
      })
    );
  });

  it('shows Save Changes button when editing', () => {
    const initial = {
      id: 't1',
      type: 'vocab' as const,
      content: { term: 'Variable', definition: 'A named storage location.' },
      order: 2,
    };
    render(<VocabForm initial={initial} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('prefills fields from initial value', () => {
    const initial = {
      id: 't1',
      type: 'vocab' as const,
      content: { term: 'Variable', definition: 'A named storage location.' },
      order: 2,
    };
    render(<VocabForm initial={initial} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText(/term/i)).toHaveValue('Variable');
    expect(screen.getByLabelText(/definition/i)).toHaveValue('A named storage location.');
  });

  it('changing order input updates value', () => {
    render(<VocabForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const orderInput = screen.getByLabelText(/order/i);
    fireEvent.change(orderInput, { target: { value: '3' } });
    expect(orderInput).toHaveValue(3);
  });

  it('shows Saving state during submission', async () => {
    const neverSubmit = vi.fn(() => new Promise<void>(() => {}));
    render(<VocabForm onSubmit={neverSubmit} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/term/i), { target: { value: 'Variable' } });
    fireEvent.change(screen.getByLabelText(/definition/i), { target: { value: 'A storage location.' } });
    fireEvent.click(screen.getByRole('button', { name: /add term/i }));
    expect(await screen.findByText(/saving/i)).toBeInTheDocument();
  });
});
