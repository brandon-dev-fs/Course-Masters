import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ActivityTypeMenu from '../../../features/builder/ActivityTypeMenu.js';

describe('ActivityTypeMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with role="menu"', () => {
    render(<ActivityTypeMenu onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('has aria-label "Select activity type"', () => {
    render(<ActivityTypeMenu onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('menu')).toHaveAttribute('aria-label', 'Select activity type');
  });

  it('renders all activity type options', () => {
    render(<ActivityTypeMenu onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('menuitem', { name: /Note/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Video/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /External Link/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Vocab/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Practice Problem/i })).toBeInTheDocument();
  });

  it('calls onSelect with the correct type when an item is clicked', async () => {
    const onSelect = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<ActivityTypeMenu onSelect={onSelect} onClose={onClose} />);
    fireEvent.click(screen.getByRole('menuitem', { name: /Note/i }));
    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith('note');
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  it('calls onSelect with "video" type', async () => {
    const onSelect = vi.fn().mockResolvedValue(undefined);
    render(<ActivityTypeMenu onSelect={onSelect} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('menuitem', { name: /Video/i }));
    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith('video');
    });
  });

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn();
    render(<ActivityTypeMenu onSelect={vi.fn()} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when clicking outside', () => {
    const onClose = vi.fn();
    render(
      <div>
        <ActivityTypeMenu onSelect={vi.fn()} onClose={onClose} />
        <button>Outside</button>
      </div>,
    );
    fireEvent.mouseDown(screen.getByText('Outside'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('disables all items while a selection is in progress', async () => {
    let resolveSelect!: () => void;
    const onSelect = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSelect = resolve;
        }),
    );
    render(<ActivityTypeMenu onSelect={onSelect} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('menuitem', { name: /Note/i }));
    await waitFor(() => {
      const items = screen.getAllByRole('menuitem');
      items.forEach((item) => {
        expect(item).toBeDisabled();
      });
    });
    resolveSelect();
  });

  it('re-enables items if onSelect throws', async () => {
    const onSelect = vi.fn().mockRejectedValue(new Error('Failed'));
    render(<ActivityTypeMenu onSelect={onSelect} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('menuitem', { name: /Note/i }));
    await waitFor(() => {
      const items = screen.getAllByRole('menuitem');
      items.forEach((item) => {
        expect(item).not.toBeDisabled();
      });
    });
  });

  it('does not call onSelect again while already creating', async () => {
    let resolveSelect!: () => void;
    const onSelect = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSelect = resolve;
        }),
    );
    render(<ActivityTypeMenu onSelect={onSelect} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('menuitem', { name: /Note/i }));
    // Try clicking again while in progress — all are disabled, so this is a no-op
    fireEvent.click(screen.getByRole('menuitem', { name: /Video/i }));
    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledTimes(1);
    });
    resolveSelect();
  });

  it('navigates with ArrowDown key', () => {
    render(<ActivityTypeMenu onSelect={vi.fn()} onClose={vi.fn()} />);
    const items = screen.getAllByRole('menuitem');
    items[0].focus();
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(items[1]);
  });

  it('navigates with ArrowUp key', () => {
    render(<ActivityTypeMenu onSelect={vi.fn()} onClose={vi.fn()} />);
    const items = screen.getAllByRole('menuitem');
    items[1].focus();
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowUp' });
    expect(document.activeElement).toBe(items[0]);
  });

  it('wraps ArrowDown from last to first', () => {
    render(<ActivityTypeMenu onSelect={vi.fn()} onClose={vi.fn()} />);
    const items = screen.getAllByRole('menuitem');
    items[items.length - 1].focus();
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(items[0]);
  });

  it('ignores unhandled keys in menu keydown handler', () => {
    const onClose = vi.fn();
    render(<ActivityTypeMenu onSelect={vi.fn()} onClose={onClose} />);
    // Firing a key that is not ArrowDown/ArrowUp should not throw and should not close
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Tab' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows spinner on the item being created', async () => {
    let resolveSelect!: () => void;
    const onSelect = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSelect = resolve;
        }),
    );
    render(<ActivityTypeMenu onSelect={onSelect} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('menuitem', { name: /Note/i }));
    await waitFor(() => {
      // Loader2 renders as an svg — the Note button's icon span should contain it
      const noteBtn = screen.getByRole('menuitem', { name: /Note/i });
      expect(noteBtn.querySelector('svg')).toBeInTheDocument();
    });
    resolveSelect();
  });
});
