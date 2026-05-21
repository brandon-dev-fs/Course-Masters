import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import HeroSection from '../../../features/home/HeroSection.js';

describe('HeroSection', () => {
  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <HeroSection loggedIn={false} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('shows Get Started and Sign In links when not logged in', () => {
    render(
      <MemoryRouter>
        <HeroSection loggedIn={false} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: /get started/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });

  it('hides CTA links when logged in', () => {
    render(
      <MemoryRouter>
        <HeroSection loggedIn={true} userName="Test User" />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('link', { name: /get started/i })).not.toBeInTheDocument();
  });
});
