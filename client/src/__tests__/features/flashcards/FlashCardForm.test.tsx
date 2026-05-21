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
import FlashCardForm from '../../../features/flashcards/FlashCardForm.js';

describe('FlashCardForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<FlashCardForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText(/front/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/back/i)).toBeInTheDocument();
  });

  it('shows Add Card button', () => {
    render(<FlashCardForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: /add card/i })).toBeInTheDocument();
  });

  it('calls onCancel when Cancel clicked', () => {
    const onCancel = vi.fn();
    render(<FlashCardForm onSubmit={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('shows validation error when submitted empty', async () => {
    render(<FlashCardForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /add card/i }));
    expect(await screen.findByText(/front and back are required/i)).toBeInTheDocument();
  });

  it('calls onSubmit with trimmed values when valid', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<FlashCardForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/front/i), { target: { value: ' Question? ' } });
    fireEvent.change(screen.getByLabelText(/back/i), { target: { value: ' Answer! ' } });
    fireEvent.click(screen.getByRole('button', { name: /add card/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ front: 'Question?', back: 'Answer!', order: 1 }));
  });

  it('shows Save Changes button when editing', () => {
    const initial = {
      id: 't1',
      type: 'flash_card' as const,
      title: 'FC',
      content: { front: 'Q?', back: 'A!' },
      order: 2,
      lessonId: 'l1',
      isRequired: false,
    };
    render(<FlashCardForm initial={initial} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('prefills front and back from initial', () => {
    const initial = {
      id: 't1',
      type: 'flash_card' as const,
      title: 'FC',
      content: { front: 'Term', back: 'Definition' },
      order: 1,
      lessonId: 'l1',
      isRequired: false,
    };
    render(<FlashCardForm initial={initial} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText(/front/i)).toHaveValue('Term');
    expect(screen.getByLabelText(/back/i)).toHaveValue('Definition');
  });

  it('shows Saving state during submission', async () => {
    const neverSubmit = vi.fn(() => new Promise<void>(() => {}));
    render(<FlashCardForm onSubmit={neverSubmit} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/front/i), { target: { value: 'Q' } });
    fireEvent.change(screen.getByLabelText(/back/i), { target: { value: 'A' } });
    fireEvent.click(screen.getByRole('button', { name: /add card/i }));
    expect(await screen.findByText(/saving/i)).toBeInTheDocument();
  });
});
