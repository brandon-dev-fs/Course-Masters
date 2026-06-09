import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState from '../../components/EmptyState.js';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No items found" />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<EmptyState title="No items" description="Try adding one" />);
    expect(screen.getByText('Try adding one')).toBeInTheDocument();
  });

  it('does not render description when omitted', () => {
    render(<EmptyState title="No items" />);
    // Only the title paragraph should be present, no description
    expect(screen.queryByText('Try adding one')).not.toBeInTheDocument();
  });

  it('renders action button when action prop is provided', () => {
    const onClick = vi.fn();
    render(<EmptyState title="No items" action={{ label: 'Add item', onClick }} />);
    expect(screen.getByRole('button', { name: 'Add item' })).toBeInTheDocument();
  });

  it('calls action.onClick when action button is clicked', () => {
    const onClick = vi.fn();
    render(<EmptyState title="No items" action={{ label: 'Add item', onClick }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add item' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not render action button when action prop is omitted', () => {
    render(<EmptyState title="No items" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders custom icon when icon prop is provided', () => {
    render(<EmptyState title="No items" icon={<span data-testid="custom-icon">★</span>} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('renders default icon (Inbox) when icon prop is omitted', () => {
    render(<EmptyState title="No items" />);
    // The Inbox SVG icon should be rendered by default
    const svgs = document.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });
});
