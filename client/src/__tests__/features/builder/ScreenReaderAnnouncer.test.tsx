import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ScreenReaderAnnouncer from '../../../features/builder/ScreenReaderAnnouncer.js';

describe('ScreenReaderAnnouncer', () => {
  it('renders the given message', () => {
    render(<ScreenReaderAnnouncer message="Item added" />);
    expect(screen.getByText('Item added')).toBeInTheDocument();
  });

  it('has role="status"', () => {
    render(<ScreenReaderAnnouncer message="Item added" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has aria-live="polite"', () => {
    render(<ScreenReaderAnnouncer message="Loading..." />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('has aria-atomic="true"', () => {
    render(<ScreenReaderAnnouncer message="Done" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-atomic', 'true');
  });

  it('renders an empty message', () => {
    render(<ScreenReaderAnnouncer message="" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('status').textContent).toBe('');
  });

  it('updates message when prop changes', () => {
    const { rerender } = render(<ScreenReaderAnnouncer message="First" />);
    expect(screen.getByText('First')).toBeInTheDocument();
    rerender(<ScreenReaderAnnouncer message="Second" />);
    expect(screen.getByText('Second')).toBeInTheDocument();
  });
});
