import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Footer from '../../components/Footer.js';

describe('Footer', () => {
  it('renders without crashing', () => {
    render(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('displays the brand name', () => {
    render(<Footer />);
    expect(screen.getAllByText('Course Masters').length).toBeGreaterThan(0);
  });

  it('displays technology links', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: /react/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /tailwind css/i })).toBeInTheDocument();
  });

  it('shows the current year in copyright', () => {
    render(<Footer />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });
});
