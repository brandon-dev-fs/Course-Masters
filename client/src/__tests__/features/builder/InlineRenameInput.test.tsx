import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

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
    constructor(
      public readonly code: string,
      message: string,
    ) {
      super(message);
      this.name = 'ApiClientError';
    }
  },
  classifyError: (e: unknown) => (e instanceof Error ? e.message : String(e)),
}));

import InlineRenameInput from '../../../features/builder/InlineRenameInput.js';

describe('InlineRenameInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders an input with the initial value', () => {
    render(
      <InlineRenameInput
        initialValue="Unit 1"
        onSave={vi.fn()}
        onCancel={vi.fn()}
        ariaLabel="Rename unit"
      />,
    );
    expect(screen.getByRole('textbox')).toHaveValue('Unit 1');
  });

  it('applies the ariaLabel to the input', () => {
    render(
      <InlineRenameInput
        initialValue="Unit 1"
        onSave={vi.fn()}
        onCancel={vi.fn()}
        ariaLabel="Rename unit"
      />,
    );
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-label', 'Rename unit');
  });

  it('calls onCancel when Escape is pressed', () => {
    const onCancel = vi.fn();
    render(
      <InlineRenameInput
        initialValue="Unit 1"
        onSave={vi.fn()}
        onCancel={onCancel}
        ariaLabel="Rename unit"
      />,
    );
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('calls onCancel when value is unchanged and Enter is pressed', async () => {
    const onCancel = vi.fn();
    const onSave = vi.fn();
    render(
      <InlineRenameInput
        initialValue="Unit 1"
        onSave={onSave}
        onCancel={onCancel}
        ariaLabel="Rename unit"
      />,
    );
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    await waitFor(() => {
      expect(onCancel).toHaveBeenCalledOnce();
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  it('calls onSave with trimmed value when Enter is pressed with new value', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <InlineRenameInput
        initialValue="Unit 1"
        onSave={onSave}
        onCancel={vi.fn()}
        ariaLabel="Rename unit"
      />,
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '  New Name  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('New Name');
    });
  });

  it('shows error when saving with empty value', async () => {
    render(
      <InlineRenameInput
        initialValue="Unit 1"
        onSave={vi.fn()}
        onCancel={vi.fn()}
        ariaLabel="Rename unit"
      />,
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => {
      expect(screen.getByText('Name cannot be empty.')).toBeInTheDocument();
    });
  });

  it('marks input as aria-invalid when there is an error', async () => {
    render(
      <InlineRenameInput
        initialValue="Unit 1"
        onSave={vi.fn()}
        onCancel={vi.fn()}
        ariaLabel="Rename unit"
      />,
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });
  });

  it('clears error when user types after an error', async () => {
    render(
      <InlineRenameInput
        initialValue="Unit 1"
        onSave={vi.fn()}
        onCancel={vi.fn()}
        ariaLabel="Rename unit"
      />,
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => {
      expect(screen.getByText('Name cannot be empty.')).toBeInTheDocument();
    });
    fireEvent.change(input, { target: { value: 'Something' } });
    expect(screen.queryByText('Name cannot be empty.')).not.toBeInTheDocument();
  });

  it('shows API error when onSave throws ApiClientError', async () => {
    const { ApiClientError } = await import('../../../api/client.js');
    const onSave = vi.fn().mockRejectedValue(new ApiClientError('NOT_FOUND', 'Not found'));
    render(
      <InlineRenameInput
        initialValue="Unit 1"
        onSave={onSave}
        onCancel={vi.fn()}
        ariaLabel="Rename unit"
      />,
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'New Title' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => {
      expect(screen.getByText('Not found')).toBeInTheDocument();
    });
  });

  it('shows generic error when onSave throws a non-ApiClientError', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('Network failure'));
    render(
      <InlineRenameInput
        initialValue="Unit 1"
        onSave={onSave}
        onCancel={vi.fn()}
        ariaLabel="Rename unit"
      />,
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'New Title' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => {
      expect(screen.getByText('Failed to save.')).toBeInTheDocument();
    });
  });

  it('disables input while saving', async () => {
    let resolvePromise!: () => void;
    const onSave = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolvePromise = resolve;
        }),
    );
    render(
      <InlineRenameInput
        initialValue="Unit 1"
        onSave={onSave}
        onCancel={vi.fn()}
        ariaLabel="Rename unit"
      />,
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'New Title' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeDisabled();
    });
    resolvePromise();
  });

  it('calls onSave on blur when not saving', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <InlineRenameInput
        initialValue="Unit 1"
        onSave={onSave}
        onCancel={vi.fn()}
        ariaLabel="Rename unit"
      />,
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Updated Name' } });
    fireEvent.blur(input);
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('Updated Name');
    });
  });

  it('does not call onSave on blur while already saving', async () => {
    let resolvePromise!: () => void;
    const onSave = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolvePromise = resolve;
        }),
    );
    render(
      <InlineRenameInput
        initialValue="Unit 1"
        onSave={onSave}
        onCancel={vi.fn()}
        ariaLabel="Rename unit"
      />,
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'New Title' } });
    // Trigger save via Enter, then blur while saving — should not call onSave again
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(screen.getByRole('textbox')).toBeDisabled());
    fireEvent.blur(input);
    expect(onSave).toHaveBeenCalledTimes(1);
    resolvePromise();
  });
});
