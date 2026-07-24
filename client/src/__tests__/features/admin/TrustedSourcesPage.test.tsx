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

// Stub child form to avoid re-testing its internals
vi.mock('../../../features/admin/TrustedSourceForm.js', () => ({
  default: ({ onSuccess, onCancel }: { onSuccess: (s: unknown) => void; onCancel: () => void }) => (
    <div data-testid="trusted-source-form">
      <button onClick={() => onSuccess({ id: 'ts-new', name: 'New', domain: 'new.com', contentTypes: [], categories: [], active: true })}>
        Submit form
      </button>
      <button onClick={onCancel}>Form Cancel</button>
    </div>
  ),
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TrustedSourcesPage from '../../../features/admin/TrustedSourcesPage.js';
import type { TrustedSource } from '../../../api/types.js';

function makeSource(overrides: Partial<TrustedSource> = {}): TrustedSource {
  return {
    id: 'ts-1',
    name: 'Khan Academy',
    domain: 'khanacademy.org',
    contentTypes: ['video'],
    categories: ['math'],
    active: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('TrustedSourcesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTrustedSourcesApi.getAll.mockResolvedValue([]);
  });

  // ── Loading / error ────────────────────────────────────────────────────────

  it('renders the page heading', async () => {
    render(<TrustedSourcesPage />);
    expect(screen.getByRole('heading', { name: /trusted sources/i })).toBeInTheDocument();
    await waitFor(() => expect(mockTrustedSourcesApi.getAll).toHaveBeenCalled());
  });

  it('shows error message when fetch fails', async () => {
    mockTrustedSourcesApi.getAll.mockRejectedValue(new Error('network error'));
    render(<TrustedSourcesPage />);
    await waitFor(() =>
      expect(screen.getByText(/failed to load trusted sources/i)).toBeInTheDocument(),
    );
  });

  // ── Data display ───────────────────────────────────────────────────────────

  it('renders source name and domain in table', async () => {
    mockTrustedSourcesApi.getAll.mockResolvedValue([makeSource()]);
    render(<TrustedSourcesPage />);
    expect(await screen.findByText('Khan Academy')).toBeInTheDocument();
    expect(screen.getByText('khanacademy.org')).toBeInTheDocument();
  });

  it('shows "Active" badge for active sources', async () => {
    mockTrustedSourcesApi.getAll.mockResolvedValue([makeSource({ active: true })]);
    render(<TrustedSourcesPage />);
    expect(await screen.findByText('Active')).toBeInTheDocument();
  });

  it('shows "Inactive" badge for inactive sources', async () => {
    mockTrustedSourcesApi.getAll.mockResolvedValue([makeSource({ active: false })]);
    render(<TrustedSourcesPage />);
    expect(await screen.findByText('Inactive')).toBeInTheDocument();
  });

  it('shows empty state when no sources are returned', async () => {
    mockTrustedSourcesApi.getAll.mockResolvedValue([]);
    render(<TrustedSourcesPage />);
    expect(await screen.findByText(/no trusted sources found/i)).toBeInTheDocument();
  });

  // ── Filter ─────────────────────────────────────────────────────────────────

  it('renders All, Active, and Inactive filter buttons', async () => {
    render(<TrustedSourcesPage />);
    await waitFor(() => expect(mockTrustedSourcesApi.getAll).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: /^all$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^active$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^inactive$/i })).toBeInTheDocument();
  });

  it('calls getAll with active=true when Active filter is clicked', async () => {
    render(<TrustedSourcesPage />);
    await waitFor(() => expect(mockTrustedSourcesApi.getAll).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: /^active$/i }));
    await waitFor(() =>
      expect(mockTrustedSourcesApi.getAll).toHaveBeenCalledWith(true),
    );
  });

  it('calls getAll with active=false when Inactive filter is clicked', async () => {
    render(<TrustedSourcesPage />);
    await waitFor(() => expect(mockTrustedSourcesApi.getAll).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: /^inactive$/i }));
    await waitFor(() =>
      expect(mockTrustedSourcesApi.getAll).toHaveBeenCalledWith(false),
    );
  });

  // ── Add source modal ───────────────────────────────────────────────────────

  it('opens add source modal when "Add Source" button is clicked', async () => {
    render(<TrustedSourcesPage />);
    await waitFor(() => expect(mockTrustedSourcesApi.getAll).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: /add source/i }));
    expect(screen.getByTestId('trusted-source-form')).toBeInTheDocument();
  });

  it('closes add source modal when form cancel is clicked', async () => {
    render(<TrustedSourcesPage />);
    await waitFor(() => expect(mockTrustedSourcesApi.getAll).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: /add source/i }));
    fireEvent.click(screen.getByRole('button', { name: /form cancel/i }));
    expect(screen.queryByTestId('trusted-source-form')).not.toBeInTheDocument();
  });

  it('prepends newly created source to the list', async () => {
    mockTrustedSourcesApi.getAll.mockResolvedValue([makeSource()]);
    render(<TrustedSourcesPage />);
    await screen.findByText('Khan Academy');

    fireEvent.click(screen.getByRole('button', { name: /add source/i }));
    fireEvent.click(screen.getByRole('button', { name: /submit form/i }));

    await waitFor(() => expect(screen.getByText('New')).toBeInTheDocument());
  });

  // ── Edit source modal ──────────────────────────────────────────────────────

  it('opens edit modal when Edit button is clicked', async () => {
    mockTrustedSourcesApi.getAll.mockResolvedValue([makeSource()]);
    render(<TrustedSourcesPage />);
    await screen.findByText('Khan Academy');
    fireEvent.click(screen.getByRole('button', { name: /edit khan academy/i }));
    expect(screen.getByTestId('trusted-source-form')).toBeInTheDocument();
  });

  // ── Deactivate ─────────────────────────────────────────────────────────────

  it('calls deactivate API and shows Reactivate button after deactivation', async () => {
    mockTrustedSourcesApi.getAll.mockResolvedValue([makeSource({ active: true })]);
    mockTrustedSourcesApi.deactivate.mockResolvedValue(undefined);
    render(<TrustedSourcesPage />);
    await screen.findByText('Khan Academy');
    fireEvent.click(screen.getByRole('button', { name: /deactivate khan academy/i }));
    await waitFor(() =>
      expect(mockTrustedSourcesApi.deactivate).toHaveBeenCalledWith('ts-1'),
    );
    // After deactivation the action button label changes to "Reactivate"
    expect(await screen.findByRole('button', { name: /reactivate khan academy/i })).toBeInTheDocument();
  });

  // ── Reactivate ─────────────────────────────────────────────────────────────

  it('calls update API and shows Deactivate button after reactivation', async () => {
    mockTrustedSourcesApi.getAll.mockResolvedValue([makeSource({ active: false })]);
    const reactivated = makeSource({ active: true });
    mockTrustedSourcesApi.update.mockResolvedValue(reactivated);
    render(<TrustedSourcesPage />);
    await screen.findByText('Khan Academy');
    fireEvent.click(screen.getByRole('button', { name: /reactivate khan academy/i }));
    await waitFor(() =>
      expect(mockTrustedSourcesApi.update).toHaveBeenCalledWith('ts-1', { active: true }),
    );
    // After reactivation the action button label changes to "Deactivate"
    expect(await screen.findByRole('button', { name: /deactivate khan academy/i })).toBeInTheDocument();
  });
});
