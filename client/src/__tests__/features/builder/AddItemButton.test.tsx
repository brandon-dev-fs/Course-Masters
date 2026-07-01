import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AddItemButton from '../../../features/builder/AddItemButton.js';

describe('AddItemButton', () => {
  it('renders with the given label', () => {
    render(<AddItemButton label="Add Unit" onClick={vi.fn()} />);
    expect(screen.getByText('Add Unit')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<AddItemButton label="Add Unit" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('uses label as aria-label by default', () => {
    render(<AddItemButton label="Add Lesson" onClick={vi.fn()} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Add Lesson');
  });

  it('uses ariaLabel prop when provided', () => {
    render(
      <AddItemButton label="Add Lesson" onClick={vi.fn()} ariaLabel="Custom Label" />,
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Custom Label');
  });

  it('is not disabled by default', () => {
    render(<AddItemButton label="Add Unit" onClick={vi.fn()} />);
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('is disabled when loading is true', () => {
    render(<AddItemButton label="Add Unit" onClick={vi.fn()} loading />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows "Adding..." text when loading', () => {
    render(<AddItemButton label="Add Unit" onClick={vi.fn()} loading />);
    expect(screen.getByText('Adding...')).toBeInTheDocument();
  });

  it('does not show "Adding..." when not loading', () => {
    render(<AddItemButton label="Add Unit" onClick={vi.fn()} />);
    expect(screen.queryByText('Adding...')).not.toBeInTheDocument();
  });

  it('does not have aria-haspopup by default', () => {
    render(<AddItemButton label="Add Unit" onClick={vi.fn()} />);
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-haspopup');
  });

  it('has aria-haspopup="menu" when ariaHasPopup is true', () => {
    render(<AddItemButton label="Add Unit" onClick={vi.fn()} ariaHasPopup />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-haspopup', 'menu');
  });

  it('does not call onClick when disabled (loading)', () => {
    const onClick = vi.fn();
    render(<AddItemButton label="Add Unit" onClick={onClick} loading />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
