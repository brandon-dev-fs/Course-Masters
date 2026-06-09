import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MonthGrid from '../../../features/courses/MonthGrid.js';

describe('MonthGrid', () => {
  it('renders weekday headers', () => {
    render(<MonthGrid year={2024} month={0} markers={[]} />);
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
  });

  it('renders days for January 2024', () => {
    render(<MonthGrid year={2024} month={0} markers={[]} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('31')).toBeInTheDocument();
  });

  it('renders days for February 2024 (leap year)', () => {
    render(<MonthGrid year={2024} month={1} markers={[]} />);
    expect(screen.getByText('29')).toBeInTheDocument();
  });

  it('renders with markers', () => {
    const markers = [
      { label: 'Unit 1', color: '#ff0000', weekIndex: 0 },
    ];
    const { container } = render(<MonthGrid year={2024} month={0} markers={markers} />);
    // The marker renders a colored div inside the first week
    const coloredDiv = container.querySelector('[style*="background-color"]');
    expect(coloredDiv).toBeTruthy();
  });

  it('renders December month correctly', () => {
    render(<MonthGrid year={2024} month={11} markers={[]} />);
    expect(screen.getByText('31')).toBeInTheDocument();
  });
});
