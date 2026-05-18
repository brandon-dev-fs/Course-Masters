import { render, container } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ProgressBar from '../../../features/progress/ProgressBar.js';

describe('ProgressBar', () => {
  it('renders without crashing at 0%', () => {
    const { container } = render(<ProgressBar percent={0} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders at 50%', () => {
    const { container } = render(<ProgressBar percent={50} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders at 100%', () => {
    const { container } = render(<ProgressBar percent={100} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('clamps width to 100% when percent exceeds 100', () => {
    const { container } = render(<ProgressBar percent={150} />);
    const fill = container.querySelector('[style]') as HTMLElement;
    expect(fill.style.width).toBe('100%');
  });

  it('applies a red color class for low progress', () => {
    const { container } = render(<ProgressBar percent={20} />);
    const fill = container.querySelector('.bg-destructive');
    expect(fill).toBeInTheDocument();
  });

  it('applies primary color class for high progress', () => {
    const { container } = render(<ProgressBar percent={90} />);
    const fill = container.querySelector('.bg-primary');
    expect(fill).toBeInTheDocument();
  });
});
