import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../../components/LoadingSpinner.js';

describe('LoadingSpinner', () => {
  it('renders without crashing', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders the loading text', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('renders the GraduationCap icon (SVG)', () => {
    render(<LoadingSpinner />);
    const svgs = document.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('applies custom className', () => {
    const { container } = render(<LoadingSpinner className="my-class" />);
    expect(container.firstChild).toHaveClass('my-class');
  });

  it('applies fullPage min-height class when fullPage=true', () => {
    const { container } = render(<LoadingSpinner fullPage />);
    // fullPage adds min-h-[50vh] to the wrapper
    expect((container.firstChild as Element).className).toMatch(/min-h/);
  });

  it('does not apply fullPage class by default', () => {
    const { container } = render(<LoadingSpinner />);
    expect((container.firstChild as Element).className).not.toContain('min-h-[50vh]');
  });
});
