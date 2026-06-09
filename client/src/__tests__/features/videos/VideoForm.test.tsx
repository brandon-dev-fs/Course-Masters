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
import VideoForm from '../../../features/videos/VideoForm.js';

describe('VideoForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock youtube title endpoint
    apiClientMock.get.mockResolvedValue({ title: '' });
  });

  it('renders without crashing', () => {
    render(<VideoForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText(/youtube url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
  });

  it('shows Add Video button', () => {
    render(<VideoForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: /add video/i })).toBeInTheDocument();
  });

  it('calls onCancel when Cancel clicked', () => {
    const onCancel = vi.fn();
    render(<VideoForm onSubmit={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('shows validation error on empty submit', async () => {
    render(<VideoForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /add video/i }));
    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
  });

  it('shows URL required error when title filled but URL empty', async () => {
    render(<VideoForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'My Video' } });
    fireEvent.click(screen.getByRole('button', { name: /add video/i }));
    expect(await screen.findByText(/youtube url is required/i)).toBeInTheDocument();
  });

  it('calls onSubmit with trimmed values when valid', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<VideoForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/youtube url/i), {
      target: { value: 'https://www.youtube.com/watch?v=abc' },
    });
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'My Video' } });
    fireEvent.click(screen.getByRole('button', { name: /add video/i }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'My Video',
        url: 'https://www.youtube.com/watch?v=abc',
        order: 1,
      })
    );
  });

  it('shows Save Changes button when editing', () => {
    const initial = {
      id: 'r1',
      type: 'video' as const,
      title: 'Existing Video',
      content: { url: 'https://youtube-nocookie.com/embed/abc' },
      order: 2,
      lessonId: 'l1',
      isRequired: false,
    };
    render(<VideoForm initial={initial} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('shows Saving state during submission', async () => {
    const neverSubmit = vi.fn(() => new Promise<void>(() => {}));
    render(<VideoForm onSubmit={neverSubmit} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/youtube url/i), {
      target: { value: 'https://www.youtube.com/watch?v=abc' },
    });
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Video' } });
    fireEvent.click(screen.getByRole('button', { name: /add video/i }));
    expect(await screen.findByText(/saving/i)).toBeInTheDocument();
  });

  it('covers title onChange handler', () => {
    render(<VideoForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'New Title' } });
    expect(screen.getByLabelText(/title/i)).toHaveValue('New Title');
  });

  it('covers order input onChange', () => {
    render(<VideoForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const orderInput = screen.getByLabelText(/order/i);
    fireEvent.change(orderInput, { target: { value: '3' } });
    expect(orderInput).toHaveValue(3);
  });

  it('auto-fetches title when valid YouTube URL is blurred', async () => {
    apiClientMock.get.mockResolvedValueOnce({ title: 'Auto Title' });
    render(<VideoForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const urlInput = screen.getByLabelText(/youtube url/i);
    fireEvent.change(urlInput, { target: { value: 'https://www.youtube.com/watch?v=abc' } });
    fireEvent.blur(urlInput);
    await waitFor(() => expect(screen.getByLabelText(/title/i)).toHaveValue('Auto Title'));
  });
});
