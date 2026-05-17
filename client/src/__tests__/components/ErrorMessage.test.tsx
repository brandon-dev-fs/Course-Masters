import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorMessage from '../../components/ErrorMessage.js';

describe('ErrorMessage', () => {
  it('renders the message', () => {
    render(<ErrorMessage message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders with role=alert for accessibility', () => {
    render(<ErrorMessage message="Error" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders default variant as a div with error styling', () => {
    render(<ErrorMessage message="Default error" />);
    const alert = screen.getByRole('alert');
    expect(alert.tagName).toBe('DIV');
  });

  it('renders inline variant as a paragraph', () => {
    render(<ErrorMessage message="Inline error" variant="inline" />);
    const alert = screen.getByRole('alert');
    expect(alert.tagName).toBe('P');
  });

  it('merges custom className', () => {
    render(<ErrorMessage message="Error" className="my-custom-class" />);
    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('my-custom-class');
  });

  it('renders default variant when variant prop is omitted', () => {
    render(<ErrorMessage message="Default" />);
    const alert = screen.getByRole('alert');
    // Default variant uses a div with destructive/10 background
    expect(alert.className).toContain('bg-destructive');
  });

  it('inline variant does not use background styling', () => {
    render(<ErrorMessage message="Inline" variant="inline" />);
    const alert = screen.getByRole('alert');
    expect(alert.className).not.toContain('bg-destructive');
  });
});
