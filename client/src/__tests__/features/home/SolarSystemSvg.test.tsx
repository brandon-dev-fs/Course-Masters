import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import SolarSystemSvg from '../../features/home/SolarSystemSvg.js';

describe('SolarSystemSvg', () => {
	it('renders an aria-hidden SVG', () => {
		const { container } = render(<SolarSystemSvg />);
		const svg = container.querySelector('svg');
		expect(svg).toBeInTheDocument();
		expect(svg).toHaveAttribute('aria-hidden', 'true');
	});

	it('sets focusable="false" to prevent IE/Edge focus', () => {
		const { container } = render(<SolarSystemSvg />);
		const svg = container.querySelector('svg');
		expect(svg).toHaveAttribute('focusable', 'false');
	});

	it('has the correct viewBox', () => {
		const { container } = render(<SolarSystemSvg />);
		const svg = container.querySelector('svg');
		expect(svg).toHaveAttribute('viewBox', '0 0 480 480');
	});

	it('renders 8 orbit ring circles', () => {
		const { container } = render(<SolarSystemSvg />);
		// Orbit rings are circles with fill="none"
		const orbitRings = Array.from(container.querySelectorAll('circle')).filter(
			(el) => el.getAttribute('fill') === 'none' || el.getAttribute('fill') === null && el.getAttribute('stroke') !== null,
		);
		// Count circles that have fill="none" explicitly
		const fillNoneCircles = Array.from(container.querySelectorAll('circle[fill="none"]'));
		expect(fillNoneCircles).toHaveLength(8);
	});

	it('renders the sun circle with the correct fill', () => {
		const { container } = render(<SolarSystemSvg />);
		const sunCircle = container.querySelector('circle.sun');
		expect(sunCircle).toBeInTheDocument();
		expect(sunCircle).toHaveAttribute('fill', '#FDB813');
	});
});
