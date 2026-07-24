const { mockTrustedSourcesApi } = vi.hoisted(() => ({
  mockTrustedSourcesApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
  },
}));

vi.mock('../../../api/trusted-sources.js', () => ({
  trustedSourcesApi: mockTrustedSourcesApi,
}));
vi.mock('../../../api/client.js', () => ({
  ApiClientError: class ApiClientError extends Error {},
  classifyError: (e: unknown) => String(e),
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TrustedSourceForm from '../../../features/admin/TrustedSourceForm.js';
import type { TrustedSource } from '../../../api/types.js';

function makeSource(overrides: Partial<TrustedSource> = {}): TrustedSource {
  return {
    id: 'ts-1',
    name: 'Khan Academy',
    domain: 'khanacademy.org',
    contentTypes: ['video', 'article'],
    categories: ['math', 'science'],
    active: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('TrustedSourceForm', () => {
  const onSuccess = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('renders Name field', () => {
    render(<TrustedSourceForm onSuccess={onSuccess} onCancel={onCancel} />);
    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
  });

  it('renders Domain field', () => {
    render(<TrustedSourceForm onSuccess={onSuccess} onCancel={onCancel} />);
    expect(screen.getByLabelText(/domain/i)).toBeInTheDocument();
  });

  it('shows "Add Source" button in create mode', () => {
    render(<TrustedSourceForm onSuccess={onSuccess} onCancel={onCancel} />);
    expect(screen.getByRole('button', { name: /add source/i })).toBeInTheDocument();
  });

  it('shows "Save Changes" button in edit mode', () => {
    render(<TrustedSourceForm source={makeSource()} onSuccess={onSuccess} onCancel={onCancel} />);
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('pre-fills name from source prop', () => {
    render(<TrustedSourceForm source={makeSource()} onSuccess={onSuccess} onCancel={onCancel} />);
    expect(screen.getByLabelText(/^name$/i)).toHaveValue('Khan Academy');
  });

  it('pre-fills domain from source prop', () => {
    render(<TrustedSourceForm source={makeSource()} onSuccess={onSuccess} onCancel={onCancel} />);
    expect(screen.getByLabelText(/domain/i)).toHaveValue('khanacademy.org');
  });

  it('pre-fills contentTypes as comma-separated string', () => {
    render(<TrustedSourceForm source={makeSource()} onSuccess={onSuccess} onCancel={onCancel} />);
    expect(screen.getByLabelText(/content types/i)).toHaveValue('video, article');
  });

  // ── Cancel ─────────────────────────────────────────────────────────────────

  it('calls onCancel when Cancel is clicked', () => {
    render(<TrustedSourceForm onSuccess={onSuccess} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  // ── Validation ─────────────────────────────────────────────────────────────

  it('shows "Name is required" when submitting without a name', async () => {
    render(<TrustedSourceForm onSuccess={onSuccess} onCancel={onCancel} />);
    fireEvent.submit(screen.getByRole('button', { name: /add source/i }).closest('form')!);
    await waitFor(() =>
      expect(screen.getByText(/name is required/i)).toBeInTheDocument(),
    );
    expect(mockTrustedSourcesApi.create).not.toHaveBeenCalled();
  });

  it('shows "Domain is required" when submitting without a domain', async () => {
    render(<TrustedSourceForm onSuccess={onSuccess} onCancel={onCancel} />);
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: 'Test' } });
    fireEvent.submit(screen.getByRole('button', { name: /add source/i }).closest('form')!);
    await waitFor(() =>
      expect(screen.getByText(/domain is required/i)).toBeInTheDocument(),
    );
  });

  it('clears error when name field is changed', async () => {
    render(<TrustedSourceForm onSuccess={onSuccess} onCancel={onCancel} />);
    fireEvent.submit(screen.getByRole('button', { name: /add source/i }).closest('form')!);
    await waitFor(() => expect(screen.getByText(/name is required/i)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: 'X' } });
    expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
  });

  // ── Create ─────────────────────────────────────────────────────────────────

  it('calls create API and invokes onSuccess in create mode', async () => {
    const created = makeSource({ id: 'ts-new', name: 'Test', domain: 'test.com' });
    mockTrustedSourcesApi.create.mockResolvedValue(created);

    render(<TrustedSourceForm onSuccess={onSuccess} onCancel={onCancel} />);
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/domain/i), { target: { value: 'test.com' } });
    fireEvent.submit(screen.getByRole('button', { name: /add source/i }).closest('form')!);

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(created));
    expect(mockTrustedSourcesApi.create).toHaveBeenCalledWith({
      name: 'Test',
      domain: 'test.com',
      contentTypes: [],
      categories: [],
    });
  });

  it('parses comma-separated contentTypes and categories', async () => {
    const created = makeSource();
    mockTrustedSourcesApi.create.mockResolvedValue(created);

    render(<TrustedSourceForm onSuccess={onSuccess} onCancel={onCancel} />);
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/domain/i), { target: { value: 'test.com' } });
    fireEvent.change(screen.getByLabelText(/content types/i), { target: { value: 'video, article' } });
    fireEvent.change(screen.getByLabelText(/categories/i), { target: { value: 'math, science' } });
    fireEvent.submit(screen.getByRole('button', { name: /add source/i }).closest('form')!);

    await waitFor(() => expect(mockTrustedSourcesApi.create).toHaveBeenCalledWith({
      name: 'Test',
      domain: 'test.com',
      contentTypes: ['video', 'article'],
      categories: ['math', 'science'],
    }));
  });

  // ── Update ─────────────────────────────────────────────────────────────────

  it('calls update API and invokes onSuccess in edit mode', async () => {
    const source = makeSource();
    const updated = { ...source, name: 'Updated Name' };
    mockTrustedSourcesApi.update.mockResolvedValue(updated);

    render(<TrustedSourceForm source={source} onSuccess={onSuccess} onCancel={onCancel} />);
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: 'Updated Name' } });
    fireEvent.submit(screen.getByRole('button', { name: /save changes/i }).closest('form')!);

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(updated));
    expect(mockTrustedSourcesApi.update).toHaveBeenCalledWith('ts-1', expect.objectContaining({
      name: 'Updated Name',
    }));
  });
});
