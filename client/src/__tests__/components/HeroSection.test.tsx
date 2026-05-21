import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HeroSection from '../../features/home/HeroSection.js';

function renderHero(props: { loggedIn: boolean; userName?: string }) {
	return render(
		<MemoryRouter>
			<HeroSection {...props} />
		</MemoryRouter>,
	);
}

describe('HeroSection — guest state', () => {
	it('renders the hero landmark', () => {
		renderHero({ loggedIn: false });
		expect(screen.getByRole('region', { name: 'Hero' })).toBeInTheDocument();
	});

	it('renders the headline', () => {
		renderHero({ loggedIn: false });
		expect(
			screen.getByText(/Master anything/i),
		).toBeInTheDocument();
	});

	it('renders the subtitle paragraph', () => {
		renderHero({ loggedIn: false });
		expect(
			screen.getByText(/Build structured courses/i),
		).toBeInTheDocument();
	});

	it('renders the Get Started link pointing to /register', () => {
		renderHero({ loggedIn: false });
		const link = screen.getByRole('link', { name: 'Get Started' });
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute('href', '/register');
	});

	it('renders the Sign In link pointing to /login', () => {
		renderHero({ loggedIn: false });
		const link = screen.getByRole('link', { name: 'Sign In' });
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute('href', '/login');
	});

	it('renders the decorative solar system SVG', () => {
		renderHero({ loggedIn: false });
		// The SVG is aria-hidden so it won't surface via ARIA queries;
		// query by the container element to confirm it is present in the DOM.
		const svgs = document.querySelectorAll('svg[aria-hidden="true"]');
		expect(svgs.length).toBeGreaterThan(0);
	});
});

describe('HeroSection — authenticated state', () => {
	it('renders the greeting with the user name', () => {
		renderHero({ loggedIn: true, userName: 'Test User' });
		expect(screen.getByText(/Welcome back, Test User\./i)).toBeInTheDocument();
	});

	it('does not render the subtitle', () => {
		renderHero({ loggedIn: true, userName: 'Test User' });
		expect(
			screen.queryByText(/Build structured courses/i),
		).not.toBeInTheDocument();
	});

	it('does not render the Get Started CTA', () => {
		renderHero({ loggedIn: true, userName: 'Test User' });
		expect(
			screen.queryByRole('link', { name: 'Get Started' }),
		).not.toBeInTheDocument();
	});

	it('does not render the Sign In CTA', () => {
		renderHero({ loggedIn: true, userName: 'Test User' });
		expect(
			screen.queryByRole('link', { name: 'Sign In' }),
		).not.toBeInTheDocument();
	});

	it('does not render the solar system SVG', () => {
		renderHero({ loggedIn: true, userName: 'Test User' });
		const svgs = document.querySelectorAll('svg[aria-hidden="true"]');
		expect(svgs.length).toBe(0);
	});
});
